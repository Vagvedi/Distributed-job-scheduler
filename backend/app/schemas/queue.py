from datetime import datetime
from pydantic import BaseModel


class QueueCreate(BaseModel):
    name: str
    priority: int = 1
    status: str = "active"


class QueueResponse(BaseModel):
    id: int
    name: str
    priority: int
    status: str
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class QueueStatusUpdate(BaseModel):
    status: str
