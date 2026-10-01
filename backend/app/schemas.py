from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "admin"

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: Optional[str]
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Student Schemas
class StudentBase(BaseModel):
    student_id: str
    name: str
    email: EmailStr
    github_username: str
    department: Optional[str] = "Computer Science & Engineering"
    batch: Optional[str] = "2024-2028"
    is_active: Optional[bool] = True

class StudentCreate(StudentBase):
    pass

class StudentRegisterRequest(StudentBase):
    track_all_public_repos: Optional[bool] = False
    selected_repositories: Optional[List[str]] = []
    custom_repository_urls: Optional[List[str]] = []
    auto_sync: Optional[bool] = True

class StudentGitHubLookup(BaseModel):
    username: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    public_repos_count: int = 0
    repositories: List[Dict[str, Any]] = []

class StudentUpdate(BaseModel):
    student_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    github_username: Optional[str] = None
    department: Optional[str] = None
    batch: Optional[str] = None
    is_active: Optional[bool] = None

class StudentOut(StudentBase):
    id: int
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    commits_count: Optional[int] = 0
    prs_count: Optional[int] = 0
    issues_count: Optional[int] = 0
    repositories_count: Optional[int] = 0
    score: Optional[float] = 0.0
    rank: Optional[int] = None

    class Config:
        from_attributes = True

# Repository Schemas
class RepositoryBase(BaseModel):
    owner: str
    name: str
    full_name: str
    description: Optional[str] = None
    url: str
    language: Optional[str] = "JavaScript"
    is_private: Optional[bool] = False

class RepositoryCreate(BaseModel):
    url_or_fullname: str  # e.g. "facebook/react" or "https://github.com/facebook/react"

class RepositoryOut(RepositoryBase):
    id: int
    stars: int = 0
    forks: int = 0
    open_issues: int = 0
    default_branch: str = "main"
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    commits_count: Optional[int] = 0
    prs_count: Optional[int] = 0
    contributors_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Commit Schemas
class CommitOut(BaseModel):
    id: int
    sha: str
    message: str
    author_name: Optional[str] = None
    author_email: Optional[str] = None
    github_username: Optional[str] = None
    branch: str = "main"
    additions: int = 0
    deletions: int = 0
    url: Optional[str] = None
    committed_at: datetime
    repository_id: int
    student_id: Optional[int] = None
    repository_name: Optional[str] = None
    student_name: Optional[str] = None

    class Config:
        from_attributes = True

# Pull Request Schemas
class PullRequestOut(BaseModel):
    id: int
    github_id: Optional[int] = None
    number: int
    title: str
    body: Optional[str] = None
    state: str
    github_username: Optional[str] = None
    reviewer: Optional[str] = None
    url: Optional[str] = None
    created_at: datetime
    closed_at: Optional[datetime] = None
    merged_at: Optional[datetime] = None
    repository_id: int
    student_id: Optional[int] = None
    repository_name: Optional[str] = None
    student_name: Optional[str] = None

    class Config:
        from_attributes = True

# Issue Schemas
class IssueOut(BaseModel):
    id: int
    github_id: Optional[int] = None
    number: int
    title: str
    body: Optional[str] = None
    state: str
    github_username: Optional[str] = None
    comments_count: int = 0
    url: Optional[str] = None
    created_at: datetime
    closed_at: Optional[datetime] = None
    repository_id: int
    student_id: Optional[int] = None
    repository_name: Optional[str] = None
    student_name: Optional[str] = None

    class Config:
        from_attributes = True

# Activity Log Schema
class ActivityLogOut(BaseModel):
    id: int
    activity_type: str
    title: str
    description: Optional[str] = None
    timestamp: datetime
    url: Optional[str] = None
    student_id: Optional[int] = None
    repository_id: Optional[int] = None
    student_name: Optional[str] = None
    github_username: Optional[str] = None
    student_avatar: Optional[str] = None
    repository_name: Optional[str] = None

    class Config:
        from_attributes = True

# Ranking Schemas
class RankingItem(BaseModel):
    rank: int
    student_id: int
    student_code: str
    student_name: str
    github_username: str
    avatar_url: Optional[str] = None
    commits: int
    pull_requests: int
    issues: int
    reviews: int
    repositories: int
    consistency_days: int
    raw_scores: Dict[str, float]
    normalized_scores: Dict[str, float]
    score: float

class RankingResponse(BaseModel):
    rankings: List[RankingItem]
    weights: Dict[str, float]
    date_filter: str
    total_students: int
    calculated_at: datetime

class RankingSettingsSchema(BaseModel):
    commit_weight: float = 30.0
    pr_weight: float = 20.0
    issue_weight: float = 10.0
    review_weight: float = 15.0
    repo_weight: float = 15.0
    consistency_weight: float = 10.0

# Dashboard Summary Schema
class DashboardSummary(BaseModel):
    total_students: int
    total_repositories: int
    total_commits: int
    total_pull_requests: int
    total_issues: int
    total_contributors: int
    last_synced_at: Optional[datetime] = None
    rate_limit: Dict[str, Any]

# Global Search Result Schema
class GlobalSearchResult(BaseModel):
    students: List[Dict[str, Any]]
    repositories: List[Dict[str, Any]]
    commits: List[Dict[str, Any]]
    pull_requests: List[Dict[str, Any]]
    issues: List[Dict[str, Any]]
