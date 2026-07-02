from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class Queue(Base):
    __tablename__ = "queues"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), nullable=False)

    project_id = Column(Integer, ForeignKey("projects.id"))

    # backref="project" is defined on the Project side
