import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Nav, Row, Col, Badge, InputGroup, ListGroup } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const Login = () => {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' | 'student'

  // Admin Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Student Registration State
  const [studentForm, setStudentForm] = useState({
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

  // Student Submit State
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(null);

  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  // Admin Login Handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setLoginError('Please provide both username and password.');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Student GitHub Live Verification
  const handleVerifyGitHub = async () => {
    const user = studentForm.github_username.trim().replace(/^@/, '');
    if (!user) {
      setLookupError('Please enter a GitHub username to verify.');
      return;
    }

    setLookingUp(true);
    setLookupError(null);
    setGithubProfile(null);
    try {
      const res = await api.get(`/students/github-lookup/${encodeURIComponent(user)}`);
      setGithubProfile(res.data);
      if (!studentForm.name && res.data.name) {
        setStudentForm(prev => ({ ...prev, name: res.data.name }));
      }
    } catch (err) {
      setLookupError(err.message || 'GitHub username not found.');
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

  // Student Registration Submit Handler
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setRegistering(true);
    setRegisterError(null);
    setRegisterSuccess(null);

    const payload = {
      student_id: studentForm.student_id.trim(),
      name: studentForm.name.trim(),
      email: studentForm.email.trim(),
      github_username: studentForm.github_username.trim().replace(/^@/, ''),
      department: studentForm.department,
      batch: studentForm.batch,
      track_all_public_repos: studentForm.track_all_public_repos,
      selected_repositories: selectedRepos,
      custom_repository_urls: customReposList,
      auto_sync: studentForm.auto_sync,
    };

    try {
      const res = await api.post('/students/register', payload);
      setRegisterSuccess(res.data);
    } catch (err) {
      setRegisterError(err.message || 'Registration failed.');
    } finally {
      setRegistering(false);
    }
  };

  const resetStudentForm = () => {
    setStudentForm({
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
    setRegisterSuccess(null);
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center py-5 px-3" style={{ background: 'var(--body-bg)' }}>
      {/* Top right Theme switcher */}
      <div className="position-absolute top-0 end-0 p-3">
        <Button variant="light" size="sm" onClick={toggleTheme} className="border shadow-sm">
          <i className={`bi ${isDark ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill text-primary'}`}></i>
        </Button>
      </div>

      <Container style={{ maxWidth: activeTab === 'admin' ? '480px' : '760px', transition: 'max-width 0.3s ease' }}>
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-4 bg-primary text-white mb-3 shadow"
            style={{ width: '64px', height: '64px', fontSize: '2rem' }}
          >
            <i className="bi bi-github"></i>
          </div>
          <h3 className="fw-bold text-body mb-1">GitHub Tracking & Analytics</h3>
          <p className="text-muted small">Academic Engineering Monitoring & Evaluation Platform</p>
        </div>

        {/* Dual Portal Switcher Navigation */}
        <Nav variant="pills" className="nav-justified bg-light p-1 rounded-3 mb-4 border shadow-sm">
          <Nav.Item>
            <Nav.Link
              active={activeTab === 'admin'}
              onClick={() => setActiveTab('admin')}
              className="d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold"
              style={{ cursor: 'pointer' }}
            >
              <i className="bi bi-shield-lock-fill"></i>
              <span>Admin / Faculty Portal</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === 'student'}
              onClick={() => setActiveTab('student')}
              className="d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold"
              style={{ cursor: 'pointer' }}
            >
              <i className="bi bi-mortarboard-fill"></i>
              <span>Student Registration & Sync</span>
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* TAB 1: ADMIN & FACULTY LOGIN CARD */}
        {activeTab === 'admin' && (
          <Card className="card-custom border-0 shadow-lg p-3 p-sm-4 animate__animated animate__fadeIn">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="fw-bold text-body mb-0">Sign In to Dashboard</h5>
                <Badge bg="primary-subtle" className="text-primary font-monospace">Faculty Portal</Badge>
              </div>

              {loginError && (
                <Alert variant="danger" dismissible onClose={() => setLoginError(null)} className="small py-2 mb-3">
                  <i className="bi bi-exclamation-octagon-fill me-2"></i>
                  {loginError}
                </Alert>
              )}

              <Form onSubmit={handleLoginSubmit}>
                <Form.Group className="mb-3" controlId="formUsername">
                  <Form.Label className="small fw-semibold text-muted">Administrator Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="py-2"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="formPassword">
                  <Form.Label className="small fw-semibold text-muted">Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="py-2"
                    required
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 py-2 fw-semibold mb-3 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <>
                      <Spinner animation="border" size="sm" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right"></i>
                      <span>Access Faculty Dashboard</span>
                    </>
                  )}
                </Button>

                <div className="text-center pt-2 border-top">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setActiveTab('student')}
                    className="text-decoration-none small text-primary"
                  >
                    New Student? Register profile & repositories &rarr;
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        )}

        {/* TAB 2: STUDENT REGISTRATION & GITHUB SYNC PORTAL */}
        {activeTab === 'student' && (
          <Card className="card-custom border-0 shadow-lg p-3 p-sm-4 animate__animated animate__fadeIn">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div>
                  <h5 className="fw-bold text-body mb-0">Student Enrollment & GitHub Sync</h5>
                  <small className="text-muted">Connect your GitHub handle to auto-index commits and assignment repositories.</small>
                </div>
                <Badge bg="success-subtle" className="text-success font-monospace">Auto-Sync</Badge>
              </div>

              {/* Success Result Box */}
              {registerSuccess ? (
                <div className="text-center py-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success text-white mb-3"
                    style={{ width: '64px', height: '64px', fontSize: '1.8rem' }}
                  >
                    <i className="bi bi-check-lg"></i>
                  </div>
                  <h5 className="fw-bold text-body mb-1">Registration & GitHub Sync Complete!</h5>
                  <p className="text-muted small mb-4">{registerSuccess.message}</p>

                  <Row className="g-2 mb-4 justify-content-center">
                    <Col xs={6} sm={3}>
                      <Card className="border bg-light">
                        <Card.Body className="p-2">
                          <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Student ID</div>
                          <div className="fw-bold text-body font-monospace">{registerSuccess.student?.student_id}</div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={6} sm={3}>
                      <Card className="border bg-light">
                        <Card.Body className="p-2">
                          <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Tracked Repos</div>
                          <div className="fw-bold text-primary font-monospace">{registerSuccess.tracked_repositories_count}</div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={6} sm={3}>
                      <Card className="border bg-light">
                        <Card.Body className="p-2">
                          <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Commits Synced</div>
                          <div className="fw-bold text-success font-monospace">{registerSuccess.total_commits_synced}</div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={6} sm={3}>
                      <Card className="border bg-light">
                        <Card.Body className="p-2">
                          <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Activity Score</div>
                          <div className="fw-bold text-warning font-monospace">{registerSuccess.student?.score || 0}</div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-center gap-2">
                    <Button variant="outline-primary" size="sm" onClick={() => setActiveTab('admin')}>
                      <i className="bi bi-box-arrow-in-right me-1"></i> Go to Admin Dashboard
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={resetStudentForm}>
                      <i className="bi bi-person-plus me-1"></i> Register Another
                    </Button>
                  </div>
                </div>
              ) : (
                /* Registration Form */
                <Form onSubmit={handleStudentSubmit}>
                  {registerError && (
                    <Alert variant="danger" dismissible onClose={() => setRegisterError(null)} className="small py-2 mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {registerError}
                    </Alert>
                  )}

                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <Form.Group controlId="stuId">
                        <Form.Label className="small fw-semibold text-muted">Student ID / Roll No <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g. CS2024-055"
                          value={studentForm.student_id}
                          onChange={(e) => setStudentForm({ ...studentForm, student_id: e.target.value })}
                          required
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group controlId="stuName">
                        <Form.Label className="small fw-semibold text-muted">Full Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g. Sarah Connor"
                          value={studentForm.name}
                          onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                          required
                        />
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group controlId="stuEmail">
                        <Form.Label className="small fw-semibold text-muted">University Email Address <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="email"
                          placeholder="sarah.connor@university.edu"
                          value={studentForm.email}
                          onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                          required
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group controlId="stuDept">
                        <Form.Label className="small fw-semibold text-muted">Department</Form.Label>
                        <Form.Control
                          type="text"
                          value={studentForm.department}
                          onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group controlId="stuBatch">
                        <Form.Label className="small fw-semibold text-muted">Academic Batch</Form.Label>
                        <Form.Control
                          type="text"
                          value={studentForm.batch}
                          onChange={(e) => setStudentForm({ ...studentForm, batch: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* GitHub Profile Verification */}
                  <Form.Group className="mb-3" controlId="stuGitHub">
                    <Form.Label className="small fw-semibold text-muted">GitHub Username <span className="text-danger">*</span></Form.Label>
                    <InputGroup>
                      <InputGroup.Text><i className="bi bi-github"></i></InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="e.g. torvalds or octocat"
                        value={studentForm.github_username}
                        onChange={(e) => setStudentForm({ ...studentForm, github_username: e.target.value })}
                        required
                      />
                      <Button
                        variant="outline-primary"
                        type="button"
                        disabled={lookingUp || !studentForm.github_username}
                        onClick={handleVerifyGitHub}
                      >
                        {lookingUp ? <Spinner animation="border" size="sm" /> : <><i className="bi bi-check2-circle me-1"></i> Verify GitHub</>}
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  {lookupError && (
                    <Alert variant="warning" className="small py-2 mb-3">
                      <i className="bi bi-exclamation-triangle me-2"></i>{lookupError}
                    </Alert>
                  )}

                  {/* Verified GitHub Card */}
                  {githubProfile && (
                    <Card className="border bg-light-subtle p-3 mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <img src={githubProfile.avatar_url} alt={githubProfile.username} className="rounded-circle border" width="46" height="46" />
                        <div className="flex-grow-1">
                          <div className="fw-bold text-body small d-flex align-items-center gap-2">
                            <span>{githubProfile.name}</span>
                            <Badge bg="success" style={{ fontSize: '0.65rem' }}>Verified</Badge>
                          </div>
                          <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                            @{githubProfile.username} &bull; {githubProfile.public_repos_count} Public Repositories
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Repository Options */}
                  <div className="p-3 bg-light rounded mb-3 border">
                    <Form.Check
                      type="switch"
                      id="trackAllSwitchMain"
                      label="Auto-track all public repositories owned by this GitHub user"
                      checked={studentForm.track_all_public_repos}
                      onChange={(e) => setStudentForm({ ...studentForm, track_all_public_repos: e.target.checked })}
                      className="fw-semibold text-body small mb-2"
                    />

                    {/* Discovered GitHub Repos List */}
                    {githubProfile && githubProfile.repositories?.length > 0 && !studentForm.track_all_public_repos && (
                      <div className="mb-2">
                        <div className="small fw-semibold text-muted mb-1">Select repositories to track:</div>
                        <div className="overflow-auto border rounded p-2 bg-white" style={{ maxHeight: '160px' }}>
                          <ListGroup variant="flush">
                            {githubProfile.repositories.map((repo) => (
                              <ListGroup.Item
                                key={repo.full_name}
                                action
                                onClick={() => toggleRepoSelection(repo.full_name)}
                                className="d-flex align-items-center justify-content-between p-1 rounded small mb-1"
                              >
                                <div className="d-flex align-items-center gap-2 text-truncate">
                                  <Form.Check
                                    type="checkbox"
                                    checked={selectedRepos.includes(repo.full_name)}
                                    onChange={() => {}}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <span className="fw-semibold text-body">{repo.name}</span>
                                </div>
                                <Badge bg="secondary-subtle" className="text-body" style={{ fontSize: '0.7rem' }}>{repo.language}</Badge>
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        </div>
                      </div>
                    )}

                    {/* Custom Repository URL */}
                    <div className="mt-2">
                      <Form.Label className="small text-muted mb-1">Add Course / Project Repository (e.g. <code>org/assignment-repo</code>)</Form.Label>
                      <InputGroup size="sm">
                        <Form.Control
                          placeholder="e.g. univ-cs/project-1"
                          value={customRepoInput}
                          onChange={(e) => setCustomRepoInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomRepo(); } }}
                        />
                        <Button variant="outline-secondary" type="button" onClick={handleAddCustomRepo}>
                          <i className="bi bi-plus-lg"></i>
                        </Button>
                      </InputGroup>
                      {customReposList.length > 0 && (
                        <div className="d-flex flex-wrap gap-1 mt-2">
                          {customReposList.map((r) => (
                            <Badge key={r} bg="white" text="dark" className="border py-1 px-2 d-flex align-items-center gap-1 font-monospace small">
                              <span>{r}</span>
                              <i className="bi bi-x text-danger" style={{ cursor: 'pointer' }} onClick={() => handleRemoveCustomRepo(r)}></i>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="success"
                    size="lg"
                    type="submit"
                    disabled={registering}
                    className="w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  >
                    {registering ? (
                      <>
                        <Spinner animation="border" size="sm" />
                        <span>Enrolling & Syncing GitHub Database...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cloud-arrow-up-fill"></i>
                        <span>Register Student & Sync Database</span>
                      </>
                    )}
                  </Button>
                </Form>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Footer info */}
        <div className="text-center mt-4 text-muted small">
          <div>FastAPI Backend &bull; SQLite Database &bull; GitHub REST API v3 Integration</div>
          <div className="mt-1">GitHub Tracking & Analytics Dashboard &copy; 2026</div>
        </div>
      </Container>
    </div>
  );
};

export default Login;
