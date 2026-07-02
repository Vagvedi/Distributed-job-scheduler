from fastapi import FastAPI

from app.db.database import Base, engine
from app.models.user import User

from app.routers.auth import router as auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Distributed Job Scheduler API",
    version="1.0.0"
)

# 🔥 THIS IS IMPORTANT
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "API Running"
    }