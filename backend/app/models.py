from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="admin")  # admin, faculty, viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), unique=True, index=True, nullable=False)  # Academic roll no / ID
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    github_username = Column(String(100), unique=True, index=True, nullable=False)
    avatar_url = Column(String(255), nullable=True)
    department = Column(String(100), default="Computer Science & Engineering")
    batch = Column(String(50), default="2024-2028")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    commits = relationship("Commit", back_populates="student", cascade="all, delete-orphan")
    pull_requests = relationship("PullRequest", back_populates="student", cascade="all, delete-orphan")
    issues = relationship("Issue", back_populates="student", cascade="all, delete-orphan")
    contributions = relationship("Contribution", back_populates="student", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="student", cascade="all, delete-orphan")

class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True)
    owner = Column(String(100), nullable=False)
    name = Column(String(100), nullable=False)
    full_name = Column(String(200), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String(255), nullable=False)
    language = Column(String(50), default="JavaScript")
    stars = Column(Integer, default=0)
    forks = Column(Integer, default=0)
    open_issues = Column(Integer, default=0)
    default_branch = Column(String(50), default="main")
    is_private = Column(Boolean, default=False)
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    commits = relationship("Commit", back_populates="repository", cascade="all, delete-orphan")
    pull_requests = relationship("PullRequest", back_populates="repository", cascade="all, delete-orphan")
    issues = relationship("Issue", back_populates="repository", cascade="all, delete-orphan")
    contributions = relationship("Contribution", back_populates="repository", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="repository", cascade="all, delete-orphan")

class Commit(Base):
    __tablename__ = "commits"

    id = Column(Integer, primary_key=True, index=True)
    sha = Column(String(64), unique=True, index=True, nullable=False)
    message = Column(Text, nullable=False)
    author_name = Column(String(100), nullable=True)
    author_email = Column(String(100), nullable=True)
    github_username = Column(String(100), index=True, nullable=True)
    branch = Column(String(100), default="main")
    additions = Column(Integer, default=0)
    deletions = Column(Integer, default=0)
    url = Column(String(255), nullable=True)
    committed_at = Column(DateTime, index=True, nullable=False)
    
    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)

    # Relationships
    repository = relationship("Repository", back_populates="commits")
    student = relationship("Student", back_populates="commits")

class PullRequest(Base):
    __tablename__ = "pull_requests"

    id = Column(Integer, primary_key=True, index=True)
    github_id = Column(Integer, unique=True, index=True, nullable=True)
    number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    state = Column(String(20), default="open")  # open, closed, merged
    github_username = Column(String(100), index=True, nullable=True)
    reviewer = Column(String(100), nullable=True)
    url = Column(String(255), nullable=True)
    created_at = Column(DateTime, index=True, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    merged_at = Column(DateTime, nullable=True)

    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)

    # Relationships
    repository = relationship("Repository", back_populates="pull_requests")
    student = relationship("Student", back_populates="pull_requests")

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    github_id = Column(Integer, unique=True, index=True, nullable=True)
    number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    state = Column(String(20), default="open")  # open, closed
    github_username = Column(String(100), index=True, nullable=True)
    comments_count = Column(Integer, default=0)
    url = Column(String(255), nullable=True)
    created_at = Column(DateTime, index=True, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)

    # Relationships
    repository = relationship("Repository", back_populates="issues")
    student = relationship("Student", back_populates="issues")

class Contribution(Base):
    __tablename__ = "contributions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=False)
    commits_count = Column(Integer, default=0)
    prs_count = Column(Integer, default=0)
    issues_count = Column(Integer, default=0)
    reviews_count = Column(Integer, default=0)
    last_activity_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="contributions")
    repository = relationship("Repository", back_populates="contributions")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    activity_type = Column(String(50), nullable=False)  # commit, pull_request, issue, review, repository
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    timestamp = Column(DateTime, index=True, default=datetime.utcnow)
    url = Column(String(255), nullable=True)
    
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=True)

    student = relationship("Student", back_populates="activity_logs")
    repository = relationship("Repository", back_populates="activity_logs")

class RankingSetting(Base):
    __tablename__ = "ranking_settings"

    id = Column(Integer, primary_key=True, index=True)
    commit_weight = Column(Float, default=30.0)
    pr_weight = Column(Float, default=20.0)
    issue_weight = Column(Float, default=10.0)
    review_weight = Column(Float, default=15.0)
    repo_weight = Column(Float, default=15.0)
    consistency_weight = Column(Float, default=10.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
