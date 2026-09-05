import React from 'react';
import { Target, Award, Dumbbell, Compass, CheckCircle } from 'lucide-react';
import Card from '../../../components/common/Card';

export default function AboutSection() {
  return (
    <section id="about" className="section about-section">
      <div className="container">
        <div className="about-grid">
          {/* Left: Visual Collage */}
          <div className="about-visual">
            <div className="about-image-main glass-panel">
              <img
                src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80"
                alt="Gym equipment and training arena"
                className="about-img"
              />
            </div>
            <div className="about-badge-card glass-panel animate-float">
              <div className="badge-card-icon">
                <Award size={28} />
              </div>
              <div className="badge-card-text">
                <span className="badge-title">10+ Years</span>
                <span className="badge-sub">Excellence in Fitness & Coaching</span>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="about-content">
            <span className="section-subtitle">ABOUT IRONFORGE</span>
            <h2 className="section-title">
              WHERE DISCIPLINE MEETS <span className="text-gradient-orange">RESULTS.</span>
            </h2>
            <p className="about-description">
              IronForge Fitness was founded with a single mission: to create an empowering, scientifically backed training sanctuary where every individual—from total beginners to seasoned athletes—can shatter their physical barriers.
            </p>
            <p className="about-description">
              Our 18,000 sq. ft. facility combines heavy powerlifting platforms, high-performance cardio zones, Olympic lifting rigs, and dedicated recovery suites into one unified training experience.
            </p>

            <div className="about-pillars">
              <div className="pillar-item">
                <div className="pillar-icon">
                  <Dumbbell size={20} />
                </div>
                <div className="pillar-info">
                  <h4>Next-Gen Equipment</h4>
                  <p>Hammer Strength, Eleiko, and Rogue calibrated gear maintained daily.</p>
                </div>
              </div>

              <div className="pillar-item">
                <div className="pillar-icon">
                  <Target size={20} />
                </div>
                <div className="pillar-info">
                  <h4>Custom Goal Tracking</h4>
                  <p>Integrated workout logs and structured progress tracking for members.</p>
                </div>
              </div>

              <div className="pillar-item">
                <div className="pillar-icon">
                  <Compass size={20} />
                </div>
                <div className="pillar-info">
                  <h4>Holistic Well-being</h4>
                  <p>Infrared saunas, steam rooms, and post-workout nutritional shake bar.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
