from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.services.task_service import create_task, delete_task, get_task, list_tasks, update_task

router = APIRouter()


@router.get("", response_model=list[TaskRead])
def get_tasks(db: Session = Depends(get_db)) -> list[TaskRead]:
    return list_tasks(db)


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task_endpoint(
    payload: TaskCreate,
    db: Session = Depends(get_db),
) -> TaskRead:
    return create_task(db, payload)


@router.patch("/{task_id}", response_model=TaskRead)
def update_task_endpoint(
    task_id: str,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
) -> TaskRead:
    task = update_task(db, task_id, payload)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task_endpoint(task_id: str, db: Session = Depends(get_db)) -> Response:
    task = get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    delete_task(db, task)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
