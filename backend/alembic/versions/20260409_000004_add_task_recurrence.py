"""add recurrence to tasks

Revision ID: 20260409_000004
Revises: 20260409_000003
Create Date: 2026-04-09 00:00:04
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260409_000004"
down_revision: Union[str, None] = "20260409_000003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column("recurrence", sa.String(length=16), nullable=False, server_default="none"),
    )
    op.alter_column("tasks", "recurrence", server_default=None)


def downgrade() -> None:
    op.drop_column("tasks", "recurrence")
