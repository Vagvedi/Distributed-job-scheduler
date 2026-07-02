from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException

from app.models.job import Job
from app.models.queue import Queue
from app.schemas.job import JobCreate


# Valid status transitions
VALID_STATUS_TRANSITIONS = {
    "QUEUED": ["RUNNING"],
    "RUNNING": ["SUCCESS", "FAILED"],
    "FAILED": ["RETRY", "DEAD_LETTER"],
    "RETRY": ["RUNNING", "FAILED", "DEAD_LETTER"],
    "SUCCESS": [],  # Terminal state
    "DEAD_LETTER": [],  # Terminal state
}

VALID_STATUSES = ["QUEUED", "RUNNING", "SUCCESS", "FAILED", "RETRY", "DEAD_LETTER"]


def validate_status_transition(current_status: str, new_status: str):
    """Validate if a status transition is allowed"""
    if new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"
        )
    
    if new_status == current_status:
        return  # No change is allowed
    
    allowed_transitions = VALID_STATUS_TRANSITIONS.get(current_status, [])
    if new_status not in allowed_transitions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition from {current_status} to {new_status}. Allowed transitions: {', '.join(allowed_transitions) if allowed_transitions else 'None (terminal state)'}"
        )


def create_job(db: Session, job_data: JobCreate):
    # Verify queue exists
    queue = db.query(Queue).filter(Queue.id == job_data.queue_id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")

    db_job = Job(
        queue_id=job_data.queue_id,
        payload=job_data.payload,
        priority=job_data.priority,
        max_retries=job_data.max_retries,
        status="QUEUED",
        retry_count=0,
        started_at=None,
        completed_at=None
    )

    db.add(db_job)
    try:
        db.commit()
        db.refresh(db_job)
        return db_job
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create job")


def get_job(db: Session, job_id: int):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def get_jobs_by_queue(db: Session, queue_id: int):
    # Verify queue exists
    queue = db.query(Queue).filter(Queue.id == queue_id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")

    return db.query(Job).filter(Job.queue_id == queue_id).all()


def update_job_status(db: Session, job_id: int, new_status: str):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Validate status transition
    validate_status_transition(job.status, new_status)

    # Update timestamps based on status
    if new_status == "RUNNING" and job.started_at is None:
        job.started_at = datetime.utcnow()
    elif new_status in ["SUCCESS", "FAILED", "DEAD_LETTER"] and job.completed_at is None:
        job.completed_at = datetime.utcnow()
    elif new_status == "RETRY":
        job.retry_count += 1
        # Check if retry count exceeds max retries
        if job.retry_count > job.max_retries:
            raise HTTPException(
                status_code=400,
                detail=f"Retry count ({job.retry_count}) exceeds max retries ({job.max_retries})"
            )
        # Reset started_at for retry
        job.started_at = None

    job.status = new_status

    try:
        db.commit()
        db.refresh(job)
        return job
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update job status")


def retry_job(db: Session, job_id: int):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status != "FAILED":
        raise HTTPException(
            status_code=400,
            detail="Only failed jobs can be retried"
        )

    # Check retry count
    if job.retry_count >= job.max_retries:
        raise HTTPException(
            status_code=400,
            detail=f"Job has reached maximum retry limit ({job.max_retries})"
        )

    # Reset for retry
    job.status = "QUEUED"
    job.retry_count += 1
    job.started_at = None
    job.completed_at = None

    try:
        db.commit()
        db.refresh(job)
        return job
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to retry job")


def delete_job(db: Session, job_id: int):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    try:
        db.delete(job)
        db.commit()
        return {"message": "Job deleted successfully"}
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete job")
