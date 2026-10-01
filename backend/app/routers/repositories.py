from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import re
from datetime import datetime

from app.database import get_db
from app.models import Repository, Commit, PullRequest, Issue
from app.schemas import RepositoryCreate, RepositoryOut
from app.github_service import github_service

router = APIRouter(prefix="/repositories", tags=["Repositories"])

def parse_github_target(input_str: str):
    """Extract owner and repo from URL or 'owner/repo' format"""
    cleaned = input_str.strip().rstrip('/')
    # If full URL: https://github.com/owner/repo
    url_match = re.search(r"github\.com[/:]([\w.-]+)/([\w.-]+)", cleaned)
    if url_match:
        return url_match.group(1), url_match.group(2)
    # If format 'owner/repo'
    parts = cleaned.split('/')
    if len(parts) == 2:
        return parts[0], parts[1]
    raise ValueError("Invalid format. Use 'owner/repo' or 'https://github.com/owner/repo'")

@router.get("", response_model=List[RepositoryOut])
def get_repositories(db: Session = Depends(get_db)):
    repos = db.query(Repository).order_by(Repository.updated_at.desc()).all()
    result = []
    for r in repos:
        c_count = db.query(Commit).filter(Commit.repository_id == r.id).count()
        pr_count = db.query(PullRequest).filter(PullRequest.repository_id == r.id).count()
        contrib_count = db.query(Commit.github_username).filter(Commit.repository_id == r.id, Commit.github_username != None).distinct().count()
        
        result.append(RepositoryOut(
            id=r.id,
            owner=r.owner,
            name=r.name,
            full_name=r.full_name,
            description=r.description,
            url=r.url,
            language=r.language or "Unknown",
            stars=r.stars,
            forks=r.forks,
            open_issues=r.open_issues,
            default_branch=r.default_branch,
            is_private=r.is_private,
            last_synced_at=r.last_synced_at,
            created_at=r.created_at,
            commits_count=c_count,
            prs_count=pr_count,
            contributors_count=contrib_count
        ))
    return result

@router.post("", response_model=RepositoryOut, status_code=status.HTTP_201_CREATED)
async def add_repository(repo_in: RepositoryCreate, db: Session = Depends(get_db)):
    try:
        owner, repo_name = parse_github_target(repo_in.url_or_fullname)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    full_name = f"{owner}/{repo_name}"
    existing = db.query(Repository).filter(Repository.full_name.ilike(full_name)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Repository '{full_name}' is already being tracked.")

    # Try fetching from GitHub API
    try:
        gh_data = await github_service.get_repository_info(owner, repo_name)
    except Exception as e:
        # If network/token error, allow adding with fallback metadata or raise specific alert
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=f"GitHub repository '{full_name}' not found. Please verify the name or access permissions.")
        gh_data = {
            "description": "Repository added in tracking list",
            "html_url": f"https://github.com/{full_name}",
            "language": "JavaScript",
            "stargazers_count": 0,
            "forks_count": 0,
            "open_issues_count": 0,
            "default_branch": "main",
            "private": False
        }

    new_repo = Repository(
        owner=owner,
        name=repo_name,
        full_name=full_name,
        description=gh_data.get("description"),
        url=gh_data.get("html_url", f"https://github.com/{full_name}"),
        language=gh_data.get("language") or "Other",
        stars=gh_data.get("stargazers_count", 0),
        forks=gh_data.get("forks_count", 0),
        open_issues=gh_data.get("open_issues_count", 0),
        default_branch=gh_data.get("default_branch", "main"),
        is_private=gh_data.get("private", False),
        last_synced_at=datetime.utcnow()
    )
    db.add(new_repo)
    db.commit()
    db.refresh(new_repo)

    # Perform initial GitHub sync
    try:
        await github_service.sync_repository_data(new_repo, db)
    except Exception:
        pass

    return RepositoryOut(
        id=new_repo.id,
        owner=new_repo.owner,
        name=new_repo.name,
        full_name=new_repo.full_name,
        description=new_repo.description,
        url=new_repo.url,
        language=new_repo.language,
        stars=new_repo.stars,
        forks=new_repo.forks,
        open_issues=new_repo.open_issues,
        default_branch=new_repo.default_branch,
        is_private=new_repo.is_private,
        last_synced_at=new_repo.last_synced_at,
        created_at=new_repo.created_at,
        commits_count=0,
        prs_count=0,
        contributors_count=0
    )

