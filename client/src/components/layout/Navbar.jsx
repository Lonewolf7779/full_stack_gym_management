import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dumbbell, Menu, X, User, Sparkles, LogOut, LayoutDashboard, Shield, Award, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Badge from '../common/Badge';
import './Navbar.css';

export default function Navbar({ serverStatus }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);

      if (isHomePage) {
        const sections = ['home', 'about', 'features', 'memberships', 'trainers', 'why-us', 'reviews'];
        const scrollPos = window.scrollY + 200;

        for (const section of sections) {
          const el = document.getElementById(section);
          if (el) {
            const top = el.offsetTop;
            const height = el.offsetHeight;
            if (scrollPos >= top && scrollPos < top + height) {
              setActiveSection(section);
              break;
            }
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (!isHomePage) {
      navigate(`/#${id}`);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getDashboardPath = (role) => {
    if (role === 'admin') return '/admin';
    if (role === 'trainer') return '/trainer';
    return '/member';
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <header className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-logo" onClick={() => scrollToSection('home')}>
          <div className="logo-icon-wrap">
            <Dumbbell className="logo-icon" size={24} />
          </div>
          <div className="logo-text">
            <span className="logo-title">IRON<span className="logo-highlight">FORGE</span></span>
            <span className="logo-subtitle">FITNESS & PERFORMANCE</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-desktop">
          <ul className="nav-links">
            <li>
              <button
                className={`nav-link ${activeSection === 'home' && isHomePage ? 'active' : ''}`}
                onClick={() => scrollToSection('home')}
              >
                Home
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${activeSection === 'about' && isHomePage ? 'active' : ''}`}
                onClick={() => scrollToSection('about')}
              >
                About
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${activeSection === 'features' && isHomePage ? 'active' : ''}`}
                onClick={() => scrollToSection('features')}
              >
                Features
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${activeSection === 'memberships' && isHomePage ? 'active' : ''}`}
                onClick={() => scrollToSection('memberships')}
              >
                Plans
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${activeSection === 'trainers' && isHomePage ? 'active' : ''}`}
                onClick={() => scrollToSection('trainers')}
              >
                Coaches
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${activeSection === 'why-us' && isHomePage ? 'active' : ''}`}
                onClick={() => scrollToSection('why-us')}
              >
                Why Us
              </button>
            </li>
          </ul>
        </nav>

        {/* Server Status & CTA Actions */}
        <div className="navbar-actions">
          {/* Backend Status Indicator */}
          <div
            className={`server-indicator ${serverStatus?.online ? 'status-online' : 'status-offline'}`}
            title={`Backend API: ${serverStatus?.online ? 'Connected' : 'Connecting'}`}
          >
            <span className="status-dot"></span>
            <span className="status-text">{serverStatus?.online ? 'API Live' : 'API Connecting'}</span>
          </div>

          {isAuthenticated ? (
            /* Authenticated User Actions */
            <div className="navbar-user-group">
              <Link to={getDashboardPath(user?.role)}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={LayoutDashboard}
                  iconPosition="left"
                  className="btn-user-dashboard"
                >
                  <span className="user-nav-name">{user?.name?.split(' ')[0]}</span>
                  <span className="user-nav-role">({user?.role})</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                icon={LogOut}
                onClick={handleLogout}
                title="Log Out"
                className="btn-logout"
              >
                Logout
              </Button>
            </div>
          ) : (
            /* Guest Actions */
            <div className="navbar-guest-group">
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={User}
                  iconPosition="left"
                  className="btn-login-trigger"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Sparkles}
                >
                  Join Now
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'drawer-open' : ''}`}>
        <div className="mobile-drawer-content">
          <ul className="mobile-nav-links">
            <li>
              <button onClick={() => scrollToSection('home')}>Home</button>
            </li>
            <li>
              <button onClick={() => scrollToSection('about')}>About Us</button>
            </li>
            <li>
              <button onClick={() => scrollToSection('features')}>Features & Benefits</button>
            </li>
            <li>
              <button onClick={() => scrollToSection('memberships')}>Membership Plans</button>
            </li>
            <li>
              <button onClick={() => scrollToSection('trainers')}>Expert Coaches</button>
            </li>
            <li>
              <button onClick={() => scrollToSection('why-us')}>Why Choose IronForge</button>
            </li>
          </ul>

          <div className="mobile-drawer-footer">
            {isAuthenticated ? (
              <>
                <Link to={getDashboardPath(user?.role)} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" fullWidth size="md" icon={LayoutDashboard}>
                    Open Dashboard ({user?.role})
                  </Button>
                </Link>
                <Button variant="outline" fullWidth size="md" icon={LogOut} onClick={handleLogout}>
                  Sign Out ({user?.name})
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" fullWidth size="md" icon={User}>
                    Member / Staff Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" fullWidth size="md" icon={Sparkles}>
                    Create Member Account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
