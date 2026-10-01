import React, { useState, useEffect } from 'react';
import { Card, Table, Form, InputGroup, Row, Col, Badge, Alert, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ExportButton from '../components/ExportButton';
import { formatDate } from '../utils/formatters';
import api from '../services/api';

const PullRequests = () => {
  const [prs, setPRs] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, merged: 0, closed: 0 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [repositoryId, setRepositoryId] = useState('');
  const [reposList, setReposList] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await api.get('/repositories');
        setReposList(res.data);
      } catch (e) {
        console.error('Error fetching repositories list:', e);
      }
    };
    fetchRepos();
  }, []);

  const fetchPRs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);
      if (statusFilter && statusFilter !== 'all') params.append('status_filter', statusFilter);
      if (repositoryId) params.append('repository_id', repositoryId);

      const res = await api.get(`/pull-requests?${params.toString()}`);
      setPRs(res.data.items || []);
      setStats(res.data.stats || { total: 0, open: 0, merged: 0, closed: 0 });
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch pull requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPRs();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, search, statusFilter, repositoryId]);

  return (
    <div className="pb-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-body mb-1">Pull Requests Analysis</h3>
          <p className="text-muted small mb-0">
            Track student feature branching, peer reviews, merged work, and collaboration quality.
          </p>
        </div>
        <ExportButton dataType="pull_requests" label="Export PRs" size="sm" />
      </div>

      {/* 4 PR Status Stat Cards */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <StatCard title="Total PRs" value={stats.total} icon="bi-git" color="primary" />
        </Col>
        <Col xs={6} md={3}>
          <StatCard title="Open PRs" value={stats.open} icon="bi-record-circle" color="success" />
        </Col>
        <Col xs={6} md={3}>
          <StatCard title="Merged PRs" value={stats.merged} icon="bi-check-all" color="purple" />
        </Col>
        <Col xs={6} md={3}>
          <StatCard title="Closed PRs" value={stats.closed} icon="bi-x-circle" color="danger" />
        </Col>
      </Row>

      {/* Filter Toolbar */}
      <Card className="card-custom border-0 mb-4">
        <Card.Body className="p-3">
          <Row className="g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-transparent">
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Search PR title, author, or username..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="shadow-none border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="all">All PR Statuses</option>
                <option value="open">Open Only</option>
                <option value="merged">Merged Only</option>
                <option value="closed">Closed Only</option>
              </Form.Select>
            </Col>
            <Col md={3}>
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
        <LoadingSpinner message="Filtering and loading pull requests..." />
      ) : prs.length === 0 ? (
        <EmptyState
          icon="bi-git"
          title="No Pull Requests Found"
          description="No pull requests match the selected filters."
        />
      ) : (
        <Card className="card-custom border-0">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '90px' }}>PR #</th>
                  <th>Title</th>
                  <th>Student Author</th>
                  <th>Repository</th>
                  <th className="text-center">Status</th>
                  <th>Reviewer</th>
                  <th className="text-end">Created Date</th>
                </tr>
              </thead>
              <tbody>
                {prs.map((p) => {
                  let badgeBg = 'bg-success';
                  if (p.state === 'merged') badgeBg = 'bg-purple text-white';
                  else if (p.state === 'closed') badgeBg = 'bg-secondary';

                  return (
                    <tr key={p.id}>
                      <td className="font-monospace fw-bold text-body">#{p.number}</td>
                      <td>
                        <div className="fw-semibold text-body">{p.title}</div>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noreferrer" className="text-muted small text-decoration-none">
                            <i className="bi bi-box-arrow-up-right me-1"></i>View on GitHub
                          </a>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {p.student_avatar && (
                            <img src={p.student_avatar} alt={p.student_name} className="rounded-circle" width="24" height="24" />
                          )}
                          <div>
                            {p.student_id ? (
                              <span
                                className="fw-semibold text-primary"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/students/${p.student_id}`)}
                              >
                                {p.student_name}
                              </span>
                            ) : (
                              <span className="text-body">{p.github_username}</span>
                            )}
                            <small className="text-muted d-block font-monospace">@{p.github_username}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge bg="light" text="dark" className="border">
                          {p.repository_name}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge ${badgeBg} px-2 py-1`}
                          style={p.state === 'merged' ? { backgroundColor: '#9333ea' } : {}}
                        >
                          {p.state}
                        </span>
                      </td>
                      <td className="small text-muted">{p.reviewer || 'Peer Review'}</td>
                      <td className="text-end small text-muted">{formatDate(p.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <Card.Footer className="bg-transparent border-top py-3 d-flex align-items-center justify-content-between">
              <div className="small text-muted">
                Showing <strong>{(page - 1) * limit + 1}</strong> - <strong>{Math.min(page * limit, total)}</strong> of <strong>{total}</strong> pull requests
              </div>
              <Pagination className="mb-0" size="sm">
                <Pagination.Prev disabled={page === 1} onClick={() => setPage(p => p - 1)} />
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pNum = i + 1;
                  if (page > 3 && totalPages > 5) {
                    pNum = page - 2 + i;
                    if (pNum > totalPages) pNum = totalPages - (4 - i);
                  }
                  return (
                    <Pagination.Item key={pNum} active={pNum === page} onClick={() => setPage(pNum)}>
                      {pNum}
                    </Pagination.Item>
                  );
                })}
                <Pagination.Next disabled={page === totalPages} onClick={() => setPage(p => p + 1)} />
              </Pagination>
            </Card.Footer>
          )}
        </Card>
      )}
    </div>
  );
};

export default PullRequests;
