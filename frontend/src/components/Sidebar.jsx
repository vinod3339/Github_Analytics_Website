import React from 'react';
import { NavLink } from 'react-router-dom';
import { Badge } from 'react-bootstrap';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill' },
  { path: '/students', label: 'Students', icon: 'bi-mortarboard-fill' },
  { path: '/students/register', label: 'Register Student', icon: 'bi-person-plus-fill', badge: 'Sync' },
  { path: '/repositories', label: 'Repositories', icon: 'bi-folder2-open' },
  { path: '/commits', label: 'Commits', icon: 'bi-file-earmark-code-fill' },
  { path: '/pull-requests', label: 'Pull Requests', icon: 'bi-git' },
  { path: '/issues', label: 'Issues', icon: 'bi-exclamation-circle-fill' },
  { path: '/contributors', label: 'Contributors', icon: 'bi-people-fill' },
  { path: '/rankings', label: 'Rankings', icon: 'bi-trophy-fill', badge: 'Score' },
  { path: '/activity', label: 'Activity', icon: 'bi-lightning-charge-fill' },
  { path: '/analytics', label: 'Analytics', icon: 'bi-bar-chart-line-fill' },
  { path: '/settings', label: 'Settings', icon: 'bi-gear-fill' },
];

const Sidebar = ({ collapsed, mobileOpen, onCloseMobile }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="position-fixed top-0 bottom-0 start-0 end-0 bg-dark opacity-50 d-lg-none"
          style={{ zIndex: 1035 }}
          onClick={onCloseMobile}
        />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between" style={{ height: 'var(--topbar-height)' }}>
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <div
              className="rounded-3 bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '36px', height: '36px', fontSize: '1.2rem' }}
            >
              <i className="bi bi-github"></i>
            </div>
            {!collapsed && (
              <div className="text-truncate">
                <div className="fw-bold text-body" style={{ fontSize: '0.95rem', letterSpacing: '-0.02em' }}>
                  GitHub Tracker
                </div>
                <div className="text-muted small" style={{ fontSize: '0.7rem' }}>
                  Academic Faculty Portal
                </div>
              </div>
            )}
          </div>
          {mobileOpen && (
            <button className="btn btn-sm btn-light d-lg-none" onClick={onCloseMobile}>
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="py-3 flex-grow-1 overflow-y-auto">
          {!collapsed && (
            <div className="px-3 mb-2 text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}>
              Navigation Menu
            </div>
          )}
          <nav className="nav flex-column">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `nav-link-custom ${isActive ? 'active' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <i className={`bi ${item.icon} fs-5`}></i>
                {!collapsed && (
                  <div className="d-flex align-items-center justify-content-between flex-grow-1">
                    <span>{item.label}</span>
                    {item.badge && (
                      <Badge bg="warning" text="dark" className="px-2 py-1 small rounded-pill">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        {!collapsed && (
          <div className="p-3 border-top bg-light-subtle small text-muted">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="fw-semibold">Academic Edition</span>
              <Badge bg="primary-subtle" className="text-primary">v1.0</Badge>
            </div>
            <div className="text-truncate" style={{ fontSize: '0.75rem' }}>
              FastAPI + React Dashboard
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
