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
        retry_delay_seconds=job_data.retry_delay_seconds,
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


def upsert_dead_letter_entry(db: Session, job: Job, failure_reason: str | None = None):
    from app.models.dead_letter_queue import DeadLetterQueue
    from app.models.worker import Worker

    # Find worker assigned to this job
    worker = db.query(Worker).filter(Worker.current_job_id == job.id).first()
    worker_id = worker.id if worker else None

    # Check if entry already exists in DeadLetterQueue
    dlq_entry = db.query(DeadLetterQueue).filter(DeadLetterQueue.job_id == job.id).first()

    if dlq_entry:
        dlq_entry.queue_id = job.queue_id
        dlq_entry.retry_count = job.retry_count
        if failure_reason:
            dlq_entry.failure_reason = failure_reason
        dlq_entry.failed_at = datetime.utcnow()
        if worker_id:
            dlq_entry.worker_id = worker_id
    else:
        dlq_entry = DeadLetterQueue(
            job_id=job.id,
            queue_id=job.queue_id,
            retry_count=job.retry_count,
            failure_reason=failure_reason or "Job execution failed (retry limit exceeded)",
            failed_at=datetime.utcnow(),
            worker_id=worker_id
        )
        db.add(dlq_entry)


def update_job_status(db: Session, job_id: int, new_status: str, failure_reason: str | None = None):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Validate status transition
    validate_status_transition(job.status, new_status)

    # Update timestamps and status based on status
    if new_status == "RUNNING" and job.started_at is None:
        job.started_at = datetime.utcnow()
        job.status = new_status
    elif new_status in ["SUCCESS", "FAILED", "DEAD_LETTER"] and job.completed_at is None:
        job.completed_at = datetime.utcnow()
        # When job fails, increment retry count and check if should go to DEAD_LETTER
        if new_status == "FAILED":
            job.retry_count += 1
            if job.retry_count <= job.max_retries:
                job.status = "RETRY"
            else:
                job.status = "DEAD_LETTER"
        else:
            job.status = new_status
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
    else:
        job.status = new_status

    # If the job status is DEAD_LETTER, upsert a Dead Letter Queue entry
    if job.status == "DEAD_LETTER":
        upsert_dead_letter_entry(db, job, failure_reason)

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

    if job.status not in ["FAILED", "RETRY"]:
        raise HTTPException(
            status_code=400,
            detail="Only failed or retry jobs can be retried"
        )

    # Check retry count
    # Since retry_count is only incremented when the job fails:
    # - 1st failure sets retry_count to 1 (0 retries attempted so far)
    # - 2nd failure sets retry_count to 2 (1 retry attempted so far)
    # - N-th failure sets retry_count to N (N-1 retries attempted so far)
    # Therefore, the number of retries already attempted is max(0, job.retry_count - 1).
    # If the number of attempted retries is greater than or equal to max_retries, the limit is exceeded.
    retries_attempted = max(0, job.retry_count - 1)
    if retries_attempted >= job.max_retries:
        raise HTTPException(
            status_code=400,
            detail=f"Retry limit exceeded. Job has already been retried {retries_attempted} times (max allowed: {job.max_retries})"
        )

    # Reset for retry
    job.status = "QUEUED"
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
