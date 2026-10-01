from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Student, Commit, PullRequest, Issue, Contribution, Repository
from app.schemas import StudentCreate, StudentUpdate, StudentOut, StudentRegisterRequest
from app.analytics_service import AnalyticsService
from app.github_service import github_service

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("", response_model=List[StudentOut])
def get_students(
    search: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Student).filter(Student.is_active == True)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Student.name.ilike(search_pattern),
                Student.student_id.ilike(search_pattern),
                Student.github_username.ilike(search_pattern),
                Student.email.ilike(search_pattern)
            )
        )
    if department:
        query = query.filter(Student.department == department)

    students = query.all()
    rankings_map = {r["student_id"]: r for r in AnalyticsService.get_rankings(db).get("rankings", [])}

    result = []
    for s in students:
        ranking_info = rankings_map.get(s.id, {})
        c_count = db.query(Commit).filter(Commit.student_id == s.id).count()
        pr_count = db.query(PullRequest).filter(PullRequest.student_id == s.id).count()
        issue_count = db.query(Issue).filter(Issue.student_id == s.id).count()
        repo_count = db.query(func.count(func.distinct(Commit.repository_id))).filter(Commit.student_id == s.id).scalar() or 0

        result.append(StudentOut(
            id=s.id,
            student_id=s.student_id,
            name=s.name,
            email=s.email,
            github_username=s.github_username,
            avatar_url=s.avatar_url or f"https://avatars.githubusercontent.com/{s.github_username}",
            department=s.department,
            batch=s.batch,
            is_active=s.is_active,
            created_at=s.created_at,
            updated_at=s.updated_at,
            commits_count=c_count,
            prs_count=pr_count,
            issues_count=issue_count,
            repositories_count=repo_count,
            score=ranking_info.get("score", 0.0),
            rank=ranking_info.get("rank", None)
        ))

    # Sort by rank or id
    result.sort(key=lambda x: (x.rank if x.rank is not None else 9999))
    return result

