from fastapi import HTTPException, UploadFile, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.voice_note import VoiceNote
from app.schemas.task import TaskCreate
from app.schemas.voice_note import VoiceNoteUploadResponse
from app.services.audio_upload import save_upload_to_temporary_file, validate_audio_upload
from app.services.task_extraction import get_task_extraction_service
from app.services.task_service import create_tasks
from app.services.transcription import TranscriptionServiceError, get_transcription_service


async def create_voice_note_from_upload(
    db: Session,
    upload: UploadFile,
    user_id: str,
) -> VoiceNoteUploadResponse:
    validate_audio_upload(upload)
    temp_file_path = save_upload_to_temporary_file(upload)
    transcription_service = get_transcription_service()
    task_extraction_service = get_task_extraction_service()

    try:
        print("transcription_service")
        transcript = await transcription_service.transcribe(
            file_path=temp_file_path,
            original_filename=upload.filename or "uploaded-audio",
        )
        print("transcript",transcript)
        extracted_tasks = await task_extraction_service.extract_tasks(transcript)
        print("extracted_tasks",transcript)
    except NotImplementedError as exc:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=str(exc),
        ) from exc
    except TranscriptionServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process uploaded voice note: {type(exc).__name__}: {exc}",
        ) from exc
    finally:
        temp_file_path.unlink(missing_ok=True)

    try:
        voice_note = VoiceNote(
            original_filename=upload.filename or "uploaded-audio",
            transcription_text=transcript,
            user_id=user_id,
        )

        db.add(voice_note)
        db.commit()
        db.refresh(voice_note)

        linked_tasks = [
            task.model_copy(update={"source_voice_note_id": voice_note.id})
            for task in extracted_tasks
        ]
        created_tasks = create_tasks(db, linked_tasks, user_id) if linked_tasks else []
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while saving uploaded voice note: {type(exc).__name__}: {exc}",
        ) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error while saving uploaded voice note: {type(exc).__name__}: {exc}",
        ) from exc

    return VoiceNoteUploadResponse(
        transcription_text=transcript,
        voice_note=voice_note,
        extracted_tasks=created_tasks,
    )
