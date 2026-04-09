import uuid
from datetime import date
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.voice_note import VoiceNote


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    day_of_week: Mapped[str | None] = mapped_column(String(32), nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="todo", nullable=False)
    source_voice_note_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("voice_notes.id", ondelete="SET NULL"), nullable=True
    )
    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    source_voice_note: Mapped["VoiceNote | None"] = relationship(
        "VoiceNote",
        back_populates="tasks",
    )
    user: Mapped["User | None"] = relationship("User", back_populates="tasks")
