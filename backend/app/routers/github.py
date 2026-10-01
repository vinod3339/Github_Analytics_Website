from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from app.database import get_db
from app.models import Repository
from app.github_service import github_service
from app.auth import get_current_user

router = APIRouter(prefix="/github", tags=["GitHub"])

@router.get("/rate-limit")
async def get_github_rate_limit():
    return await github_service.get_rate_limit()

@router.post("/sync")
async def sync_github_data(
    repository_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Trigger real GitHub API sync for all tracked repositories or a single repository.
    """
    if repository_id:
        repo = db.query(Repository).filter(Repository.id == repository_id).first()
        if not repo:
            raise HTTPException(status_code=404, detail="Repository not found.")
        try:
            res = await github_service.sync_repository_data(repo, db)
            return {
                "message": f"Synchronized repository {repo.full_name}",
                "results": [res]
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to sync repository: {str(e)}")
    else:
        repos = db.query(Repository).all()
        results = []
        errors = []
        for repo in repos:
            try:
                res = await github_service.sync_repository_data(repo, db)
                results.append(res)
            except Exception as e:
                errors.append({"repository": repo.full_name, "error": str(e)})

        return {
            "message": f"Synchronization completed for {len(results)} repositories.",
            "results": results,
            "errors": errors
        }
