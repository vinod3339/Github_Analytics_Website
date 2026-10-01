import React, { useState, useEffect } from 'react';
import { Modal, Form, InputGroup, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const GlobalSearchModal = ({ show, onHide }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(response.data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (path) => {
    onHide();
    setQuery('');
    setResults(null);
    navigate(path);
  };

  const hasResults =
    results &&
    (results.students?.length > 0 ||
      results.repositories?.length > 0 ||
      results.commits?.length > 0 ||
      results.pull_requests?.length > 0 ||
      results.issues?.length > 0);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Body className="p-4">
        <InputGroup className="mb-3">
          <InputGroup.Text className="bg-transparent border-end-0">
            {loading ? <Spinner animation="border" size="sm" /> : <i className="bi bi-search text-muted"></i>}
          </InputGroup.Text>
          <Form.Control
            type="search"
            placeholder="Search students, repositories, commits, pull requests, issues..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="border-start-0 py-2 fs-6 shadow-none"
          />
        </InputGroup>

        {query.length >= 2 && !loading && !hasResults && (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-emoji-neutral fs-2 d-block mb-2"></i>
            No matching results found for "{query}".
          </div>
        )}

        {hasResults && (
          <div className="overflow-auto" style={{ maxHeight: '420px' }}>
            {/* Students */}
            {results.students?.length > 0 && (
              <div className="mb-3">
                <div className="text-uppercase small fw-bold text-muted mb-2">Students</div>
                <ListGroup variant="flush">
                  {results.students.map((s) => (
                    <ListGroup.Item
                      key={s.id}
                      action
                      onClick={() => handleSelect(`/students/${s.id}`)}
                      className="d-flex align-items-center justify-content-between p-2 rounded mb-1"
                    >
                      <div className="d-flex align-items-center gap-2">
                        <img src={s.avatar_url} alt={s.name} className="rounded-circle" width="28" height="28" />
                        <div>
                          <span className="fw-semibold text-body">{s.name}</span>
                          <span className="text-muted small ms-2">({s.student_id})</span>
                        </div>
                      </div>
                      <Badge bg="primary-subtle" className="text-primary">@{s.github_username}</Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}

            {/* Repositories */}
            {results.repositories?.length > 0 && (
              <div className="mb-3">
                <div className="text-uppercase small fw-bold text-muted mb-2">Repositories</div>
                <ListGroup variant="flush">
                  {results.repositories.map((r) => (
                    <ListGroup.Item
                      key={r.id}
                      action
                      onClick={() => handleSelect(`/repositories/${r.owner}/${r.name}`)}
                      className="d-flex align-items-center justify-content-between p-2 rounded mb-1"
                    >
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-folder2 text-warning fs-5"></i>
                        <span className="fw-semibold text-body">{r.full_name}</span>
                      </div>
                      <Badge bg="secondary">{r.language}</Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}

            {/* Commits */}
            {results.commits?.length > 0 && (
              <div className="mb-3">
                <div className="text-uppercase small fw-bold text-muted mb-2">Commits</div>
                <ListGroup variant="flush">
                  {results.commits.map((c) => (
                    <ListGroup.Item
                      key={c.id}
                      action
                      onClick={() => handleSelect('/commits')}
                      className="d-flex align-items-center justify-content-between p-2 rounded mb-1"
                    >
                      <div className="d-flex align-items-center gap-2 text-truncate me-2">
                        <span className="badge font-monospace bg-light text-dark border">{c.sha}</span>
                        <span className="text-body small text-truncate">{c.message}</span>
                      </div>
                      <span className="text-muted small flex-shrink-0">{c.author}</span>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}

            {/* Pull Requests */}
            {results.pull_requests?.length > 0 && (
              <div className="mb-3">
                <div className="text-uppercase small fw-bold text-muted mb-2">Pull Requests</div>
                <ListGroup variant="flush">
                  {results.pull_requests.map((p) => (
                    <ListGroup.Item
                      key={p.id}
                      action
                      onClick={() => handleSelect('/pull-requests')}
                      className="d-flex align-items-center justify-content-between p-2 rounded mb-1"
                    >
                      <div className="d-flex align-items-center gap-2 text-truncate me-2">
                        <i className="bi bi-git text-success"></i>
                        <span className="text-body small text-truncate">#{p.number} {p.title}</span>
                      </div>
                      <Badge bg={p.state === 'merged' ? 'purple' : p.state === 'open' ? 'success' : 'secondary'}>
                        {p.state}
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}

            {/* Issues */}
            {results.issues?.length > 0 && (
              <div>
                <div className="text-uppercase small fw-bold text-muted mb-2">Issues</div>
                <ListGroup variant="flush">
                  {results.issues.map((i) => (
                    <ListGroup.Item
                      key={i.id}
                      action
                      onClick={() => handleSelect('/issues')}
                      className="d-flex align-items-center justify-content-between p-2 rounded mb-1"
                    >
                      <div className="d-flex align-items-center gap-2 text-truncate me-2">
                        <i className={`bi bi-record-circle ${i.state === 'open' ? 'text-danger' : 'text-secondary'}`}></i>
                        <span className="text-body small text-truncate">#{i.number} {i.title}</span>
                      </div>
                      <Badge bg={i.state === 'open' ? 'danger' : 'secondary'}>{i.state}</Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default GlobalSearchModal;
