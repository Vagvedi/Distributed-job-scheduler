from datetime import datetime
from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship

from app.db.database import Base

class DeadLetterQueue(Base):
    __tablename__ = "dead_letter_queue"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    queue_id = Column(Integer, ForeignKey("queues.id"), nullable=False)
    failure_reason = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    failed_at = Column(DateTime, default=datetime.utcnow)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=True)

    # Relationships using strings to prevent circular imports
    job = relationship("Job", foreign_keys=[job_id])
    queue = relationship("Queue", foreign_keys=[queue_id])
    worker = relationship("Worker", foreign_keys=[worker_id])

    @property
    def queue_name(self):
        return self.queue.name if self.queue else None

    @property
    def worker_name(self):
        return self.worker.name if self.worker else None
