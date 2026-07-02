from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from app.db.database import Base


class WorkerHeartbeat(Base):
    __tablename__ = "worker_heartbeats"

    id = Column(Integer, primary_key=True, index=True)

    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)

    timestamp = Column(DateTime, default=datetime.utcnow)

    status_message = Column(String(500), nullable=True)

    # Relationship
    worker = relationship("Worker", back_populates="heartbeats")
