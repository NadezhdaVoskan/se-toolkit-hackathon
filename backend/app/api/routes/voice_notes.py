from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.voice_note import VoiceNoteUploadResponse
from app.services.voice_note_service import create_voice_note_from_upload

router = APIRouter()


@router.post("/upload", response_model=VoiceNoteUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_voice_note(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VoiceNoteUploadResponse:
    print("upload a voice note")
    return await create_voice_note_from_upload(db, file, current_user.id)
