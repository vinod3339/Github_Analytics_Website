from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from app.database import get_db
from app.models import Issue, Repository, Student

router = APIRouter(prefix="/issues", tags=["Issues"])

@router.get("")
def get_issues(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    student_id: Optional[int] = None,
    repository_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Issue)

    if status_filter and status_filter != "all":
        query = query.filter(Issue.state == status_filter)
    if student_id:
        query = query.filter(Issue.student_id == student_id)
    if repository_id:
        query = query.filter(Issue.repository_id == repository_id)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Issue.title.ilike(pattern),
                Issue.github_username.ilike(pattern)
            )
        )

    total_open = db.query(Issue).filter(Issue.state == "open").count()
    total_closed = db.query(Issue).filter(Issue.state == "closed").count()

    total_count = query.count()
    issues = query.order_by(Issue.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    items = []
    for issue in issues:
        items.append({
            "id": issue.id,
            "github_id": issue.github_id,
            "number": issue.number,
            "title": issue.title,
            "body": issue.body,
            "state": issue.state,
            "github_username": issue.github_username,
            "comments_count": issue.comments_count,
            "url": issue.url,
            "created_at": issue.created_at.isoformat() if issue.created_at else None,
            "closed_at": issue.closed_at.isoformat() if issue.closed_at else None,
            "repository_id": issue.repository_id,
            "repository_name": issue.repository.name if issue.repository else None,
            "repository_full_name": issue.repository.full_name if issue.repository else None,
            "student_id": issue.student_id,
            "student_name": issue.student.name if issue.student else issue.github_username,
            "student_avatar": issue.student.avatar_url if issue.student else f"https://avatars.githubusercontent.com/{issue.github_username}" if issue.github_username else None
        })

    return {
        "stats": {
            "total": total_open + total_closed,
            "open": total_open,
            "closed": total_closed
        },
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit if total_count > 0 else 1,
        "items": items
    }
