import React from 'react';
import { Button } from 'react-bootstrap';

const EmptyState = ({
  icon = 'bi-inbox',
  title = 'No Data Available',
  description = 'There are currently no records found for this section.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="text-center py-5 px-3">
      <div
        className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle mb-3 p-4"
        style={{ width: '80px', height: '80px' }}
      >
        <i className={`bi ${icon} text-secondary fs-1`}></i>
      </div>
      <h5 className="fw-semibold text-body mb-2">{title}</h5>
      <p className="text-muted mx-auto mb-4" style={{ maxWidth: '420px' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} className="d-inline-flex align-items-center gap-2">
          <i className="bi bi-plus-lg"></i>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
