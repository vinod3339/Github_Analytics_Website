import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, ProgressBar } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getRankBadge, getLanguageBadgeColor } from '../utils/formatters';
import api from '../services/api';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/students/${id}`);
        setProfile(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load student profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading student portfolio & analytics..." />;
  if (error || !profile) {
    return (
      <Alert variant="danger" className="my-4">
        <h5>Student Not Found</h5>
        <p>{error || 'The requested student could not be located.'}</p>
        <Button variant="outline-danger" size="sm" onClick={() => navigate('/students')}>
          &larr; Back to Students Cohort
        </Button>
      </Alert>
    );
  }

  const { student, stats, repository_contributions, timeline_data } = profile;
  const rankBadge = stats.rank ? getRankBadge(stats.rank) : null;
  const normalized = stats.normalized_scores || {};

  return (
    <div className="pb-5">
      {/* Back button & Breadcrumb */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <Button variant="link" size="sm" onClick={() => navigate('/students')} className="text-decoration-none ps-0">
          <i className="bi bi-arrow-left me-1"></i> Back to Student Cohort
        </Button>
        <a
          href={`https://github.com/${student.github_username}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"
        >
          <i className="bi bi-github"></i>
          <span>View on GitHub</span>
        </a>
      </div>

      {/* Student Profile Header Card */}
      <Card className="card-custom border-0 mb-4">
        <Card.Body className="p-4">
          <Row className="g-4 align-items-center">
            <Col md="auto" className="text-center">
              <div className="position-relative d-inline-block">
                <img
                  src={student.avatar_url}
                  alt={student.name}
                  className="rounded-circle shadow-sm border border-3 border-primary"
                  width="100"
                  height="100"
                />
                {rankBadge && (
                  <span className="position-absolute bottom-0 end-0 fs-4">{rankBadge.medal}</span>
                )}
              </div>
            </Col>
            <Col md>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                <h3 className="fw-bold text-body mb-0">{student.name}</h3>
                {rankBadge && <span className={rankBadge.className}>{rankBadge.label}</span>}
              </div>
              <p className="text-muted mb-2">
                <span className="font-monospace">@{student.github_username}</span> &bull; <span>{student.email}</span>
              </p>
              <div className="d-flex flex-wrap gap-2 small text-muted">
                <Badge bg="light" text="dark" className="border">
                  <i className="bi bi-card-text me-1"></i> {student.student_id}
                </Badge>
                <Badge bg="light" text="dark" className="border">
                  <i className="bi bi-building me-1"></i> {student.department}
                </Badge>
                <Badge bg="light" text="dark" className="border">
                  <i className="bi bi-calendar3 me-1"></i> Batch {student.batch}
                </Badge>
              </div>
            </Col>
            <Col md="auto" className="text-md-end border-md-start ps-md-4">
              <div className="text-muted small text-uppercase fw-semibold">GitHub Activity Score</div>
              <div className="display-5 fw-bold text-primary my-1">{stats.score}</div>
              <div className="text-muted small">Cohort Rank #{stats.rank || 'N/A'}</div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Key Metric Cards */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <StatCard title="Total Commits" value={stats.total_commits} icon="bi-file-earmark-code" color="primary" />
        </Col>
        <Col xs={6} md={3}>
          <StatCard title="Pull Requests" value={stats.total_prs} icon="bi-git" color="success" />
        </Col>
        <Col xs={6} md={3}>
          <StatCard title="Issues Resolved" value={stats.total_issues} icon="bi-exclamation-circle" color="warning" />
        </Col>
        <Col xs={6} md={3}>
          <StatCard title="Repositories" value={stats.total_repositories} icon="bi-folder2" color="purple" />
        </Col>
      </Row>

      {/* Component Breakdown & Timeline Charts */}
      <Row className="g-4 mb-4">
        {/* Component Score Progress Bars */}
        <Col lg={5}>
          <Card className="card-custom border-0 h-100">
            <Card.Header className="bg-transparent border-bottom py-3">
              <span className="fw-bold text-body">Scoring Dimension Breakdown</span>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="mb-3">
                <div className="d-flex justify-content-between small mb-1">
                  <span>Commits Contribution</span>
                  <span className="fw-bold font-monospace">{normalized.commits || 0}%</span>
                </div>
                <ProgressBar now={normalized.commits || 0} variant="primary" style={{ height: '7px' }} />
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between small mb-1">
                  <span>Pull Requests</span>
                  <span className="fw-bold font-monospace">{normalized.pull_requests || 0}%</span>
                </div>
                <ProgressBar now={normalized.pull_requests || 0} variant="success" style={{ height: '7px' }} />
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between small mb-1">
                  <span>Issues Engagement</span>
                  <span className="fw-bold font-monospace">{normalized.issues || 0}%</span>
                </div>
                <ProgressBar now={normalized.issues || 0} variant="warning" style={{ height: '7px' }} />
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between small mb-1">
                  <span>Code Reviews & Mentorship</span>
                  <span className="fw-bold font-monospace">{normalized.reviews || 0}%</span>
                </div>
                <ProgressBar now={normalized.reviews || 0} variant="info" style={{ height: '7px' }} />
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between small mb-1">
                  <span>Repository Breadth</span>
                  <span className="fw-bold font-monospace">{normalized.repositories || 0}%</span>
                </div>
                <ProgressBar now={normalized.repositories || 0} variant="secondary" style={{ height: '7px' }} />
              </div>

              <div>
                <div className="d-flex justify-content-between small mb-1">
                  <span>Contribution Consistency</span>
                  <span className="fw-bold font-monospace">{normalized.consistency || 0}%</span>
                </div>
                <ProgressBar now={normalized.consistency || 0} variant="dark" style={{ height: '7px' }} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* 6-Month Timeline Chart */}
        <Col lg={7}>
          <Card className="card-custom border-0 h-100">
            <Card.Header className="bg-transparent border-bottom py-3">
              <span className="fw-bold text-body">6-Month Activity Evolution</span>
            </Card.Header>
            <Card.Body className="p-3">
              <div style={{ width: '100%', height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeline_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="commits" name="Commits" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pull_requests" name="Pull Requests" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="issues" name="Issues" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Repository-wise contribution breakdown */}
      <Card className="card-custom border-0">
        <Card.Header className="bg-transparent border-bottom py-3">
          <span className="fw-bold text-body">Repository-Wise Contribution Breakdown</span>
        </Card.Header>
        <div className="table-responsive">
          <Table hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Repository</th>
                <th>Language</th>
                <th className="text-center">Commits</th>
                <th className="text-center">Pull Requests</th>
                <th className="text-center">Issues</th>
                <th className="text-end">Contribution Score</th>
              </tr>
            </thead>
            <tbody>
              {repository_contributions.map((r) => (
                <tr
                  key={r.repository_id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/repositories/${r.full_name}`)}
                >
                  <td>
                    <div className="fw-semibold text-primary">{r.full_name}</div>
                  </td>
                  <td>
                    <Badge className={getLanguageBadgeColor(r.language)}>{r.language}</Badge>
                  </td>
                  <td className="text-center font-monospace">{r.commits}</td>
                  <td className="text-center font-monospace">{r.pull_requests}</td>
                  <td className="text-center font-monospace">{r.issues}</td>
                  <td className="text-end font-monospace fw-bold text-success">{r.score}</td>
                </tr>
              ))}
              {repository_contributions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    No repository contributions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default StudentProfile;
