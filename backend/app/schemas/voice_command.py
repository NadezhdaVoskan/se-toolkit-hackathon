from typing import Literal

from pydantic import BaseModel

from app.schemas.task import DayOfWeek, TaskRead

VoiceCommandIntent = Literal["add", "mark_done", "delete", "move", "unknown"]


class ParsedVoiceCommand(BaseModel):
    intent: VoiceCommandIntent
    task_title: str | None = None
    day_of_week: DayOfWeek | None = None


class VoiceCommandResponse(BaseModel):
    success: bool
    transcription_text: str
    action_summary: str
    command: ParsedVoiceCommand
    affected_task: TaskRead | None = None
