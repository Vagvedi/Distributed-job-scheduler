from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.job import (
    JobCreate,
    JobResponse,
    JobStatusUpdate,
)
from app.services.job_service import (
    create_job,
    get_job,
    get_jobs_by_queue,
    update_job_status,
    retry_job,
    delete_job,
)

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)


@router.post("/", response_model=JobResponse)
def create_job_endpoint(
    job: JobCreate,
    db: Session = Depends(get_db)
):
    """Create a new job"""
    try:
        return create_job(db, job)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}", response_model=JobResponse)
def get_job_endpoint(
    job_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific job by ID"""
    try:
        return get_job(db, job_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/queue/{queue_id}", response_model=List[JobResponse])
def list_jobs_by_queue(
    queue_id: int,
    db: Session = Depends(get_db)
):
    """Get all jobs for a specific queue"""
    try:
        return get_jobs_by_queue(db, queue_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{job_id}/status", response_model=JobResponse)
def update_job_status_endpoint(
    job_id: int,
    status_update: JobStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update the status of a job"""
    try:
        return update_job_status(db, job_id, status_update.status, status_update.failure_reason)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{job_id}/retry", response_model=JobResponse)
def retry_job_endpoint(
    job_id: int,
    db: Session = Depends(get_db)
):
    """Retry a failed job"""
    try:
        return retry_job(db, job_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{job_id}")
def delete_job_endpoint(
    job_id: int,
    db: Session = Depends(get_db)
):
    """Delete a job"""
    try:
        return delete_job(db, job_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
