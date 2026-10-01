import React, { useState } from 'react';
import { Button, Dropdown, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import GlobalSearchModal from './GlobalSearchModal';
import api from '../services/api';

const Navbar = ({ onToggleSidebar, onSyncComplete }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showSearch, setShowSearch] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  // Keyboard shortcut Ctrl+K for search
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const res = await api.post('/github/sync');
      setSyncStatus({ type: 'success', message: res.data.message || 'GitHub data synced successfully!' });
      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      setSyncStatus({ type: 'danger', message: err.message || 'GitHub Sync failed.' });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  return (
    <>
      <header className="top-navbar px-3 px-lg-4 d-flex align-items-center justify-content-between">
        {/* Left: Sidebar Toggle & Search Trigger */}
        <div className="d-flex align-items-center gap-3">
          <Button
            variant="light"
            size="sm"
            onClick={onToggleSidebar}
            className="border text-secondary d-flex align-items-center justify-content-center"
            style={{ width: '38px', height: '38px' }}
            title="Toggle Navigation Sidebar"
          >
            <i className="bi bi-list fs-5"></i>
          </Button>

          <div
            onClick={() => setShowSearch(true)}
            className="d-none d-md-flex align-items-center justify-content-between px-3 py-2 rounded-3 bg-light border text-muted"
            style={{ width: '280px', cursor: 'pointer' }}
          >
            <div className="d-flex align-items-center gap-2 small">
              <i className="bi bi-search"></i>
              <span>Quick Search...</span>
            </div>
            <kbd className="bg-white border text-dark font-monospace px-2 py-0 small rounded">Ctrl+K</kbd>
          </div>
        </div>

        {/* Right Actions: Sync, Theme Toggle, User Profile */}
        <div className="d-flex align-items-center gap-2 gap-lg-3">
          {syncStatus && (
            <Badge bg={syncStatus.type} className="d-none d-lg-inline-block py-2 px-3 animate__animated animate__fadeIn">
              {syncStatus.message}
            </Badge>
          )}

          <Button
            variant="outline-primary"
            size="sm"
            disabled={syncing}
            onClick={handleSyncNow}
            className="d-flex align-items-center gap-2 px-3"
          >
            {syncing ? (
              <>
                <Spinner animation="border" size="sm" />
                <span className="d-none d-sm-inline">Syncing GitHub...</span>
              </>
            ) : (
              <>
                <i className="bi bi-arrow-repeat"></i>
                <span className="d-none d-sm-inline">Sync Now</span>
              </>
            )}
          </Button>

          <Button
            variant="light"
            size="sm"
            onClick={toggleTheme}
            className="border text-secondary d-flex align-items-center justify-content-center"
            style={{ width: '38px', height: '38px' }}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            <i className={`bi ${isDark ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill text-primary'}`}></i>
          </Button>

          {/* User Dropdown */}
          <Dropdown align="end">
            <Dropdown.Toggle variant="light" className="border d-flex align-items-center gap-2 p-1 pe-3 rounded-pill">
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}
              >
                {user?.username ? user.username[0].toUpperCase() : 'A'}
              </div>
              <div className="text-start d-none d-md-block" style={{ lineHeight: '1.2' }}>
                <div className="fw-semibold text-body" style={{ fontSize: '0.85rem' }}>
                  {user?.full_name || user?.username || 'Admin'}
                </div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                  {user?.role ? user.role.toUpperCase() : 'FACULTY'}
                </div>
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu className="shadow border-0 mt-2 p-2" style={{ minWidth: '220px' }}>
              <div className="px-3 py-2 border-bottom mb-2">
                <div className="fw-bold text-body">{user?.full_name || user?.username}</div>
                <div className="small text-muted text-truncate">{user?.email || 'admin@university.edu'}</div>
              </div>
              <Dropdown.Item href="/settings" className="rounded py-2">
                <i className="bi bi-gear me-2 text-primary"></i> System Settings
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={logout} className="rounded py-2 text-danger">
                <i className="bi bi-box-arrow-right me-2"></i> Sign Out
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </header>

      <GlobalSearchModal show={showSearch} onHide={() => setShowSearch(false)} />
    </>
  );
};

export default Navbar;