@router.post("", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def create_student(student_in: StudentCreate, db: Session = Depends(get_db)):
    # Check duplicate student_id or email or github
    if db.query(Student).filter(Student.student_id == student_in.student_id).first():
        raise HTTPException(status_code=400, detail="Student ID already registered.")
    if db.query(Student).filter(Student.email == student_in.email).first():
        raise HTTPException(status_code=400, detail="Student email already registered.")
    if db.query(Student).filter(Student.github_username == student_in.github_username).first():
        raise HTTPException(status_code=400, detail="GitHub username already registered.")

    clean_username = student_in.github_username.strip().lstrip('@')
    clean_email = student_in.email.strip().lower()

    avatar_url = f"https://avatars.githubusercontent.com/{clean_username}"

    new_student = Student(
        student_id=student_in.student_id.strip(),
        name=student_in.name.strip(),
        email=clean_email,
        github_username=clean_username,
        avatar_url=avatar_url,
        department=student_in.department,
        batch=student_in.batch,
        is_active=student_in.is_active if student_in.is_active is not None else True
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    # Link any existing commits/PRs/issues by github_username or email or author_name
    db.query(Commit).filter(
        or_(
            Commit.github_username.ilike(clean_username),
            Commit.author_email.ilike(clean_email),
            Commit.author_name.ilike(new_student.name)
        )
    ).update({"student_id": new_student.id}, synchronize_session=False)

    db.query(PullRequest).filter(
        PullRequest.github_username.ilike(clean_username)
    ).update({"student_id": new_student.id}, synchronize_session=False)

    db.query(Issue).filter(
        Issue.github_username.ilike(clean_username)
    ).update({"student_id": new_student.id}, synchronize_session=False)

    db.commit()

    # Calculate real-time counts after linking
    c_count = db.query(Commit).filter(Commit.student_id == new_student.id).count()
    pr_count = db.query(PullRequest).filter(PullRequest.student_id == new_student.id).count()
    issue_count = db.query(Issue).filter(Issue.student_id == new_student.id).count()
    repo_count = db.query(func.count(func.distinct(Commit.repository_id))).filter(Commit.student_id == new_student.id).scalar() or 0

    return StudentOut(
        id=new_student.id,
        student_id=new_student.student_id,
        name=new_student.name,
        email=new_student.email,
        github_username=new_student.github_username,
        avatar_url=new_student.avatar_url,
        department=new_student.department,
        batch=new_student.batch,
        is_active=new_student.is_active,
        created_at=new_student.created_at,
        updated_at=new_student.updated_at,
        commits_count=c_count,
        prs_count=pr_count,
        issues_count=issue_count,
        repositories_count=repo_count,
        score=0.0,
        rank=None
    )

@router.get("/github-lookup/{username}")
async def lookup_github_user(username: str):
    """
    Look up a student's GitHub profile and public repositories in real-time.
    """
    clean_user = username.strip().lstrip('@')
    try:
        user_info = await github_service.get_user_info(clean_user)
        repos_info = await github_service.get_user_repositories(clean_user)
        
        repo_list = []
        for r in repos_info:
            repo_list.append({
                "name": r.get("name"),
                "full_name": r.get("full_name"),
                "description": r.get("description"),
                "language": r.get("language") or "Other",
                "stars": r.get("stargazers_count", 0),
                "forks": r.get("forks_count", 0),
                "default_branch": r.get("default_branch", "main"),
                "url": r.get("html_url")
            })

        return {
            "username": user_info.get("login"),
            "name": user_info.get("name") or user_info.get("login"),
            "avatar_url": user_info.get("avatar_url"),
            "bio": user_info.get("bio"),
            "public_repos_count": user_info.get("public_repos", len(repo_list)),
            "repositories": repo_list
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_student_with_repos(
    reg_in: StudentRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Student Self-Registration Portal Endpoint:
    1. Validates and saves Student profile.
    2. Adds and tracks student's GitHub repositories in the database.
    3. Triggers immediate GitHub REST API synchronization to pull commits, PRs, and issues.
    4. Computes initial dynamic activity score.
    """
    clean_student_id = reg_in.student_id.strip()
    clean_email = reg_in.email.strip().lower()
    clean_username = reg_in.github_username.strip().lstrip('@')

    # Check duplicates
    if db.query(Student).filter(Student.student_id == clean_student_id).first():
        raise HTTPException(status_code=400, detail=f"Student ID '{clean_student_id}' is already registered.")
    if db.query(Student).filter(Student.email == clean_email).first():
        raise HTTPException(status_code=400, detail=f"Email '{clean_email}' is already registered.")
    if db.query(Student).filter(Student.github_username.ilike(clean_username)).first():
        raise HTTPException(status_code=400, detail=f"GitHub username '@{clean_username}' is already registered.")

    # Try resolving avatar from GitHub
    avatar_url = f"https://avatars.githubusercontent.com/{clean_username}"
    try:
        gh_user = await github_service.get_user_info(clean_username)
        if gh_user.get("avatar_url"):
            avatar_url = gh_user.get("avatar_url")
    except Exception:
        pass

    # 1. Create student
    new_student = Student(
        student_id=clean_student_id,
        name=reg_in.name.strip(),
        email=clean_email,
        github_username=clean_username,
        avatar_url=avatar_url,
        department=reg_in.department or "Computer Science & Engineering",
        batch=reg_in.batch or "2024-2028",
        is_active=True
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    # 2. Gather repositories to track
    repos_to_sync = set()

    # If track all public repos requested
    if reg_in.track_all_public_repos:
        try:
            user_repos = await github_service.get_user_repositories(clean_username)
            for r in user_repos:
                if r.get("full_name"):
                    repos_to_sync.add(r.get("full_name"))
        except Exception:
            pass

    # If specific selected repositories passed
    if reg_in.selected_repositories:
        for r_name in reg_in.selected_repositories:
            if "/" in r_name:
                repos_to_sync.add(r_name)
            else:
                repos_to_sync.add(f"{clean_username}/{r_name}")

    # If custom URLs passed
    if reg_in.custom_repository_urls:
        for url in reg_in.custom_repository_urls:
            url_clean = url.strip().rstrip('/')
            if "github.com/" in url_clean:
                parts = url_clean.split("github.com/")[-1].split('/')
                if len(parts) >= 2:
                    repos_to_sync.add(f"{parts[0]}/{parts[1]}")
            elif "/" in url_clean:
                repos_to_sync.add(url_clean)

    # 3. Add repositories to database & sync
    tracked_repo_objs = []
    sync_results = []

    for full_name in repos_to_sync:
        parts = full_name.split('/')
        if len(parts) != 2:
            continue
        owner, repo_name = parts[0], parts[1]

        existing_repo = db.query(Repository).filter(Repository.full_name.ilike(full_name)).first()
        if not existing_repo:
            try:
                gh_data = await github_service.get_repository_info(owner, repo_name)
            except Exception:
                gh_data = {
                    "description": f"Repository for student {new_student.name}",
                    "html_url": f"https://github.com/{full_name}",
                    "language": "Other",
                    "stargazers_count": 0,
                    "forks_count": 0,
                    "open_issues_count": 0,
                    "default_branch": "main",
                    "private": False
                }

            existing_repo = Repository(
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
            db.add(existing_repo)
            db.commit()
            db.refresh(existing_repo)

        tracked_repo_objs.append(existing_repo)

        # 4. Synchronize data from GitHub
        if reg_in.auto_sync:
            try:
                sync_res = await github_service.sync_repository_data(existing_repo, db)
                sync_results.append(sync_res)
            except Exception as e:
                sync_results.append({"repository": full_name, "error": str(e)})

    # Also synchronize existing course repositories so any existing commits are matched
    all_repos = db.query(Repository).all()
    for repo in all_repos:
        if repo not in tracked_repo_objs and reg_in.auto_sync:
            try:
                await github_service.sync_repository_data(repo, db)
            except Exception:
                pass

    # 5. Link historical unassigned commits / PRs / issues
    db.query(Commit).filter(
        or_(
            Commit.github_username.ilike(clean_username),
            Commit.author_email.ilike(clean_email),
            Commit.author_name.ilike(new_student.name)
        )
    ).update({"student_id": new_student.id}, synchronize_session=False)

    db.query(PullRequest).filter(
        PullRequest.github_username.ilike(clean_username)
    ).update({"student_id": new_student.id}, synchronize_session=False)

    db.query(Issue).filter(
        Issue.github_username.ilike(clean_username)
    ).update({"student_id": new_student.id}, synchronize_session=False)

    db.commit()

    # 6. Recalculate metrics
    c_count = db.query(Commit).filter(Commit.student_id == new_student.id).count()
    pr_count = db.query(PullRequest).filter(PullRequest.student_id == new_student.id).count()
    issue_count = db.query(Issue).filter(Issue.student_id == new_student.id).count()
    repo_count = db.query(func.count(func.distinct(Commit.repository_id))).filter(Commit.student_id == new_student.id).scalar() or 0

    rankings_res = AnalyticsService.get_rankings(db)
    ranking_info = next((r for r in rankings_res.get("rankings", []) if r["student_id"] == new_student.id), None)

    return {
        "message": f"Student '{new_student.name}' successfully registered and synchronized with GitHub.",
        "student": StudentOut(
            id=new_student.id,
            student_id=new_student.student_id,
            name=new_student.name,
            email=new_student.email,
            github_username=new_student.github_username,
            avatar_url=new_student.avatar_url,
            department=new_student.department,
            batch=new_student.batch,
            is_active=new_student.is_active,
            created_at=new_student.created_at,
            updated_at=new_student.updated_at,
            commits_count=c_count,
            prs_count=pr_count,
            issues_count=issue_count,
            repositories_count=repo_count,
            score=ranking_info.get("score", 0.0) if ranking_info else 0.0,
            rank=ranking_info.get("rank", None) if ranking_info else None
        ),
        "tracked_repositories_count": len(tracked_repo_objs),
        "synced_repositories": [r.full_name for r in tracked_repo_objs],
        "total_commits_synced": c_count,
        "total_prs_synced": pr_count,
        "total_issues_synced": issue_count
    }

@router.get("/{student_id}")
def get_student_profile(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    rankings_res = AnalyticsService.get_rankings(db)
    ranking_info = next((r for r in rankings_res.get("rankings", []) if r["student_id"] == student.id), None)

    # Repository-wise contributions
    repos = db.query(Repository).all()
    repo_contributions = []
    for r in repos:
        c_count = db.query(Commit).filter(Commit.student_id == student.id, Commit.repository_id == r.id).count()
        pr_count = db.query(PullRequest).filter(PullRequest.student_id == student.id, PullRequest.repository_id == r.id).count()
        issue_count = db.query(Issue).filter(Issue.student_id == student.id, Issue.repository_id == r.id).count()
        
        if c_count > 0 or pr_count > 0 or issue_count > 0:
            repo_contributions.append({
                "repository_id": r.id,
                "repository_name": r.name,
                "full_name": r.full_name,
                "language": r.language,
                "commits": c_count,
                "pull_requests": pr_count,
                "issues": issue_count,
                "score": round((c_count * 0.4 + pr_count * 0.4 + issue_count * 0.2) * 10, 1)
            })

    # Activity timeline over past 6 months
    now = datetime.utcnow()
    timeline_data = []
    for i in range(5, -1, -1):
        m_date = now - timedelta(days=i * 30)
        month_label = m_date.strftime("%b %Y")
        month_start = datetime(m_date.year, m_date.month, 1)
        month_end = datetime(m_date.year + 1, 1, 1) if m_date.month == 12 else datetime(m_date.year, m_date.month + 1, 1)

        c_c = db.query(Commit).filter(Commit.student_id == student.id, Commit.committed_at >= month_start, Commit.committed_at < month_end).count()
        p_c = db.query(PullRequest).filter(PullRequest.student_id == student.id, PullRequest.created_at >= month_start, PullRequest.created_at < month_end).count()
        i_c = db.query(Issue).filter(Issue.student_id == student.id, Issue.created_at >= month_start, Issue.created_at < month_end).count()

        timeline_data.append({
            "month": month_label,
            "commits": c_c,
            "pull_requests": p_c,
            "issues": i_c
        })

    # Total metrics
    total_commits = db.query(Commit).filter(Commit.student_id == student.id).count()
    total_prs = db.query(PullRequest).filter(PullRequest.student_id == student.id).count()
    total_issues = db.query(Issue).filter(Issue.student_id == student.id).count()

    return {
        "student": {
            "id": student.id,
            "student_id": student.student_id,
            "name": student.name,
            "email": student.email,
            "github_username": student.github_username,
            "avatar_url": student.avatar_url or f"https://avatars.githubusercontent.com/{student.github_username}",
            "department": student.department,
            "batch": student.batch,
            "created_at": student.created_at
        },
        "stats": {
            "rank": ranking_info["rank"] if ranking_info else None,
            "score": ranking_info["score"] if ranking_info else 0.0,
            "total_commits": total_commits,
            "total_prs": total_prs,
            "total_issues": total_issues,
            "total_repositories": len(repo_contributions),
            "raw_scores": ranking_info.get("raw_scores") if ranking_info else {},
            "normalized_scores": ranking_info.get("normalized_scores") if ranking_info else {}
        },
        "repository_contributions": repo_contributions,
        "timeline_data": timeline_data
    }

@router.put("/{student_id}", response_model=StudentOut)
def update_student(student_id: int, student_in: StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    if student_in.name is not None:
        student.name = student_in.name
    if student_in.email is not None:
        student.email = student_in.email
    if student_in.department is not None:
        student.department = student_in.department
    if student_in.batch is not None:
        student.batch = student_in.batch
    if student_in.is_active is not None:
        student.is_active = student_in.is_active
    if student_in.github_username is not None and student_in.github_username != student.github_username:
        student.github_username = student_in.github_username
        student.avatar_url = f"https://avatars.githubusercontent.com/{student_in.github_username}"

    student.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(student)

    c_count = db.query(Commit).filter(Commit.student_id == student.id).count()
    pr_count = db.query(PullRequest).filter(PullRequest.student_id == student.id).count()
    issue_count = db.query(Issue).filter(Issue.student_id == student.id).count()
    repo_count = db.query(func.count(func.distinct(Commit.repository_id))).filter(Commit.student_id == student.id).scalar() or 0

    return StudentOut(
        id=student.id,
        student_id=student.student_id,
        name=student.name,
        email=student.email,
        github_username=student.github_username,
        avatar_url=student.avatar_url,
        department=student.department,
        batch=student.batch,
        is_active=student.is_active,
        created_at=student.created_at,
        updated_at=student.updated_at,
        commits_count=c_count,
        prs_count=pr_count,
        issues_count=issue_count,
        repositories_count=repo_count,
        score=0.0,
        rank=None
    )

@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    db.delete(student)
    db.commit()
    return None
