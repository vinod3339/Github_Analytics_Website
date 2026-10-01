import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Row, Col, Badge, Alert, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import ExportButton from '../components/ExportButton';
import { getRankBadge } from '../utils/formatters';
import api from '../services/api';

const Contributors = () => {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [reposList, setReposList] = useState([]);
  const [repositoryId, setRepositoryId] = useState('');

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

  const fetchContributors = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ date_filter: dateFilter });
      if (repositoryId) params.append('repository_id', repositoryId);

      const res = await api.get(`/contributors?${params.toString()}`);
      setContributors(res.data.contributors || []);
    } catch (err) {
      setError(err.message || 'Failed to load contributors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributors();
  }, [dateFilter, repositoryId]);

  const chartData = contributors.slice(0, 8).map((c) => ({
    name: c.student_name.split(' ')[0],
    Commits: c.commits,
    PRs: c.pull_requests,
    Issues: c.issues,
    Reviews: c.reviews,
  }));

  return (
    <div className="pb-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-body mb-1">Cohort Contributors Leaderboard</h3>
          <p className="text-muted small mb-0">
            Comprehensive breakdown of student contributions across commits, pull requests, issues, and peer reviews.
          </p>
        </div>
        <ExportButton dataType="rankings" label="Export Leaderboard" size="sm" />
      </div>

      {/* Filter Toolbar */}
      <Card className="card-custom border-0 mb-4">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col md={6}>
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
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Select
                value={repositoryId}
                onChange={(e) => setRepositoryId(e.target.value)}
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

      {/* Contribution Comparison Chart */}
      {contributors.length > 0 && (
        <Card className="card-custom border-0 mb-4">
          <Card.Header className="bg-transparent border-bottom py-3">
            <span className="fw-bold text-body">Top Contributor Multi-Metric Comparison</span>
          </Card.Header>
          <Card.Body className="p-3">
            <div style={{ width: '100%', height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Commits" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="PRs" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Issues" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Reviews" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Contributors Table */}
      {loading ? (
        <LoadingSpinner message="Calculating contributor rankings & activities..." />
      ) : (
        <Card className="card-custom border-0">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '80px' }}>Rank</th>
                  <th>Student</th>
                  <th>GitHub Username</th>
                  <th className="text-center">Commits</th>
                  <th className="text-center">PRs</th>
                  <th className="text-center">Issues</th>
                  <th className="text-center">Reviews</th>
                  <th className="text-center">Active Days</th>
                  <th className="text-end">Activity Score</th>
                </tr>
              </thead>
              <tbody>
                {contributors.map((c) => {
                  const badge = getRankBadge(c.rank);
                  return (
                    <tr
                      key={c.student_id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/students/${c.student_id}`)}
                    >
                      <td>
                        <span className={badge.className} style={{ fontSize: '0.75rem' }}>{badge.medal}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img src={c.avatar_url} alt={c.student_name} className="rounded-circle" width="32" height="32" />
                          <div>
                            <div className="fw-semibold text-body">{c.student_name}</div>
                            <small className="text-muted">{c.student_code}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-monospace text-muted">@{c.github_username}</span>
                      </td>
                      <td className="text-center font-monospace fw-semibold text-primary">{c.commits}</td>
                      <td className="text-center font-monospace">{c.pull_requests}</td>
                      <td className="text-center font-monospace">{c.issues}</td>
                      <td className="text-center font-monospace">{c.reviews}</td>
                      <td className="text-center font-monospace">{c.consistency_days}</td>
                      <td className="text-end font-monospace fw-bold fs-6 text-primary">{c.score}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Contributors;
