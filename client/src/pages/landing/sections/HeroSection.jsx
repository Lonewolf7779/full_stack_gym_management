import React from 'react';
import { ArrowRight, Flame, Shield, Award, Users, CheckCircle2, Zap } from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';

export default function HeroSection() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="hero-section">
      <div className="glow-ambient-orange" style={{ top: '-100px', right: '-100px' }}></div>
      <div className="glow-ambient-cyan" style={{ bottom: '-150px', left: '-150px' }}></div>

      <div className="container hero-container">
        <div className="hero-content">
          {/* Top Badge */}
          <div className="hero-badge-wrapper">
            <Badge variant="primary" icon={Flame}>
              PREMIER FITNESS & STRENGTH FACILITY
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="hero-title">
            TRAIN <span className="text-gradient-orange">STRONG.</span><br />
            LIVE <span className="text-gradient">STRONGER.</span>
          </h1>

          {/* Description */}
          <p className="hero-description">
            Unlock your full physical potential at IronForge. Experience world-class equipment, personalized workout programs, certified elite trainers, and an unstoppable community built to conquer goals.
          </p>

          {/* Action CTAs */}
          <div className="hero-actions">
            <Button
              variant="primary"
              size="lg"
              icon={ArrowRight}
              onClick={() => scrollTo('memberships')}
            >
              Explore Memberships
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => scrollTo('about')}
            >
              Learn More
            </Button>
          </div>

          {/* Key Value Checklist */}
          <div className="hero-highlights">
            <div className="highlight-item">
              <CheckCircle2 size={18} className="highlight-icon" />
              <span>No Long-Term Lock-in</span>
            </div>
            <div className="highlight-item">
              <CheckCircle2 size={18} className="highlight-icon" />
              <span>Free Initial Fitness Assessment</span>
            </div>
            <div className="highlight-item">
              <CheckCircle2 size={18} className="highlight-icon" />
              <span>24/7 RFID Facility Access</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Card / Athletic Showcase */}
        <div className="hero-visual">
          <div className="hero-image-card glass-panel">
            <div className="hero-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80"
                alt="Athlete training in modern gym"
                className="hero-main-img"
              />
              <div className="hero-img-overlay"></div>
            </div>

            {/* Floating Metric 1: Workout Intensity */}
            <div className="floating-card float-top glass-panel animate-float">
              <div className="floating-icon-wrap icon-flame">
                <Zap size={22} />
              </div>
              <div className="floating-card-info">
                <span className="floating-label">Active Workout</span>
                <span className="floating-val">High Intensity Hypertrophy</span>
              </div>
            </div>

            {/* Floating Metric 2: Live Community Stat */}
            <div className="floating-card float-bottom glass-panel">
              <div className="floating-icon-wrap icon-users">
                <Users size={22} />
              </div>
              <div className="floating-card-info">
                <span className="floating-val">500+ Members</span>
                <span className="floating-sub">Achieving Goals This Month</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Stats Ticker */}
      <div className="hero-stats-banner">
        <div className="container stats-container">
          <div className="stat-box">
            <span className="stat-number">1,200<span className="stat-plus">+</span></span>
            <span className="stat-label">Active Members</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-box">
            <span className="stat-number">25<span className="stat-plus">+</span></span>
            <span className="stat-label">Certified Coaches</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-box">
            <span className="stat-number">45<span className="stat-plus">+</span></span>
            <span className="stat-label">Weekly Classes</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-box">
            <span className="stat-number">99<span className="stat-plus">%</span></span>
            <span className="stat-label">Success Rate</span>
          </div>
        </div>
      </div>
    </section>
  );
}
