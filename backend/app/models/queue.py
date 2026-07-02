from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from app.db.database import Base


class Queue(Base):
    __tablename__ = "queues"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), nullable=False)

    priority = Column(Integer, default=1)

    status = Column(String(50), default="active")  # active, inactive

    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # backref="project" is defined on the Project side
