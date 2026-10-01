import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert } from 'react-bootstrap';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import StatCard from '../components/StatCard';
import RateLimitWidget from '../components/RateLimitWidget';
import RankingMethodologyModal from '../components/RankingMethodologyModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ExportButton from '../components/ExportButton';
import { formatNumber, formatRelativeTime, getRankBadge } from '../utils/formatters';
import api from '../services/api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMethodology, setShowMethodology] = useState(false);
  
  const navigate = useNavigate();
  const context = useOutletContext();
  const syncVersion = context?.syncVersion || 0;

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/overview');
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [syncVersion]);

  if (loading && !data) {
    return <LoadingSpinner message="Aggregating GitHub analytics and metrics..." />;
  }

  if (error) {
    return (
      <Alert variant="danger" className="d-flex align-items-center justify-content-between p-4 my-4">
        <div>
          <h5 className="alert-heading fw-bold mb-1">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>Dashboard Sync Error
          </h5>
          <p className="mb-0">{error}</p>
        </div>
        <Button variant="outline-danger" onClick={fetchDashboardData}>
          <i className="bi bi-arrow-clockwise me-1"></i> Retry
        </Button>
      </Alert>
    );
  }

  const summary = data?.summary || {};
  const topPerformers = data?.top_performers || [];
  const top3 = topPerformers.slice(0, 3);
  const restTop = topPerformers.slice(3, 10);
  const monthlyActivity = data?.analytics?.monthly_activity || [];
  const repoActivity = data?.analytics?.repository_activity || [];
  const recentActs = data?.recent_activities || [];

  return (
    <div className="pb-5">
      {/* Top Header Banner */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-body mb-1">GitHub Tracking & Analytics</h3>
          <p className="text-muted small mb-0">
            Real-time GitHub academic monitoring, dynamic student ranking, and repository metrics.
          </p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <Button
            variant="success"
            size="sm"
            onClick={() => navigate('/students/register')}
            className="d-flex align-items-center gap-2"
          >
            <i className="bi bi-person-plus-fill"></i>
            <span>Register Student & Sync</span>
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setShowMethodology(true)}
            className="d-flex align-items-center gap-2"
          >
            <i className="bi bi-info-circle"></i>
            <span>Scoring Formula</span>
          </Button>
          <ExportButton dataType="rankings" label="Export Rankings" size="sm" />
        </div>
      </div>

      {/* 6 Top Summary Stat Cards */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={4} xl={2}>
          <StatCard
            title="Students"
            value={summary.total_students}
            icon="bi-mortarboard"
            color="primary"
            onClick={() => navigate('/students')}
          />
        </Col>
        <Col xs={6} md={4} xl={2}>
          <StatCard
            title="Repositories"
            value={summary.total_repositories}
            icon="bi-folder2"
            color="warning"
            onClick={() => navigate('/repositories')}
          />
        </Col>
        <Col xs={6} md={4} xl={2}>
          <StatCard
            title="Commits"
            value={summary.total_commits}
            icon="bi-file-earmark-code"
            color="success"
            onClick={() => navigate('/commits')}
          />
        </Col>
        <Col xs={6} md={4} xl={2}>
          <StatCard
            title="Pull Requests"
            value={summary.total_pull_requests}
            icon="bi-git"
            color="purple"
            onClick={() => navigate('/pull-requests')}
          />
        </Col>
        <Col xs={6} md={4} xl={2}>
          <StatCard
            title="Issues"
            value={summary.total_issues}
            icon="bi-exclamation-circle"
            color="danger"
            onClick={() => navigate('/issues')}
          />
        </Col>
        <Col xs={6} md={4} xl={2}>
          <StatCard
            title="Contributors"
            value={summary.total_contributors}
            icon="bi-people"
            color="info"
            onClick={() => navigate('/contributors')}
          />
        </Col>
      </Row>

      {/* API Rate Limit & Activity Summary Bar */}
      <Row className="g-3 mb-4">
        <Col lg={7}>
          <RateLimitWidget rateLimit={summary.rate_limit} onRefresh={fetchDashboardData} />
        </Col>
        <Col lg={5}>
          <Card className="card-custom border-0 h-100">
            <Card.Body className="p-3 p-lg-4 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="fw-bold text-body">Data Synchronization</span>
                  <Badge bg="info-subtle" className="text-info">Live Sync</Badge>
                </div>
                <div className="small text-muted mb-3">
                  Last database sync:{' '}
                  <span className="fw-semibold text-body">
                    {summary.last_synced_at ? formatRelativeTime(summary.last_synced_at) : 'Just now'}
                  </span>
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                <span className="small text-muted">Tracking {summary.total_repositories} GitHub repositories</span>
                <Button variant="link" size="sm" onClick={() => navigate('/repositories')} className="p-0 text-decoration-none">
                  Manage Repos &rarr;
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* TOP GITHUB CONTRIBUTORS SECTION */}
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-trophy-fill text-warning fs-5"></i>
            <h5 className="fw-bold text-body mb-0">Top GitHub Contributors</h5>
          </div>
          <Button variant="link" size="sm" onClick={() => navigate('/rankings')} className="text-decoration-none">
            View All Cohort Rankings &rarr;
          </Button>
        </div>

        {/* Top 3 Distinct Highlight Cards */}
        <Row className="g-3 mb-3">
          {top3.map((student, idx) => {
            const rankClass = idx === 0 ? 'rank-card-gold' : idx === 1 ? 'rank-card-silver' : 'rank-card-bronze';
            const badge = getRankBadge(idx + 1);

            return (
              <Col md={4} key={student.student_id}>
                <Card
                  className={`card-custom h-100 ${rankClass}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/students/${student.student_id}`)}
                >
                  <Card.Body className="p-4 text-center">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className={badge.className}>{badge.label}</span>
                      <Badge bg="dark" className="font-monospace fs-6">
                        Score: {student.score}
                      </Badge>
                    </div>

                    <div className="my-3 position-relative d-inline-block">
                      <img
                        src={student.avatar_url}
                        alt={student.student_name}
                        className="rounded-circle shadow-sm border border-2 border-white"
                        width="76"
                        height="76"
                      />
                      <span className="position-absolute bottom-0 end-0 fs-5">{badge.medal}</span>
                    </div>

                    <h5 className="fw-bold text-body mb-1">{student.student_name}</h5>
                    <p className="text-muted small mb-3">@{student.github_username}</p>

                    <Row className="g-2 pt-2 border-top small text-muted">
                      <Col xs={4}>
                        <div className="fw-bold text-body">{student.commits}</div>
                        <div>Commits</div>
                      </Col>
                      <Col xs={4}>
                        <div className="fw-bold text-body">{student.pull_requests}</div>
                        <div>PRs</div>
                      </Col>
                      <Col xs={4}>
                        <div className="fw-bold text-body">{student.issues}</div>
                        <div>Issues</div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Ranks 4-10 Mini Cards / Table */}
        {restTop.length > 0 && (
          <Card className="card-custom border-0">
            <Card.Header className="bg-transparent border-bottom py-3">
              <span className="fw-semibold text-body small text-uppercase">Top Performers (Ranks 4 - 10)</span>
            </Card.Header>
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '80px' }}>Rank</th>
                    <th>Student</th>
                    <th className="text-center">Commits</th>
                    <th className="text-center">PRs</th>
                    <th className="text-center">Issues</th>
                    <th className="text-center">Reviews</th>
                    <th className="text-end">Activity Score</th>
                  </tr>
                </thead>
                <tbody>
                  {restTop.map((s) => (
                    <tr
                      key={s.student_id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/students/${s.student_id}`)}
                    >
                      <td>
                        <Badge bg="secondary" className="px-2 py-1">Rank {s.rank}</Badge>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img src={s.avatar_url} alt={s.student_name} className="rounded-circle" width="30" height="30" />
                          <div>
                            <div className="fw-semibold text-body">{s.student_name}</div>
                            <small className="text-muted">@{s.github_username}</small>
                          </div>
                        </div>
                      </td>
                      <td className="text-center font-monospace">{s.commits}</td>
                      <td className="text-center font-monospace">{s.pull_requests}</td>
                      <td className="text-center font-monospace">{s.issues}</td>
                      <td className="text-center font-monospace">{s.reviews}</td>
                      <td className="text-end font-monospace fw-bold text-primary">{s.score}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* ACTIVITY ANALYTICS & RECENT ACTIVITY FEED */}
      <Row className="g-4 mb-4">
        {/* Monthly Activity Area Chart */}
        <Col lg={7}>
          <Card className="card-custom border-0 h-100">
            <Card.Header className="bg-transparent border-bottom py-3 d-flex align-items-center justify-content-between">
              <span className="fw-bold text-body">Cohort Activity Trend (Last 6 Months)</span>
              <Button variant="link" size="sm" onClick={() => navigate('/analytics')} className="p-0 text-decoration-none">
                Detailed Analytics &rarr;
              </Button>
            </Card.Header>
            <Card.Body className="p-3">
              <div style={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPRs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="commits" name="Commits" stroke="#2563eb" fillOpacity={1} fill="url(#colorCommits)" />
                    <Area type="monotone" dataKey="pull_requests" name="Pull Requests" stroke="#10b981" fillOpacity={1} fill="url(#colorPRs)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Activity Feed */}
        <Col lg={5}>
          <Card className="card-custom border-0 h-100">
            <Card.Header className="bg-transparent border-bottom py-3 d-flex align-items-center justify-content-between">
              <span className="fw-bold text-body">Recent GitHub Activity</span>
              <Button variant="link" size="sm" onClick={() => navigate('/activity')} className="p-0 text-decoration-none">
                Full Feed &rarr;
              </Button>
            </Card.Header>
            <Card.Body className="p-3 overflow-auto" style={{ maxHeight: '320px' }}>
              <div className="timeline">
                {recentActs.map((act) => {
                  let badgeBg = 'bg-primary';
                  let icon = 'bi-file-code';
                  if (act.activity_type === 'pull_request') {
                    badgeBg = 'bg-success';
                    icon = 'bi-git';
                  } else if (act.activity_type === 'issue') {
                    badgeBg = 'bg-danger';
                    icon = 'bi-exclamation-circle';
                  } else if (act.activity_type === 'review') {
                    badgeBg = 'bg-info';
                    icon = 'bi-chat-left-text';
                  }

                  return (
                    <div key={act.id} className="timeline-item">
                      <div className={`timeline-badge ${badgeBg}`}>
                        <i className={`bi ${icon}`}></i>
                      </div>
                      <div className="d-flex justify-content-between align-items-baseline">
                        <span className="fw-semibold text-body small">{act.title}</span>
                        <span className="text-muted small" style={{ fontSize: '0.7rem' }}>
                          {formatRelativeTime(act.timestamp)}
                        </span>
                      </div>
                      {act.description && (
                        <div className="text-muted small text-truncate mt-1">{act.description}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* REPOSITORY PERFORMANCE OVERVIEW TABLE */}
      <Card className="card-custom border-0">
        <Card.Header className="bg-transparent border-bottom py-3 d-flex align-items-center justify-content-between">
          <span className="fw-bold text-body">Tracked Repository Performance</span>
          <Button variant="outline-primary" size="sm" onClick={() => navigate('/repositories')}>
            Manage Repositories
          </Button>
        </Card.Header>
        <div className="table-responsive">
          <Table hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Repository</th>
                <th>Language</th>
                <th className="text-center">Stars / Forks</th>
                <th className="text-center">Commits</th>
                <th className="text-center">PRs</th>
                <th className="text-center">Issues</th>
                <th className="text-center">Contributors</th>
              </tr>
            </thead>
            <tbody>
              {repoActivity.map((r) => (
                <tr
                  key={r.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/repositories/${r.full_name}`)}
                >
                  <td>
                    <div className="fw-bold text-primary">{r.full_name}</div>
                  </td>
                  <td>
                    <Badge bg="secondary-subtle" className="text-body">{r.language}</Badge>
                  </td>
                  <td className="text-center small">
                    ⭐ {r.stars} &nbsp; 🍴 {r.forks}
                  </td>
                  <td className="text-center font-monospace">{formatNumber(r.commits)}</td>
                  <td className="text-center font-monospace">{r.pull_requests}</td>
                  <td className="text-center font-monospace">{r.issues}</td>
                  <td className="text-center font-monospace fw-bold">{r.contributors}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>

      <RankingMethodologyModal
        show={showMethodology}
        onHide={() => setShowMethodology(false)}
        weights={data?.weights}
      />
    </div>
  );
};

export default Dashboard;
