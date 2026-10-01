import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models import User, Student, Repository, Commit, PullRequest, Issue, Contribution, ActivityLog, RankingSetting
from app.auth import get_password_hash
from app.config import settings

def seed_database(db: Session):
    # 1. Create Default Admin User
    admin = db.query(User).filter(User.username == settings.DEFAULT_ADMIN_USERNAME).first()
    if not admin:
        admin = User(
            username=settings.DEFAULT_ADMIN_USERNAME,
            email=settings.DEFAULT_ADMIN_EMAIL,
            full_name=settings.DEFAULT_ADMIN_FULL_NAME,
            hashed_password=get_password_hash(settings.DEFAULT_ADMIN_PASSWORD),
            role="admin",
            is_active=True
        )
        db.add(admin)

    # 2. Create Default Ranking Settings
    rank_settings = db.query(RankingSetting).first()
    if not rank_settings:
        rank_settings = RankingSetting(
            commit_weight=30.0,
            pr_weight=20.0,
            issue_weight=10.0,
            review_weight=15.0,
            repo_weight=15.0,
            consistency_weight=10.0
        )
        db.add(rank_settings)
    db.commit()

    # 3. Seed Sample Academic Data if Students table is empty
    if db.query(Student).count() == 0:
        sample_students = [
            {"student_id": "CS2024-001", "name": "Rahul Sharma", "email": "rahul.sharma@university.edu", "github_username": "rahulsharma-dev", "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"},
            {"student_id": "CS2024-002", "name": "Priya Patel", "email": "priya.patel@university.edu", "github_username": "priyapatel-ai", "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"},
            {"student_id": "CS2024-003", "name": "Arun Kumar", "email": "arun.kumar@university.edu", "github_username": "arunkumar-tech", "avatar_url": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150"},
            {"student_id": "CS2024-004", "name": "Sneha Gupta", "email": "sneha.gupta@university.edu", "github_username": "snehagupta-code", "avatar_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150"},
            {"student_id": "CS2024-005", "name": "Vikram Singh", "email": "vikram.singh@university.edu", "github_username": "vikramsingh-cs", "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"},
            {"student_id": "CS2024-006", "name": "Ananya Roy", "email": "ananya.roy@university.edu", "github_username": "ananyaroy-dev", "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"},
            {"student_id": "CS2024-007", "name": "David Chen", "email": "david.chen@university.edu", "github_username": "davidchen-eng", "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"},
            {"student_id": "CS2024-008", "name": "Emily Watson", "email": "emily.watson@university.edu", "github_username": "emilywatson-lab", "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"},
            {"student_id": "CS2024-009", "name": "Rohan Verma", "email": "rohan.verma@university.edu", "github_username": "rohanverma-ml", "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"},
            {"student_id": "CS2024-010", "name": "Maya Lin", "email": "maya.lin@university.edu", "github_username": "mayalin-cloud", "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"}
        ]

        student_objs = []
        for s_data in sample_students:
            st = Student(**s_data, department="Computer Science & Engineering", batch="2024-2028")
            db.add(st)
            student_objs.append(st)
        db.commit()

        sample_repos = [
            {
                "owner": "univ-cs",
                "name": "distributed-systems-lab",
                "full_name": "univ-cs/distributed-systems-lab",
                "description": "Course projects and assignments on consensus algorithms, Raft, and distributed KV stores.",
                "url": "https://github.com/univ-cs/distributed-systems-lab",
                "language": "Go",
                "stars": 42,
                "forks": 18,
                "open_issues": 4,
                "default_branch": "main"
            },
            {
                "owner": "univ-cs",
                "name": "machine-learning-capstone",
                "full_name": "univ-cs/machine-learning-capstone",
                "description": "Deep learning models, computer vision pipelines, and transformer evaluation benchmarks.",
                "url": "https://github.com/univ-cs/machine-learning-capstone",
                "language": "Python",
                "stars": 88,
                "forks": 34,
                "open_issues": 7,
                "default_branch": "main"
            },
            {
                "owner": "univ-cs",
                "name": "fullstack-campus-portal",
                "full_name": "univ-cs/fullstack-campus-portal",
                "description": "Modern campus management system with React frontend, GraphQL API, and PostgreSQL.",
                "url": "https://github.com/univ-cs/fullstack-campus-portal",
                "language": "TypeScript",
                "stars": 65,
                "forks": 22,
                "open_issues": 5,
                "default_branch": "main"
            },
            {
                "owner": "univ-cs",
                "name": "compiler-design-project",
                "full_name": "univ-cs/compiler-design-project",
                "description": "Mini-C compiler with LLVM backend, lexer, AST builder, and type checker.",
                "url": "https://github.com/univ-cs/compiler-design-project",
                "language": "C++",
                "stars": 31,
                "forks": 12,
                "open_issues": 2,
                "default_branch": "main"
            },
            {
                "owner": "univ-cs",
                "name": "cloud-native-microservices",
                "full_name": "univ-cs/cloud-native-microservices",
                "description": "Kubernetes helm charts, service meshes, and observability pipelines for academic deployment.",
                "url": "https://github.com/univ-cs/cloud-native-microservices",
                "language": "Rust",
                "stars": 54,
                "forks": 19,
                "open_issues": 3,
                "default_branch": "main"
            }
        ]

        repo_objs = []
        for r_data in sample_repos:
            repo = Repository(**r_data, last_synced_at=datetime.utcnow() - timedelta(hours=2))
            db.add(repo)
            repo_objs.append(repo)
        db.commit()

        # Seed realistic commits, PRs, issues and activity across past 90 days
        commit_messages = [
            "Implement Raft leader election and heartbeat timer",
            "Add automated test suite for distributed key-value store",
            "Optimize ResNet-50 image augmentation pipeline",
            "Fix JWT authentication middleware token expiration",
            "Implement lexer token stream and symbol table",
            "Add responsive sidebar and dark mode switcher",
            "Refactor RPC client connection pool",
            "Add Prometheus metrics exporter and Grafana dashboard",
            "Implement transformer multi-head attention layer",
            "Fix LLVM intermediate code generation memory leak",
            "Add GraphQL schema pagination and query batching",
            "Improve consensus election timeout randomized jitter",
            "Implement student enrollment REST endpoints",
            "Write comprehensive documentation and deployment guide",
            "Fix race condition in log replication state machine"
        ]

        now = datetime.utcnow()

        # Seed student activities
        for idx, student in enumerate(student_objs):
            # Give top students higher commit/PR ratios
            intensity = (len(student_objs) - idx) + 2
            
            for repo in repo_objs:
                num_commits = random.randint(intensity * 2, intensity * 7)
                num_prs = random.randint(1, max(2, intensity))
                num_issues = random.randint(0, max(1, intensity // 2))
                num_reviews = random.randint(1, intensity * 2)

                # Commits
                for c_i in range(num_commits):
                    days_ago = random.randint(1, 85)
                    commit_time = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
                    sha = f"{student.github_username[:4]}{repo.name[:3]}{random.randint(100000, 999999)}{days_ago}"
                    msg = random.choice(commit_messages)
                    
                    commit = Commit(
                        sha=sha,
                        message=msg,
                        author_name=student.name,
                        author_email=student.email,
                        github_username=student.github_username,
                        branch="main",
                        additions=random.randint(15, 250),
                        deletions=random.randint(2, 60),
                        url=f"https://github.com/{repo.full_name}/commit/{sha}",
                        committed_at=commit_time,
                        repository_id=repo.id,
                        student_id=student.id
                    )
                    db.add(commit)

                # Pull Requests
                for pr_i in range(num_prs):
                    days_ago = random.randint(1, 80)
                    pr_time = now - timedelta(days=days_ago)
                    state = "merged" if pr_i % 3 != 0 else "open"
                    merged_time = pr_time + timedelta(hours=random.randint(4, 36)) if state == "merged" else None
                    
                    pr = PullRequest(
                        github_id=random.randint(1000000, 9999999),
                        number=random.randint(10, 150),
                        title=f"Feature: {random.choice(commit_messages).split('Fix ')[-1].split('Implement ')[-1]}",
                        body="This PR implements key requirements discussed in sprint planning with full unit tests.",
                        state=state,
                        github_username=student.github_username,
                        reviewer="Faculty Reviewer",
                        url=f"https://github.com/{repo.full_name}/pull/{pr_i + 1}",
                        created_at=pr_time,
                        merged_at=merged_time,
                        repository_id=repo.id,
                        student_id=student.id
                    )
                    db.add(pr)

                # Issues
                for iss_i in range(num_issues):
                    days_ago = random.randint(1, 75)
                    iss_time = now - timedelta(days=days_ago)
                    state = "closed" if iss_i % 2 == 0 else "open"
                    closed_time = iss_time + timedelta(days=random.randint(1, 5)) if state == "closed" else None

                    issue = Issue(
                        github_id=random.randint(1000000, 9999999),
                        number=random.randint(1, 90),
                        title=f"Bug: {random.choice(commit_messages)}",
                        body="Identified edge condition during stress testing on distributed node clusters.",
                        state=state,
                        github_username=student.github_username,
                        comments_count=random.randint(1, 8),
                        url=f"https://github.com/{repo.full_name}/issues/{iss_i + 1}",
                        created_at=iss_time,
                        closed_at=closed_time,
                        repository_id=repo.id,
                        student_id=student.id
                    )
                    db.add(issue)

                # Contribution summary record
                contrib = Contribution(
                    student_id=student.id,
                    repository_id=repo.id,
                    commits_count=num_commits,
                    prs_count=num_prs,
                    issues_count=num_issues,
                    reviews_count=num_reviews,
                    last_activity_at=now - timedelta(days=random.randint(0, 10))
                )
                db.add(contrib)

            # Seed Activity Logs
            recent_acts = [
                ("commit", f"Pushed {random.randint(2, 6)} commits to {repo_objs[0].name}", "Updated documentation and fixed unit tests"),
                ("pull_request", f"Opened Pull Request in {repo_objs[1].name}", "Implemented deep learning evaluation benchmark"),
                ("review", f"Reviewed Pull Request #42 in {repo_objs[2].name}", "LGTM! Verified error handling and TypeScript types"),
                ("issue", f"Resolved Issue #18 in {repo_objs[3].name}", "Fixed buffer overflow edge case in AST lexer")
            ]

            for a_type, a_title, a_desc in recent_acts:
                act = ActivityLog(
                    activity_type=a_type,
                    title=f"{student.name}: {a_title}",
                    description=a_desc,
                    timestamp=now - timedelta(hours=random.randint(1, 72), minutes=random.randint(0, 59)),
                    url=f"https://github.com/{repo_objs[0].full_name}",
                    student_id=student.id,
                    repository_id=repo_objs[0].id
                )
                db.add(act)

        db.commit()
