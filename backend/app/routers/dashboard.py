from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from datetime import datetime

from app.database import get_db
from app.models import Student, Repository, Commit, PullRequest, Issue, ActivityLog
from app.schemas import DashboardSummary
from app.analytics_service import AnalyticsService
from app.github_service import github_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(db: Session = Depends(get_db)):
    total_students = db.query(Student).filter(Student.is_active == True).count()
    total_repos = db.query(Repository).count()
    total_commits = db.query(Commit).count()
    total_prs = db.query(PullRequest).count()
    total_issues = db.query(Issue).count()
    total_contributors = db.query(distinct(Commit.github_username)).filter(Commit.github_username != None).count()

    # Find latest sync time across repos
    last_synced = db.query(func.max(Repository.last_synced_at)).scalar()

    # GitHub rate limit
    rate_limit_info = await github_service.get_rate_limit()

    return {
        "total_students": total_students,
        "total_repositories": total_repos,
        "total_commits": total_commits,
        "total_pull_requests": total_prs,
        "total_issues": total_issues,
        "total_contributors": max(total_contributors, total_students),
        "last_synced_at": last_synced,
        "rate_limit": rate_limit_info
    }

@router.get("/overview")
async def get_dashboard_overview(db: Session = Depends(get_db)):
    summary = await get_dashboard_summary(db)
    top_performers = AnalyticsService.get_rankings(db, limit=10)
    analytics_data = AnalyticsService.get_analytics_overview(db)
    
    # Recent activities (latest 10)
    recent_activities = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(10).all()
    
    activities_list = []
    for a in recent_activities:
        st = a.student
        repo = a.repository
        activities_list.append({
            "id": a.id,
            "activity_type": a.activity_type,
            "title": a.title,
            "description": a.description,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
            "url": a.url,
            "student_name": st.name if st else "System",
            "github_username": st.github_username if st else None,
            "student_avatar": st.avatar_url if st else None,
            "repository_name": repo.full_name if repo else None
        })

    return {
        "summary": summary,
        "top_performers": top_performers.get("rankings", []),
        "weights": top_performers.get("weights", {}),
        "recent_activities": activities_list,
        "analytics": analytics_data
    }
