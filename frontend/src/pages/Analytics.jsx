import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Alert, Table } from 'react-bootstrap';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import ExportButton from '../components/ExportButton';
import api from '../services/api';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#64748b'];

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/analytics');
        setData(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <LoadingSpinner message="Aggregating multi-repository charts and statistical analytics..." />;
  if (error || !data) {
    return <Alert variant="danger" className="my-4">{error || 'Failed to aggregate analytics.'}</Alert>;
  }

  const monthlyActivity = data.monthly_activity || [];
  const languageDist = data.language_distribution || [];
  const studentComp = data.student_comparison || [];
  const repoActivity = data.repository_activity || [];

  return (
    <div className="pb-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-body mb-1">GitHub Cohort Analytics</h3>
          <p className="text-muted small mb-0">
            Interactive visual charts analyzing development cadence, language stacks, and student metrics.
          </p>
        </div>
        <ExportButton dataType="rankings" label="Export Statistical Data" size="sm" />
      </div>

      {/* Row 1: Line Chart & Pie Chart */}
      <Row className="g-4 mb-4">
        {/* 1. Monthly Activity Line Chart */}
        <Col lg={8}>
          <Card className="card-custom border-0 h-100">
            <Card.Header className="bg-transparent border-bottom py-3">
              <span className="fw-bold text-body">1. Monthly Engineering Cadence (Line Chart)</span>
            </Card.Header>
            <Card.Body className="p-3">
              <div style={{ width: '100%', height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyActivity} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="commits" name="Commits" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                    <Line type="monotone" dataKey="pull_requests" name="Pull Requests" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                    <Line type="monotone" dataKey="issues" name="Issues" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* 2. Language Distribution Pie Chart */}
        <Col lg={4}>
          <Card className="card-custom border-0 h-100">
            <Card.Header className="bg-transparent border-bottom py-3">
              <span className="fw-bold text-body">2. Language Stacks (Pie Chart)</span>
            </Card.Header>
            <Card.Body className="p-3 d-flex flex-column justify-content-center">
              <div style={{ width: '100%', height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={languageDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {languageDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="d-flex flex-wrap justify-content-center gap-2 mt-2">
                {languageDist.map((entry, index) => (
                  <span key={entry.name} className="small d-flex align-items-center gap-1">
                    <span className="d-inline-block rounded-circle" style={{ width: 10, height: 10, backgroundColor: COLORS[index % COLORS.length] }}></span>
                    {entry.name} ({entry.value})
                  </span>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Row 2: Bar Chart & Area Chart */}
      <Row className="g-4 mb-4">
        {/* 3. Student Contribution Comparison Bar Chart */}
        <Col lg={6}>
          <Card className="card-custom border-0 h-100">
            <Card.Header className="bg-transparent border-bottom py-3">
              <span className="fw-bold text-body">3. Top Student Contribution Comparison (Bar Chart)</span>
            </Card.Header>
            <Card.Body className="p-3">
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentComp} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="commits" name="Commits" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="prs" name="Pull Requests" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="issues" name="Issues" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* 4. Cumulative Total Activity Area Chart */}
        <Col lg={6}>
          <Card className="card-custom border-0 h-100">
            <Card.Header className="bg-transparent border-bottom py-3">
              <span className="fw-bold text-body">4. Cumulative Contribution Trend (Area Chart)</span>
            </Card.Header>
            <Card.Body className="p-3">
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="total_activity"
                      name="Total Activity (Commits+PRs+Issues)"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Repository Activity Matrix Table */}
      <Card className="card-custom border-0">
        <Card.Header className="bg-transparent border-bottom py-3">
          <span className="fw-bold text-body">Repository Engineering Activity Matrix</span>
        </Card.Header>
        <div className="table-responsive">
          <Table hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Repository</th>
                <th>Language</th>
                <th className="text-center">Stars</th>
                <th className="text-center">Forks</th>
                <th className="text-center">Commits</th>
                <th className="text-center">Pull Requests</th>
                <th className="text-center">Issues</th>
                <th className="text-center">Active Contributors</th>
              </tr>
            </thead>
            <tbody>
              {repoActivity.map((r) => (
                <tr key={r.id}>
                  <td className="fw-bold text-primary">{r.full_name}</td>
                  <td>{r.language}</td>
                  <td className="text-center font-monospace">{r.stars}</td>
                  <td className="text-center font-monospace">{r.forks}</td>
                  <td className="text-center font-monospace fw-semibold text-primary">{r.commits}</td>
                  <td className="text-center font-monospace">{r.pull_requests}</td>
                  <td className="text-center font-monospace">{r.issues}</td>
                  <td className="text-center font-monospace fw-bold">{r.contributors}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
