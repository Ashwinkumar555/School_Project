import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage, { getDashboardRouteForRole } from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardShell from './pages/DashboardShell';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import ParentDashboard from './pages/dashboards/ParentDashboard';
import LocalHeadDashboard from './pages/dashboards/LocalHeadDashboard';
import AlumniDashboard from './pages/dashboards/AlumniDashboard';
import NgoDashboard from './pages/dashboards/NgoDashboard';
import VillagerDashboard from './pages/dashboards/VillagerDashboard';
import CommunityDashboard from './pages/dashboards/CommunityDashboard';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Strict Role-Protected Route wrapper (denies access and redirects to user's registered role dashboard if role does not match)
const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role;
  const isAllowed =
    Array.isArray(allowedRoles) &&
    (allowedRoles.includes(userRole) ||
      (userRole === 'villager' && allowedRoles.includes('community_member')));

  if (!isAllowed) {
    // If a user manually changes URL to another role's dashboard:
    // Deny access, do not display protected dashboard, redirect to their own registered role's dashboard
    return <Navigate to={getDashboardRouteForRole(userRole)} replace />;
  }

  return children;
};

// Public Route wrapper (redirects authenticated users directly to dashboard)
const PublicOnlyRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user?.role) {
    return <Navigate to={getDashboardRouteForRole(user.role)} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route
              index
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route path="landing" element={<LandingPage />} />
            <Route path="home" element={<LandingPage />} />
            <Route
              path="register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />

            {/* General Dashboard (auto-routes based on role) */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <DashboardShell />
                </ProtectedRoute>
              }
            />

            {/* Strict Role-Protected Dashboard Routes for all 8 roles */}
            {/* 1. Headmaster / Admin Dashboard */}
            <Route
              path="dashboard/admin"
              element={
                <RoleProtectedRoute allowedRoles={['headmaster_admin', 'admin']}>
                  <AdminDashboard />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="dashboard/headmaster"
              element={
                <RoleProtectedRoute allowedRoles={['headmaster_admin', 'admin']}>
                  <AdminDashboard />
                </RoleProtectedRoute>
              }
            />

            {/* 2. Teacher Dashboard */}
            <Route
              path="dashboard/teacher"
              element={
                <RoleProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </RoleProtectedRoute>
              }
            />

            {/* 3. Student Dashboard */}
            <Route
              path="dashboard/student"
              element={
                <RoleProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </RoleProtectedRoute>
              }
            />

            {/* 4. Parent / Guardian Dashboard */}
            <Route
              path="dashboard/parent"
              element={
                <RoleProtectedRoute allowedRoles={['parent', 'student_parent']}>
                  <ParentDashboard />
                </RoleProtectedRoute>
              }
            />

            {/* 5. Village Local Head Dashboard */}
            <Route
              path="dashboard/local-head"
              element={
                <RoleProtectedRoute allowedRoles={['village_head']}>
                  <LocalHeadDashboard />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="dashboard/village-head"
              element={
                <RoleProtectedRoute allowedRoles={['village_head']}>
                  <LocalHeadDashboard />
                </RoleProtectedRoute>
              }
            />

            {/* 6. School Alumni Dashboard */}
            <Route
              path="dashboard/alumni"
              element={
                <RoleProtectedRoute allowedRoles={['alumni']}>
                  <AlumniDashboard />
                </RoleProtectedRoute>
              }
            />

            {/* 7. NGO / Partner Dashboard */}
            <Route
              path="dashboard/ngo"
              element={
                <RoleProtectedRoute allowedRoles={['ngo']}>
                  <NgoDashboard />
                </RoleProtectedRoute>
              }
            />

            {/* 8. Villager Dashboard */}
            <Route
              path="dashboard/villager"
              element={
                <RoleProtectedRoute allowedRoles={['villager', 'community_member']}>
                  <VillagerDashboard />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="dashboard/community"
              element={
                <RoleProtectedRoute allowedRoles={['villager', 'community_member', 'community_volunteer', 'welfare_officer']}>
                  <VillagerDashboard />
                </RoleProtectedRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
