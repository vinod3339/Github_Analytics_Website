# GitHub Tracking & Analytics Dashboard

A modern, production-grade web application tailored for faculty and university administrators to monitor, analyze, and rank student software engineering contributions across GitHub repositories.

---

## 🌟 Highlights & Features

- **Dynamic GitHub Activity Score**: Transparent academic ranking formula that evaluates code additions, pull requests, bug issues, peer code reviews, repository diversity, and contribution consistency.
- **Direct GitHub REST API Integration**: Communicates securely with GitHub API via backend proxy, supporting live data synchronization and rate-limit monitoring (5,000 req/hr with PAT).
- **Interactive Multi-Chart Analytics**: Powered by Recharts (Monthly Activity Line Chart, Language Distribution Pie Chart, Top Student Comparison Bar Chart, and Cumulative Trend Area Chart).
- **Complete Cohort Management**: Comprehensive student registration with automatic GitHub profile avatar resolution and per-student analytics dossiers.
- **Repository Management**: Track public and private GitHub repositories with automated commit logging, PR lifecycle tracking, and branch inspection.
- **Activity Stream Timeline**: Real-time chronological audit trail of all student engineering events.
- **Universal Data Export**: One-click export of rankings, students, repositories, commits, PRs, and issues in both **CSV** and **Excel (.xlsx)** formats.
- **Enterprise Security**: JWT authentication (HS256), Bcrypt password hashing, backend-only secret management, and CORS protection.
- **Light & Dark Mode**: Professional academic interface with Bootstrap 5 themes.

---

## 🏗️ Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   React 18 Frontend                    │
│   (Vite + React Bootstrap + Recharts + Bootstrap Icons) │
└───────────────────────────┬────────────────────────────┘
                            │ Axios (JWT Bearer Token)
                            ▼
┌────────────────────────────────────────────────────────┐
│                    FastAPI Backend                     │
│      (Python 3.12 + SQLAlchemy ORM + Pydantic v2)      │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼                            ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│      SQLite Database      │ │     GitHub REST API      │
│ (Persistent Local Store)  │ │ (api.github.com / Token) │
└───────────────────────────┘ └──────────────────────────┘
```

---

## 📁 Folder Structure

```text
github-tracking/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ExportButton.jsx
│   │   │   ├── GlobalSearchModal.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── RankingMethodologyModal.jsx
│   │   │   ├── RateLimitWidget.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── StatCard.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── hooks/
│   │   │   └── useAsync.js
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx
│   │   ├── pages/
│   │   │   ├── Activity.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Commits.jsx
│   │   │   ├── Contributors.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Issues.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── PullRequests.jsx
│   │   │   ├── Rankings.jsx
│   │   │   ├── Repositories.jsx
│   │   │   ├── RepositoryDetail.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── StudentProfile.jsx
│   │   │   └── Students.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   ├── exportUtils.js
│   │   │   └── formatters.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── activity.py
│   │   │   ├── analytics.py
│   │   │   ├── auth.py
│   │   │   ├── commits.py
│   │   │   ├── contributors.py
│   │   │   ├── dashboard.py
│   │   │   ├── export.py
│   │   │   ├── github.py
│   │   │   ├── issues.py
│   │   │   ├── pull_requests.py
│   │   │   ├── rankings.py
│   │   │   ├── repositories.py
│   │   │   ├── search.py
│   │   │   ├── settings.py
│   │   │   └── students.py
│   │   ├── analytics_service.py
│   │   ├── auth.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── github_service.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── seed_data.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
│
├── README.md
└── .gitignore
```

---

## ⚙️ Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- *(Optional)* **GitHub Personal Access Token (PAT)** for extended API rate limits (5,000 req/hr).

---

## 🚀 Quick Start Guide

### 1. Backend Setup

Open a terminal in the `backend/` directory:

```bash
cd backend

# 1. Create Python virtual environment
python -m venv venv

# 2. Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux / macOS:
# source venv/bin/activate

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. (Optional) Configure environment variables
# Copy .env.example to .env
copy .env.example .env

# 5. Start the FastAPI development server
uvicorn app.main:app --reload --port 8000
```

- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Documentation**: `http://localhost:8000/docs`
- **Alternative ReDoc**: `http://localhost:8000/redoc`

### 2. Frontend Setup

In a new terminal, navigate to `frontend/`:

```bash
cd frontend

# 1. Install frontend dependencies
npm install

# 2. Launch Vite development server
npm run dev
```

- **Frontend Portal**: `http://localhost:5173`

---

## 🔑 Default Administrator Credentials

When launching the application for the first time, a default administrator account is seeded automatically:

- **Username**: `admin`
- **Password**: `admin123`
- *(You can also click "Auto-fill Demo Admin" on the login screen for instant access).*

---

## 🔐 GitHub Token Configuration

To track private repositories and avoid the 60 request/hour public rate limit:

1. Generate a GitHub Personal Access Token at [GitHub Token Settings](https://github.com/settings/tokens) with `repo` and `read:user` permissions.
2. In the application:
   - Navigate to **Settings** (`/settings`) from the sidebar.
   - Enter your token under **GitHub API Authentication** and click **Update GitHub Token**.
   - Alternatively, add it directly to `backend/.env`:
     ```env
     GITHUB_TOKEN="ghp_yourPersonalAccessTokenHere"
     ```
3. The dashboard rate limit widget will immediately update to show **5,000 remaining requests**.

---

## 🏆 Ranking Scoring Methodology

The GitHub Activity Score evaluates student engineering performance using a normalized multi-criteria formula:

$$\text{Activity Score} = \sum_{i=1}^{6} (\text{Norm}(C_i) \times W_i)$$

### Default Weights:
- **Commits ($W_1 = 30\%$)**: Volume of code additions, feature implementations, and bug fixes.
- **Pull Requests ($W_2 = 20\%$)**: Collaboration, branching discipline, and merged code.
- **Issues ($W_3 = 10\%$)**: Problem reporting, design discussions, and task tracking.
- **Code Reviews ($W_4 = 15\%$)**: Peer review engagement, pull request approvals, and feedback.
- **Repository Scope ($W_5 = 15\%$)**: Breadth of involvement across different course modules.
- **Consistency ($W_6 = 10\%$)**: Distinct active days with commits over the evaluated time window.

Each raw score is normalized relative to cohort maximums:

$$\text{Norm}(C_i) = \left( \frac{\text{Value}}{\text{Max Value in Cohort}} \right) \times 100$$

*(Weights are fully adjustable in the Settings panel by administrators).*

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT access token |
| `GET` | `/api/dashboard/summary` | Retrieve summary counters and rate limit status |
| `GET` | `/api/dashboard/overview` | Retrieve full dashboard package with top 10 & charts |
| `GET` | `/api/students` | List all students with search and calculated metrics |
| `POST` | `/api/students` | Register a new student |
| `GET` | `/api/students/{id}` | Retrieve individual student portfolio & 6-month evolution |
| `PUT` | `/api/students/{id}` | Update student details |
| `DELETE` | `/api/students/{id}` | Remove a student record |
| `GET` | `/api/repositories` | List tracked GitHub repositories |
| `POST` | `/api/repositories` | Track a new repository via GitHub REST API |
| `GET` | `/api/repositories/{owner}/{repo}` | Detailed repository analytics, branches, and contributors |
| `DELETE` | `/api/repositories/{id}` | Delete a tracked repository |
| `GET` | `/api/commits` | Filterable commits log with pagination |
| `GET` | `/api/pull-requests` | Pull requests log with status counts |
| `GET` | `/api/issues` | Bug reports and issue tracker |
| `GET` | `/api/contributors` | Contributor leaderboards |
| `GET` | `/api/rankings` | Dynamic weighted rankings with flexible date ranges |
| `GET` | `/api/rankings/methodology` | Detailed explanation of scoring weights |
| `GET` | `/api/activity` | Chronological activity event feed |
| `GET` | `/api/analytics` | Statistical chart data (monthly cadence, languages, trends) |
| `GET` | `/api/export/{data_type}` | Export data as CSV or Excel (`?format=csv` or `?format=excel`) |
| `GET` | `/api/github/rate-limit` | Check real-time GitHub REST API rate limits |
| `POST` | `/api/github/sync` | Trigger on-demand sync from GitHub REST API |
| `GET` | `/api/search` | Global search across students, repos, commits, PRs, and issues |
| `GET` | `/api/settings` | Retrieve active ranking weights and system info |
| `PUT` | `/api/settings/weights` | Update ranking component weights |
| `PUT` | `/api/settings/github-token` | Update backend GitHub Personal Access Token |

---

## 🧪 Testing Checklist

- [x] **Backend Authentication**: Login with `admin` / `admin123` returns valid JWT token.
- [x] **Protected Routes**: Unauthenticated requests redirect automatically to `/login`.
- [x] **Dashboard Metrics**: Summary cards display total students, repos, commits, PRs, issues, and contributors.
- [x] **Top Performers**: Top 3 Gold 🥇, Silver 🥈, Bronze 🥉 cards render distinct badges with normalized score metrics.
- [x] **Dynamic Ranking**: Filter by Today, Last 7 Days, 30 Days, 3 Months, Semester, or Custom Date Range.
- [x] **Student Management**: Add, Edit, and Delete student records with validation.
- [x] **Repository Tracking**: Track repositories using `owner/repo` or full URL; syncs data from GitHub REST API.
- [x] **Global Search**: `Ctrl+K` or search bar returns instant multi-entity results.
- [x] **Export System**: CSV and Excel downloads for rankings, students, repos, commits, PRs, and issues.
- [x] **Responsive UI & Themes**: Light and Dark mode toggle seamlessly with Bootstrap 5.
