import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 992) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const handleSyncComplete = () => {
    setSyncVersion((v) => v + 1);
  };

  return (
    <div className="app-container">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="main-wrapper">
        <Navbar
          onToggleSidebar={handleToggleSidebar}
          onSyncComplete={handleSyncComplete}
        />
        <main className="p-3 p-lg-4 flex-grow-1">
          <Outlet context={{ syncVersion, onSyncComplete: handleSyncComplete }} />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
