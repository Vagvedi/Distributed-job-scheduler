from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.user import UserCreate, UserLogin
from app.schemas.user import UserResponse
from app.schemas.token import Token
from app.services.auth_service import (
    create_user,
    get_user_by_email,
    get_user_by_username,
)
from app.core.security import (
    verify_password,
    create_access_token
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register", response_model=UserResponse)
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    try:
        existing_email = get_user_by_email(db, user.email)
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")

        existing_username = get_user_by_username(db, user.username)
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already registered")

        return create_user(db, user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/login",
    response_model=Token
)
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    try:
        db_user = get_user_by_email(db, user.email)

        if not db_user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not verify_password(user.password, db_user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_access_token({"sub": db_user.email})

        return {"access_token": token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))