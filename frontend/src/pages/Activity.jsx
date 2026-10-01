import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, Badge, Alert, Pagination, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatDate, formatRelativeTime } from '../utils/formatters';
import api from '../services/api';

const Activity = () => {
  const [activities, setActivities] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [activityType, setActivityType] = useState('all');
  const [studentId, setStudentId] = useState('');
  const [repositoryId, setRepositoryId] = useState('');

  const [studentsList, setStudentsList] = useState([]);
  const [reposList, setReposList] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [stRes, rpRes] = await Promise.all([
          api.get('/students'),
          api.get('/repositories')
        ]);
        setStudentsList(stRes.data);
        setReposList(rpRes.data);
      } catch (e) {}
    };
    fetchDropdowns();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (activityType && activityType !== 'all') params.append('activity_type', activityType);
      if (studentId) params.append('student_id', studentId);
      if (repositoryId) params.append('repository_id', repositoryId);

      const res = await api.get(`/activity?${params.toString()}`);
      setActivities(res.data.items || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load activity feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, activityType, studentId, repositoryId]);

  return (
    <div className="pb-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-body mb-1">GitHub Activity Stream</h3>
          <p className="text-muted small mb-0">
            Real-time chronological timeline of commits, pull requests, issue closures, and code reviews.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="card-custom border-0 mb-4">
        <Card.Body className="p-3">
          <Row className="g-3">
            <Col md={4}>
              <Form.Select
                value={activityType}
                onChange={(e) => { setActivityType(e.target.value); setPage(1); }}
              >
                <option value="all">All Activity Types</option>
                <option value="commit">Commits Only</option>
                <option value="pull_request">Pull Requests Only</option>
                <option value="issue">Issues Only</option>
                <option value="review">Code Reviews Only</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Select
                value={studentId}
                onChange={(e) => { setStudentId(e.target.value); setPage(1); }}
              >
                <option value="">All Students</option>
                {studentsList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} (@{s.github_username})</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Select
                value={repositoryId}
                onChange={(e) => { setRepositoryId(e.target.value); setPage(1); }}
              >
                <option value="">All Repositories</option>
                {reposList.map((r) => (
                  <option key={r.id} value={r.id}>{r.full_name}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {loading ? (
        <LoadingSpinner message="Loading GitHub event stream..." />
      ) : activities.length === 0 ? (
        <EmptyState
          icon="bi-lightning-charge"
          title="No Activity Found"
          description="No GitHub events recorded for the selected filter combination."
        />
      ) : (
        <Card className="card-custom border-0 p-4">
          <div className="timeline">
            {activities.map((act) => {
              let badgeBg = 'bg-primary';
              let icon = 'bi-file-code';
              let typeLabel = 'Commit';

              if (act.activity_type === 'pull_request') {
                badgeBg = 'bg-success';
                icon = 'bi-git';
                typeLabel = 'Pull Request';
              } else if (act.activity_type === 'issue') {
                badgeBg = 'bg-danger';
                icon = 'bi-exclamation-circle';
                typeLabel = 'Issue';
              } else if (act.activity_type === 'review') {
                badgeBg = 'bg-info';
                icon = 'bi-chat-left-text';
                typeLabel = 'Review';
              }

              return (
                <div key={act.id} className="timeline-item">
                  <div className={`timeline-badge ${badgeBg}`}>
                    <i className={`bi ${icon}`}></i>
                  </div>
                  <Card className="border bg-light-subtle shadow-sm mb-2">
                    <Card.Body className="p-3">
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                        <div className="d-flex align-items-center gap-2">
                          {act.student_avatar && (
                            <img src={act.student_avatar} alt={act.student_name} className="rounded-circle" width="24" height="24" />
                          )}
                          <span
                            className="fw-bold text-body"
                            style={{ cursor: act.student_id ? 'pointer' : 'default' }}
                            onClick={() => act.student_id && navigate(`/students/${act.student_id}`)}
                          >
                            {act.student_name}
                          </span>
                          {act.github_username && (
                            <small className="text-muted font-monospace">@{act.github_username}</small>
                          )}
                          <Badge bg="light" text="dark" className="border ms-1">
                            {typeLabel}
                          </Badge>
                        </div>
                        <span className="text-muted small">
                          <i className="bi bi-clock me-1"></i>
                          {formatRelativeTime(act.timestamp)} &bull; {formatDate(act.timestamp)}
                        </span>
                      </div>

                      <div className="fw-semibold text-body mb-1">{act.title}</div>
                      {act.description && (
                        <p className="text-muted small mb-2">{act.description}</p>
                      )}

                      <div className="d-flex align-items-center justify-content-between pt-2 border-top small">
                        <span className="text-muted">
                          Repository: <strong>{act.repository_name || 'Academic Repo'}</strong>
                        </span>
                        {act.url && (
                          <a href={act.url} target="_blank" rel="noreferrer" className="text-decoration-none">
                            GitHub Link <i className="bi bi-box-arrow-up-right ms-1"></i>
                          </a>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-between pt-3 border-top mt-3">
              <div className="small text-muted">
                Page {page} of {totalPages} ({total} events)
              </div>
              <Pagination className="mb-0" size="sm">
                <Pagination.Prev disabled={page === 1} onClick={() => setPage(p => p - 1)} />
                <Pagination.Next disabled={page === totalPages} onClick={() => setPage(p => p + 1)} />
              </Pagination>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default Activity;
