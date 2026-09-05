import React from 'react';
import { Star, Quote } from 'lucide-react';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';

const testimonials = [
  {
    id: 1,
    name: 'Alexander Hayes',
    role: 'Member for 1.5 Years',
    achievement: '+45 lbs Deadlift PR',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    quote:
      'IronForge transformed how I approach training. The trainers genuinely care about proper form and periodization. The equipment is always spotlessly clean and readily available.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Samantha Wei',
    role: 'Member for 8 Months',
    achievement: '-22 lbs Fat Loss & Recomp',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    quote:
      'Joining Elena’s functional conditioning sessions helped me build stamina I never thought I had. The atmosphere is encouraging and motivating without any unnecessary intimidation.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Michael Kowalski',
    role: 'Member for 2 Years',
    achievement: 'Powerlifting Meet 1st Place',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    quote:
      'The 24/7 keycard access and heavy-duty calibrated plates are unbeatable. Having the portal track my workout splits keeps my routine structured every single week.',
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section id="reviews" className="section testimonials-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-subtitle">REAL SUCCESS STORIES</span>
          <h2 className="section-title">
            TRANSFORMATIONS THAT <span className="text-gradient-orange">INSPIRE.</span>
          </h2>
          <p className="section-desc">
            Hear directly from members who took charge of their fitness journey and achieved tangible, life-changing milestones.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid-3 testimonials-grid">
          {testimonials.map((item) => (
            <Card key={item.id} className="testimonial-card" hoverEffect={true}>
              <div className="quote-icon-wrap">
                <Quote size={24} className="quote-icon" />
              </div>

              <div className="stars-row">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} size={16} className="star-filled" />
                ))}
              </div>

              <p className="testimonial-quote">"{item.quote}"</p>

              <div className="testimonial-author">
                <img src={item.avatar} alt={item.name} className="author-avatar" />
                <div className="author-info">
                  <span className="author-name">{item.name}</span>
                  <span className="author-role">{item.role}</span>
                  <Badge variant="secondary" size="sm" className="author-badge">
                    {item.achievement}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
