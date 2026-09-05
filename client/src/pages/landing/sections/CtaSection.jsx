import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import Button from '../../../components/common/Button';

export default function CtaSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="section cta-section">
      <div className="container">
        <div className="cta-banner glass-panel">
          <div className="cta-content">
            <span className="section-subtitle">START YOUR JOURNEY TODAY</span>
            <h2 className="cta-title">
              READY TO <span className="text-gradient-orange">FORGE</span> YOUR STRONGEST SELF?
            </h2>
            <p className="cta-desc">
              Claim your complimentary 3-Day VIP Pass and experience our world-class gym floor, recovery suite, and training atmosphere with zero commitments.
            </p>

            {submitted ? (
              <div className="cta-success-box">
                <Check size={20} className="text-highlight" />
                <span>Thank you! Your 3-Day VIP Day Pass invitation has been dispatched to <strong>{email}</strong>.</span>
              </div>
            ) : (
              <form className="cta-form" onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="cta-input"
                  required
                />
                <Button type="submit" variant="primary" size="lg" icon={ArrowRight}>
                  Claim Free Pass
                </Button>
              </form>
            )}

            <div className="cta-trust-items">
              <div className="trust-item">
                <ShieldCheck size={16} className="trust-icon" />
                <span>Zero Credit Card Required</span>
              </div>
              <div className="trust-item">
                <ShieldCheck size={16} className="trust-icon" />
                <span>Instant Facility Keycode Access</span>
              </div>
              <div className="trust-item">
                <ShieldCheck size={16} className="trust-icon" />
                <span>Full Access to All Equipment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
