from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException

from app.models.worker import Worker
from app.models.worker_heartbeat import WorkerHeartbeat
from app.models.job import Job
from app.schemas.worker import WorkerCreate, WorkerHeartbeatCreate


VALID_WORKER_STATUSES = ["ACTIVE", "IDLE", "BUSY", "OFFLINE"]


def validate_worker_status(status: str):
    """Validate worker status"""
    if status not in VALID_WORKER_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid worker status. Must be one of: {', '.join(VALID_WORKER_STATUSES)}"
        )


def create_worker(db: Session, worker_data: WorkerCreate):
    db_worker = Worker(
        name=worker_data.name,
        status="IDLE",
        current_job_id=None,
        last_heartbeat=None
    )

    db.add(db_worker)
    try:
        db.commit()
        db.refresh(db_worker)
        return db_worker
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create worker")


def get_workers(db: Session):
    return db.query(Worker).all()


def get_worker_by_id(db: Session, worker_id: int):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker


def update_worker_status(db: Session, worker_id: int, new_status: str):
    validate_worker_status(new_status)

    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    worker.status = new_status
    worker.updated_at = datetime.utcnow()

    try:
        db.commit()
        db.refresh(worker)
        return worker
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update worker status")


def assign_job_to_worker(db: Session, worker_id: int, job_id: int):
    # Verify worker exists
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Verify job exists
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Business rule: Worker cannot be assigned job if status = OFFLINE
    if worker.status == "OFFLINE":
        raise HTTPException(
            status_code=400,
            detail="Cannot assign job to OFFLINE worker"
        )

    # Business rule: Worker status changes automatically to BUSY when job assigned
    worker.current_job_id = job_id
    worker.status = "BUSY"
    worker.updated_at = datetime.utcnow()

    try:
        db.commit()
        db.refresh(worker)
        return worker
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to assign job to worker")


def worker_heartbeat(db: Session, worker_id: int, heartbeat_data: WorkerHeartbeatCreate):
    # Verify worker exists
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Business rule: Heartbeat updates last_heartbeat timestamp
    worker.last_heartbeat = datetime.utcnow()
    worker.updated_at = datetime.utcnow()

    # Create heartbeat record
    heartbeat = WorkerHeartbeat(
        worker_id=worker_id,
        timestamp=datetime.utcnow(),
        status_message=heartbeat_data.status_message
    )

    db.add(heartbeat)

    try:
        db.commit()
        db.refresh(worker)
        return worker
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to record worker heartbeat")


def get_idle_workers(db: Session):
    return db.query(Worker).filter(Worker.status == "IDLE").all()
