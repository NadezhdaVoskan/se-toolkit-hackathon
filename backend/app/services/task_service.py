from difflib import SequenceMatcher

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate


def list_tasks(db: Session) -> list[Task]:
    statement = select(Task).order_by(Task.created_at.desc())
    return list(db.scalars(statement))


def get_task(db: Session, task_id: str) -> Task | None:
    return db.get(Task, task_id)


def create_task(db: Session, payload: TaskCreate) -> Task:
    record = Task(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def create_tasks(db: Session, payloads: list[TaskCreate]) -> list[Task]:
    records = [Task(**payload.model_dump()) for payload in payloads]
    db.add_all(records)
    db.commit()
    for record in records:
        db.refresh(record)
    return records


def update_task(db: Session, task_id: str, payload: TaskUpdate) -> Task | None:
    record = get_task(db, task_id)
    if record is None:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()


def find_matching_task(
    db: Session,
    query: str,
    *,
    prefer_todo: bool = False,
) -> Task | None:
    normalized_query = normalize_for_matching(query)
    if not normalized_query:
        return None

    tasks = list_tasks(db)
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
