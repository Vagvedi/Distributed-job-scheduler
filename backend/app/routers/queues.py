from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.queue import (
    QueueCreate,
    QueueResponse,
    QueueStatusUpdate,
)
from app.services.queue_service import (
    create_queue,
    get_all_queues,
    get_queues_by_project,
    get_queue,
    update_queue_status,
)

router = APIRouter(
    prefix="/queues",
    tags=["Queues"]
)


@router.get("/", response_model=List[QueueResponse])
def list_all_queues(
    db: Session = Depends(get_db)
):
    """Get all queues"""
    try:
        return get_all_queues(db)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=QueueResponse)
def create_queue_endpoint(
    project_id: int,
    queue: QueueCreate,
    db: Session = Depends(get_db)
):
    """Create a new queue for a project"""
    try:
        return create_queue(db, project_id, queue)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}", response_model=List[QueueResponse])
def list_queues_by_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get all queues for a specific project"""
    try:
        return get_queues_by_project(db, project_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/queue/{queue_id}", response_model=QueueResponse)
def get_queue_endpoint(
    queue_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific queue by ID"""
    try:
        return get_queue(db, queue_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{queue_id}/status", response_model=QueueResponse)
def update_queue_status_endpoint(
    queue_id: int,
    status_update: QueueStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update the status of a queue (active/inactive)"""
    try:
        return update_queue_status(db, queue_id, status_update.status)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
