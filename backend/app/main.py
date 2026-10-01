from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database
from app.routers import (
    auth,
    dashboard,
    students,
    repositories,
    commits,
    pull_requests,
    issues,
    contributors,
    rankings,
    activity,
    analytics,
    export,
    settings as settings_router,
    github,
    search
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    
    # Run database seed
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade GitHub Tracking & Analytics Platform for Academic Institutions & Faculty.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api
api_prefix = settings.API_V1_STR

app.include_router(auth.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(students.router, prefix=api_prefix)
app.include_router(repositories.router, prefix=api_prefix)
app.include_router(commits.router, prefix=api_prefix)
app.include_router(pull_requests.router, prefix=api_prefix)
app.include_router(issues.router, prefix=api_prefix)
app.include_router(contributors.router, prefix=api_prefix)
app.include_router(rankings.router, prefix=api_prefix)
app.include_router(activity.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(export.router, prefix=api_prefix)
app.include_router(settings_router.router, prefix=api_prefix)
app.include_router(github.router, prefix=api_prefix)
app.include_router(search.router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
