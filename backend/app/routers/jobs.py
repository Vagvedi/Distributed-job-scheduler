from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs Placeholder"]
)

@router.get("/placeholder", response_model=List[Dict[str, Any]])
def get_jobs_placeholder():
    return [
        { "id": "job-9842", "name": "image-resize-task-23", "queue": "media-processing", "status": "running", "progress": 68, "duration": "1.2s", "created": "10s ago" },
        { "id": "job-9841", "name": "sync-user-db", "queue": "auth-sync", "status": "success", "progress": 100, "duration": "3.4s", "created": "2m ago" },
        { "id": "job-9840", "name": "send-welcome-emails", "queue": "notifications", "status": "success", "progress": 100, "duration": "0.8s", "created": "5m ago" },
        { "id": "job-9839", "name": "generate-monthly-report", "queue": "reporting", "status": "failed", "progress": 45, "duration": "12.1s", "created": "15m ago" },
        { "id": "job-9838", "name": "aggregate-analytics-logs", "queue": "analytics-heavy", "status": "success", "progress": 100, "duration": "45.2s", "created": "1h ago" }
    ]
