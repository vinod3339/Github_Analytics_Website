from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("")
def get_analytics(db: Session = Depends(get_db)):
    return AnalyticsService.get_analytics_overview(db)
