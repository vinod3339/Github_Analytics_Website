from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.analytics_service import AnalyticsService

router = APIRouter(prefix="/contributors", tags=["Contributors"])

@router.get("")
def get_contributors(
    date_filter: str = "all",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    repository_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    rankings_data = AnalyticsService.get_rankings(
        db,
        date_filter=date_filter,
        start_date=start_date,
        end_date=end_date,
        repository_id=repository_id
    )

    return {
        "contributors": rankings_data.get("rankings", []),
        "weights": rankings_data.get("weights", {}),
        "total_contributors": rankings_data.get("total_students", 0),
        "date_filter": date_filter
    }
