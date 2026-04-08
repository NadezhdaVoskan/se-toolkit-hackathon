import json
import mimetypes
import os
import uuid
from pathlib import Path
from typing import Protocol
from urllib import error, request

from app.core.config import settings

DEFAULT_OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions"
PROJECT_ROOT = Path(__file__).resolve().parents[3]


class TranscriptionServiceError(RuntimeError):
    pass


class TranscriptionService(Protocol):
    async def transcribe(self, file_path: Path, original_filename: str) -> str:
        ...


class MockTranscriptionService:
    async def transcribe(self, file_path: Path, original_filename: str) -> str:
        del file_path
        if "voice-command" in original_filename.lower():
            return "Add buy groceries on Thursday."
        return (
            f"Review project timeline on Monday. "
            f"Prepare presentation slides on Wednesday. "
            f"Audio source: {original_filename}."
        )


class LocalWhisperTranscriptionService:
    def __init__(
        self,
        model_name: str,
        device: str,
        compute_type: str,
        download_root: str,
        language: str | None = None,
    ) -> None:
        self.model_name = model_name
        self.device = device
        self.compute_type = compute_type
        self.download_root = download_root
        self.language = language

    async def transcribe(self, file_path: Path, original_filename: str) -> str:
        del original_filename

        if not file_path.exists():
            raise TranscriptionServiceError("Uploaded audio file could not be found for transcription.")

        try:
            from faster_whisper import WhisperModel
        except ImportError as exc:
            raise TranscriptionServiceError(
                "Local Whisper is not installed. Install it with: pip install faster-whisper"
            ) from exc

        cache_dir = Path(self.download_root).expanduser()
        cache_dir.mkdir(parents=True, exist_ok=True)
        print(f"model_name: {self.model_name}")
        print(f"cache_dir: {cache_dir}")
        os.environ["HF_HOME"] = str(cache_dir)
        os.environ["HF_TOKEN"] = ""
        os.environ["HUGGINGFACE_HUB_CACHE"] = str(cache_dir / "hub")
        os.environ["HF_HUB_DISABLE_XET"] = "1"

        try:
            model_source = resolve_local_whisper_model_source(
                model_name=self.model_name,
                download_root=cache_dir,
            )
            print(f"model_source: {model_source}")

            segments, _ = transcribe_with_local_whisper(
                model_source=model_source,
                file_path=file_path,
                device=self.device,
                compute_type=self.compute_type,
                download_root=cache_dir,
                language=self.language,
            )
            print(f"segments: {segments}")
        except Exception as exc:
            raise TranscriptionServiceError(
                f"Local Whisper transcription failed: {type(exc).__name__}: {exc}"
            ) from exc

        transcript_parts = [segment.text.strip() for segment in segments if segment.text.strip()]
        transcript = " ".join(transcript_parts).strip()
        if not transcript:
            raise TranscriptionServiceError("Local Whisper returned an empty transcript.")

        print(f"transcript: {transcript}")
        return transcript


