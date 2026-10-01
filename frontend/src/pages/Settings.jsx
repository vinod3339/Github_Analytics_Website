import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Badge, Spinner, InputGroup } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

const Settings = () => {
  const [settingsData, setSettingsData] = useState(null);
  const [weights, setWeights] = useState({
    commit_weight: 30,
    pr_weight: 20,
    issue_weight: 10,
    review_weight: 15,
    repo_weight: 15,
    consistency_weight: 10,
  });

  const [githubToken, setGithubToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingWeights, setSavingWeights] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [weightsMessage, setWeightsMessage] = useState(null);
  const [tokenMessage, setTokenMessage] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      setSettingsData(res.data);
      if (res.data.ranking_weights) {
        setWeights(res.data.ranking_weights);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const totalWeights =
    Number(weights.commit_weight || 0) +
    Number(weights.pr_weight || 0) +
    Number(weights.issue_weight || 0) +
    Number(weights.review_weight || 0) +
    Number(weights.repo_weight || 0) +
    Number(weights.consistency_weight || 0);

  const handleSaveWeights = async (e) => {
    e.preventDefault();
    setSavingWeights(true);
    setWeightsMessage(null);
    try {
      await api.put('/settings/weights', weights);
      setWeightsMessage({ type: 'success', text: 'Ranking methodology weights updated successfully!' });
    } catch (err) {
      setWeightsMessage({ type: 'danger', text: err.message || 'Failed to update weights.' });
    } finally {
      setSavingWeights(false);
    }
  };

  const handleSaveToken = async (e) => {
    e.preventDefault();
    setSavingToken(true);
    setTokenMessage(null);
    try {
      await api.put('/settings/github-token', { token: githubToken });
      setTokenMessage({
        type: 'success',
        text: 'GitHub Personal Access Token updated in backend environment. Rate limit extended to 5,000 req/hr.'
      });
      setGithubToken('');
      fetchSettings();
    } catch (err) {
      setTokenMessage({ type: 'danger', text: err.message || 'Failed to update token.' });
    } finally {
      setSavingToken(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading system settings and configuration..." />;

  return (
    <div className="pb-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-body mb-1">System & Scoring Settings</h3>
          <p className="text-muted small mb-0">
            Tune multi-dimensional ranking algorithm weights and manage secure GitHub API credentials.
          </p>
        </div>
      </div>

      <Row className="g-4">
        {/* Left Column: Ranking Algorithm Weights */}
        <Col lg={7}>
          <Card className="card-custom border-0 h-100">
            <Card.Header className="bg-transparent border-bottom py-3 d-flex align-items-center justify-content-between">
              <span className="fw-bold text-body">1. Dynamic Ranking Algorithm Weights</span>
              <Badge bg={totalWeights === 100 ? 'success' : 'warning'} className="font-monospace px-3 py-2">
                Total: {totalWeights}%
              </Badge>
            </Card.Header>
            <Card.Body className="p-4">
              {weightsMessage && (
                <Alert variant={weightsMessage.type} dismissible onClose={() => setWeightsMessage(null)} className="small py-2 mb-3">
                  {weightsMessage.text}
                </Alert>
              )}

              <Form onSubmit={handleSaveWeights}>
                {/* Commits */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between small fw-semibold mb-1">
                    <span>Commits Contribution Weight</span>
                    <span className="text-primary font-monospace">{weights.commit_weight}%</span>
                  </div>
                  <Form.Range
                    min="0"
                    max="100"
                    step="5"
                    value={weights.commit_weight}
                    onChange={(e) => setWeights({ ...weights, commit_weight: Number(e.target.value) })}
                  />
                </div>

                {/* PRs */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between small fw-semibold mb-1">
                    <span>Pull Requests Weight</span>
                    <span className="text-success font-monospace">{weights.pr_weight}%</span>
                  </div>
                  <Form.Range
                    min="0"
                    max="100"
                    step="5"
                    value={weights.pr_weight}
                    onChange={(e) => setWeights({ ...weights, pr_weight: Number(e.target.value) })}
                  />
                </div>

                {/* Issues */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between small fw-semibold mb-1">
                    <span>Issues & Bug Reports Weight</span>
                    <span className="text-warning font-monospace">{weights.issue_weight}%</span>
                  </div>
                  <Form.Range
                    min="0"
                    max="100"
                    step="5"
                    value={weights.issue_weight}
                    onChange={(e) => setWeights({ ...weights, issue_weight: Number(e.target.value) })}
                  />
                </div>

                {/* Reviews */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between small fw-semibold mb-1">
                    <span>Code Reviews & Collaboration Weight</span>
                    <span className="text-info font-monospace">{weights.review_weight}%</span>
                  </div>
                  <Form.Range
                    min="0"
                    max="100"
                    step="5"
                    value={weights.review_weight}
                    onChange={(e) => setWeights({ ...weights, review_weight: Number(e.target.value) })}
                  />
                </div>

                {/* Repositories */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between small fw-semibold mb-1">
                    <span>Repository Breadth Weight</span>
                    <span className="text-secondary font-monospace">{weights.repo_weight}%</span>
                  </div>
                  <Form.Range
                    min="0"
                    max="100"
                    step="5"
                    value={weights.repo_weight}
                    onChange={(e) => setWeights({ ...weights, repo_weight: Number(e.target.value) })}
                  />
                </div>

                {/* Consistency */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between small fw-semibold mb-1">
                    <span>Consistency (Active Days) Weight</span>
                    <span className="text-dark font-monospace">{weights.consistency_weight}%</span>
                  </div>
                  <Form.Range
                    min="0"
                    max="100"
                    step="5"
                    value={weights.consistency_weight}
                    onChange={(e) => setWeights({ ...weights, consistency_weight: Number(e.target.value) })}
                  />
                </div>

                <div className="d-flex align-items-center justify-content-between pt-3 border-top">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setWeights({ commit_weight: 30, pr_weight: 20, issue_weight: 10, review_weight: 15, repo_weight: 15, consistency_weight: 10 })}
                  >
                    Reset Defaults
                  </Button>
                  <Button variant="primary" type="submit" disabled={savingWeights}>
                    {savingWeights ? 'Saving...' : 'Save Ranking Weights'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column: GitHub Token & System Info */}
        <Col lg={5}>
          {/* GitHub Token Card */}
          <Card className="card-custom border-0 mb-4">
            <Card.Header className="bg-transparent border-bottom py-3">
              <span className="fw-bold text-body">2. GitHub API Authentication</span>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="mb-3">
                <div className="small text-muted mb-1">Current Token Status:</div>
                {settingsData?.github_token_configured ? (
                  <Badge bg="success-subtle" className="text-success p-2 d-inline-flex align-items-center gap-1">
                    <i className="bi bi-shield-check"></i> Configured ({settingsData?.github_token_masked})
                  </Badge>
                ) : (
                  <Badge bg="warning-subtle" className="text-warning p-2 d-inline-flex align-items-center gap-1">
                    <i className="bi bi-shield-exclamation"></i> Using Public Unauthenticated (60 req/hr)
                  </Badge>
                )}
              </div>

              {tokenMessage && (
                <Alert variant={tokenMessage.type} dismissible onClose={() => setTokenMessage(null)} className="small py-2 mb-3">
                  {tokenMessage.text}
                </Alert>
              )}

              <Form onSubmit={handleSaveToken}>
                <Form.Group className="mb-3" controlId="formToken">
                  <Form.Label className="small fw-semibold">Update GitHub Personal Access Token (PAT)</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><i className="bi bi-key-fill"></i></InputGroup.Text>
                    <Form.Control
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      required
                    />
                  </InputGroup>
                  <Form.Text className="text-muted small">
                    Stored securely in backend memory / environment. Never exposed to the frontend.
                  </Form.Text>
                </Form.Group>

                <Button variant="primary" size="sm" type="submit" disabled={savingToken || !githubToken} className="w-100">
                  {savingToken ? 'Updating...' : 'Update GitHub Token'}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* System & Database Architecture Info */}
          <Card className="card-custom border-0">
            <Card.Header className="bg-transparent border-bottom py-3">
              <span className="fw-bold text-body">3. Architecture & Deployment</span>
            </Card.Header>
            <Card.Body className="p-4 small">
              <div className="mb-2 d-flex justify-content-between">
                <span className="text-muted">Backend Service:</span>
                <span className="fw-semibold font-monospace">FastAPI / Python 3.12</span>
              </div>
              <div className="mb-2 d-flex justify-content-between">
                <span className="text-muted">Database Engine:</span>
                <span className="fw-semibold font-monospace">SQLite + SQLAlchemy ORM</span>
              </div>
              <div className="mb-2 d-flex justify-content-between">
                <span className="text-muted">Frontend Stack:</span>
                <span className="fw-semibold font-monospace">React 18 + Vite + Bootstrap 5</span>
              </div>
              <div className="mb-2 d-flex justify-content-between">
                <span className="text-muted">Charts Engine:</span>
                <span className="fw-semibold font-monospace">Recharts (SVG)</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Security Layer:</span>
                <span className="fw-semibold font-monospace">JWT (HS256) + Bcrypt</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Settings;