@router.get("/{owner}/{repo}")
async def get_repository_detail(owner: str, repo: str, db: Session = Depends(get_db)):
    full_name = f"{owner}/{repo}"
    repository = db.query(Repository).filter(Repository.full_name.ilike(full_name)).first()
    if not repository:
        raise HTTPException(status_code=404, detail=f"Repository '{full_name}' not found.")

    # Commits, PRs, Issues
    commits = db.query(Commit).filter(Commit.repository_id == repository.id).order_by(Commit.committed_at.desc()).all()
    prs = db.query(PullRequest).filter(PullRequest.repository_id == repository.id).order_by(PullRequest.created_at.desc()).all()
    issues = db.query(Issue).filter(Issue.repository_id == repository.id).order_by(Issue.created_at.desc()).all()

    # Contributors breakdown
    contrib_map = {}
    for c in commits:
        name = c.student.name if c.student else (c.author_name or c.github_username or "Unknown")
        gh = c.github_username or (c.student.github_username if c.student else "unknown")
        if gh not in contrib_map:
            contrib_map[gh] = {
                "name": name,
                "github_username": gh,
                "avatar_url": c.student.avatar_url if c.student else f"https://avatars.githubusercontent.com/{gh}",
                "commits": 0,
                "prs": 0,
                "issues": 0,
                "student_id": c.student_id
            }
        contrib_map[gh]["commits"] += 1

    for p in prs:
        gh = p.github_username or "unknown"
        if gh in contrib_map:
            contrib_map[gh]["prs"] += 1

    for iss in issues:
        gh = iss.github_username or "unknown"
        if gh in contrib_map:
            contrib_map[gh]["issues"] += 1

    contributors_list = sorted(list(contrib_map.values()), key=lambda x: x["commits"], reverse=True)

    # Activity by week/month
    commit_activity = []
    # Fetch branches
    branches = []
    try:
        branches_data = await github_service.get_branches(owner, repo)
        branches = [b.get("name") for b in branches_data]
    except Exception:
        branches = [repository.default_branch]

    return {
        "repository": {
            "id": repository.id,
            "owner": repository.owner,
            "name": repository.name,
            "full_name": repository.full_name,
            "description": repository.description,
            "url": repository.url,
            "language": repository.language,
            "stars": repository.stars,
            "forks": repository.forks,
            "open_issues": repository.open_issues,
            "default_branch": repository.default_branch,
            "is_private": repository.is_private,
            "last_synced_at": repository.last_synced_at,
            "created_at": repository.created_at
        },
        "stats": {
            "total_commits": len(commits),
            "total_prs": len(prs),
            "open_prs": len([p for p in prs if p.state == "open"]),
            "merged_prs": len([p for p in prs if p.state == "merged"]),
            "closed_prs": len([p for p in prs if p.state == "closed"]),
            "total_issues": len(issues),
            "open_issues": len([i for i in issues if i.state == "open"]),
            "closed_issues": len([i for i in issues if i.state == "closed"]),
            "total_contributors": len(contributors_list)
        },
        "branches": branches,
        "contributors": contributors_list,
        "recent_commits": [
            {
                "sha": c.sha,
                "message": c.message,
                "author": c.student.name if c.student else (c.author_name or c.github_username),
                "github_username": c.github_username,
                "branch": c.branch,
                "committed_at": c.committed_at.isoformat() if c.committed_at else None,
                "url": c.url
            }
            for c in commits[:15]
        ]
    }

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_repository(id: int, db: Session = Depends(get_db)):
    repo = db.query(Repository).filter(Repository.id == id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found.")
    db.delete(repo)
    db.commit()
    return None
