import React, { useState, useEffect } from 'react';
import { Dumbbell, Menu, X, ShieldCheck, User, Sparkles, Activity } from 'lucide-react';
import Button from '../common/Button';
import './Navbar.css';

export default function Navbar({ serverStatus }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);

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
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-container">
        {/* Brand Logo */}
        <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }} className="navbar-logo">
          <div className="logo-icon-wrap">
            <Dumbbell className="logo-icon" size={24} />
          </div>
          <div className="logo-text">
            <span className="logo-title">IRON<span className="logo-highlight">FORGE</span></span>
            <span className="logo-subtitle">FITNESS & PERFORMANCE</span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="nav-desktop">
          <ul className="nav-links">
            <li>
              <button
                className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
                onClick={() => scrollToSection('home')}
              >
                Home
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
                onClick={() => scrollToSection('about')}
              >
                About
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${activeSection === 'features' ? 'active' : ''}`}
                onClick={() => scrollToSection('features')}
              >
                Features
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${activeSection === 'memberships' ? 'active' : ''}`}
                onClick={() => scrollToSection('memberships')}
              >
                Plans
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${activeSection === 'trainers' ? 'active' : ''}`}
                onClick={() => scrollToSection('trainers')}
              >
                Coaches
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${activeSection === 'why-us' ? 'active' : ''}`}
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
          <div className={`server-indicator ${serverStatus?.online ? 'status-online' : 'status-offline'}`} title={`Backend API: ${serverStatus?.online ? 'Connected' : 'Connecting'}`}>
            <span className="status-dot"></span>
            <span className="status-text">{serverStatus?.online ? 'API Live' : 'API Connecting'}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            icon={User}
            iconPosition="left"
            onClick={() => scrollToSection('memberships')}
            className="btn-login-trigger"
          >
            Portal
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Sparkles}
            onClick={() => scrollToSection('memberships')}
          >
            Join Now
          </Button>

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
            <Button
              variant="outline"
              fullWidth
              size="md"
              onClick={() => scrollToSection('memberships')}
            >
              Member Portal
            </Button>
            <Button
              variant="primary"
              fullWidth
              size="md"
              onClick={() => scrollToSection('memberships')}
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
