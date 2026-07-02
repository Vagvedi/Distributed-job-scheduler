from datetime import datetime
from pydantic import BaseModel


class JobCreate(BaseModel):
    queue_id: int
    payload: str
    priority: int = 1
    max_retries: int = 3


class JobResponse(BaseModel):
    id: int
    queue_id: int
    payload: str
    status: str
    priority: int
    retry_count: int
    max_retries: int
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None

    class Config:
        from_attributes = True


class JobStatusUpdate(BaseModel):
    status: str
