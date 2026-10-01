import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup, Row, Col, Badge, Alert, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import RankingMethodologyModal from '../components/RankingMethodologyModal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ExportButton from '../components/ExportButton';
import { getRankBadge } from '../utils/formatters';
import api from '../services/api';

const Rankings = () => {
  const [rankings, setRankings] = useState([]);
  const [weights, setWeights] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMethodology, setShowMethodology] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [repositoryId, setRepositoryId] = useState('');
  const [search, setSearch] = useState('');

  const [reposList, setReposList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await api.get('/repositories');
        setReposList(res.data);
      } catch (e) {}
    };
    fetchRepos();
  }, []);

  const fetchRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ date_filter: dateFilter });
      if (dateFilter === 'custom' && startDate) {
        params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
      }
      if (repositoryId) params.append('repository_id', repositoryId);

      const res = await api.get(`/rankings?${params.toString()}`);
      setRankings(res.data.rankings || []);
      setWeights(res.data.weights || {});
    } catch (err) {
      setError(err.message || 'Failed to calculate rankings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [dateFilter, startDate, endDate, repositoryId]);

  const filteredRankings = rankings.filter((r) =>
    r.student_name.toLowerCase().includes(search.toLowerCase()) ||
    r.github_username.toLowerCase().includes(search.toLowerCase()) ||
    r.student_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-5">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-body mb-1">Student GitHub Rankings</h3>
          <p className="text-muted small mb-0">
            Dynamic, multi-dimensional academic activity ranking with transparent weighted scoring.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setShowMethodology(true)}
            className="d-flex align-items-center gap-2"
          >
            <i className="bi bi-info-circle-fill"></i>
            <span>Ranking Methodology</span>
          </Button>
          <ExportButton dataType="rankings" label="Export Rankings" size="sm" />
        </div>
      </div>

      {/* Weights Banner */}
      <Card className="card-custom border-0 mb-4 bg-light-subtle">
        <Card.Body className="p-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-sliders text-primary fs-5"></i>
              <span className="fw-semibold small text-body">Active Scoring Weights:</span>
            </div>
            <div className="d-flex flex-wrap gap-2 small">
              <Badge bg="primary">Commits: {weights.commits || 30}%</Badge>
              <Badge bg="success">PRs: {weights.pull_requests || 20}%</Badge>
              <Badge bg="warning" text="dark">Issues: {weights.issues || 10}%</Badge>
              <Badge bg="info">Reviews: {weights.reviews || 15}%</Badge>
              <Badge bg="secondary">Repo Scope: {weights.repositories || 15}%</Badge>
              <Badge bg="dark">Consistency: {weights.consistency || 10}%</Badge>
            </div>
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate('/settings')}
              className="p-0 text-decoration-none small"
            >
              Adjust in Settings &rarr;
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Filter Toolbar */}
      <Card className="card-custom border-0 mb-4">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col lg={4}>
              <InputGroup>
                <InputGroup.Text className="bg-transparent">
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Filter student name, ID, or username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="shadow-none border-start-0"
                />
              </InputGroup>
            </Col>
            <Col sm={6} lg={3}>
              <Form.Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="3m">Last 3 Months</option>
                <option value="semester">Current Semester</option>
                <option value="custom">Custom Date Range</option>
              </Form.Select>
            </Col>
            <Col sm={6} lg={3}>
              <Form.Select
                value={repositoryId}
                onChange={(e) => setRepositoryId(e.target.value)}
              >
                <option value="">All Tracked Repositories</option>
                {reposList.map((r) => (
                  <option key={r.id} value={r.id}>{r.full_name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col lg={2} className="text-lg-end text-muted small">
              <strong>{filteredRankings.length}</strong> Students Evaluated
            </Col>
          </Row>

          {/* Custom Date Range Inputs */}
          {dateFilter === 'custom' && (
            <Row className="g-3 mt-2 pt-2 border-top">
              <Col md={6}>
                <Form.Group controlId="startDate">
                  <Form.Label className="small text-muted mb-1">Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="endDate">
                  <Form.Label className="small text-muted mb-1">End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Rankings Table */}
      {loading ? (
        <LoadingSpinner message="Calculating normalized activity scores..." />
      ) : filteredRankings.length === 0 ? (
        <EmptyState
          icon="bi-trophy"
          title="No Rankings Found"
          description="No student activities recorded for the selected filter parameters."
        />
      ) : (
        <Card className="card-custom border-0">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '120px' }}>Rank</th>
                  <th>Student</th>
                  <th>GitHub</th>
                  <th className="text-center">Commits ({weights.commits}%)</th>
                  <th className="text-center">PRs ({weights.pull_requests}%)</th>
                  <th className="text-center">Issues ({weights.issues}%)</th>
                  <th className="text-center">Reviews ({weights.reviews}%)</th>
                  <th className="text-center">Repos ({weights.repositories}%)</th>
                  <th className="text-center">Active Days ({weights.consistency}%)</th>
                  <th className="text-end" style={{ width: '140px' }}>Activity Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredRankings.map((r) => {
                  const badge = getRankBadge(r.rank);
                  const isTop3 = r.rank <= 3;

                  return (
                    <tr
                      key={r.student_id}
                      style={{ cursor: 'pointer', backgroundColor: isTop3 ? 'rgba(37, 99, 235, 0.02)' : 'inherit' }}
                      onClick={() => navigate(`/students/${r.student_id}`)}
                    >
                      <td>
                        <span className={badge.className}>{badge.label}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img src={r.avatar_url} alt={r.student_name} className="rounded-circle" width="34" height="34" />
                          <div>
                            <div className="fw-semibold text-body">{r.student_name}</div>
                            <small className="text-muted">{r.student_code}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-monospace text-muted">@{r.github_username}</span>
                      </td>
                      <td className="text-center">
                        <div className="font-monospace fw-semibold">{r.commits}</div>
                        <small className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                          norm: {r.normalized_scores.commits}%
                        </small>
                      </td>
                      <td className="text-center">
                        <div className="font-monospace fw-semibold">{r.pull_requests}</div>
                        <small className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                          norm: {r.normalized_scores.pull_requests}%
                        </small>
                      </td>
                      <td className="text-center">
                        <div className="font-monospace fw-semibold">{r.issues}</div>
                        <small className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                          norm: {r.normalized_scores.issues}%
                        </small>
                      </td>
                      <td className="text-center">
                        <div className="font-monospace fw-semibold">{r.reviews}</div>
                        <small className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                          norm: {r.normalized_scores.reviews}%
                        </small>
                      </td>
                      <td className="text-center">
                        <div className="font-monospace fw-semibold">{r.repositories}</div>
                        <small className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                          norm: {r.normalized_scores.repositories}%
                        </small>
                      </td>
                      <td className="text-center">
                        <div className="font-monospace fw-semibold">{r.consistency_days}</div>
                        <small className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                          norm: {r.normalized_scores.consistency}%
                        </small>
                      </td>
                      <td className="text-end">
                        <div className="display-6 fw-bold font-monospace text-primary" style={{ fontSize: '1.25rem' }}>
                          {r.score}
                        </div>
                        <ProgressBar
                          now={r.score}
                          variant={r.score > 80 ? 'success' : r.score > 50 ? 'primary' : 'warning'}
                          style={{ height: '4px' }}
                          className="mt-1"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      <RankingMethodologyModal
        show={showMethodology}
        onHide={() => setShowMethodology(false)}
        weights={weights}
      />
    </div>
  );
};

export default Rankings;
