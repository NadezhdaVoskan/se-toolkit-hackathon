from fastapi import APIRouter

from app.api.routes import health, tasks, voice_commands, voice_notes

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(voice_notes.router, prefix="/voice-notes", tags=["voice-notes"])
api_router.include_router(voice_commands.router, prefix="/voice-commands", tags=["voice-commands"])
