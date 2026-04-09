from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

DayOfWeek = Literal[
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]

TaskStatus = Literal["todo", "done"]


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    day_of_week: DayOfWeek | None = None
    due_date: date | None = None
    status: TaskStatus = "todo"
    source_voice_note_id: str | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    day_of_week: DayOfWeek | None = None
    due_date: date | None = None
    status: TaskStatus | None = None


class TaskRead(TaskCreate):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
