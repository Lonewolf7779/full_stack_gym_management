import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, Dumbbell } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import Badge from '../common/Badge';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Show loading state while checking session
  if (loading) {
    return (
      <div className="auth-loading-screen" style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '3px solid rgba(255, 77, 0, 0.2)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Verifying IronForge session...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 2. Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Role authorization check
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    const getDashboardPath = (role) => {
      if (role === 'admin') return '/admin';
      if (role === 'trainer') return '/trainer';
      return '/member';
    };

    return (
      <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <Card className="glass-panel" style={{ maxWidth: '520px', width: '100%', textAlign: 'center', padding: '2.5rem 2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            color: '#ef4444'
          }}>
            <ShieldAlert size={32} />
          </div>

          <Badge variant="warning" size="md" style={{ marginBottom: '1rem' }}>
            403 - ACCESS FORBIDDEN
          </Badge>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Unauthorized Role</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Your account role (<strong style={{ color: 'var(--primary)', textTransform: 'capitalize' }}>{user.role}</strong>) does not have permission to view this section. This area requires: <strong style={{ color: '#ffffff' }}>{allowedRoles.join(' or ')}</strong> privileges.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={getDashboardPath(user.role)}>
              <Button variant="primary" size="md">
                Go to My Dashboard ({user.role})
              </Button>
            </Link>
            <Link to="/">
              <Button variant="secondary" size="md" icon={ArrowLeft} iconPosition="left">
                Back to Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // 4. Authenticated & Authorized
  return children;
}
