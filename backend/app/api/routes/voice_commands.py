from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.voice_command import VoiceCommandResponse
from app.services.voice_command_service import process_voice_command_upload

router = APIRouter()


@router.post("/upload", response_model=VoiceCommandResponse, status_code=status.HTTP_200_OK)
async def upload_voice_command(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> VoiceCommandResponse:
    return await process_voice_command_upload(db, file)
