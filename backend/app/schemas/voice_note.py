from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.task import TaskCreate, TaskRead


class VoiceNoteRead(BaseModel):
    id: str
    original_filename: str
    transcription_text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VoiceNoteUploadResponse(BaseModel):
    transcription_text: str
    voice_note: VoiceNoteRead
    extracted_tasks: list[TaskRead]


class VoiceNoteProcessResponse(BaseModel):
    original_filename: str
    transcription_text: str
    extracted_tasks: list[TaskCreate]


class VoiceNoteConfirmRequest(BaseModel):
    original_filename: str
    transcription_text: str
    tasks: list[TaskCreate]
