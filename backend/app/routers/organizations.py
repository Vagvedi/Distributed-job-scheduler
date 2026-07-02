from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
)
from app.services.organization_service import (
    create_organization,
    get_organizations,
)

router = APIRouter(
    prefix="/organizations",
    tags=["Organizations"]
)


@router.post("/", response_model=OrganizationResponse)
def create_org(org: OrganizationCreate, db: Session = Depends(get_db)):

    # TEMP user_id = 1 (we will replace with JWT later)
    return create_organization(db, 1, org)


@router.get("/", response_model=List[OrganizationResponse])
def list_orgs(db: Session = Depends(get_db)):

    return get_organizations(db, 1)