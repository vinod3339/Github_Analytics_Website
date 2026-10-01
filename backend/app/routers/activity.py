from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import ActivityLog

router = APIRouter(prefix="/activity", tags=["Activity"])

@router.get("")
def get_activity_feed(
    activity_type: Optional[str] = None,
    student_id: Optional[int] = None,
    repository_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(ActivityLog)

    if activity_type and activity_type != "all":
        query = query.filter(ActivityLog.activity_type == activity_type)
    if student_id:
        query = query.filter(ActivityLog.student_id == student_id)
    if repository_id:
        query = query.filter(ActivityLog.repository_id == repository_id)

    total_count = query.count()
    activities = query.order_by(ActivityLog.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()

    items = []
    for a in activities:
        st = a.student
        repo = a.repository
        items.append({
            "id": a.id,
            "activity_type": a.activity_type,
            "title": a.title,
            "description": a.description,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
            "url": a.url,
            "student_id": a.student_id,
            "student_name": st.name if st else "System",
            "github_username": st.github_username if st else None,
            "student_avatar": st.avatar_url if st else None,
            "repository_id": a.repository_id,
            "repository_name": repo.name if repo else None,
            "repository_full_name": repo.full_name if repo else None
        })

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit if total_count > 0 else 1,
        "items": items
    }
