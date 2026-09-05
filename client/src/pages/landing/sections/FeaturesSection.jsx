import React from 'react';
import { UserCheck, Activity, CalendarCheck, TrendingUp, Sparkles, ArrowUpRight } from 'lucide-react';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';

const features = [
  {
    id: 1,
    icon: UserCheck,
    title: 'Expert Trainers',
    subtitle: 'Certified Professionals',
    description:
      'Work 1-on-1 with nationally accredited coaches who tailor every exercise to your biomechanics, goals, and training history.',
    badge: '1-on-1 Coaching',
    color: 'orange',
  },
  {
    id: 2,
    icon: Activity,
    title: 'Personalized Workouts',
    subtitle: 'Custom Daily Routines',
    description:
      'Receive dynamic workout splits crafted for hypertrophy, powerlifting, fat loss, or functional mobility with clear sets & reps.',
    badge: 'Tailored Plans',
    color: 'cyan',
  },
  {
    id: 3,
    icon: CalendarCheck,
    title: 'Flexible Memberships',
    subtitle: 'Zero Hidden Fees',
    description:
      'Choose from monthly, quarterly, or annual plans with zero sign-up traps, simple fee records, and hassle-free pause policies.',
    badge: 'Transparent Pricing',
    color: 'green',
  },
  {
    id: 4,
    icon: TrendingUp,
    title: 'Progress Tracking',
    subtitle: 'Measurable Results',
    description:
      'Log workout milestones, strength PRs, and body metrics directly inside your IronForge dashboard to visualize your growth.',
    badge: 'Analytics',
    color: 'gold',
  },
];

export default function FeaturesSection() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="features" className="section features-section">
      <div className="glow-ambient-orange" style={{ top: '20%', left: '-150px' }}></div>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-subtitle">BUILT FOR EXCELLENCE</span>
          <h2 className="section-title">
            EVERYTHING YOU NEED TO <span className="text-gradient-orange">SUCCEED.</span>
          </h2>
          <p className="section-desc">
            We deliver the ultimate training ecosystem—combining expert human coaching with clean technology to keep you consistent and motivated.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid-4 features-grid">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.id} className="feature-card" hoverEffect={true}>
                <div className="feature-card-header">
                  <div className={`feature-icon-box feature-icon-${item.color}`}>
                    <Icon size={26} />
                  </div>
                  <Badge variant={item.color === 'orange' ? 'primary' : item.color === 'cyan' ? 'secondary' : 'success'} size="sm">
                    {item.badge}
                  </Badge>
                </div>

                <div className="feature-card-body">
                  <h3 className="feature-card-title">{item.title}</h3>
                  <span className="feature-card-subtitle">{item.subtitle}</span>
                  <p className="feature-card-text">{item.description}</p>
                </div>

                <div className="feature-card-footer">
                  <button onClick={() => scrollTo('memberships')} className="feature-link">
                    <span>Learn More</span>
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
