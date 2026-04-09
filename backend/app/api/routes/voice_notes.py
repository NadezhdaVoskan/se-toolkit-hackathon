from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.voice_note import (
    VoiceNoteConfirmRequest,
    VoiceNoteProcessResponse,
    VoiceNoteUploadResponse,
)
from app.services.voice_note_service import (
    confirm_voice_note_tasks,
    create_voice_note_from_upload,
    process_voice_note_upload,
)

router = APIRouter()


@router.post("/upload", response_model=VoiceNoteUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_voice_note(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VoiceNoteUploadResponse:
    print("upload a voice note")
    return await create_voice_note_from_upload(db, file, current_user.id)


@router.post("/process", response_model=VoiceNoteProcessResponse, status_code=status.HTTP_200_OK)
async def process_voice_note(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> VoiceNoteProcessResponse:
    del current_user
    return await process_voice_note_upload(file)


@router.post("/confirm", response_model=VoiceNoteUploadResponse, status_code=status.HTTP_201_CREATED)
def confirm_voice_note(
    payload: VoiceNoteConfirmRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VoiceNoteUploadResponse:
    return confirm_voice_note_tasks(db, payload, current_user.id)
