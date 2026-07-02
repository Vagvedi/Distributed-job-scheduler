from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from app.db.database import Base


class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), nullable=False)

    status = Column(String(50), default="IDLE")  # ACTIVE, IDLE, BUSY, OFFLINE

    current_job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)

    last_heartbeat = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    job = relationship("Job", foreign_keys=[current_job_id])
    heartbeats = relationship("WorkerHeartbeat", back_populates="worker", cascade="all, delete-orphan")
