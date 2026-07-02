from sqlalchemy.orm import Session

from app.models.project import Project
from app.schemas.project import ProjectCreate
from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError


def create_project(db: Session, project: ProjectCreate):

    db_project = Project(
        name=project.name,
        organization_id=project.organization_id
    )

    db.add(db_project)
    try:
        db.commit()
        db.refresh(db_project)

        return db_project
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create project")


def get_projects(db: Session, organization_id: int):

    return db.query(Project).filter(
        Project.organization_id == organization_id
    ).all()