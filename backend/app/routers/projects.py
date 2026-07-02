from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
)
from app.services.project_service import (
    create_project,
    get_projects,
)

router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)


@router.post("/", response_model=ProjectResponse)
def create_proj(project: ProjectCreate, db: Session = Depends(get_db)):

    return create_project(db, project)


@router.get("/{org_id}", response_model=List[ProjectResponse])
def list_projects(org_id: int, db: Session = Depends(get_db)):

    return get_projects(db, org_id)