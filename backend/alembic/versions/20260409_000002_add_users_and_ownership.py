"""add users and ownership columns

Revision ID: 20260409_000002
Revises: 20260405_000001
Create Date: 2026-04-09 00:00:02
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260409_000002"
down_revision: Union[str, None] = "20260405_000001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=512), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.add_column("voice_notes", sa.Column("user_id", sa.String(length=36), nullable=True))
    op.create_index("ix_voice_notes_user_id", "voice_notes", ["user_id"], unique=False)
    op.create_foreign_key(
        "fk_voice_notes_user_id_users",
        "voice_notes",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.add_column("tasks", sa.Column("user_id", sa.String(length=36), nullable=True))
    op.create_index("ix_tasks_user_id", "tasks", ["user_id"], unique=False)
    op.create_foreign_key(
        "fk_tasks_user_id_users",
        "tasks",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_tasks_user_id_users", "tasks", type_="foreignkey")
    op.drop_index("ix_tasks_user_id", table_name="tasks")
    op.drop_column("tasks", "user_id")

    op.drop_constraint("fk_voice_notes_user_id_users", "voice_notes", type_="foreignkey")
    op.drop_index("ix_voice_notes_user_id", table_name="voice_notes")
    op.drop_column("voice_notes", "user_id")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
