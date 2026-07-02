from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.worker import (
    WorkerCreate,
    WorkerResponse,
    WorkerStatusUpdate,
    WorkerHeartbeatCreate,
    JobAssignment,
)
from app.services.worker_service import (
    create_worker,
    get_workers,
    get_worker_by_id,
    update_worker_status,
    assign_job_to_worker,
    worker_heartbeat,
    get_idle_workers,
)

router = APIRouter(
    prefix="/workers",
    tags=["Workers"]
)


@router.post("/", response_model=WorkerResponse)
def create_worker_endpoint(
    worker: WorkerCreate,
    db: Session = Depends(get_db)
):
    """Register a new worker"""
    try:
        return create_worker(db, worker)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[WorkerResponse])
def list_workers(
    db: Session = Depends(get_db)
):
    """Get all workers"""
    try:
        return get_workers(db)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/idle", response_model=List[WorkerResponse])
def list_idle_workers(
    db: Session = Depends(get_db)
):
    """Get all idle workers"""
    try:
        return get_idle_workers(db)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{worker_id}", response_model=WorkerResponse)
def get_worker_endpoint(
    worker_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific worker by ID"""
    try:
        return get_worker_by_id(db, worker_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{worker_id}/status", response_model=WorkerResponse)
def update_worker_status_endpoint(
    worker_id: int,
    status_update: WorkerStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update the status of a worker"""
    try:
        return update_worker_status(db, worker_id, status_update.status)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{worker_id}/heartbeat", response_model=WorkerResponse)
def worker_heartbeat_endpoint(
    worker_id: int,
    heartbeat: WorkerHeartbeatCreate,
    db: Session = Depends(get_db)
):
    """Record a worker heartbeat"""
    try:
        return worker_heartbeat(db, worker_id, heartbeat)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{worker_id}/assign-job", response_model=WorkerResponse)
def assign_job_endpoint(
    worker_id: int,
    assignment: JobAssignment,
    db: Session = Depends(get_db)
):
    """Assign a job to a worker"""
    try:
        return assign_job_to_worker(db, worker_id, assignment.job_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
