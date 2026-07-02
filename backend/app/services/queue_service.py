from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException

from app.models.queue import Queue
from app.models.project import Project
from app.schemas.queue import QueueCreate


def create_queue(db: Session, project_id: int, queue_data: QueueCreate):
    # Verify project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_queue = Queue(
        name=queue_data.name,
        priority=queue_data.priority,
        status=queue_data.status,
        project_id=project_id
    )

    db.add(db_queue)
    try:
        db.commit()
        db.refresh(db_queue)
        return db_queue
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create queue")


def get_all_queues(db: Session):
    return db.query(Queue).all()


def get_queues_by_project(db: Session, project_id: int):
    # Verify project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return db.query(Queue).filter(Queue.project_id == project_id).all()


def get_queue(db: Session, queue_id: int):
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    return queue


def update_queue_status(db: Session, queue_id: int, status: str):
    # Validate status
    valid_statuses = ["active", "inactive"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")

    queue.status = status
    try:
        db.commit()
        db.refresh(queue)
        return queue
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update queue status")
