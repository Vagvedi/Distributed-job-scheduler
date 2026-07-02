from datetime import datetime
from pydantic import BaseModel


class WorkerCreate(BaseModel):
    name: str


class WorkerResponse(BaseModel):
    id: int
    name: str
    status: str
    current_job_id: int | None = None
    last_heartbeat: datetime | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkerStatusUpdate(BaseModel):
    status: str


class WorkerHeartbeatCreate(BaseModel):
    status_message: str | None = None


class WorkerHeartbeatResponse(BaseModel):
    id: int
    worker_id: int
    timestamp: datetime
    status_message: str | None = None

    class Config:
        from_attributes = True


class JobAssignment(BaseModel):
    job_id: int
