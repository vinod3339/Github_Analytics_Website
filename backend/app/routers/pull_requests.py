from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from app.database import get_db
from app.models import PullRequest, Repository, Student
from app.analytics_service import AnalyticsService

router = APIRouter(prefix="/pull-requests", tags=["Pull Requests"])

@router.get("")
def get_pull_requests(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    student_id: Optional[int] = None,
    repository_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(PullRequest)

    if status_filter and status_filter != "all":
        query = query.filter(PullRequest.state == status_filter)
    if student_id:
        query = query.filter(PullRequest.student_id == student_id)
    if repository_id:
        query = query.filter(PullRequest.repository_id == repository_id)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                PullRequest.title.ilike(pattern),
                PullRequest.github_username.ilike(pattern)
            )
        )

    # Status counts for chart widgets
    total_open = db.query(PullRequest).filter(PullRequest.state == "open").count()
    total_merged = db.query(PullRequest).filter(PullRequest.state == "merged").count()
    total_closed = db.query(PullRequest).filter(PullRequest.state == "closed").count()

    total_count = query.count()
    prs = query.order_by(PullRequest.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    items = []
    for pr in prs:
        items.append({
            "id": pr.id,
            "github_id": pr.github_id,
            "number": pr.number,
            "title": pr.title,
            "body": pr.body,
            "state": pr.state,
            "github_username": pr.github_username,
            "reviewer": pr.reviewer or "Peer Review",
            "url": pr.url,
            "created_at": pr.created_at.isoformat() if pr.created_at else None,
            "closed_at": pr.closed_at.isoformat() if pr.closed_at else None,
            "merged_at": pr.merged_at.isoformat() if pr.merged_at else None,
            "repository_id": pr.repository_id,
            "repository_name": pr.repository.name if pr.repository else None,
            "repository_full_name": pr.repository.full_name if pr.repository else None,
            "student_id": pr.student_id,
            "student_name": pr.student.name if pr.student else pr.github_username,
            "student_avatar": pr.student.avatar_url if pr.student else f"https://avatars.githubusercontent.com/{pr.github_username}" if pr.github_username else None
        })

    return {
        "stats": {
            "total": total_open + total_merged + total_closed,
            "open": total_open,
            "merged": total_merged,
            "closed": total_closed
        },
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit if total_count > 0 else 1,
        "items": items
    }
