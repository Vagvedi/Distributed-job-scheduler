from dotenv import load_dotenv
import os

load_dotenv()


class Settings:
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "sqlite:///./scheduler.db"
    )

    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "supersecretkey123"
    )

    ALGORITHM = os.getenv(
        "ALGORITHM",
        "HS256"
    )

    ACCESS_TOKEN_EXPIRE_MINUTES = int(
        os.getenv(
            "ACCESS_TOKEN_EXPIRE_MINUTES",
            60
        )
    )


settings = Settings()