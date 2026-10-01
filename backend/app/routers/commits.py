from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models import Commit, Repository, Student
from app.analytics_service import AnalyticsService

router = APIRouter(prefix="/commits", tags=["Commits"])

@router.get("")
def get_commits(
    search: Optional[str] = None,
    student_id: Optional[int] = None,
    repository_id: Optional[int] = None,
    branch: Optional[str] = None,
    date_filter: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Commit)

    if student_id:
        query = query.filter(Commit.student_id == student_id)
    if repository_id:
        query = query.filter(Commit.repository_id == repository_id)
    if branch:
        query = query.filter(Commit.branch == branch)

    if date_filter:
        s_dt, e_dt = AnalyticsService.get_date_range(date_filter, start_date, end_date)
        if s_dt and e_dt:
            query = query.filter(Commit.committed_at >= s_dt, Commit.committed_at <= e_dt)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Commit.message.ilike(pattern),
                Commit.sha.ilike(pattern),
                Commit.author_name.ilike(pattern),
                Commit.github_username.ilike(pattern)
            )
        )

    total_count = query.count()
    commits = query.order_by(Commit.committed_at.desc()).offset((page - 1) * limit).limit(limit).all()

    items = []
    for c in commits:
        items.append({
            "id": c.id,
            "sha": c.sha,
            "message": c.message,
            "author_name": c.author_name,
            "author_email": c.author_email,
            "github_username": c.github_username or (c.student.github_username if c.student else None),
            "branch": c.branch,
            "additions": c.additions,
            "deletions": c.deletions,
            "url": c.url,
            "committed_at": c.committed_at.isoformat() if c.committed_at else None,
            "repository_id": c.repository_id,
            "repository_name": c.repository.name if c.repository else None,
            "repository_full_name": c.repository.full_name if c.repository else None,
            "student_id": c.student_id,
            "student_name": c.student.name if c.student else (c.author_name or c.github_username),
            "student_avatar": c.student.avatar_url if c.student else f"https://avatars.githubusercontent.com/{c.github_username}" if c.github_username else None
        })

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit if total_count > 0 else 1,
        "items": items
    }
