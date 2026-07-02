from sqlalchemy.orm import Session
from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate
from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError


def create_organization(db: Session, user_id: int, org: OrganizationCreate):

    db_org = Organization(
        name=org.name,
        owner_id=user_id
    )

    db.add(db_org)
    try:
        db.commit()
        db.refresh(db_org)

        return db_org
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create organization")


def get_organizations(db: Session, user_id: int):

    return db.query(Organization).filter(
        Organization.owner_id == user_id
    ).all()