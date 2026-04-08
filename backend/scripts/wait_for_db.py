import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

import time

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings


def wait_for_database(max_attempts: int = 30, delay_seconds: int = 2) -> None:
    engine = create_engine(settings.database_url, future=True)

    for attempt in range(1, max_attempts + 1):
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            print("Database is ready.")
            return
        except SQLAlchemyError:
            print(f"Waiting for database... attempt {attempt}/{max_attempts}")
            time.sleep(delay_seconds)

    raise RuntimeError("Database did not become ready in time.")


if __name__ == "__main__":
    wait_for_database()
