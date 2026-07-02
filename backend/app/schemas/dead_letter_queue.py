from datetime import datetime
from pydantic import BaseModel

class DeadLetterQueueResponse(BaseModel):
    id: int
    job_id: int
    queue_id: int
    failure_reason: str | None = None
    retry_count: int
    failed_at: datetime
    worker_id: int | None = None
    queue_name: str | None = None
    worker_name: str | None = None

    class Config:
        from_attributes = True
