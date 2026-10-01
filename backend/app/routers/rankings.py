from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas import RankingResponse
from app.analytics_service import AnalyticsService

router = APIRouter(prefix="/rankings", tags=["Rankings"])

@router.get("", response_model=RankingResponse)
def get_student_rankings(
    date_filter: str = Query("all", description="today, 7d, 30d, 3m, semester, custom, all"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    repository_id: Optional[int] = None,
    student_id: Optional[int] = None,
    limit: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_rankings(
        db=db,
        date_filter=date_filter,
        start_date=start_date,
        end_date=end_date,
        repository_id=repository_id,
        student_id=student_id,
        limit=limit
    )

@router.get("/top")
def get_top_rankings(limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    data = AnalyticsService.get_rankings(db=db, limit=limit)
    return {
        "top_rankings": data.get("rankings", []),
        "weights": data.get("weights", {}),
        "total": data.get("total_students", 0)
    }

@router.get("/methodology")
def get_ranking_methodology(db: Session = Depends(get_db)):
    rankings_data = AnalyticsService.get_rankings(db)
    weights = rankings_data.get("weights", {})
    return {
        "title": "Academic GitHub Activity Scoring Methodology",
        "description": "A balanced multi-criteria evaluation model designed to encourage consistent software engineering practices, collaborative code reviews, high-quality pull requests, and active issue resolution rather than purely commit counts.",
        "formula": "Activity Score = (Commit Norm × W_commit) + (PR Norm × W_pr) + (Issue Norm × W_issue) + (Review Norm × W_review) + (Repo Norm × W_repo) + (Consistency Norm × W_cons)",
        "weights": weights,
        "components": [
            {
                "name": "Commits",
                "weight": f"{weights.get('commits', 30)}%",
                "description": "Measures continuous code additions, bug fixes, and development iterations.",
                "normalization": "Normalized relative to the highest commit count across the student cohort (Value / Max × 100)."
            },
            {
                "name": "Pull Requests",
                "weight": f"{weights.get('pull_requests', 20)}%",
                "description": "Rewards collaborative feature branching, code reviews, and merged work.",
                "normalization": "Normalized relative to the highest PR count across the cohort."
            },
            {
                "name": "Issues",
                "weight": f"{weights.get('issues', 10)}%",
                "description": "Reflects problem reporting, requirement documentation, and bug tracking.",
                "normalization": "Normalized relative to the highest issue count across the cohort."
            },
            {
                "name": "Code Reviews",
                "weight": f"{weights.get('reviews', 15)}%",
                "description": "Encourages peer review quality, commenting, and assisting fellow students.",
                "normalization": "Normalized relative to the highest review count across the cohort."
            },
            {
                "name": "Repository Scope",
                "weight": f"{weights.get('repositories', 15)}%",
                "description": "Rewards breadth of contribution across multiple course modules and repositories.",
                "normalization": "Normalized relative to total tracked repositories."
            },
            {
                "name": "Consistency",
                "weight": f"{weights.get('consistency', 10)}%",
                "description": "Measures sustained engineering engagement based on distinct active coding days.",
                "normalization": "Normalized relative to the maximum active days in the selected time window."
            }
        ]
    }
