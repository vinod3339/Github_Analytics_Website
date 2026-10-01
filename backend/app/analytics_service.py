from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct

from app.models import Student, Repository, Commit, PullRequest, Issue, Contribution, RankingSetting

class AnalyticsService:
    @staticmethod
    def get_date_range(filter_type: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
        """Helper to resolve date filters to start and end datetimes"""
        now = datetime.utcnow()
        if filter_type == "today":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            return start, now
        elif filter_type == "7d":
            return now - timedelta(days=7), now
        elif filter_type == "30d":
            return now - timedelta(days=30), now
        elif filter_type == "3m":
            return now - timedelta(days=90), now
        elif filter_type == "semester":
            # 6 months semester window
            return now - timedelta(days=180), now
        elif filter_type == "custom" and start_date:
            try:
                s = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
                e = datetime.fromisoformat(end_date.replace("Z", "+00:00")) if end_date else now
                return s, e
            except Exception:
                return None, None
        return None, None  # All time

    @classmethod
    def get_rankings(
        cls,
        db: Session,
        date_filter: str = "all",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        repository_id: Optional[int] = None,
        student_id: Optional[int] = None,
        limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Dynamically calculate student GitHub ranking scores with component normalization.
        """
        # 1. Fetch ranking weights
        settings = db.query(RankingSetting).first()
        if not settings:
            w_commit, w_pr, w_issue, w_review, w_repo, w_consistency = 30.0, 20.0, 10.0, 15.0, 15.0, 10.0
        else:
            w_commit = settings.commit_weight
            w_pr = settings.pr_weight
            w_issue = settings.issue_weight
            w_review = settings.review_weight
            w_repo = settings.repo_weight
            w_consistency = settings.consistency_weight

        # 2. Resolve date boundaries
        start_dt, end_dt = cls.get_date_range(date_filter, start_date, end_date)

        # 3. Base student query
        student_query = db.query(Student).filter(Student.is_active == True)
        if student_id:
            student_query = student_query.filter(Student.id == student_id)
        students = student_query.all()

        if not students:
            return {
                "rankings": [],
                "weights": {
                    "commits": w_commit,
                    "pull_requests": w_pr,
                    "issues": w_issue,
                    "reviews": w_review,
                    "repositories": w_repo,
                    "consistency": w_consistency
                },
                "date_filter": date_filter,
                "total_students": 0,
                "calculated_at": datetime.utcnow()
            }

        # 4. Gather raw metrics per student
        student_metrics = []
        max_commits = 1
        max_prs = 1
        max_issues = 1
        max_reviews = 1
        max_repos = 1
        max_consistency = 1

        for student in students:
            # Commits
            c_query = db.query(Commit).filter(Commit.student_id == student.id)
            if repository_id:
                c_query = c_query.filter(Commit.repository_id == repository_id)
            if start_dt and end_dt:
                c_query = c_query.filter(Commit.committed_at >= start_dt, Commit.committed_at <= end_dt)
            commits_count = c_query.count()

            # PRs
            pr_query = db.query(PullRequest).filter(PullRequest.student_id == student.id)
            if repository_id:
                pr_query = pr_query.filter(PullRequest.repository_id == repository_id)
            if start_dt and end_dt:
                pr_query = pr_query.filter(PullRequest.created_at >= start_dt, PullRequest.created_at <= end_dt)
            prs_count = pr_query.count()

            # Issues
            i_query = db.query(Issue).filter(Issue.student_id == student.id)
            if repository_id:
                i_query = i_query.filter(Issue.repository_id == repository_id)
            if start_dt and end_dt:
                i_query = i_query.filter(Issue.created_at >= start_dt, Issue.created_at <= end_dt)
            issues_count = i_query.count()

            # Code Reviews / Contributions
            contrib_query = db.query(Contribution).filter(Contribution.student_id == student.id)
            if repository_id:
                contrib_query = contrib_query.filter(Contribution.repository_id == repository_id)
            contribs = contrib_query.all()
            reviews_count = sum(c.reviews_count for c in contribs)

            # Repositories contributed to
            repo_count = c_query.with_entities(func.count(distinct(Commit.repository_id))).scalar() or 0

            # Consistency: distinct active days based on commit dates
            commit_dates = c_query.with_entities(Commit.committed_at).all()
            distinct_days = len(set(c[0].date() for c in commit_dates if c[0]))

            # Track maximums for normalization
            if commits_count > max_commits:
                max_commits = commits_count
            if prs_count > max_prs:
                max_prs = prs_count
            if issues_count > max_issues:
                max_issues = issues_count
            if reviews_count > max_reviews:
                max_reviews = reviews_count
            if repo_count > max_repos:
                max_repos = repo_count
            if distinct_days > max_consistency:
                max_consistency = distinct_days

            student_metrics.append({
                "student": student,
                "commits": commits_count,
                "pull_requests": prs_count,
                "issues": issues_count,
                "reviews": reviews_count,
                "repositories": repo_count,
                "consistency_days": distinct_days
            })

        # 5. Compute normalized scores and weighted final score
        scored_items = []
        for item in student_metrics:
            s = item["student"]
            
            # Normalized component scores (0 - 100)
            c_norm = (item["commits"] / max_commits) * 100.0 if max_commits > 0 else 0.0
            pr_norm = (item["pull_requests"] / max_prs) * 100.0 if max_prs > 0 else 0.0
            i_norm = (item["issues"] / max_issues) * 100.0 if max_issues > 0 else 0.0
            rev_norm = (item["reviews"] / max_reviews) * 100.0 if max_reviews > 0 else 0.0
            repo_norm = (item["repositories"] / max_repos) * 100.0 if max_repos > 0 else 0.0
            cons_norm = (item["consistency_days"] / max_consistency) * 100.0 if max_consistency > 0 else 0.0

            total_weight = w_commit + w_pr + w_issue + w_review + w_repo + w_consistency
            if total_weight <= 0:
                total_weight = 100.0

            final_score = (
                (c_norm * w_commit) +
                (pr_norm * w_pr) +
                (i_norm * w_issue) +
                (rev_norm * w_review) +
                (repo_norm * w_repo) +
                (cons_norm * w_consistency)
            ) / total_weight

            scored_items.append({
                "student_id": s.id,
                "student_code": s.student_id,
                "student_name": s.name,
                "github_username": s.github_username,
                "avatar_url": s.avatar_url or f"https://avatars.githubusercontent.com/{s.github_username}",
                "commits": item["commits"],
                "pull_requests": item["pull_requests"],
                "issues": item["issues"],
                "reviews": item["reviews"],
                "repositories": item["repositories"],
                "consistency_days": item["consistency_days"],
                "raw_scores": {
                    "commits": float(item["commits"]),
                    "pull_requests": float(item["pull_requests"]),
                    "issues": float(item["issues"]),
                    "reviews": float(item["reviews"]),
                    "repositories": float(item["repositories"]),
                    "consistency_days": float(item["consistency_days"])
                },
                "normalized_scores": {
                    "commits": round(c_norm, 1),
                    "pull_requests": round(pr_norm, 1),
                    "issues": round(i_norm, 1),
                    "reviews": round(rev_norm, 1),
                    "repositories": round(repo_norm, 1),
                    "consistency": round(cons_norm, 1)
                },
                "score": round(final_score, 1)
            })

        # 6. Sort descending by score
        scored_items.sort(key=lambda x: (x["score"], x["commits"], x["pull_requests"]), reverse=True)

        # 7. Assign ranks (1-based)
        rankings = []
        for rank_idx, item in enumerate(scored_items, start=1):
            item["rank"] = rank_idx
            rankings.append(item)

        if limit:
            rankings = rankings[:limit]

        return {
            "rankings": rankings,
            "weights": {
                "commits": w_commit,
                "pull_requests": w_pr,
                "issues": w_issue,
                "reviews": w_review,
                "repositories": w_repo,
                "consistency": w_consistency
            },
            "date_filter": date_filter,
            "total_students": len(students),
            "calculated_at": datetime.utcnow()
        }

    @classmethod
    def get_analytics_overview(cls, db: Session) -> Dict[str, Any]:
        """
        Generate datasets for all analytics charts (Monthly Trends, Languages, Top Performers, Repo Activity).
        """
        # 1. Monthly activity (past 6 months)
        now = datetime.utcnow()
        monthly_data = []
        for i in range(5, -1, -1):
            m_date = now - timedelta(days=i * 30)
            month_label = m_date.strftime("%b %Y")
            month_start = datetime(m_date.year, m_date.month, 1)
            # next month
            if m_date.month == 12:
                month_end = datetime(m_date.year + 1, 1, 1)
            else:
                month_end = datetime(m_date.year, m_date.month + 1, 1)

            c_count = db.query(Commit).filter(Commit.committed_at >= month_start, Commit.committed_at < month_end).count()
            pr_count = db.query(PullRequest).filter(PullRequest.created_at >= month_start, PullRequest.created_at < month_end).count()
            i_count = db.query(Issue).filter(Issue.created_at >= month_start, Issue.created_at < month_end).count()

            monthly_data.append({
                "month": month_label,
                "commits": c_count,
                "pull_requests": pr_count,
                "issues": i_count,
                "total_activity": c_count + pr_count + i_count
            })

        # 2. Programming Language Distribution
        repos = db.query(Repository).all()
        lang_counts: Dict[str, int] = {}
        for r in repos:
            lang = r.language or "Other"
            lang_counts[lang] = lang_counts.get(lang, 0) + 1

        language_data = [{"name": k, "value": v} for k, v in lang_counts.items()]

        # 3. Repository activity breakdown
        repo_activity = []
        for r in repos:
            commits = db.query(Commit).filter(Commit.repository_id == r.id).count()
            prs = db.query(PullRequest).filter(PullRequest.repository_id == r.id).count()
            issues = db.query(Issue).filter(Issue.repository_id == r.id).count()
            contributors = db.query(distinct(Commit.student_id)).filter(Commit.repository_id == r.id, Commit.student_id != None).count()

            repo_activity.append({
                "id": r.id,
                "name": r.name,
                "full_name": r.full_name,
                "language": r.language,
                "stars": r.stars,
                "forks": r.forks,
                "commits": commits,
                "pull_requests": prs,
                "issues": issues,
                "contributors": contributors
            })

        # 4. Student contribution comparison (Top 8 students)
        rankings_data = cls.get_rankings(db, limit=8)
        student_comparison = []
        for item in rankings_data.get("rankings", []):
            student_comparison.append({
                "name": item["student_name"].split()[0], # First name for chart label
                "fullName": item["student_name"],
                "commits": item["commits"],
                "prs": item["pull_requests"],
                "issues": item["issues"],
                "score": item["score"]
            })

        return {
            "monthly_activity": monthly_data,
            "language_distribution": language_data,
            "repository_activity": repo_activity,
            "student_comparison": student_comparison
        }
