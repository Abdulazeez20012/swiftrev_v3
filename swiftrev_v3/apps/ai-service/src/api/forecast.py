from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.ml_service import ml_service

router = APIRouter(prefix="/forecast", tags=["forecast"])

@router.get("/revenue/{hospital_id}")
async def get_hospital_forecast(hospital_id: str, periods: int = 30, db: Session = Depends(get_db)):
    try:
        result = await ml_service.get_revenue_forecast(db, hospital_id, periods)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
