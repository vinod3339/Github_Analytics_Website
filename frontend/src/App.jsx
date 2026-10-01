import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import Repositories from './pages/Repositories';
import RepositoryDetail from './pages/RepositoryDetail';
import Commits from './pages/Commits';
import PullRequests from './pages/PullRequests';
import Issues from './pages/Issues';
import Contributors from './pages/Contributors';
import Rankings from './pages/Rankings';
import Activity from './pages/Activity';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import StudentRegistration from './pages/StudentRegistration';
import LoadingSpinner from './components/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Checking authentication status..." minHeight="100vh" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<StudentRegistration />} />
      <Route path="/register-student" element={<StudentRegistration />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/register" element={<StudentRegistration />} />
        <Route path="students/:id" element={<StudentProfile />} />
        <Route path="repositories" element={<Repositories />} />
        <Route path="repositories/:owner/:repo" element={<RepositoryDetail />} />
        <Route path="commits" element={<Commits />} />
        <Route path="pull-requests" element={<PullRequests />} />
        <Route path="issues" element={<Issues />} />
        <Route path="contributors" element={<Contributors />} />
        <Route path="rankings" element={<Rankings />} />
        <Route path="activity" element={<Activity />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
