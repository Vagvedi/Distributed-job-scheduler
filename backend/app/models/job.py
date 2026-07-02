from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)

    queue_id = Column(Integer, ForeignKey("queues.id"), nullable=False)

    payload = Column(Text, nullable=False)

    status = Column(String(50), default="QUEUED")  # QUEUED, RUNNING, SUCCESS, FAILED, RETRY, DEAD_LETTER

    priority = Column(Integer, default=1)

    retry_count = Column(Integer, default=0)

    max_retries = Column(Integer, default=3)

    created_at = Column(DateTime, default=datetime.utcnow)

    started_at = Column(DateTime, nullable=True)

    completed_at = Column(DateTime, nullable=True)

    # Relationship with Queue
    queue = relationship("Queue", backref="jobs")
