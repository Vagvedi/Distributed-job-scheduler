from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.dead_letter_queue import DeadLetterQueue

def get_all_dead_letter(db: Session):
    return db.query(DeadLetterQueue).all()

def get_dead_letter_by_job_id(db: Session, job_id: int):
    entry = db.query(DeadLetterQueue).filter(DeadLetterQueue.job_id == job_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Dead letter entry not found")
    return entry

def delete_dead_letter(db: Session, dlq_id: int):
    entry = db.query(DeadLetterQueue).filter(DeadLetterQueue.id == dlq_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Dead letter entry not found")
    
    try:
        db.delete(entry)
        db.commit()
        return {"message": "Dead letter entry deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