class WhisperTranscriptionService:
    def __init__(
        self,
        api_key: str,
        model: str,
        api_url: str | None = None,
        language: str | None = None,
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.api_url = api_url
        self.language = language

    async def transcribe(self, file_path: Path, original_filename: str) -> str:
        if not file_path.exists():
            raise TranscriptionServiceError("Uploaded audio file could not be found for transcription.")

        request_url = self.api_url or DEFAULT_OPENAI_TRANSCRIPTION_URL
        request_data = [
            ("model", self.model),
            ("response_format", "json"),
            ("temperature", "0"),
        ]
        if self.language:
            request_data.append(("language", self.language))

        try:
            response_payload = await submit_openai_transcription_request(
                request_url=request_url,
                api_key=self.api_key,
                file_path=file_path,
                original_filename=original_filename or file_path.name,
                fields=request_data,
            )
        except TimeoutError as exc:
            raise TranscriptionServiceError("OpenAI transcription request timed out.") from exc
        except error.URLError as exc:
            raise TranscriptionServiceError(build_network_error_message(exc)) from exc
        except error.HTTPError as exc:
            raise TranscriptionServiceError(build_openai_error_message(exc.code, exc.read())) from exc

        transcript = response_payload.get("text") if isinstance(response_payload, dict) else None
        if not isinstance(transcript, str) or not transcript.strip():
            raise TranscriptionServiceError("OpenAI transcription returned an empty transcript.")

        return transcript.strip()


async def submit_openai_transcription_request(
    request_url: str,
    api_key: str,
    file_path: Path,
    original_filename: str,
    fields: list[tuple[str, str]],
) -> dict:
    boundary = f"----VoiceWeeklyPlanner{uuid.uuid4().hex}"
    request_body = build_multipart_body(
        boundary=boundary,
        fields=fields,
        file_path=file_path,
        original_filename=original_filename,
    )
    http_request = request.Request(
        request_url,
        data=request_body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )

    with request.urlopen(http_request, timeout=60) as response:
        raw_payload = response.read()

    try:
        parsed = json.loads(raw_payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise TranscriptionServiceError("OpenAI transcription returned an invalid JSON response.") from exc

    if not isinstance(parsed, dict):
        raise TranscriptionServiceError("OpenAI transcription returned an unexpected response shape.")

    return parsed


def build_multipart_body(
    boundary: str,
    fields: list[tuple[str, str]],
    file_path: Path,
    original_filename: str,
) -> bytes:
    line_break = b"\r\n"
    body = bytearray()

    for name, value in fields:
        body.extend(f"--{boundary}".encode("utf-8"))
        body.extend(line_break)
        body.extend(f'Content-Disposition: form-data; name="{name}"'.encode("utf-8"))
        body.extend(line_break)
        body.extend(line_break)
        body.extend(value.encode("utf-8"))
        body.extend(line_break)

    content_type = mimetypes.guess_type(original_filename)[0] or "application/octet-stream"
    file_bytes = file_path.read_bytes()

    body.extend(f"--{boundary}".encode("utf-8"))
    body.extend(line_break)
    body.extend(
        (
            f'Content-Disposition: form-data; name="file"; filename="{original_filename}"'
        ).encode("utf-8")
    )
    body.extend(line_break)
    body.extend(f"Content-Type: {content_type}".encode("utf-8"))
    body.extend(line_break)
    body.extend(line_break)
    body.extend(file_bytes)
    body.extend(line_break)
    body.extend(f"--{boundary}--".encode("utf-8"))
    body.extend(line_break)

    return bytes(body)


def build_openai_error_message(status_code: int, raw_payload: bytes) -> str:
    if status_code in {401, 403}:
        return "OpenAI transcription request was rejected. Check WHISPER_API_KEY."
    if status_code == 429:
        return "OpenAI transcription rate limit was reached. Try again in a moment."

    default_message = f"OpenAI transcription failed with status {status_code}."

    try:
        payload = json.loads(raw_payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return default_message

    if not isinstance(payload, dict):
        return default_message

    error_payload = payload.get("error")
    if isinstance(error_payload, dict):
        message = error_payload.get("message")
        if isinstance(message, str) and message.strip():
            return f"OpenAI transcription failed: {message.strip()}"

    message = payload.get("message")
    if isinstance(message, str) and message.strip():
        return f"OpenAI transcription failed: {message.strip()}"

    return default_message


def build_network_error_message(exc: error.URLError) -> str:
    reason = exc.reason
    if reason is None:
        return "Could not reach the OpenAI transcription service."

    reason_text = str(reason).strip()
    if not reason_text:
        return "Could not reach the OpenAI transcription service."

    return f"Could not reach the OpenAI transcription service: {reason_text}"


def transcribe_with_local_whisper(
    *,
    model_source: str,
    file_path: Path,
    device: str,
    compute_type: str,
    download_root: Path,
    language: str | None,
):
    from faster_whisper import WhisperModel

    attempted_configs = build_local_whisper_attempts(device=device, compute_type=compute_type)
    last_error: Exception | None = None

    for attempt_device, attempt_compute_type in attempted_configs:
        try:
            model = WhisperModel(
                model_source,
                device=attempt_device,
                compute_type=attempt_compute_type,
                download_root=str(download_root),
            )
            return model.transcribe(
                str(file_path),
                language=language,
                beam_size=5,
                best_of=5,
                vad_filter=True,
                condition_on_previous_text=False,
                temperature=0,
            )
        except Exception as exc:
            last_error = exc
            if not should_retry_local_whisper(exc, attempt_device):
                raise

    if last_error is not None:
        raise last_error

    raise RuntimeError("Local Whisper could not start with any device configuration.")


def build_local_whisper_attempts(device: str, compute_type: str) -> list[tuple[str, str]]:
    normalized_device = device.lower().strip()
    normalized_compute_type = compute_type.lower().strip()

    attempts: list[tuple[str, str]] = [(normalized_device, normalized_compute_type)]
    cpu_fallbacks = [("cpu", "int8"), ("cpu", "float32")]

    for fallback in cpu_fallbacks:
        if fallback not in attempts:
            attempts.append(fallback)

    return attempts


def should_retry_local_whisper(exc: Exception, attempted_device: str) -> bool:
    if attempted_device == "cpu":
        return False

    message = str(exc).lower()
    retry_markers = (
        "cublas",
        "cudnn",
        "cuda",
        "cupti",
        "cannot be loaded",
        "failed to create cuda",
        "no gpu detected",
    )
    return any(marker in message for marker in retry_markers)


def resolve_local_whisper_model_source(model_name: str, download_root: Path) -> str:
    local_snapshot = find_local_whisper_snapshot(download_root, model_name)
    if local_snapshot is not None:
        return str(local_snapshot)

    any_local_snapshot = find_any_local_whisper_snapshot(download_root)
    if any_local_snapshot is not None:
        return str(any_local_snapshot)

    return model_name


def find_local_whisper_snapshot(download_root: Path, model_name: str) -> Path | None:
    repo_relative_root = PROJECT_ROOT / download_root
    candidate_roots = [
        download_root,
        repo_relative_root,
        download_root / "hub",
        repo_relative_root / "hub",
    ]

    model_folder_name = f"models--Systran--faster-whisper-{model_name}"

    for root in candidate_roots:
        snapshots_dir = root / model_folder_name / "snapshots"
        if not snapshots_dir.exists():
            continue

        snapshot_dirs = [path for path in snapshots_dir.iterdir() if path.is_dir()]
        if snapshot_dirs:
            return sorted(snapshot_dirs)[-1]

    return None


def find_any_local_whisper_snapshot(download_root: Path) -> Path | None:
    repo_relative_root = PROJECT_ROOT / download_root
    candidate_roots = [
        download_root,
        repo_relative_root,
        download_root / "hub",
        repo_relative_root / "hub",
    ]

    for root in candidate_roots:
        if not root.exists():
            continue

        for model_dir in root.glob("models--Systran--faster-whisper-*"):
            snapshots_dir = model_dir / "snapshots"
            if not snapshots_dir.exists():
                continue

            snapshot_dirs = [path for path in snapshots_dir.iterdir() if path.is_dir()]
            if snapshot_dirs:
                return sorted(snapshot_dirs)[-1]

    return None


def get_transcription_service() -> TranscriptionService:
    provider = settings.transcription_provider.lower()
    effective_api_key = settings.whisper_api_key.strip() if settings.whisper_api_key else None
    print("provider", provider)
    print("settings.local_whisper_model", settings.local_whisper_model)
    settings.local_whisper_model = "medium"
    settings.local_whisper_device = "cpu"
    settings.local_whisper_compute_type = "int8"
    settings.whisper_language = "en"
    print("settings.local_whisper_model", settings.local_whisper_model)
    if provider == "mock":
        return MockTranscriptionService()

    if provider == "local":
        return LocalWhisperTranscriptionService(
            model_name=settings.local_whisper_model,
            device=settings.local_whisper_device,
            compute_type=settings.local_whisper_compute_type,
            download_root=settings.local_whisper_download_root,
            language=settings.whisper_language,
        )

    if effective_api_key:
        return WhisperTranscriptionService(
            api_key=effective_api_key,
            model=settings.whisper_model,
            api_url=settings.whisper_api_url,
            language=settings.whisper_language,
        )

    if provider == "auto":
        print("local provider")
        return LocalWhisperTranscriptionService(
            model_name=settings.local_whisper_model,
            device=settings.local_whisper_device,
            compute_type=settings.local_whisper_compute_type,
            download_root=settings.local_whisper_download_root,
            language=settings.whisper_language,
        )

    return MockTranscriptionService()
