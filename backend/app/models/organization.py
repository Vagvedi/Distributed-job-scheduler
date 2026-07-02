from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), nullable=False)

    owner_id = Column(Integer, ForeignKey("users.id"))

    # relationships
    owner = relationship("User", backref="organizations")
    projects = relationship("Project", backref="organization")