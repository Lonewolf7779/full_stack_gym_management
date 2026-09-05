import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Dumbbell, Lock, Mail, ArrowRight, AlertCircle, Sparkles, UserCheck, Shield, Award } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const user = await login({ email, password });

      // Navigate to intended route or role-specific route
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'trainer') {
        navigate('/trainer', { replace: true });
      } else {
        navigate('/member', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  // Demo credential autofill helper
  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="glow-ambient-orange" style={{ top: '-100px', left: '-100px' }}></div>
      <div className="glow-ambient-cyan" style={{ bottom: '-150px', right: '-150px' }}></div>

      <div className="container auth-container">
        <Card className="auth-card glass-panel" padding="lg">
          {/* Header */}
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <div className="auth-logo-icon">
                <Dumbbell size={24} />
              </div>
              <span className="auth-logo-title">IRON<span className="logo-highlight">FORGE</span></span>
            </Link>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to access your IronForge portal</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-error-alert">
              <AlertCircle size={18} className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="input-wrap">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="password" className="form-label">Password</label>
              </div>
              <div className="input-wrap">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={submitting}
              icon={ArrowRight}
              className="btn-auth-submit"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo Account Quick Pickers */}
          <div className="demo-accounts-box">
            <span className="demo-label">⚡ Demo Accounts (One-Click Fill)</span>
            <div className="demo-buttons-grid">
              <button
                type="button"
                className="demo-btn demo-btn-admin"
                onClick={() => handleQuickFill('admin@ironforge.test', 'Admin@123')}
              >
                <Shield size={13} />
                <span>Admin</span>
              </button>
              <button
                type="button"
                className="demo-btn demo-btn-trainer"
                onClick={() => handleQuickFill('trainer@ironforge.test', 'Trainer@123')}
              >
                <Award size={13} />
                <span>Trainer</span>
              </button>
              <button
                type="button"
                className="demo-btn demo-btn-member"
                onClick={() => handleQuickFill('member@ironforge.test', 'Member@123')}
              >
                <UserCheck size={13} />
                <span>Member</span>
              </button>
            </div>
          </div>

          {/* Footer switch */}
          <div className="auth-card-footer">
            <p className="switch-text">
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Register as Member
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
