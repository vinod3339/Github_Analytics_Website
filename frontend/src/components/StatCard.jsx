import React from 'react';
import { Card } from 'react-bootstrap';
import { formatNumber } from '../utils/formatters';

const StatCard = ({
  title,
  value,
  icon,
  color = 'primary',
  subtitle,
  trend,
  onClick,
}) => {
  const colorMap = {
    primary: { bg: 'rgba(37, 99, 235, 0.1)', text: '#2563eb' },
    success: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
    info: { bg: 'rgba(6, 182, 212, 0.1)', text: '#06b6d4' },
    purple: { bg: 'rgba(147, 51, 234, 0.1)', text: '#9333ea' },
    danger: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
  };

  const scheme = colorMap[color] || colorMap.primary;

  return (
    <Card
      className="card-custom h-100 border-0"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <Card.Body className="d-flex align-items-center justify-content-between p-3 p-lg-4">
        <div>
          <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
            {title}
          </div>
          <div className="fs-2 fw-bold text-body mt-1">{formatNumber(value)}</div>
          {subtitle && (
            <div className="text-muted small mt-1 d-flex align-items-center gap-1">
              {trend && (
                <span className={`text-${trend > 0 ? 'success' : 'danger'} fw-semibold`}>
                  <i className={`bi bi-arrow-${trend > 0 ? 'up' : 'down'}-short`}></i>
                  {Math.abs(trend)}%
                </span>
              )}
              <span>{subtitle}</span>
            </div>
          )}
        </div>
        <div
          className="stat-icon-wrapper flex-shrink-0"
          style={{ backgroundColor: scheme.bg, color: scheme.text }}
        >
          <i className={`bi ${icon}`}></i>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StatCard;
