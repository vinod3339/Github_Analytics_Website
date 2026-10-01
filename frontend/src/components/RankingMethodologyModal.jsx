import React from 'react';
import { Modal, Button, Table, Badge, Card } from 'react-bootstrap';

const RankingMethodologyModal = ({ show, onHide, weights = {} }) => {
  const wCommit = weights.commits !== undefined ? weights.commits : 30;
  const wPR = weights.pull_requests !== undefined ? weights.pull_requests : 20;
  const wIssue = weights.issues !== undefined ? weights.issues : 10;
  const wReview = weights.reviews !== undefined ? weights.reviews : 15;
  const wRepo = weights.repositories !== undefined ? weights.repositories : 15;
  const wCons = weights.consistency !== undefined ? weights.consistency : 10;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="border-bottom">
        <Modal.Title className="d-flex align-items-center gap-2">
          <i className="bi bi-award-fill text-warning"></i>
          <span>GitHub Activity Scoring Methodology</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <div className="alert alert-primary d-flex align-items-start gap-3 mb-4">
          <i className="bi bi-info-circle-fill fs-4 text-primary flex-shrink-0"></i>
          <div>
            <div className="fw-bold mb-1">Holistic Academic Evaluation Model</div>
            <div className="small">
              The GitHub Activity Score evaluates student engagement across multiple engineering dimensions rather than raw commit counts alone. This discourages spam commits and rewards collaborative pull requests, active code reviews, and sustained contribution.
            </div>
          </div>
        </div>

        <h6 className="fw-bold mb-3 text-body">1. Mathematical Formula</h6>
        <Card className="bg-light border-0 mb-4">
          <Card.Body className="font-monospace small text-body p-3">
            Activity Score = (Norm(Commits) × {wCommit}%) + (Norm(PRs) × {wPR}%) + (Norm(Issues) × {wIssue}%) + (Norm(Reviews) × {wReview}%) + (Norm(Repositories) × {wRepo}%) + (Norm(Consistency) × {wCons}%)
          </Card.Body>
        </Card>

        <h6 className="fw-bold mb-3 text-body">2. Scoring Components & Weights</h6>
        <Table responsive bordered hover className="align-middle">
          <thead className="table-light">
            <tr>
              <th>Component</th>
              <th className="text-center" style={{ width: '100px' }}>Weight</th>
              <th>Evaluation Criteria</th>
              <th>Normalization Method</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="fw-semibold">Commits</div>
                <small className="text-muted">Code Additions & Refactors</small>
              </td>
              <td className="text-center">
                <Badge bg="primary">{wCommit}%</Badge>
              </td>
              <td className="small">Total code commits pushed to main/feature branches.</td>
              <td className="small text-muted font-monospace">(Student Commits / Max Cohort Commits) × 100</td>
            </tr>
            <tr>
              <td>
                <div className="fw-semibold">Pull Requests</div>
                <small className="text-muted">Collaboration & Feature Work</small>
              </td>
              <td className="text-center">
                <Badge bg="success">{wPR}%</Badge>
              </td>
              <td className="small">Created, merged, and actively submitted pull requests.</td>
              <td className="small text-muted font-monospace">(Student PRs / Max Cohort PRs) × 100</td>
            </tr>
            <tr>
              <td>
                <div className="fw-semibold">Issues</div>
                <small className="text-muted">Bug Tracking & Planning</small>
              </td>
              <td className="text-center">
                <Badge bg="warning" text="dark">{wIssue}%</Badge>
              </td>
              <td className="small">Reported bugs, architectural tasks, and discussion issues.</td>
              <td className="small text-muted font-monospace">(Student Issues / Max Cohort Issues) × 100</td>
            </tr>
            <tr>
              <td>
                <div className="fw-semibold">Code Reviews</div>
                <small className="text-muted">Peer Feedback & Mentorship</small>
              </td>
              <td className="text-center">
                <Badge bg="info">{wReview}%</Badge>
              </td>
              <td className="small">Approved PRs, comments, and constructive peer reviews.</td>
              <td className="small text-muted font-monospace">(Student Reviews / Max Cohort Reviews) × 100</td>
            </tr>
            <tr>
              <td>
                <div className="fw-semibold">Repository Scope</div>
                <small className="text-muted">Cross-Project Breadth</small>
              </td>
              <td className="text-center">
                <Badge bg="secondary">{wRepo}%</Badge>
              </td>
              <td className="small">Active participation across distinct tracked repositories.</td>
              <td className="small text-muted font-monospace">(Student Repos / Total Tracked Repos) × 100</td>
            </tr>
            <tr>
              <td>
                <div className="fw-semibold">Consistency</div>
                <small className="text-muted">Active Coding Cadence</small>
              </td>
              <td className="text-center">
                <Badge bg="dark">{wCons}%</Badge>
              </td>
              <td className="small">Distinct active days with engineering contributions.</td>
              <td className="small text-muted font-monospace">(Active Days / Max Cohort Active Days) × 100</td>
            </tr>
          </tbody>
        </Table>

        <h6 className="fw-bold mt-4 mb-2 text-body">3. Honors & Badges</h6>
        <div className="d-flex flex-wrap gap-2">
          <span className="rank-badge rank-gold">🥇 Gold (Rank 1)</span>
          <span className="rank-badge rank-silver">🥈 Silver (Rank 2)</span>
          <span className="rank-badge rank-bronze">🥉 Bronze (Rank 3)</span>
          <span className="badge bg-secondary p-2">Rank 4 onwards</span>
        </div>
      </Modal.Body>
      <Modal.Footer className="border-top">
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RankingMethodologyModal;
