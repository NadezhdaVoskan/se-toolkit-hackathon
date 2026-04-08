from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Voice Weekly Planner API"
    api_prefix: str = "/api"
    database_url: str = "postgresql+psycopg://planner:planner@localhost:5432/voice_weekly_planner"
    allowed_origins: str = Field(default="http://localhost:3000")
    transcription_provider: str = "local"
    whisper_api_key: str | None = None
    whisper_model: str = "whisper-1"
    whisper_language: str | None = "ru"
    whisper_api_url: str | None = None
    local_whisper_model: str = "large-v3-turbo"
    local_whisper_device: str = "cpu"
    local_whisper_compute_type: str = "int8"
    local_whisper_download_root: str = ".cache/faster-whisper"
    task_extraction_provider: str = "local"
    llm_api_key: str | None = None
    llm_model: str = "gpt-4o-mini"
    llm_api_url: str | None = None
    command_parser_provider: str = "local"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
