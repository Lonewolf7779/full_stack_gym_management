import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Dumbbell, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import './LoginPage.css';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill out all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and re-type.');
      return;
    }

    try {
      setSubmitting(true);
      await register({ name, email, password });
      navigate('/member', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glow-ambient-orange" style={{ top: '-100px', right: '-100px' }}></div>
      <div className="glow-ambient-cyan" style={{ bottom: '-150px', left: '-150px' }}></div>

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
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join IronForge as a Member & start your journey</p>
          </div>

          {/* Registration Role Notice */}
          <div className="member-role-notice">
            <Badge variant="primary" size="sm">
              MEMBER ACCOUNT
            </Badge>
            <span className="notice-text">Public registration automatically creates a standard member profile.</span>
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
              <label htmlFor="name" className="form-label">Full Name</label>
              <div className="input-wrap">
                <User size={18} className="input-icon" />
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

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
              <label htmlFor="password" className="form-label">Password (Min. 6 characters)</label>
              <div className="input-wrap">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="input-wrap">
                <Lock size={18} className="input-icon" />
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
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
              {submitting ? 'Creating Account...' : 'Register Account'}
            </Button>
          </form>

          {/* Footer switch */}
          <div className="auth-card-footer">
            <p className="switch-text">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign In
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
