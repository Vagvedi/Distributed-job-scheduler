from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str):
    # bcrypt has a max password length of 72 bytes when encoded as UTF-8
    # Ensure the password bytes don't exceed 72
    pwd_encoded = password.encode('utf-8')
    if len(pwd_encoded) > 72:
        pwd_encoded = pwd_encoded[:72]
    password_safe = pwd_encoded.decode('utf-8', errors='ignore')
    return pwd_context.hash(password_safe)


def verify_password(
    plain_password: str,
    hashed_password: str
):
    # bcrypt has a max password length of 72 bytes
    password_bytes = plain_password.encode('utf-8')[:72]
    password_truncated = password_bytes.decode('utf-8', errors='ignore')
    return pwd_context.verify(password_truncated, hashed_password)


def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update(
        {
            "exp": expire
        }
    )

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt