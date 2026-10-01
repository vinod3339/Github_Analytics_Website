from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models import RankingSetting, User
from app.schemas import RankingSettingsSchema
from app.auth import get_current_active_admin
from app.github_service import github_service
from app.config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])

class GitHubTokenUpdate(BaseModel):
    token: str

class SystemSettingsOut(BaseModel):
    ranking_weights: RankingSettingsSchema
    github_token_configured: bool
    github_token_masked: Optional[str]
    project_name: str
    database_url: str

@router.get("", response_model=SystemSettingsOut)
def get_system_settings(db: Session = Depends(get_db)):
    rank_setting = db.query(RankingSetting).first()
    if not rank_setting:
        rank_setting = RankingSetting()
        db.add(rank_setting)
        db.commit()
        db.refresh(rank_setting)

    masked_token = None
    if github_service.token:
        t = github_service.token
        masked_token = f"{t[:4]}...{t[-4:]}" if len(t) > 8 else "***"

    return {
        "ranking_weights": {
            "commit_weight": rank_setting.commit_weight,
            "pr_weight": rank_setting.pr_weight,
            "issue_weight": rank_setting.issue_weight,
            "review_weight": rank_setting.review_weight,
            "repo_weight": rank_setting.repo_weight,
            "consistency_weight": rank_setting.consistency_weight
        },
        "github_token_configured": bool(github_service.token),
        "github_token_masked": masked_token,
        "project_name": settings.PROJECT_NAME,
        "database_url": "SQLite (Local Database)"
    }

@router.put("/weights")
def update_ranking_weights(
    weights_in: RankingSettingsSchema,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_active_admin)
):
    total = (
        weights_in.commit_weight +
        weights_in.pr_weight +
        weights_in.issue_weight +
        weights_in.review_weight +
        weights_in.repo_weight +
        weights_in.consistency_weight
    )
    if total <= 0:
        raise HTTPException(status_code=400, detail="Total weights sum must be greater than 0.")

    setting = db.query(RankingSetting).first()
    if not setting:
        setting = RankingSetting()
        db.add(setting)

    setting.commit_weight = weights_in.commit_weight
    setting.pr_weight = weights_in.pr_weight
    setting.issue_weight = weights_in.issue_weight
    setting.review_weight = weights_in.review_weight
    setting.repo_weight = weights_in.repo_weight
    setting.consistency_weight = weights_in.consistency_weight
    db.commit()

    return {"message": "Ranking weights updated successfully.", "weights": weights_in}

@router.put("/github-token")
def update_github_token(
    token_data: GitHubTokenUpdate,
    admin: User = Depends(get_current_active_admin)
):
    clean_token = token_data.token.strip()
    github_service.update_token(clean_token)
    return {
        "message": "GitHub Personal Access Token updated successfully in backend.",
        "configured": bool(clean_token)
    }
