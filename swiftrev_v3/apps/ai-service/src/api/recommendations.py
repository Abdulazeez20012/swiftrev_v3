from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.ml_service import ml_service

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("/{hospital_id}")
async def get_hospital_recommendations(hospital_id: str, db: Session = Depends(get_db)):
    try:
        result = await ml_service.get_recommendations(db, hospital_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
