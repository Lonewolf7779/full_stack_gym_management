import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dumbbell, Menu, X, User, Sparkles, LogOut, LayoutDashboard, Shield, Award, UserCheck, Bell, Check, CheckCheck, Trash2, Clock, CreditCard, Activity, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../services/api';
import Button from '../common/Button';
import Badge from '../common/Badge';
import './Navbar.css';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationsRef = useRef(null);

  const isHomePage = location.pathname === '/';

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Fetch unread notification count
  const loadUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      // silently handle background count fetch
    }
  };

  // Fetch full notification list
  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    setLoadingNotifications(true);
    try {
      const data = await notificationsApi.getAll({ limit: 15 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000); // 30s polling
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

  const toggleNotifications = () => {
    const nextState = !notificationsOpen;
    setNotificationsOpen(nextState);
    if (nextState) {
      loadNotifications();
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleDeleteNotification = async (id, e) => {
    e?.stopPropagation();
    try {
      await notificationsApi.delete(id);
      const target = notifications.find((n) => n._id === id);
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment_success':
      case 'membership_renewed':
        return <CreditCard size={16} className="notif-icon-success" />;
      case 'training_assigned':
      case 'exercise_assigned':
        return <Dumbbell size={16} className="notif-icon-primary" />;
      case 'progress_updated':
        return <Activity size={16} className="notif-icon-accent" />;
      case 'account_status':
        return <UserCheck size={16} className="notif-icon-warning" />;
      default:
        return <Bell size={16} className="notif-icon-default" />;
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

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

        {/* Action Controls */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            /* Authenticated User Actions */
            <div className="navbar-user-group">
              {/* Notification Bell with Dropdown */}
              <div className="notification-bell-wrapper" ref={notificationsRef}>
                <button
                  type="button"
                  className={`btn-notification-bell ${notificationsOpen ? 'active' : ''}`}
                  onClick={toggleNotifications}
                  aria-label="View notifications"
                  title="Notifications"
                >
                  <Bell size={19} />
                  {unreadCount > 0 && (
                    <span className="notif-badge-pill">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="notification-dropdown">
                    <div className="notif-dropdown-header">
                      <div className="notif-header-title">
                        <Bell size={16} />
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <span className="notif-count-tag">{unreadCount} new</span>
                        )}
                      </div>
                      <div className="notif-header-actions">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            className="btn-notif-action"
                            onClick={handleMarkAllAsRead}
                            title="Mark all as read"
                          >
                            <CheckCheck size={14} />
                            <span>Mark all read</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-notif-action-icon"
                          onClick={loadNotifications}
                          title="Refresh notifications"
                        >
                          <RefreshCw size={13} className={loadingNotifications ? 'spin' : ''} />
                        </button>
                      </div>
                    </div>

                    <div className="notif-dropdown-body">
                      {loadingNotifications && notifications.length === 0 ? (
                        <div className="notif-dropdown-empty">
                          <RefreshCw size={20} className="spin text-muted" />
                          <p>Loading alerts...</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="notif-dropdown-empty">
                          <Bell size={24} className="text-muted" />
                          <p>No notifications yet</p>
                          <span className="notif-empty-sub">We'll alert you when updates arrive.</span>
                        </div>
                      ) : (
                        <ul className="notif-dropdown-list">
                          {notifications.map((item) => (
                            <li
                              key={item._id}
                              className={`notif-dropdown-item ${!item.isRead ? 'unread' : 'read'}`}
                            >
                              <div className="notif-item-icon-wrap">
                                {getNotificationIcon(item.type)}
                              </div>
                              <div className="notif-item-content">
                                <div className="notif-item-header">
                                  <span className="notif-item-title">{item.title}</span>
                                  <span className="notif-item-time">
                                    <Clock size={11} />
                                    {formatRelativeTime(item.createdAt)}
                                  </span>
                                </div>
                                <p className="notif-item-msg">{item.message}</p>
                              </div>
                              <div className="notif-item-actions">
                                {!item.isRead && (
                                  <button
                                    type="button"
                                    className="btn-item-action mark-read"
                                    onClick={(e) => handleMarkAsRead(item._id, e)}
                                    title="Mark as read"
                                  >
                                    <Check size={14} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn-item-action delete"
                                  onClick={(e) => handleDeleteNotification(item._id, e)}
                                  title="Remove"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>

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
            type="button"
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
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
              <button
                type="button"
                className={`mobile-nav-item ${activeSection === 'home' && isHomePage ? 'active' : ''}`}
                onClick={() => scrollToSection('home')}
              >
                Home
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`mobile-nav-item ${activeSection === 'about' && isHomePage ? 'active' : ''}`}
                onClick={() => scrollToSection('about')}
              >
                About
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`mobile-nav-item ${activeSection === 'features' && isHomePage ? 'active' : ''}`}
                onClick={() => scrollToSection('features')}
              >
                Features
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`mobile-nav-item ${activeSection === 'memberships' && isHomePage ? 'active' : ''}`}
                onClick={() => scrollToSection('memberships')}
              >
                Plans
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`mobile-nav-item ${activeSection === 'trainers' && isHomePage ? 'active' : ''}`}
                onClick={() => scrollToSection('trainers')}
              >
                Coaches
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`mobile-nav-item ${activeSection === 'why-us' && isHomePage ? 'active' : ''}`}
                onClick={() => scrollToSection('why-us')}
              >
                Why Us
              </button>
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
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" fullWidth size="md" icon={Sparkles}>
                    Join Now
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
