import httpx
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Repository, Commit, PullRequest, Issue, Student, Contribution, ActivityLog

class GitHubService:
    def __init__(self, token: Optional[str] = None):
        self.token = token or settings.GITHUB_TOKEN
        self.base_url = settings.GITHUB_API_BASE_URL.rstrip('/')
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub-Tracking-Academic-Dashboard/1.0",
        }
        if self.token:
            self.headers["Authorization"] = f"token {self.token}"

    def update_token(self, new_token: str):
        self.token = new_token
        if new_token:
            self.headers["Authorization"] = f"token {new_token}"
        elif "Authorization" in self.headers:
            del self.headers["Authorization"]

    async def get_rate_limit(self) -> Dict[str, Any]:
        """Fetch current GitHub API rate limit status"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/rate_limit", headers=self.headers)
                if response.status_code == 200:
                    data = response.json()
                    core = data.get("resources", {}).get("core", {})
                    reset_time = datetime.fromtimestamp(core.get("reset", 0), tz=timezone.utc).isoformat()
                    return {
                        "authenticated": bool(self.token),
                        "limit": core.get("limit", 60),
                        "remaining": core.get("remaining", 60),
                        "used": core.get("used", 0),
                        "reset": core.get("reset", 0),
                        "reset_time": reset_time,
                        "status": "healthy" if core.get("remaining", 0) > 10 else "low_limit"
                    }
                else:
                    return {
                        "authenticated": bool(self.token),
                        "limit": 60 if not self.token else 5000,
                        "remaining": 0,
                        "used": 60,
                        "reset": int(datetime.utcnow().timestamp()) + 3600,
                        "reset_time": datetime.utcnow().isoformat(),
                        "status": "rate_limited_or_error",
                        "error": response.text
                    }
        except Exception as e:
            return {
                "authenticated": bool(self.token),
                "limit": 5000 if self.token else 60,
                "remaining": 4980 if self.token else 50,
                "used": 20 if self.token else 10,
                "reset": int(datetime.utcnow().timestamp()) + 3600,
                "reset_time": datetime.utcnow().isoformat(),
                "status": "offline_mode",
                "error": str(e)
            }

    async def get_repository_info(self, owner: str, repo: str) -> Dict[str, Any]:
        """Fetch metadata for a single repository"""
        url = f"{self.base_url}/repos/{owner}/{repo}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code == 404:
                raise Exception(f"Repository '{owner}/{repo}' not found on GitHub.")
            elif response.status_code == 401:
                raise Exception("GitHub authentication failed. Please check configured GITHUB_TOKEN.")
            elif response.status_code == 403:
                raise Exception("GitHub API rate limit exceeded or access forbidden.")
            elif response.status_code != 200:
                raise Exception(f"GitHub API Error: {response.status_code} - {response.text}")
            return response.json()

    async def get_commits(self, owner: str, repo: str, per_page: int = 100, page: int = 1) -> List[Dict[str, Any]]:
        """Fetch commits for a repository"""
        url = f"{self.base_url}/repos/{owner}/{repo}/commits"
        params = {"per_page": per_page, "page": page}
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 409: # Git Repository is empty
                return []
            else:
                return []

    async def get_pull_requests(self, owner: str, repo: str, state: str = "all", per_page: int = 100) -> List[Dict[str, Any]]:
        """Fetch pull requests for a repository"""
        url = f"{self.base_url}/repos/{owner}/{repo}/pulls"
        params = {"state": state, "per_page": per_page}
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                return response.json()
            return []

    async def get_issues(self, owner: str, repo: str, state: str = "all", per_page: int = 100) -> List[Dict[str, Any]]:
        """Fetch issues for a repository (excluding PRs)"""
        url = f"{self.base_url}/repos/{owner}/{repo}/issues"
        params = {"state": state, "per_page": per_page}
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                # GitHub issues endpoint includes PRs unless filtered
                data = response.json()
                return [i for i in data if "pull_request" not in i]
            return []

    async def get_contributors(self, owner: str, repo: str) -> List[Dict[str, Any]]:
        """Fetch contributors list"""
        url = f"{self.base_url}/repos/{owner}/{repo}/contributors"
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code == 200:
                return response.json()
            return []

    async def get_branches(self, owner: str, repo: str) -> List[Dict[str, Any]]:
        """Fetch branches for a repository"""
        url = f"{self.base_url}/repos/{owner}/{repo}/branches"
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code == 200:
                return response.json()
            return []

    async def get_user_info(self, username: str) -> Dict[str, Any]:
        """Fetch user profile information from GitHub"""
        clean_user = username.strip().lstrip('@')
        url = f"{self.base_url}/users/{clean_user}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code == 404:
                raise Exception(f"GitHub user '@{clean_user}' not found.")
            elif response.status_code != 200:
                raise Exception(f"GitHub API error {response.status_code}: {response.text}")
            return response.json()

    async def get_user_repositories(self, username: str, sort: str = "updated", per_page: int = 30) -> List[Dict[str, Any]]:
        """Fetch public repositories owned by a user"""
        clean_user = username.strip().lstrip('@')
        url = f"{self.base_url}/users/{clean_user}/repos"
        params = {"sort": sort, "per_page": per_page}
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                return response.json()
            return []

    async def sync_repository_data(self, repository: Repository, db: Session) -> Dict[str, Any]:
        """
        Synchronize a single repository's commits, PRs, issues and link them with registered students.
        """
        owner = repository.owner
        name = repository.name
        
        # 1. Update repo metadata
        try:
            repo_info = await self.get_repository_info(owner, name)
            repository.description = repo_info.get("description")
            repository.language = repo_info.get("language") or repository.language
            repository.stars = repo_info.get("stargazers_count", 0)
            repository.forks = repo_info.get("forks_count", 0)
            repository.open_issues = repo_info.get("open_issues_count", 0)
            repository.default_branch = repo_info.get("default_branch", "main")
            repository.is_private = repo_info.get("private", False)
            repository.last_synced_at = datetime.utcnow()
        except Exception as e:
            # If rate limited or error, record last synced attempt
            repository.last_synced_at = datetime.utcnow()
            pass

        # Build student lookup maps
        students = db.query(Student).all()
        student_by_gh = {s.github_username.lower(): s for s in students}
        student_by_email = {s.email.lower(): s for s in students}

        commits_added = 0
        prs_added = 0
        issues_added = 0

        # 2. Sync Commits
        gh_commits = await self.get_commits(owner, name, per_page=100)
        for c in gh_commits:
            sha = c.get("sha")
            if not sha:
                continue
            existing = db.query(Commit).filter(Commit.sha == sha).first()
            if existing:
                continue

            commit_data = c.get("commit", {})
            author_data = commit_data.get("author", {})
            author_name = author_data.get("name")
            author_email = author_data.get("email")
            committed_date_str = author_data.get("date")
            message = commit_data.get("message", "No commit message")
            
            gh_author = c.get("author") or {}
            gh_username = gh_author.get("login") if isinstance(gh_author, dict) else None

            # Parse timestamp
            committed_at = datetime.utcnow()
            if committed_date_str:
                try:
                    committed_at = datetime.fromisoformat(committed_date_str.replace("Z", "+00:00"))
                except Exception:
                    pass

            # Link with registered student
            matched_student = None
            if gh_username and gh_username.lower() in student_by_gh:
                matched_student = student_by_gh[gh_username.lower()]
            elif author_email and author_email.lower() in student_by_email:
                matched_student = student_by_email[author_email.lower()]

            new_commit = Commit(
                sha=sha,
                message=message,
                author_name=author_name,
                author_email=author_email,
                github_username=gh_username or (matched_student.github_username if matched_student else None),
                branch=repository.default_branch,
                url=c.get("html_url"),
                committed_at=committed_at,
                repository_id=repository.id,
                student_id=matched_student.id if matched_student else None
            )
            db.add(new_commit)
            commits_added += 1

            # Add activity log
            if matched_student:
                act = ActivityLog(
                    activity_type="commit",
                    title=f"{matched_student.name} pushed commit {sha[:7]}",
                    description=message[:120],
                    timestamp=committed_at,
                    url=c.get("html_url"),
                    student_id=matched_student.id,
                    repository_id=repository.id
                )
                db.add(act)

        # 3. Sync Pull Requests
        gh_prs = await self.get_pull_requests(owner, name)
        for pr in gh_prs:
            gh_id = pr.get("id")
            existing_pr = db.query(PullRequest).filter(PullRequest.github_id == gh_id).first() if gh_id else None
            
            pr_user = pr.get("user") or {}
            gh_username = pr_user.get("login")
            matched_student = student_by_gh.get(gh_username.lower()) if gh_username else None

            state = pr.get("state", "open")
            if pr.get("merged_at"):
                state = "merged"

            created_at = datetime.utcnow()
            if pr.get("created_at"):
                try:
                    created_at = datetime.fromisoformat(pr["created_at"].replace("Z", "+00:00"))
                except Exception:
                    pass

            merged_at = None
            if pr.get("merged_at"):
                try:
                    merged_at = datetime.fromisoformat(pr["merged_at"].replace("Z", "+00:00"))
                except Exception:
                    pass

            closed_at = None
            if pr.get("closed_at"):
                try:
                    closed_at = datetime.fromisoformat(pr["closed_at"].replace("Z", "+00:00"))
                except Exception:
                    pass

            if not existing_pr:
                new_pr = PullRequest(
                    github_id=gh_id,
                    number=pr.get("number", 0),
                    title=pr.get("title", ""),
                    body=pr.get("body"),
                    state=state,
                    github_username=gh_username,
                    reviewer=None,
                    url=pr.get("html_url"),
                    created_at=created_at,
                    closed_at=closed_at,
                    merged_at=merged_at,
                    repository_id=repository.id,
                    student_id=matched_student.id if matched_student else None
                )
                db.add(new_pr)
                prs_added += 1

                if matched_student:
                    act = ActivityLog(
                        activity_type="pull_request",
                        title=f"{matched_student.name} opened PR #{pr.get('number')}",
                        description=pr.get("title", "")[:120],
                        timestamp=created_at,
                        url=pr.get("html_url"),
                        student_id=matched_student.id,
                        repository_id=repository.id
                    )
                    db.add(act)
            else:
                existing_pr.state = state
                existing_pr.title = pr.get("title", existing_pr.title)
                existing_pr.merged_at = merged_at
                existing_pr.closed_at = closed_at

        # 4. Sync Issues
        gh_issues = await self.get_issues(owner, name)
        for issue in gh_issues:
            gh_id = issue.get("id")
            existing_issue = db.query(Issue).filter(Issue.github_id == gh_id).first() if gh_id else None
            
            issue_user = issue.get("user") or {}
            gh_username = issue_user.get("login")
            matched_student = student_by_gh.get(gh_username.lower()) if gh_username else None

            created_at = datetime.utcnow()
            if issue.get("created_at"):
                try:
                    created_at = datetime.fromisoformat(issue["created_at"].replace("Z", "+00:00"))
                except Exception:
                    pass

            closed_at = None
            if issue.get("closed_at"):
                try:
                    closed_at = datetime.fromisoformat(issue["closed_at"].replace("Z", "+00:00"))
                except Exception:
                    pass

            if not existing_issue:
                new_issue = Issue(
                    github_id=gh_id,
                    number=issue.get("number", 0),
                    title=issue.get("title", ""),
                    body=issue.get("body"),
                    state=issue.get("state", "open"),
                    github_username=gh_username,
                    comments_count=issue.get("comments", 0),
                    url=issue.get("html_url"),
                    created_at=created_at,
                    closed_at=closed_at,
                    repository_id=repository.id,
                    student_id=matched_student.id if matched_student else None
                )
                db.add(new_issue)
                issues_added += 1

                if matched_student:
                    act = ActivityLog(
                        activity_type="issue",
                        title=f"{matched_student.name} created issue #{issue.get('number')}",
                        description=issue.get("title", "")[:120],
                        timestamp=created_at,
                        url=issue.get("html_url"),
                        student_id=matched_student.id,
                        repository_id=repository.id
                    )
                    db.add(act)
            else:
                existing_issue.state = issue.get("state", existing_issue.state)
                existing_issue.title = issue.get("title", existing_issue.title)
                existing_issue.closed_at = closed_at

        db.commit()

        return {
            "repository": repository.full_name,
            "commits_synced": commits_added,
            "prs_synced": prs_added,
            "issues_synced": issues_added,
            "synced_at": repository.last_synced_at.isoformat() if repository.last_synced_at else None
        }

github_service = GitHubService()
