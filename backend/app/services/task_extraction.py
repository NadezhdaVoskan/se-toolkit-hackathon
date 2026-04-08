from datetime import datetime
import json
import re
from typing import Any, Protocol

from pydantic import BaseModel, ValidationError

from app.core.config import settings
from app.schemas.task import DayOfWeek, TaskCreate

from ollama import Client

TASK_EXTRACTION_PROMPT_TEMPLATE = """You are an assistant that extracts weekly planner tasks from a speech transcription.

Return only valid JSON.
Do not include markdown fences.
Do not include explanations.

Output format:
[
  {{
    "title": "Finish math homework",
    "description": "",
  }}
]

Rules:
- Extract only clear, actionable tasks.
- Keep titles short and specific.
- If extra detail is useful, put it in "description". Otherwise use an empty string.
- If the transcription contains no clear tasks, return [].
- Preserve the original meaning. Do not invent tasks.

Transcription:
{transcript}
"""

TASK_EXTRACTION_PROMPT_TEMPLATE_RU = """Вы — помощник, который извлекает задачи для еженедельного планировщика из транскрипции речи.

Возвращайте только валидный JSON.
Не добавляйте markdown-ограждения.
Не добавляйте никаких объяснений.

Формат вывода:
[
  {{
    "title": "Доделать домашнюю работу по математике",
    "description": "",
  }}
]

Правила:
- Извлекайте только чёткие, выполнимые задачи.
- Делайте заголовки (title) короткими и конкретными.
- Если дополнительная информация полезна, помещайте её в поле "description". В противном случае используйте пустую строку.
- Если в транскрипции нет чётких задач, верните пустой массив [].
- Сохраняйте оригинальный смысл. Не придумывайте задачи.

Транскрипция:
{transcript}
"""

DAY_KEYWORDS: dict[str, DayOfWeek] = {
    "monday": "Monday",
    "tuesday": "Tuesday",
    "wednesday": "Wednesday",
    "thursday": "Thursday",
    "friday": "Friday",
    "saturday": "Saturday",
    "sunday": "Sunday",
}

NON_TASK_PATTERNS = (
    "audio source:",
    "reminder:",
    "note to self:",
)

TASK_VERBS = (
    "add",
    "book",
    "buy",
    "call",
    "check",
    "complete",
    "email",
    "finish",
    "move",
    "plan",
    "practice",
    "prepare",
    "read",
    "remind",
    "review",
    "schedule",
    "send",
    "study",
    "submit",
    "write",
)

TASK_START_PATTERN = re.compile(
    r"\b(" + "|".join(TASK_VERBS) + r")\b",
    flags=re.IGNORECASE,
)


class ExtractedTaskPayload(BaseModel):
    title: str
    description: str = ""
    day_of_week: DayOfWeek | None = None


class TaskExtractionService(Protocol):
    async def extract_tasks(self, transcript: str) -> list[TaskCreate]:
        ...


class MockTaskExtractionService:
    async def extract_tasks(self, transcript: str) -> list[TaskCreate]:
        return [TaskCreate(title=transcript, day_of_week=get_current_weekday())]


class RealLLMTaskExtractionService:
    def __init__(self, api_key: str, model: str, api_url: str | None = None) -> None:
        self.api_key = api_key
        self.model = model
        self.api_url = api_url

    async def extract_tasks(self, transcript: str) -> list[TaskCreate]:
        prompt = build_task_extraction_prompt(transcript)
        del prompt
        raise NotImplementedError(
            "LLM task extraction is not implemented yet. "
            "Replace this placeholder with a real API call that returns JSON."
        )


class LocalLLMTaskExtractionService:
    def __init__(self, model: str = "qwen3:4b", api_url: str | None = None) -> None:
        self.client = Client(host=api_url)
        self.model = model

    async def extract_tasks(self, transcript: str) -> list[TaskCreate]:
        print(f"extract_tasks")
        print(f"transcript {transcript}")
        print(f"client {self.client}")
        print(f"client {self.client.list()}")
        print(f"model {self.model}")
        prompt = build_task_extraction_prompt(transcript)
        print(f"prompt  {prompt}")
        response = self.client.generate(
            model=self.model,
            prompt=prompt,
        )

        print(f"response: {response['response']}")
        chunks = json.loads(response['response'])
        tasks: list[TaskCreate] = []

        for chunk in chunks:

            tasks.append(TaskCreate(
                title=chunk.get("title"),
                description=chunk.get("description") or "",
                day_of_week=get_current_weekday(),
                status="todo",
            ))

        return tasks


def get_current_weekday() -> str:
    days = ["Monday", "Tuesday", "Wednesday", "Thursday",
            "Friday", "Saturday", "Sunday"]

    # weekday() возвращает 0 - понедельник, 6 - воскресенье
    today_index = datetime.now().weekday()
    return days[today_index]

def build_task_extraction_prompt(transcript: str) -> str:
    return TASK_EXTRACTION_PROMPT_TEMPLATE.format(transcript=transcript.strip())


