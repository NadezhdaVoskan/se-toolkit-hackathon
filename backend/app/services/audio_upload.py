import shutil
import tempfile
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

ALLOWED_AUDIO_CONTENT_TYPES = {
    "audio/flac",
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/x-m4a",
}

ALLOWED_AUDIO_EXTENSIONS = {
    ".flac",
    ".mp3",
    ".wav",
    ".webm",
    ".ogg",
    ".m4a",
    ".mp4",
}


def validate_audio_upload(upload: UploadFile) -> None:
    filename = upload.filename or ""
    suffix = Path(filename).suffix.lower()

    if upload.content_type not in ALLOWED_AUDIO_CONTENT_TYPES and suffix not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported audio file type.",
        )


def save_upload_to_temporary_file(upload: UploadFile) -> Path:
    suffix = Path(upload.filename or "").suffix or ".tmp"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        upload.file.seek(0)
        shutil.copyfileobj(upload.file, temp_file)
        return Path(temp_file.name)
