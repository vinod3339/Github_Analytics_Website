import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Badge, Spinner, InputGroup, ListGroup } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const StudentRegistration = () => {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    email: '',
    github_username: '',
    department: 'Computer Science & Engineering',
    batch: '2024-2028',
    track_all_public_repos: false,
    auto_sync: true,
  });

  const [selectedRepos, setSelectedRepos] = useState([]);
  const [customRepoInput, setCustomRepoInput] = useState('');
  const [customReposList, setCustomReposList] = useState([]);

  // GitHub Lookup State
  const [lookingUp, setLookingUp] = useState(false);
  const [githubProfile, setGithubProfile] = useState(null);
  const [lookupError, setLookupError] = useState(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [registeredResult, setRegisteredResult] = useState(null);

  // Live GitHub Username verification
  const handleVerifyGitHub = async () => {
    const username = formData.github_username.trim().replace(/^@/, '');
    if (!username) {
      setLookupError('Please enter a GitHub username to verify.');
      return;
    }

    setLookingUp(true);
    setLookupError(null);
    setGithubProfile(null);
    try {
      const res = await api.get(`/students/github-lookup/${encodeURIComponent(username)}`);
      setGithubProfile(res.data);
      if (!formData.name && res.data.name) {
        setFormData(prev => ({ ...prev, name: res.data.name }));
      }
    } catch (err) {
      setLookupError(err.message || 'GitHub user not found. Please verify spelling.');
    } finally {
      setLookingUp(false);
    }
  };

  const toggleRepoSelection = (repoFullName) => {
    setSelectedRepos(prev =>
      prev.includes(repoFullName) ? prev.filter(r => r !== repoFullName) : [...prev, repoFullName]
    );
  };

  const handleAddCustomRepo = () => {
    if (!customRepoInput.trim()) return;
    const clean = customRepoInput.trim();
    if (!customReposList.includes(clean)) {
      setCustomReposList(prev => [...prev, clean]);
    }
    setCustomRepoInput('');
  };

  const handleRemoveCustomRepo = (repo) => {
    setCustomReposList(prev => prev.filter(r => r !== repo));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      student_id: formData.student_id.trim(),
      name: formData.name.trim(),
      email: formData.email.trim(),
      github_username: formData.github_username.trim().replace(/^@/, ''),
      department: formData.department,
      batch: formData.batch,
      track_all_public_repos: formData.track_all_public_repos,
      selected_repositories: selectedRepos,
      custom_repository_urls: customReposList,
      auto_sync: formData.auto_sync,
    };

    try {
      const res = await api.post('/students/register', payload);
      setRegisteredResult(res.data);
    } catch (err) {
      setSubmitError(err.message || 'Registration failed. Please check input values.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      name: '',
      email: '',
      github_username: '',
      department: 'Computer Science & Engineering',
      batch: '2024-2028',
      track_all_public_repos: false,
      auto_sync: true,
    });
    setSelectedRepos([]);
    setCustomReposList([]);
    setGithubProfile(null);
    setRegisteredResult(null);
  };

  return (
    <div className="py-4" style={{ minHeight: '100vh', background: 'var(--body-bg)' }}>
      <Container style={{ maxWidth: '820px' }}>
        {/* Header Banner */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-3 bg-primary text-white d-flex align-items-center justify-content-center shadow-sm"
              style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}
            >
              <i className="bi bi-mortarboard-fill"></i>
            </div>
            <div>
              <h3 className="fw-bold text-body mb-0">Student Registration & GitHub Sync</h3>
              <p className="text-muted small mb-0">
                Enroll student profile and automatically synchronize GitHub repositories to the analytics database.
              </p>
            </div>
          </div>
          <Button variant="outline-secondary" size="sm" onClick={() => navigate('/dashboard')}>
            <i className="bi bi-house me-1"></i> Dashboard
          </Button>
        </div>

        {/* Success Screen after registration */}
        {registeredResult ? (
          <Card className="card-custom border-0 shadow-sm p-4 text-center animate__animated animate__fadeIn">
            <Card.Body>
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success text-white mb-3"
                style={{ width: '72px', height: '72px', fontSize: '2rem' }}
              >
                <i className="bi bi-check-lg"></i>
              </div>
              <h4 className="fw-bold text-body mb-2">Student Registered & Synchronized!</h4>
              <p className="text-muted mb-4" style={{ maxWidth: '520px', margin: '0 auto' }}>
                {registeredResult.message}
              </p>

              {/* Summary Metrics Box */}
              <Row className="g-3 mb-4 justify-content-center">
                <Col xs={6} sm={3}>
                  <Card className="border bg-light">
                    <Card.Body className="p-3">
                      <div className="text-muted small">Student ID</div>
                      <div className="fw-bold text-body font-monospace">{registeredResult.student?.student_id}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6} sm={3}>
                  <Card className="border bg-light">
                    <Card.Body className="p-3">
                      <div className="text-muted small">Tracked Repos</div>
                      <div className="fw-bold text-primary font-monospace">{registeredResult.tracked_repositories_count}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6} sm={3}>
                  <Card className="border bg-light">
                    <Card.Body className="p-3">
                      <div className="text-muted small">Commits Synced</div>
                      <div className="fw-bold text-success font-monospace">{registeredResult.total_commits_synced}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6} sm={3}>
                  <Card className="border bg-light">
                    <Card.Body className="p-3">
                      <div className="text-muted small">Activity Score</div>
                      <div className="fw-bold text-warning font-monospace">{registeredResult.student?.score || 0}</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <div className="d-flex flex-wrap justify-content-center gap-3">
                <Button variant="primary" onClick={() => navigate(`/students/${registeredResult.student?.id}`)}>
                  <i className="bi bi-person-badge me-2"></i> View Student Dossier
                </Button>
                <Button variant="outline-primary" onClick={() => navigate('/students')}>
                  <i className="bi bi-people me-2"></i> View All Students
                </Button>
                <Button variant="outline-secondary" onClick={resetForm}>
                  <i className="bi bi-person-plus me-2"></i> Register Another Student
                </Button>
              </div>
            </Card.Body>
          </Card>
        ) : (
          /* Registration Form */
          <Form onSubmit={handleSubmit}>
            {submitError && (
              <Alert variant="danger" dismissible onClose={() => setSubmitError(null)} className="mb-4">
                <i className="bi bi-exclamation-octagon-fill me-2"></i>
                {submitError}
              </Alert>
            )}

            {/* Section 1: Academic Student Information */}
            <Card className="card-custom border-0 shadow-sm mb-4">
              <Card.Header className="bg-transparent border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <Badge bg="primary" pill>1</Badge>
                  <span className="fw-bold text-body">Academic Information</span>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group controlId="regStudentId">
                      <Form.Label className="small fw-semibold">Academic Roll No / Student ID <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. CS2024-042"
                        value={formData.student_id}
                        onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="regStudentName">
                      <Form.Label className="small fw-semibold">Student Full Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="e.g. Alex Johnson"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="regStudentEmail">
                      <Form.Label className="small fw-semibold">University Email Address <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="alex.johnson@university.edu"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                      <Form.Text className="text-muted small">Used for matching git commit author emails.</Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group controlId="regDepartment">
                      <Form.Label className="small fw-semibold">Department</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group controlId="regBatch">
                      <Form.Label className="small fw-semibold">Academic Batch</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.batch}
                        onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Section 2: GitHub Profile & Verification */}
            <Card className="card-custom border-0 shadow-sm mb-4">
              <Card.Header className="bg-transparent border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <Badge bg="primary" pill>2</Badge>
                  <span className="fw-bold text-body">GitHub Profile Integration</span>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <Form.Group controlId="regGitHubUser" className="mb-3">
                  <Form.Label className="small fw-semibold">GitHub Username <span className="text-danger">*</span></Form.Label>
                  <InputGroup>
                    <InputGroup.Text><i className="bi bi-github"></i></InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="e.g. octocat or alexj-dev"
                      value={formData.github_username}
                      onChange={(e) => setFormData({ ...formData, github_username: e.target.value })}
                      required
                    />
                    <Button
                      variant="outline-primary"
                      type="button"
                      disabled={lookingUp || !formData.github_username}
                      onClick={handleVerifyGitHub}
                    >
                      {lookingUp ? <Spinner animation="border" size="sm" /> : <><i className="bi bi-check2-circle me-1"></i> Verify on GitHub</>}
                    </Button>
                  </InputGroup>
                  <Form.Text className="text-muted small">
                    Click "Verify on GitHub" to fetch avatar, bio, and public repositories in real-time.
                  </Form.Text>
                </Form.Group>

                {lookupError && (
                  <Alert variant="warning" className="small py-2 mb-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {lookupError}
                  </Alert>
                )}

                {/* Verified GitHub Card */}
                {githubProfile && (
                  <Card className="border bg-light-subtle p-3 mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={githubProfile.avatar_url}
                        alt={githubProfile.username}
                        className="rounded-circle border"
                        width="54"
                        height="54"
                      />
                      <div className="flex-grow-1">
                        <div className="fw-bold text-body d-flex align-items-center gap-2">
                          <span>{githubProfile.name}</span>
                          <Badge bg="success" className="font-monospace">Verified GitHub</Badge>
                        </div>
                        <div className="text-muted small">@{githubProfile.username} &bull; {githubProfile.public_repos_count} Public Repositories</div>
                        {githubProfile.bio && <div className="small text-secondary mt-1">{githubProfile.bio}</div>}
                      </div>
                    </div>
                  </Card>
                )}
              </Card.Body>
            </Card>

            {/* Section 3: Repository Selection & Database Sync */}
            <Card className="card-custom border-0 shadow-sm mb-4">
              <Card.Header className="bg-transparent border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                  <Badge bg="primary" pill>3</Badge>
                  <span className="fw-bold text-body">Repository Selection & Database Sync</span>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                {/* Checkbox: Track all public repos */}
                <Form.Check
                  type="switch"
                  id="trackAllSwitch"
                  label="Track all public repositories owned by this GitHub user automatically"
                  checked={formData.track_all_public_repos}
                  onChange={(e) => setFormData({ ...formData, track_all_public_repos: e.target.checked })}
                  className="mb-3 fw-semibold text-body"
                />

                {/* Discovered GitHub Repos List */}
                {githubProfile && githubProfile.repositories?.length > 0 && !formData.track_all_public_repos && (
                  <div className="mb-4">
                    <div className="small fw-semibold text-muted mb-2">Select Individual Repositories to Track:</div>
                    <div className="overflow-auto border rounded p-2" style={{ maxHeight: '220px' }}>
                      <ListGroup variant="flush">
                        {githubProfile.repositories.map((repo) => (
                          <ListGroup.Item
                            key={repo.full_name}
                            action
                            onClick={() => toggleRepoSelection(repo.full_name)}
                            className="d-flex align-items-center justify-content-between p-2 rounded mb-1"
                          >
                            <div className="d-flex align-items-center gap-2 text-truncate">
                              <Form.Check
                                type="checkbox"
                                checked={selectedRepos.includes(repo.full_name)}
                                onChange={() => {}}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div>
                                <span className="fw-semibold text-body small">{repo.name}</span>
                                {repo.description && <span className="text-muted small ms-2 d-none d-md-inline text-truncate">{repo.description}</span>}
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <Badge bg="secondary-subtle" className="text-body small">{repo.language}</Badge>
                              <span className="small text-muted">⭐ {repo.stars}</span>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  </div>
                )}

                {/* Custom / Course Repository URLs */}
                <div className="mb-3">
                  <Form.Label className="small fw-semibold">Add Course or Specific Repository (e.g. <code>org/course-project</code>)</Form.Label>
                  <InputGroup className="mb-2">
                    <Form.Control
                      type="text"
                      placeholder="e.g. univ-cs/compiler-design-project or https://github.com/..."
                      value={customRepoInput}
                      onChange={(e) => setCustomRepoInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomRepo(); } }}
                    />
                    <Button variant="outline-secondary" type="button" onClick={handleAddCustomRepo}>
                      <i className="bi bi-plus-lg me-1"></i> Add Repo
                    </Button>
                  </InputGroup>

                  {customReposList.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {customReposList.map((r) => (
                        <Badge key={r} bg="light" text="dark" className="border py-2 px-3 d-flex align-items-center gap-2 font-monospace">
                          <span>{r}</span>
                          <i
                            className="bi bi-x-circle text-danger"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleRemoveCustomRepo(r)}
                          ></i>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Auto Sync Checkbox */}
                <div className="p-3 bg-primary-subtle rounded mt-3">
                  <Form.Check
                    type="checkbox"
                    id="autoSyncCheck"
                    label="Immediately synchronize repository commits, pull requests, and issues into SQLite database upon registration"
                    checked={formData.auto_sync}
                    onChange={(e) => setFormData({ ...formData, auto_sync: e.target.checked })}
                    className="fw-semibold text-primary"
                  />
                  <small className="text-muted d-block mt-1">
                    Connects directly to the GitHub REST API to pull past commits and calculate the student's initial activity ranking score.
                  </small>
                </div>
              </Card.Body>
            </Card>

            {/* Form Submit Actions */}
            <div className="d-flex align-items-center justify-content-between pt-2">
              <Button variant="outline-secondary" onClick={() => navigate('/students')}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                type="submit"
                disabled={submitting}
                className="d-flex align-items-center gap-2 px-4 shadow-sm"
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" />
                    <span>Registering & Syncing GitHub...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-arrow-up-fill"></i>
                    <span>Register Student & Sync Database</span>
                  </>
                )}
              </Button>
            </div>
          </Form>
        )}
      </Container>
    </div>
  );
};

export default StudentRegistration;
