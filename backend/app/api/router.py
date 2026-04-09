from fastapi import APIRouter

from app.api.routes import auth, health, tasks, voice_notes

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(voice_notes.router, prefix="/voice-notes", tags=["voice-notes"])
