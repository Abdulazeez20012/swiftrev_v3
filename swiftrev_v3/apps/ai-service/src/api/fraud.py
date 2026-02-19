from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.ml_service import ml_service
from pydantic import BaseModel

router = APIRouter(prefix="/fraud", tags=["fraud"])

class TransactionInput(BaseModel):
    amount: float
    payment_method: str
    patient_id: str
    hospital_id: str

@router.post("/check")
async def check_transaction(data: TransactionInput, db: Session = Depends(get_db)):
    try:
        result = await ml_service.check_fraud(db, data.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
