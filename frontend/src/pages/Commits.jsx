import React, { useState, useEffect } from 'react';
import { Card, Table, Form, InputGroup, Row, Col, Pagination, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ExportButton from '../components/ExportButton';
import { formatDate } from '../utils/formatters';
import api from '../services/api';

const Commits = () => {
  const [commits, setCommits] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [repositoryId, setRepositoryId] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  // Filter dropdown lists
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
      } catch (e) {
        console.error('Error fetching filter dropdowns:', e);
      }
    };
    fetchDropdowns();
  }, []);

  const fetchCommits = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);
      if (studentId) params.append('student_id', studentId);
      if (repositoryId) params.append('repository_id', repositoryId);
      if (dateFilter && dateFilter !== 'all') params.append('date_filter', dateFilter);

      const res = await api.get(`/commits?${params.toString()}`);
      setCommits(res.data.items || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch commits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCommits();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, search, studentId, repositoryId, dateFilter]);

  return (
    <div className="pb-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-body mb-1">Git Commits Log</h3>
          <p className="text-muted small mb-0">
            Inspect individual commits, code additions, author associations, and repository branches.
          </p>
        </div>
        <ExportButton dataType="commits" label="Export Commits" size="sm" />
      </div>

      {/* Filter Toolbar */}
      <Card className="card-custom border-0 mb-4">
        <Card.Body className="p-3">
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="bg-transparent">
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Search commit message, SHA, author..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="shadow-none border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={3}>
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
            <Col md={2}>
              <Form.Select
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="3m">Last 3 Months</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {loading ? (
        <LoadingSpinner message="Filtering and loading commits..." />
      ) : commits.length === 0 ? (
        <EmptyState
          icon="bi-file-earmark-code"
          title="No Commits Found"
          description="No commit logs match the selected filter criteria."
        />
      ) : (
        <Card className="card-custom border-0">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '110px' }}>SHA</th>
                  <th>Commit Message</th>
                  <th>Student / Author</th>
                  <th>Repository</th>
                  <th>Branch</th>
                  <th className="text-end">Committed At</th>
                </tr>
              </thead>
              <tbody>
                {commits.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="badge font-monospace bg-light text-dark border">
                        {c.sha.slice(0, 8)}
                      </span>
                    </td>
                    <td>
                      <div className="fw-medium text-body">{c.message}</div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {c.student_avatar && (
                          <img src={c.student_avatar} alt={c.student_name} className="rounded-circle" width="24" height="24" />
                        )}
                        <div>
                          {c.student_id ? (
                            <span
                              className="fw-semibold text-primary"
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/students/${c.student_id}`)}
                            >
                              {c.student_name}
                            </span>
                          ) : (
                            <span className="text-body">{c.author_name || c.github_username}</span>
                          )}
                          {c.github_username && (
                            <small className="text-muted d-block font-monospace">@{c.github_username}</small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg="light" text="dark" className="border">
                        {c.repository_name || 'Repository'}
                      </Badge>
                    </td>
                    <td>
                      <span className="small font-monospace text-muted">{c.branch}</span>
                    </td>
                    <td className="text-end small text-muted">
                      {formatDate(c.committed_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <Card.Footer className="bg-transparent border-top py-3 d-flex align-items-center justify-content-between">
              <div className="small text-muted">
                Showing <strong>{(page - 1) * limit + 1}</strong> - <strong>{Math.min(page * limit, total)}</strong> of <strong>{total}</strong> commits
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
                    <Pagination.Item
                      key={pNum}
                      active={pNum === page}
                      onClick={() => setPage(pNum)}
                    >
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

export default Commits;