def parse_task_extraction_output(raw_output: str) -> list[TaskCreate]:
    if not raw_output.strip():
        return []

    cleaned_output = raw_output.strip()
    if cleaned_output.startswith("```"):
        cleaned_output = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned_output, flags=re.DOTALL)

    try:
        parsed = json.loads(cleaned_output)
    except json.JSONDecodeError:
        return []

    if not isinstance(parsed, list):
        return []

    tasks: list[TaskCreate] = []
    for item in parsed:
        validated = validate_task_extraction_item(item)
        if validated is None:
            continue

        tasks.append(
            TaskCreate(
                title=validated.title,
                description=validated.description or "",
                day_of_week=validated.day_of_week,
                status="todo",
            )
        )

    return tasks


def validate_task_extraction_item(item: Any) -> ExtractedTaskPayload | None:
    if not isinstance(item, dict):
        return None

    try:
        validated = ExtractedTaskPayload.model_validate(item)
    except ValidationError:
        return None

    if not validated.title.strip():
        return None

    return validated


def get_task_extraction_service() -> TaskExtractionService:
    provider = settings.task_extraction_provider.lower()
    effective_api_key = settings.llm_api_key
    print(f"provider: {provider}")
    provider = "mock"
    print(f"provider: {provider}")
    if provider == "mock":
        return MockTaskExtractionService()

    if effective_api_key:
        return RealLLMTaskExtractionService(
            api_key=effective_api_key,
            model=settings.llm_model,
            api_url=settings.llm_api_url,
        )

    if provider == "local":
        return LocalLLMTaskExtractionService(
            # model="llama3.2:3b",
            # model="qwen3:4b",
            model="qwen2.5:1.5b",
            api_url="http://voice-weekly-planner-ollama:11434",
        )


    return MockTaskExtractionService()


def extract_candidate_chunks(transcript: str) -> list[str]:
    cleaned = re.sub(r"\s+", " ", transcript).strip()
    if not cleaned:
        return []

    sentence_like_chunks = [part.strip(" ,") for part in re.split(r"[.\n;!?]+", cleaned) if part.strip()]
    verb_chunks = split_by_task_verbs(cleaned)

    ordered_chunks: list[str] = []
    seen: set[str] = set()
    for chunk in sentence_like_chunks + verb_chunks:
        normalized = normalize_chunk_key(chunk)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        ordered_chunks.append(chunk.strip(" ,"))

    return ordered_chunks


def split_by_task_verbs(transcript: str) -> list[str]:
    matches = list(TASK_START_PATTERN.finditer(transcript))
    if not matches:
        return []

    chunks: list[str] = []
    for index, match in enumerate(matches):
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(transcript)
        chunk = transcript[start:end].strip(" ,")
        if chunk:
            chunks.append(chunk)

    return chunks


def normalize_chunk_key(chunk: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", chunk.lower())).strip()


def build_task_from_chunk(chunk: str) -> TaskCreate | None:
    working_chunk = chunk.strip(" ,")
    day = next(
        (weekday for keyword, weekday in DAY_KEYWORDS.items() if keyword in working_chunk.lower()),
        None,
    )

    description = ""
    lowered = working_chunk.lower()
    if lowered.startswith("remind me to "):
        working_chunk = working_chunk[13:].strip()
    elif lowered.startswith("add a task to "):
        working_chunk = working_chunk[14:].strip()
    elif lowered.startswith("add task to "):
        working_chunk = working_chunk[12:].strip()

    move_match = re.match(
        r"move\s+(?P<title>.+?)\s+to\s+(?P<day>monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b",
        working_chunk,
        flags=re.IGNORECASE,
    )
    if move_match:
        working_chunk = move_match.group("title").strip(" ,")
        day = DAY_KEYWORDS[move_match.group("day").lower()]

    add_match = re.match(
        r"add\s+(?P<title>.+?)(?:\s+on\s+(?P<day>monday|tuesday|wednesday|thursday|friday|saturday|sunday))?$",
        working_chunk,
        flags=re.IGNORECASE,
    )
    if add_match:
        working_chunk = add_match.group("title").strip(" ,")
        if add_match.group("day"):
            day = DAY_KEYWORDS[add_match.group("day").lower()]

    working_chunk, description = split_time_details(working_chunk, description)
    title = cleanup_task_title(working_chunk)
    if not title:
        return None

    return TaskCreate(
        title=title,
        description=description or "",
        day_of_week=day,
        status="todo",
    )


def split_time_details(chunk: str, current_description: str) -> tuple[str, str]:
    time_phrase_match = re.search(
        r"\b(today|tonight|tomorrow(?: morning| afternoon| evening)?|after lunch|before lunch|at \d{1,2}(?::\d{2})?\s*(?:am|pm)?|for \d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b",
        chunk,
        flags=re.IGNORECASE,
    )
    if not time_phrase_match:
        return chunk, current_description

    description = time_phrase_match.group(0).strip()
    trimmed_chunk = (
            chunk[: time_phrase_match.start()] + " " + chunk[time_phrase_match.end():]
    ).strip(" ,")
    return trimmed_chunk, description if not current_description else current_description


def cleanup_task_title(chunk: str) -> str:
    cleaned = chunk.strip(" ,")
    cleaned = re.sub(r"^(and|then|also)\s+", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(
        r"\b(on|at|by|for)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" ,")
    if not cleaned:
        return ""

    return cleaned[0].upper() + cleaned[1:]
