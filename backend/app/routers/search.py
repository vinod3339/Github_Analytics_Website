from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Student, Repository, Commit, PullRequest, Issue
from app.schemas import GlobalSearchResult

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("", response_model=GlobalSearchResult)
def global_search(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    pattern = f"%{q}%"

    # Search Students
    students = db.query(Student).filter(
        or_(
            Student.name.ilike(pattern),
            Student.student_id.ilike(pattern),
            Student.github_username.ilike(pattern),
            Student.email.ilike(pattern)
        )
    ).limit(5).all()

    # Search Repositories
    repos = db.query(Repository).filter(
        or_(
            Repository.name.ilike(pattern),
            Repository.full_name.ilike(pattern),
            Repository.language.ilike(pattern),
            Repository.description.ilike(pattern)
        )
    ).limit(5).all()

    # Search Commits
    commits = db.query(Commit).filter(
        or_(
            Commit.message.ilike(pattern),
            Commit.sha.ilike(pattern),
            Commit.author_name.ilike(pattern),
            Commit.github_username.ilike(pattern)
        )
    ).limit(5).all()

    # Search Pull Requests
    prs = db.query(PullRequest).filter(
        or_(
            PullRequest.title.ilike(pattern),
            PullRequest.github_username.ilike(pattern)
        )
    ).limit(5).all()

    # Search Issues
    issues = db.query(Issue).filter(
        or_(
            Issue.title.ilike(pattern),
            Issue.github_username.ilike(pattern)
        )
    ).limit(5).all()

    return {
        "students": [
            {
                "id": s.id,
                "name": s.name,
                "student_id": s.student_id,
                "github_username": s.github_username,
                "avatar_url": s.avatar_url or f"https://avatars.githubusercontent.com/{s.github_username}"
            }
            for s in students
        ],
        "repositories": [
            {
                "id": r.id,
                "owner": r.owner,
                "name": r.name,
                "full_name": r.full_name,
                "language": r.language,
                "url": r.url
            }
            for r in repos
        ],
        "commits": [
            {
                "id": c.id,
                "sha": c.sha[:8],
                "message": c.message,
                "author": c.author_name or c.github_username,
                "repository": c.repository.name if c.repository else "",
                "committed_at": c.committed_at.isoformat() if c.committed_at else None
            }
            for c in commits
        ],
        "pull_requests": [
            {
                "id": p.id,
                "number": p.number,
                "title": p.title,
                "state": p.state,
                "author": p.github_username,
                "repository": p.repository.name if p.repository else ""
            }
            for p in prs
        ],
        "issues": [
            {
                "id": i.id,
                "number": i.number,
                "title": i.title,
                "state": i.state,
                "author": i.github_username,
                "repository": i.repository.name if i.repository else ""
            }
            for i in issues
        ]
    }
