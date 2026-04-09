from datetime import date, timedelta
from difflib import SequenceMatcher

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task import Task
from app.schemas.task import DayOfWeek, TaskCreate, TaskUpdate

WEEKDAY_TO_INDEX: dict[DayOfWeek, int] = {
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,
    "Sunday": 6,
}


def list_tasks(db: Session, user_id: str) -> list[Task]:
    statement = select(Task).where(Task.user_id == user_id).order_by(Task.created_at.desc())
    return list(db.scalars(statement))


def get_task(db: Session, task_id: str, user_id: str) -> Task | None:
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    return db.scalars(statement).first()


def create_task(db: Session, payload: TaskCreate, user_id: str) -> Task:
    normalized_payload = normalize_task_payload(payload)
    record = Task(**normalized_payload.model_dump(), user_id=user_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    if ensure_recurring_schedule(db, record):
        db.commit()
    return record


def create_tasks(db: Session, payloads: list[TaskCreate], user_id: str) -> list[Task]:
    records = [Task(**normalize_task_payload(payload).model_dump(), user_id=user_id) for payload in payloads]
    db.add_all(records)
    db.commit()
    for record in records:
        db.refresh(record)
    if any(ensure_recurring_schedule(db, record) for record in records):
        db.commit()
    return records


def update_task(db: Session, task_id: str, payload: TaskUpdate, user_id: str) -> Task | None:
    record = get_task(db, task_id, user_id)
    if record is None:
        return None

    normalized_fields = normalize_task_update_payload(payload, record)
    for field, value in normalized_fields.items():
        setattr(record, field, value)

    db.add(record)
    ensure_recurring_schedule(db, record)
    db.commit()
    db.refresh(record)
    return record


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()


def delete_task_and_future(db: Session, task: Task) -> None:
    if task.recurrence != "weekly" or task.due_date is None:
        delete_task(db, task)
        return

    description_clause = (
        Task.description.is_(None)
        if task.description is None
        else Task.description == task.description
    )
    statement = select(Task).where(
        Task.user_id == task.user_id,
        Task.title == task.title,
        description_clause,
        Task.recurrence == task.recurrence,
        Task.due_date.is_not(None),
        Task.due_date >= task.due_date,
    )
    matching_tasks = list(db.scalars(statement))
    for matching_task in matching_tasks:
        db.delete(matching_task)
    db.commit()


def find_matching_task(
    db: Session,
    query: str,
    user_id: str,
    *,
    prefer_todo: bool = False,
) -> Task | None:
    normalized_query = normalize_for_matching(query)
    if not normalized_query:
        return None

    tasks = list_tasks(db, user_id)
    best_task: Task | None = None
    best_score = 0.0

    for task in tasks:
        score = similarity_score(normalized_query, normalize_for_matching(task.title))
        if prefer_todo and task.status == "todo":
            score += 0.05

        if score > best_score:
            best_task = task
            best_score = score

    if best_score < 0.45:
        return None

    return best_task


def normalize_for_matching(text: str) -> str:
    filtered = "".join(character.lower() if character.isalnum() or character.isspace() else " " for character in text)
    return " ".join(filtered.split())


def similarity_score(left: str, right: str) -> float:
    if not left or not right:
        return 0.0

    if left == right:
        return 1.0

    if left in right or right in left:
        return 0.95

    left_tokens = set(left.split())
    right_tokens = set(right.split())
    overlap = len(left_tokens & right_tokens) / max(len(left_tokens), len(right_tokens))
    sequence = SequenceMatcher(None, left, right).ratio()
    return max(overlap, (overlap + sequence) / 2)


def normalize_task_payload(payload: TaskCreate) -> TaskCreate:
    if payload.due_date is not None or payload.day_of_week is None:
        return payload

    return payload.model_copy(update={"due_date": resolve_next_due_date(payload.day_of_week)})


def normalize_task_update_payload(payload: TaskUpdate, record: Task) -> dict:
    normalized_fields = payload.model_dump(exclude_unset=True)
    next_day_of_week = normalized_fields.get("day_of_week", record.day_of_week)
    next_due_date = normalized_fields.get("due_date", record.due_date)

    if next_due_date is None and next_day_of_week is not None:
        normalized_fields["due_date"] = resolve_next_due_date(next_day_of_week)

    return normalized_fields


def ensure_recurring_schedule(db: Session, record: Task, weeks_ahead: int = 8) -> bool:
    if record.recurrence != "weekly" or record.due_date is None:
        return False

    created_any = False
    for week_offset in range(1, weeks_ahead + 1):
        next_due_date = record.due_date + timedelta(days=7 * week_offset)
        if has_matching_recurring_occurrence(db, record, next_due_date):
            continue

        db.add(
            Task(
                title=record.title,
                description=record.description,
                day_of_week=None,
                due_date=next_due_date,
                recurrence=record.recurrence,
                status="todo",
                source_voice_note_id=record.source_voice_note_id,
                user_id=record.user_id,
            )
        )
        created_any = True

    return created_any


def has_matching_recurring_occurrence(db: Session, record: Task, due_date: date) -> bool:
    description_clause = (
        Task.description.is_(None)
        if record.description is None
        else Task.description == record.description
    )
    statement = select(Task).where(
        Task.user_id == record.user_id,
        Task.title == record.title,
        description_clause,
        Task.due_date == due_date,
        Task.recurrence == record.recurrence,
        Task.status == "todo",
    )
    return db.scalars(statement).first() is not None


def resolve_next_due_date(day_of_week: DayOfWeek) -> date:
    today = date.today()
    target_index = WEEKDAY_TO_INDEX[day_of_week]
    current_index = today.weekday()
    days_ahead = (target_index - current_index) % 7
    return today + timedelta(days=days_ahead)
