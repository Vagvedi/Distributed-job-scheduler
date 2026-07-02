from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.dead_letter_queue import DeadLetterQueueResponse
from app.services.dead_letter_service import (
    get_all_dead_letter,
    get_dead_letter_by_job_id,
    delete_dead_letter,
)

router = APIRouter(
    prefix="/dead-letter",
    tags=["Dead Letter Queue"]
)

@router.get("/", response_model=List[DeadLetterQueueResponse])
def read_all_dead_letter(db: Session = Depends(get_db)):
    """Return all failed jobs from Dead Letter Queue"""
    try:
        return get_all_dead_letter(db)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}", response_model=DeadLetterQueueResponse)
def read_one_dead_letter(job_id: int, db: Session = Depends(get_db)):
    """Return one failed job from Dead Letter Queue by Job ID"""
    try:
        return get_dead_letter_by_job_id(db, job_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
def remove_dead_letter(id: int, db: Session = Depends(get_db)):
    """Delete a Dead Letter entry only"""
    try:
        return delete_dead_letter(db, id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
