import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ message = 'Loading data...', minHeight = '300px' }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-5" style={{ minHeight }}>
      <Spinner animation="border" variant="primary" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <p className="mt-3 text-muted fw-medium">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
