import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup, Modal, Badge, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ExportButton from '../components/ExportButton';
import { getRankBadge } from '../utils/formatters';
import api from '../services/api';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    email: '',
    github_username: '',
    department: 'Computer Science & Engineering',
    batch: '2024-2028',
  });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/students${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setStudents(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load students list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenAdd = () => {
    setFormData({
      student_id: '',
      name: '',
      email: '',
      github_username: '',
      department: 'Computer Science & Engineering',
      batch: '2024-2028',
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (student, e) => {
    e.stopPropagation();
    setSelectedStudent(student);
    setFormData({
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      github_username: student.github_username,
      department: student.department || 'Computer Science & Engineering',
      batch: student.batch || '2024-2028',
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleOpenDelete = (student, e) => {
    e.stopPropagation();
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (showAddModal) {
        await api.post('/students', formData);
        setShowAddModal(false);
      } else {
        await api.put(`/students/${selectedStudent.id}`, formData);
        setShowEditModal(false);
      }
      fetchStudents();
    } catch (err) {
      setFormError(err.message || 'Failed to save student record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setSaving(true);
    try {
      await api.delete(`/students/${selectedStudent.id}`);
      setShowDeleteModal(false);
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to delete student.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-5">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-body mb-1">Student Management</h3>
          <p className="text-muted small mb-0">
            Enrolled student cohort, registered GitHub identities, and dynamic activity metrics.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => navigate('/students/register')} className="d-flex align-items-center gap-2">
            <i className="bi bi-cloud-arrow-up-fill"></i>
            <span>Register & Sync Repos</span>
          </Button>
          <Button variant="outline-primary" size="sm" onClick={handleOpenAdd} className="d-flex align-items-center gap-2">
            <i className="bi bi-person-plus-fill"></i>
            <span>Quick Add</span>
          </Button>
          <ExportButton dataType="students" label="Export Cohort" size="sm" />
        </div>
      </div>

      {/* Filter and Search Bar */}
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
                  placeholder="Search by student name, ID, GitHub username, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="shadow-none border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={6} className="text-md-end text-muted small">
              Showing <strong>{students.length}</strong> active students
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Error Alert */}
      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Students Table */}
      {loading ? (
        <LoadingSpinner message="Fetching student cohort records..." />
      ) : students.length === 0 ? (
        <EmptyState
          icon="bi-mortarboard"
          title="No Students Found"
          description={search ? `No student matching "${search}".` : "No students registered yet. Click 'Add Student' to get started."}
          actionLabel="Add First Student"
          onAction={handleOpenAdd}
        />
      ) : (
        <Card className="card-custom border-0">
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '80px' }}>Rank</th>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>GitHub Username</th>
                  <th className="text-center">Repos</th>
                  <th className="text-center">Commits</th>
                  <th className="text-center">PRs</th>
                  <th className="text-center">Issues</th>
                  <th className="text-center">Score</th>
                  <th className="text-center">Status</th>
                  <th className="text-end" style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const badge = s.rank ? getRankBadge(s.rank) : null;
                  return (
                    <tr
                      key={s.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/students/${s.id}`)}
                    >
                      <td>
                        {badge ? (
                          <span className={badge.className} style={{ fontSize: '0.75rem' }}>{badge.medal}</span>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>
                      <td className="font-monospace fw-semibold text-body">{s.student_id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img src={s.avatar_url} alt={s.name} className="rounded-circle" width="32" height="32" />
                          <div>
                            <div className="fw-semibold text-body">{s.name}</div>
                            <small className="text-muted">{s.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <a
                          href={`https://github.com/${s.github_username}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="d-inline-flex align-items-center gap-1 text-decoration-none"
                        >
                          <i className="bi bi-github"></i>
                          <span>@{s.github_username}</span>
                        </a>
                      </td>
                      <td className="text-center font-monospace">{s.repositories_count}</td>
                      <td className="text-center font-monospace fw-semibold text-primary">{s.commits_count}</td>
                      <td className="text-center font-monospace">{s.prs_count}</td>
                      <td className="text-center font-monospace">{s.issues_count}</td>
                      <td className="text-center font-monospace fw-bold text-success">{s.score}</td>
                      <td className="text-center">
                        <Badge bg={s.is_active ? 'success-subtle' : 'secondary-subtle'} className={s.is_active ? 'text-success' : 'text-secondary'}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <Button
                            variant="light"
                            size="sm"
                            onClick={(e) => handleOpenEdit(s, e)}
                            title="Edit Student Info"
                            className="border text-secondary p-1 px-2"
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </Button>
                          <Button
                            variant="light"
                            size="sm"
                            onClick={(e) => handleOpenDelete(s, e)}
                            title="Delete Student"
                            className="border text-danger p-1 px-2"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {/* Add / Edit Student Modal */}
      <Modal show={showAddModal || showEditModal} onHide={() => { setShowAddModal(false); setShowEditModal(false); }} centered>
        <Form onSubmit={handleSaveStudent}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-5">
              {showAddModal ? 'Register New Student' : 'Edit Student Details'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {formError && <Alert variant="danger" className="small py-2 mb-3">{formError}</Alert>}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="formStudentId">
                  <Form.Label className="small fw-semibold">Academic Student ID / Roll No</Form.Label>
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
                <Form.Group controlId="formGitHubUsername">
                  <Form.Label className="small fw-semibold">GitHub Username</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>@</InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="octocat"
                      value={formData.github_username}
                      onChange={(e) => setFormData({ ...formData, github_username: e.target.value })}
                      required
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group controlId="formStudentName">
                  <Form.Label className="small fw-semibold">Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Alex Johnson"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group controlId="formStudentEmail">
                  <Form.Label className="small fw-semibold">University Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="alex.johnson@university.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="formDepartment">
                  <Form.Label className="small fw-semibold">Department</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="formBatch">
                  <Form.Label className="small fw-semibold">Academic Batch</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : showAddModal ? 'Register Student' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger fw-bold fs-5">Confirm Student Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          Are you sure you want to remove <strong>{selectedStudent?.name}</strong> ({selectedStudent?.student_id})? All associated student records will be permanently deleted.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={saving}>
            {saving ? 'Deleting...' : 'Delete Student'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Students;
