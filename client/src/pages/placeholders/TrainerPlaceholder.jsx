import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Award, CheckCircle2, Dumbbell, Users, Calendar, LogOut } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import './Placeholder.css';

export default function TrainerPlaceholder() {
  const { user, logout } = useAuth();

  return (
    <div className="placeholder-page">
      <div className="container">
        <Card className="placeholder-card glass-panel">
          {/* Header */}
          <div className="placeholder-header">
            <div className="placeholder-user-info">
              <div className="placeholder-avatar avatar-trainer">
                <Award size={28} />
              </div>
              <div className="placeholder-details">
                <h2>{user?.name}</h2>
                <span className="placeholder-email">{user?.email}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Badge variant="secondary" size="md">
                TRAINER PORTAL
              </Badge>
              <Button variant="secondary" size="sm" icon={LogOut} onClick={logout}>
                Logout
              </Button>
            </div>
          </div>

          {/* Verification Status Banner */}
          <div className="placeholder-status-banner">
            <CheckCircle2 size={24} className="status-check-icon" />
            <div>
              <h3 className="status-title">Trainer Authentication & Role Authorization Active</h3>
              <p className="status-desc">
                Phase 3 authentication is fully functional. You have successfully verified access to the protected Trainer portal. Workout planning and member roster management will be implemented in subsequent phases.
              </p>
            </div>
          </div>

          {/* Session Overview Stats */}
          <div className="placeholder-info-grid">
            <div className="info-stat-card">
              <span className="info-stat-label">User ID</span>
              <span className="info-stat-value" style={{ fontSize: '0.88rem', fontFamily: 'monospace' }}>
                {user?.id}
              </span>
            </div>
            <div className="info-stat-card">
              <span className="info-stat-label">Assigned Role</span>
              <span className="info-stat-value" style={{ color: 'var(--secondary)', textTransform: 'uppercase' }}>
                {user?.role}
              </span>
            </div>
            <div className="info-stat-card">
              <span className="info-stat-label">Session Security</span>
              <span className="info-stat-value" style={{ color: '#34d399' }}>
                HTTP-Only JWT Cookie
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
