from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine

# ensure all models are imported before creating tables
from app.models import (
    user as _user,
    organization as _organization,
    queue as _queue,
    project as _project,
    job as _job,
    job_log as _job_log,
    job_execution as _job_execution,
    dead_letter_queue as _dead_letter_queue,
    retry_policy as _retry_policy,
    worker as _worker,
    worker_heartbeat as _worker_heartbeat,
)

from app.routers.organizations import router as org_router
from app.routers.projects import router as project_router
from app.routers.queues import router as queue_router
from app.routers.auth import router as auth_router
from app.routers.jobs import router as jobs_router
from app.routers.workers import router as workers_router
from app.routers.dead_letter import router as dead_letter_router

# Create all tables after importing model modules
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Distributed Job Scheduler API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔥 THIS IS IMPORTANT
app.include_router(auth_router)

app.include_router(org_router)
app.include_router(project_router)
app.include_router(queue_router)
app.include_router(jobs_router)
app.include_router(workers_router)
app.include_router(dead_letter_router)

@app.get("/")
def root():
    return {
        "message": "API Running"
    }