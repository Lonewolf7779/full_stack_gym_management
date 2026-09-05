import React from 'react';
import { ShieldCheck, Clock, HeartPulse, Sparkles, Trophy, Users2 } from 'lucide-react';
import Card from '../../../components/common/Card';

const reasons = [
  {
    icon: ShieldCheck,
    title: 'Pristine & Sanitized',
    description: 'Hospital-grade sanitization cycles conducted hourly throughout all workout zones and locker suites.',
  },
  {
    icon: Clock,
    title: '24/7 Unlimited Access',
    description: 'Work out on your schedule with secure touchless RFID smart door access at any hour of the day or night.',
  },
  {
    icon: HeartPulse,
    title: 'Infrared Recovery Suite',
    description: 'Accelerate muscular recovery and relieve soreness with state-of-the-art infrared saunas and cold plunge pools.',
  },
  {
    icon: Sparkles,
    title: 'Calibrated Gear',
    description: 'Competition-grade barbell sets, calibrated iron plates, and heavy dumbbell racks up to 150 lbs.',
  },
  {
    icon: Trophy,
    title: 'Quarterly Challenges',
    description: 'Engage in member fitness leagues, powerlifting meets, and body recomposition challenge boards.',
  },
  {
    icon: Users2,
    title: 'Supportive Brotherhood & Community',
    description: 'An ego-free, high-energy environment where members celebrate each other’s personal records.',
  },
];

export default function WhyChooseUsSection() {
  return (
    <section id="why-us" className="section why-us-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-subtitle">THE IRONFORGE ADVANTAGE</span>
          <h2 className="section-title">
            WHY ATHLETES <span className="text-gradient-orange">CHOOSE US.</span>
          </h2>
          <p className="section-desc">
            We don’t just offer access to gym equipment; we provide the complete high-performance standard required for long-term health and strength.
          </p>
        </div>

        {/* Advantage Grid */}
        <div className="grid-3 why-grid">
          {reasons.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} className="why-card" hoverEffect={true}>
                <div className="why-icon-box">
                  <Icon size={24} />
                </div>
                <h3 className="why-title">{item.title}</h3>
                <p className="why-desc">{item.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
