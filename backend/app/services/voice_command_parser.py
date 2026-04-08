import json
import re
from difflib import SequenceMatcher
from typing import Any, Protocol

from pydantic import BaseModel, ValidationError

from app.core.config import settings
from app.schemas.task import DayOfWeek
from app.schemas.voice_command import ParsedVoiceCommand

VOICE_COMMAND_PROMPT_TEMPLATE = """You are an assistant that converts a speech transcription into one task-management command.

Return only valid JSON.
Do not include markdown fences.
Do not include explanations.

Output format:
{
  "intent": "move",
  "task_title": "presentation",
  "day_of_week": "Friday"
}

Allowed intent values:
- add
- mark_done
- delete
- move
- unknown

Rules:
- Extract exactly one command.
- "task_title" should contain the task phrase only.
- For "move" and "add", include "day_of_week" when clearly present.
- For "mark_done" and "delete", set "day_of_week" to null unless it is clearly required.
- If no clear command exists, return:
  {"intent":"unknown","task_title":null,"day_of_week":null}
- "day_of_week" must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday, or null.

Transcription:
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

DAY_PATTERN = re.compile(
    r"\b(?:on|to|for)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b",
    flags=re.IGNORECASE,
)


class VoiceCommandParser(Protocol):
    async def parse_command(self, transcript: str) -> ParsedVoiceCommand:
        ...


class VoiceCommandPayload(BaseModel):
    intent: str
    task_title: str | None = None
    day_of_week: DayOfWeek | None = None


class MockVoiceCommandParser:
    async def parse_command(self, transcript: str) -> ParsedVoiceCommand:
        normalized = normalize_text(transcript)
        if not normalized:
            return ParsedVoiceCommand(intent="unknown")

        day_of_week = extract_day_of_week(transcript)

        add_command = try_parse_add_command(transcript, normalized, day_of_week)
        if add_command:
            return add_command

        done_command = try_parse_mark_done_command(transcript, normalized)
        if done_command:
            return done_command

        delete_command = try_parse_delete_command(transcript, normalized)
        if delete_command:
            return delete_command

        move_command = try_parse_move_command(transcript, normalized, day_of_week)
        if move_command:
            return move_command

        return ParsedVoiceCommand(intent="unknown")


class RealLLMVoiceCommandParser:
    def __init__(self, api_key: str, model: str, api_url: str | None = None) -> None:
        self.api_key = api_key
        self.model = model
        self.api_url = api_url

    async def parse_command(self, transcript: str) -> ParsedVoiceCommand:
        prompt = build_voice_command_prompt(transcript)
        del prompt
        raise NotImplementedError(
            "LLM voice command parsing is not implemented yet. "
            "Replace this placeholder with a real API call that returns JSON."
        )


def build_voice_command_prompt(transcript: str) -> str:
    return VOICE_COMMAND_PROMPT_TEMPLATE.format(transcript=transcript.strip())


def parse_voice_command_output(raw_output: str) -> ParsedVoiceCommand:
    if not raw_output.strip():
        return ParsedVoiceCommand(intent="unknown")

    cleaned_output = raw_output.strip()
    if cleaned_output.startswith("```"):
        cleaned_output = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned_output, flags=re.DOTALL)

    try:
        parsed = json.loads(cleaned_output)
    except json.JSONDecodeError:
        return ParsedVoiceCommand(intent="unknown")

    if not isinstance(parsed, dict):
        return ParsedVoiceCommand(intent="unknown")

    try:
        validated = VoiceCommandPayload.model_validate(parsed)
    except ValidationError:
        return ParsedVoiceCommand(intent="unknown")

    intent = validated.intent.lower()
    if intent not in {"add", "mark_done", "delete", "move", "unknown"}:
        intent = "unknown"

    title = validated.task_title.strip() if validated.task_title else None
    if title == "":
        title = None

    return ParsedVoiceCommand(
        intent=intent,
        task_title=title,
        day_of_week=validated.day_of_week,
    )


def get_voice_command_parser() -> VoiceCommandParser:
    provider = settings.command_parser_provider.lower()
    effective_api_key = settings.llm_api_key

    if provider == "mock":
        return MockVoiceCommandParser()

    if effective_api_key:
        return RealLLMVoiceCommandParser(
            api_key=effective_api_key,
            model=settings.llm_model,
            api_url=settings.llm_api_url,
        )

    return MockVoiceCommandParser()


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", text.lower())).strip()


def extract_day_of_week(text: str) -> DayOfWeek | None:
    day_match = DAY_PATTERN.search(text)
    if not day_match:
        return None
    return DAY_KEYWORDS[day_match.group(1).lower()]


def try_parse_add_command(
    transcript: str,
    normalized: str,
    day_of_week: DayOfWeek | None,
) -> ParsedVoiceCommand | None:
    if not normalized.startswith(("add ", "create ", "schedule ", "plan ")):
        return None

    title = re.sub(
        r"^(add|create|schedule|plan)\s+",
        "",
        transcript,
        flags=re.IGNORECASE,
    )
    title = remove_day_phrase(title).strip(" ,.")

    if not title:
        return None

    return ParsedVoiceCommand(intent="add", task_title=title, day_of_week=day_of_week)


def try_parse_mark_done_command(
    transcript: str,
    normalized: str,
) -> ParsedVoiceCommand | None:
    done_patterns = ("mark ", "set ", "complete ", "finish ", "check ", "check off ")
    if not normalized.startswith(done_patterns) and " done" not in normalized and " completed" not in normalized:
        return None

    title = re.sub(
        r"^(mark|set|complete|finish|check(?:\s+off)?)\s+",
        "",
        transcript,
        flags=re.IGNORECASE,
    )
    title = re.sub(
        r"\b(as\s+done|done|completed|finished)\b",
        "",
        title,
        flags=re.IGNORECASE,
    ).strip(" ,.")

    if not title:
        return None

    return ParsedVoiceCommand(intent="mark_done", task_title=title)


def try_parse_delete_command(
    transcript: str,
    normalized: str,
) -> ParsedVoiceCommand | None:
    if not normalized.startswith(("delete ", "remove ", "cancel ")):
        return None

    title = re.sub(
        r"^(delete|remove|cancel)\s+",
        "",
        transcript,
        flags=re.IGNORECASE,
    ).strip(" ,.")

    if not title:
        return None

    return ParsedVoiceCommand(intent="delete", task_title=title)


def try_parse_move_command(
    transcript: str,
    normalized: str,
    day_of_week: DayOfWeek | None,
) -> ParsedVoiceCommand | None:
    if not normalized.startswith(("move ", "reschedule ", "shift ", "push ")):
        return None

    title = re.sub(
        r"^(move|reschedule|shift|push)\s+",
        "",
        transcript,
        flags=re.IGNORECASE,
    )
    title = remove_day_phrase(title).strip(" ,.")

    if not title:
        return None

    return ParsedVoiceCommand(intent="move", task_title=title, day_of_week=day_of_week)


def remove_day_phrase(text: str) -> str:
    return DAY_PATTERN.sub("", text, count=1)


def similarity_score(left: str, right: str) -> float:
    left_normalized = normalize_text(left)
    right_normalized = normalize_text(right)
    if not left_normalized or not right_normalized:
        return 0.0

    if left_normalized == right_normalized:
        return 1.0

    if left_normalized in right_normalized or right_normalized in left_normalized:
        return 0.95

    left_tokens = set(left_normalized.split())
    right_tokens = set(right_normalized.split())
    token_overlap = len(left_tokens & right_tokens) / max(len(left_tokens), len(right_tokens))
    sequence_score = SequenceMatcher(None, left_normalized, right_normalized).ratio()
    return max(token_overlap, (token_overlap + sequence_score) / 2)
