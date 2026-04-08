from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.schemas.task import TaskCreate, TaskUpdate
from app.schemas.voice_command import ParsedVoiceCommand, VoiceCommandResponse
from app.services.audio_upload import save_upload_to_temporary_file, validate_audio_upload
from app.services.task_service import (
    create_task,
    delete_task,
    find_matching_task,
    update_task,
)
from app.services.transcription import TranscriptionServiceError, get_transcription_service
from app.services.voice_command_parser import get_voice_command_parser


async def process_voice_command_upload(
    db: Session,
    upload: UploadFile,
) -> VoiceCommandResponse:
    validate_audio_upload(upload)
    temp_file_path = save_upload_to_temporary_file(upload)
    transcription_service = get_transcription_service()
    command_parser = get_voice_command_parser()

    try:
        print("proccessing voice command")
        transcript = await transcription_service.transcribe(
            file_path=temp_file_path,
            original_filename=upload.filename or "voice-command",
        )
        parsed_command = await command_parser.parse_command(transcript)
        print(parsed_command)
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
            detail="Failed to process voice command.",
        ) from exc
    finally:
        temp_file_path.unlink(missing_ok=True)

    return apply_voice_command(db, transcript, parsed_command)


def apply_voice_command(
    db: Session,
    transcript: str,
    command: ParsedVoiceCommand,
) -> VoiceCommandResponse:
    print(command)
    print(command.intent)
    if command.intent == "unknown" or not command.task_title:
        return VoiceCommandResponse(
            success=False,
            transcription_text=transcript,
            action_summary="No clear voice command was recognized.",
            command=command,
            affected_task=None,
        )

    if command.intent == "add":
        created_task = create_task(
            db,
            TaskCreate(
                title=command.task_title,
                description="",
                day_of_week=command.day_of_week,
                status="todo",
            ),
        )
        summary = f'Added task "{created_task.title}"'
        if created_task.day_of_week:
            summary += f" on {created_task.day_of_week}"
        summary += "."
        return VoiceCommandResponse(
            success=True,
            transcription_text=transcript,
            action_summary=summary,
            command=command,
            affected_task=created_task,
        )

    matched_task = find_matching_task(
        db,
        command.task_title,
        prefer_todo=command.intent == "mark_done",
    )
    if matched_task is None:
        return VoiceCommandResponse(
            success=False,
            transcription_text=transcript,
            action_summary=f'Could not find a task matching "{command.task_title}".',
            command=command,
            affected_task=None,
        )

    if command.intent == "mark_done":
        if matched_task.status == "done":
            return VoiceCommandResponse(
                success=True,
                transcription_text=transcript,
                action_summary=f'Task "{matched_task.title}" was already marked as done.',
                command=command,
                affected_task=matched_task,
            )

        updated_task = update_task(
            db,
            matched_task.id,
            TaskUpdate(status="done"),
        )
        return VoiceCommandResponse(
            success=True,
            transcription_text=transcript,
            action_summary=f'Marked "{matched_task.title}" as done.',
            command=command,
            affected_task=updated_task,
        )

    if command.intent == "delete":
        deleted_title = matched_task.title
        delete_task(db, matched_task)
        return VoiceCommandResponse(
            success=True,
            transcription_text=transcript,
            action_summary=f'Deleted task "{deleted_title}".',
            command=command,
            affected_task=None,
        )

    if command.intent == "move":
        if not command.day_of_week:
            return VoiceCommandResponse(
                success=False,
                transcription_text=transcript,
                action_summary="The command did not include a clear target day.",
                command=command,
                affected_task=None,
            )

        updated_task = update_task(
            db,
            matched_task.id,
            TaskUpdate(day_of_week=command.day_of_week),
        )
        return VoiceCommandResponse(
            success=True,
            transcription_text=transcript,
            action_summary=f'Moved "{matched_task.title}" to {command.day_of_week}.',
            command=command,
            affected_task=updated_task,
        )

    return VoiceCommandResponse(
        success=False,
        transcription_text=transcript,
        action_summary="The voice command intent is not supported.",
        command=command,
        affected_task=None,
    )
