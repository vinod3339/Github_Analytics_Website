import io
import pandas as pd
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import Student, Repository, Commit, PullRequest, Issue
from app.analytics_service import AnalyticsService

router = APIRouter(prefix="/export", tags=["Export"])

@router.get("/{data_type}")
def export_data(
    data_type: str,
    format: str = Query("csv", pattern="^(csv|excel)$"),
    db: Session = Depends(get_db)
):
    df = None
    filename_prefix = f"github_tracking_{data_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

    if data_type == "rankings":
        rankings_data = AnalyticsService.get_rankings(db).get("rankings", [])
        rows = []
        for r in rankings_data:
            rows.append({
                "Rank": r["rank"],
                "Student ID": r["student_code"],
                "Student Name": r["student_name"],
                "GitHub Username": r["github_username"],
                "Commits": r["commits"],
                "Pull Requests": r["pull_requests"],
                "Issues": r["issues"],
                "Reviews": r["reviews"],
                "Repositories": r["repositories"],
                "Active Days": r["consistency_days"],
                "Activity Score": r["score"]
            })
        df = pd.DataFrame(rows)

    elif data_type == "students":
        students = db.query(Student).all()
        rows = []
        for s in students:
            rows.append({
                "ID": s.id,
                "Student ID": s.student_id,
                "Name": s.name,
                "Email": s.email,
                "GitHub Username": s.github_username,
                "Department": s.department,
                "Batch": s.batch,
                "Active": s.is_active,
                "Created At": s.created_at
            })
        df = pd.DataFrame(rows)

    elif data_type == "repositories":
        repos = db.query(Repository).all()
        rows = []
        for r in repos:
            rows.append({
                "ID": r.id,
                "Full Name": r.full_name,
                "Language": r.language,
                "Stars": r.stars,
                "Forks": r.forks,
                "Open Issues": r.open_issues,
                "URL": r.url,
                "Last Synced At": r.last_synced_at
            })
        df = pd.DataFrame(rows)

    elif data_type == "commits":
        commits = db.query(Commit).order_by(Commit.committed_at.desc()).limit(1000).all()
        rows = []
        for c in commits:
            rows.append({
                "SHA": c.sha,
                "Author": c.author_name or (c.student.name if c.student else c.github_username),
                "GitHub Username": c.github_username,
                "Repository": c.repository.full_name if c.repository else "",
                "Branch": c.branch,
                "Message": c.message,
                "Additions": c.additions,
                "Deletions": c.deletions,
                "Committed At": c.committed_at,
                "URL": c.url
            })
        df = pd.DataFrame(rows)

    elif data_type == "pull_requests":
        prs = db.query(PullRequest).order_by(PullRequest.created_at.desc()).limit(1000).all()
        rows = []
        for p in prs:
            rows.append({
                "Number": p.number,
                "Title": p.title,
                "State": p.state,
                "Author": p.student.name if p.student else p.github_username,
                "GitHub Username": p.github_username,
                "Repository": p.repository.full_name if p.repository else "",
                "Created At": p.created_at,
                "Merged At": p.merged_at,
                "Closed At": p.closed_at,
                "URL": p.url
            })
        df = pd.DataFrame(rows)

    elif data_type == "issues":
        issues = db.query(Issue).order_by(Issue.created_at.desc()).limit(1000).all()
        rows = []
        for iss in issues:
            rows.append({
                "Number": iss.number,
                "Title": iss.title,
                "State": iss.state,
                "Author": iss.student.name if iss.student else iss.github_username,
                "GitHub Username": iss.github_username,
                "Repository": iss.repository.full_name if iss.repository else "",
                "Comments": iss.comments_count,
                "Created At": iss.created_at,
                "Closed At": iss.closed_at,
                "URL": iss.url
            })
        df = pd.DataFrame(rows)

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported export type '{data_type}'")

    if df is None or df.empty:
        df = pd.DataFrame([{"Message": "No data available"}])

    if format == "csv":
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename={filename_prefix}.csv"
        return response
    else:
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name=data_type.capitalize()[:30])
        output.seek(0)
        response = StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response.headers["Content-Disposition"] = f"attachment; filename={filename_prefix}.xlsx"
        return response
