from fastapi import FastAPI

from app.db.database import engine
from app.models.user import User

User.metadata.create_all(bind=engine)

app = FastAPI(
    title="Distributed Job Scheduler",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Distributed Job Scheduler API is running!"
    }