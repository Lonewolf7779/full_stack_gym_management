import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import MemberDashboard from './pages/member/MemberDashboard';
import { checkServerHealth } from './services/api';

// Redirect authenticated users away from Login/Register to their respective dashboard
function PublicAuthRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated && user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'trainer') return <Navigate to="/trainer" replace />;
    return <Navigate to="/member" replace />;
  }

  return children;
}

function MainApp() {
  const [serverStatus, setServerStatus] = useState({
    online: false,
    checking: true,
    data: null,
  });

  useEffect(() => {
    let isMounted = true;

    const pingBackend = async () => {
      const res = await checkServerHealth();
      if (isMounted) {
        setServerStatus({
          online: res.online,
          checking: false,
          data: res.data || null,
        });
      }
    };

    pingBackend();

    // Check periodically every 30 seconds
    const interval = setInterval(pingBackend, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="app-layout">
      <Navbar serverStatus={serverStatus} />
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage serverStatus={serverStatus} />} />

        {/* Public Authentication Routes */}
        <Route
          path="/login"
          element={
            <PublicAuthRoute>
              <LoginPage />
            </PublicAuthRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicAuthRoute>
              <RegisterPage />
            </PublicAuthRoute>
          }
        />

        {/* Real Role-Based Dashboards */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer"
          element={
            <ProtectedRoute allowedRoles={['trainer']}>
              <TrainerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member"
          element={
            <ProtectedRoute allowedRoles={['member']}>
              <MemberDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <MainApp />
      </Router>
    </AuthProvider>
  );
}
