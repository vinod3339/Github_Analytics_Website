import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatNumber, formatRelativeTime, getLanguageBadgeColor } from '../utils/formatters';
import api from '../services/api';

const RepositoryDetail = () => {
  const { owner, repo } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRepo = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/repositories/${owner}/${repo}`);
        setData(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load repository details.');
      } finally {
        setLoading(false);
      }
    };
    fetchRepo();
  }, [owner, repo]);

  if (loading) return <LoadingSpinner message="Fetching repository analytics from GitHub..." />;
  if (error || !data) {
    return (
      <Alert variant="danger" className="my-4">
        <h5>Repository Not Found</h5>
        <p>{error || 'The requested repository could not be located.'}</p>
        <Button variant="outline-danger" size="sm" onClick={() => navigate('/repositories')}>
          &larr; Back to Repositories
        </Button>
      </Alert>
    );
  }

  const { repository, stats, branches, contributors, recent_commits } = data;

  return (
    <div className="pb-5">
      {/* Navigation & Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <Button variant="link" size="sm" onClick={() => navigate('/repositories')} className="text-decoration-none ps-0">
          <i className="bi bi-arrow-left me-1"></i> Back to Repositories List
        </Button>
        <a
          href={repository.url}
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"
        >
          <i className="bi bi-github"></i>
          <span>Open on GitHub</span>
        </a>
      </div>

      {/* Repo Summary Card */}
      <Card className="card-custom border-0 mb-4">
        <Card.Body className="p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-folder2-open text-warning fs-3"></i>
                <h3 className="fw-bold text-body mb-0">{repository.full_name}</h3>
                <Badge className={getLanguageBadgeColor(repository.language)}>{repository.language}</Badge>
              </div>
              <p className="text-muted mb-3" style={{ maxWidth: '650px' }}>
                {repository.description || 'No description provided for this repository.'}
              </p>
              <div className="d-flex flex-wrap gap-3 small text-muted">
                <span><i className="bi bi-star-fill text-warning me-1"></i> {formatNumber(repository.stars)} Stars</span>
                <span><i className="bi bi-diagram-2 text-primary me-1"></i> {formatNumber(repository.forks)} Forks</span>
                <span><i className="bi bi-git me-1"></i> Default Branch: <code>{repository.default_branch}</code></span>
                <span><i className="bi bi-clock-history me-1"></i> Synced: {formatRelativeTime(repository.last_synced_at)}</span>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* 4 Quick Stat Cards */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <StatCard title="Total Commits" value={stats.total_commits} icon="bi-file-earmark-code" color="primary" />
        </Col>
        <Col xs={6} md={3}>
          <StatCard title="Pull Requests" value={stats.total_prs} icon="bi-git" color="success" subtitle={`${stats.open_prs} Open, ${stats.merged_prs} Merged`} />
        </Col>
        <Col xs={6} md={3}>
          <StatCard title="Issues" value={stats.total_issues} icon="bi-exclamation-circle" color="danger" subtitle={`${stats.open_issues} Open, ${stats.closed_issues} Closed`} />
        </Col>
        <Col xs={6} md={3}>
          <StatCard title="Contributors" value={stats.total_contributors} icon="bi-people" color="info" />
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        {/* Contributors Table */}
        <Col lg={7}>
          <Card className="card-custom border-0 h-100">
            <Card.Header className="bg-transparent border-bottom py-3">
              <span className="fw-bold text-body">Repository Contributors & Activity</span>
            </Card.Header>
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Contributor</th>
                    <th className="text-center">Commits</th>
                    <th className="text-center">PRs</th>
                    <th className="text-center">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {contributors.map((c) => (
                    <tr
                      key={c.github_username}
                      style={{ cursor: c.student_id ? 'pointer' : 'default' }}
                      onClick={() => c.student_id && navigate(`/students/${c.student_id}`)}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img src={c.avatar_url} alt={c.name} className="rounded-circle" width="30" height="30" />
                          <div>
                            <div className="fw-semibold text-body">{c.name}</div>
                            <small className="text-muted">@{c.github_username}</small>
                          </div>
                        </div>
                      </td>
                      <td className="text-center font-monospace fw-bold text-primary">{c.commits}</td>
                      <td className="text-center font-monospace">{c.prs}</td>
                      <td className="text-center font-monospace">{c.issues}</td>
                    </tr>
                  ))}
                  {contributors.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted">
                        No contributor data recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </Col>

        {/* Branches & Repo Info */}
        <Col lg={5}>
          <Card className="card-custom border-0 mb-4">
            <Card.Header className="bg-transparent border-bottom py-3">
              <span className="fw-bold text-body">Branches ({branches.length})</span>
            </Card.Header>
            <Card.Body className="p-3">
              <div className="d-flex flex-wrap gap-2">
                {branches.map((b) => (
                  <Badge key={b} bg="light" text="dark" className="border font-monospace py-2 px-3">
                    <i className="bi bi-bezier2 me-1 text-primary"></i> {b}
                  </Badge>
                ))}
              </div>
            </Card.Body>
          </Card>

          <Card className="card-custom border-0">
            <Card.Header className="bg-transparent border-bottom py-3">
              <span className="fw-bold text-body">Pull Request Status</span>
            </Card.Header>
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small text-muted">Open PRs</span>
                <Badge bg="success">{stats.open_prs}</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small text-muted">Merged PRs</span>
                <Badge bg="purple" style={{ backgroundColor: '#9333ea' }}>{stats.merged_prs}</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="small text-muted">Closed PRs</span>
                <Badge bg="secondary">{stats.closed_prs}</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Commits in Repo */}
      <Card className="card-custom border-0">
        <Card.Header className="bg-transparent border-bottom py-3">
          <span className="fw-bold text-body">Recent Commits</span>
        </Card.Header>
        <div className="table-responsive">
          <Table hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '120px' }}>SHA</th>
                <th>Message</th>
                <th>Author</th>
                <th>Branch</th>
                <th className="text-end">Committed At</th>
              </tr>
            </thead>
            <tbody>
              {recent_commits.map((c) => (
                <tr key={c.sha}>
                  <td>
                    <span className="badge font-monospace bg-light text-dark border">{c.sha.slice(0, 8)}</span>
                  </td>
                  <td className="fw-medium text-body">{c.message}</td>
                  <td>{c.author}</td>
                  <td><Badge bg="secondary-subtle" className="text-body font-monospace">{c.branch}</Badge></td>
                  <td className="text-end small text-muted">{formatRelativeTime(c.committed_at)}</td>
                </tr>
              ))}
              {recent_commits.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    No commits recorded in this repository.
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

export default RepositoryDetail;
