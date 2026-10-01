import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup, Modal, Badge, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ExportButton from '../components/ExportButton';
import { formatRelativeTime, formatNumber, getLanguageBadgeColor } from '../utils/formatters';
import api from '../services/api';

const Repositories = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Add repo modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [repoInput, setRepoInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);

  const navigate = useNavigate();

  const fetchRepositories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/repositories');
      setRepositories(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load tracked repositories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const handleAddRepository = async (e) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    setAdding(true);
    setAddError(null);
    try {
      await api.post('/repositories', { url_or_fullname: repoInput.trim() });
      setShowAddModal(false);
      setRepoInput('');
      fetchRepositories();
    } catch (err) {
      setAddError(err.message || 'Failed to add repository.');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/repositories/${selectedRepo.id}`);
      setShowDeleteModal(false);
      fetchRepositories();
    } catch (err) {
      alert(err.message || 'Failed to remove repository.');
    }
  };

  const filteredRepos = repositories.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.language && r.language.toLowerCase().includes(search.toLowerCase())) ||
    (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="pb-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-body mb-1">Tracked Repositories</h3>
          <p className="text-muted small mb-0">
            Monitor course repositories, codebases, commits, and student engagement via GitHub REST API.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)} className="d-flex align-items-center gap-2">
            <i className="bi bi-plus-lg"></i>
            <span>Track New Repository</span>
          </Button>
          <ExportButton dataType="repositories" label="Export Repositories" size="sm" />
        </div>
      </div>

      {/* Filter and Search */}
      <Card className="card-custom border-0 mb-4">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-transparent">
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Search repository by name, organization, or language..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="shadow-none border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={6} className="text-md-end text-muted small">
              Tracking <strong>{filteredRepos.length}</strong> GitHub repositories
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {loading ? (
        <LoadingSpinner message="Fetching repository metrics and GitHub statuses..." />
      ) : filteredRepos.length === 0 ? (
        <EmptyState
          icon="bi-folder2-open"
          title="No Repositories Found"
          description={search ? `No repository matching "${search}".` : "No repositories tracked yet. Click 'Track New Repository' to add one."}
          actionLabel="Track Repository"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <Card className="card-custom border-0">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Repository Name</th>
                  <th>Language</th>
                  <th className="text-center">Stars / Forks</th>
                  <th className="text-center">Open Issues</th>
                  <th className="text-center">Commits</th>
                  <th className="text-center">PRs</th>
                  <th className="text-center">Contributors</th>
                  <th>Last Synced</th>
                  <th className="text-end" style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepos.map((r) => (
                  <tr
                    key={r.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/repositories/${r.full_name}`)}
                  >
                    <td>
                      <div>
                        <div className="fw-bold text-primary">{r.full_name}</div>
                        {r.description && (
                          <div className="text-muted small text-truncate" style={{ maxWidth: '300px' }}>
                            {r.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge className={getLanguageBadgeColor(r.language)}>{r.language || 'Other'}</Badge>
                    </td>
                    <td className="text-center small">
                      <span className="me-2">⭐ {formatNumber(r.stars)}</span>
                      <span>🍴 {formatNumber(r.forks)}</span>
                    </td>
                    <td className="text-center font-monospace">{r.open_issues}</td>
                    <td className="text-center font-monospace fw-semibold text-primary">{formatNumber(r.commits_count)}</td>
                    <td className="text-center font-monospace">{r.prs_count}</td>
                    <td className="text-center font-monospace fw-bold">{r.contributors_count}</td>
                    <td className="small text-muted">{formatRelativeTime(r.last_synced_at)}</td>
                    <td className="text-end">
                      <Button
                        variant="light"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRepo(r);
                          setShowDeleteModal(true);
                        }}
                        className="border text-danger p-1 px-2"
                        title="Remove Repository"
                      >
                        <i className="bi bi-trash-fill"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {/* Add Repository Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Form onSubmit={handleAddRepository}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-5">Track GitHub Repository</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {addError && <Alert variant="danger" className="small py-2 mb-3">{addError}</Alert>}

            <Form.Group controlId="formRepoInput">
              <Form.Label className="small fw-semibold">GitHub Repository Path or URL</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. facebook/react or https://github.com/fastapi/fastapi"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                required
                autoFocus
              />
              <Form.Text className="text-muted">
                Accepts format <code>owner/repo</code> or full GitHub repository URL.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={adding}>
              {adding ? 'Fetching from GitHub...' : 'Add Repository'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Repository Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger fw-bold fs-5">Stop Tracking Repository</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          Are you sure you want to stop tracking <strong>{selectedRepo?.full_name}</strong>? Local synchronized commits and PR records will be removed.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>Remove</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Repositories;
