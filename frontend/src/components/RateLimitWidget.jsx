import React from 'react';
import { Card, ProgressBar, Badge } from 'react-bootstrap';
import { formatNumber, formatRelativeTime } from '../utils/formatters';

const RateLimitWidget = ({ rateLimit, onRefresh }) => {
  if (!rateLimit) return null;

  const limit = rateLimit.limit || 60;
  const remaining = rateLimit.remaining !== undefined ? rateLimit.remaining : 60;
  const used = rateLimit.used || Math.max(0, limit - remaining);
  const percentage = Math.min(100, Math.round((remaining / limit) * 100));

  let variant = 'success';
  if (percentage < 20) variant = 'danger';
  else if (percentage < 50) variant = 'warning';

  return (
    <Card className="card-custom border-0 h-100">
      <Card.Body className="p-3 p-lg-4">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-shield-lock-fill text-primary"></i>
            <span className="fw-bold text-body">GitHub API Rate Limit</span>
          </div>
          {rateLimit.authenticated ? (
            <Badge bg="success" className="d-flex align-items-center gap-1">
              <i className="bi bi-key-fill"></i> Authenticated (5,000/hr)
            </Badge>
          ) : (
            <Badge bg="warning" text="dark" className="d-flex align-items-center gap-1">
              <i className="bi bi-exclamation-triangle"></i> Unauthenticated (60/hr)
            </Badge>
          )}
        </div>

        <div className="d-flex justify-content-between align-items-baseline mb-1">
          <span className="small text-muted">Remaining Requests:</span>
          <span className="fw-bold fs-5 text-body">
            {formatNumber(remaining)} <span className="small text-muted fw-normal">/ {formatNumber(limit)}</span>
          </span>
        </div>

        <ProgressBar
          now={percentage}
          variant={variant}
          style={{ height: '8px', borderRadius: '4px' }}
          className="mb-2"
        />

        <div className="d-flex justify-content-between align-items-center small text-muted">
          <span>Used: {formatNumber(used)}</span>
          <span>Resets {formatRelativeTime(rateLimit.reset_time)}</span>
        </div>
      </Card.Body>
    </Card>
  );
};

export default RateLimitWidget;
