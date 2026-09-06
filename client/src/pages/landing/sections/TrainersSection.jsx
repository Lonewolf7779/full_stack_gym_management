import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Instagram, Linkedin, Dumbbell, Star, Calendar } from 'lucide-react';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';

const trainers = [
  {
    id: 1,
    name: 'Marcus Vance',
    role: 'Head Strength & Hypertrophy Coach',
    credentials: 'CSCS, NASM Master Trainer',
    experience: '9+ Years Experience',
    rating: '4.9',
    image: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=600&q=80',
    bio: 'Specializes in progressive overload mechanics, compound lifts, and personalized contest prep for bodybuilders and powerlifters.',
    specialties: ['Powerlifting', 'Hypertrophy', 'Olympic Lifts'],
  },
  {
    id: 2,
    name: 'Elena Rostova',
    role: 'HIIT & Functional Movement Lead',
    credentials: 'ACSM-CPT, FMS Level 2',
    experience: '7+ Years Experience',
    rating: '5.0',
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=600&q=80',
    bio: 'Dedicated to athletic conditioning, agility drills, metabolic conditioning, and mobility recovery for functional longevity.',
    specialties: ['MetCon', 'Agility', 'Mobility & Rehab'],
  },
  {
    id: 3,
    name: 'Daria Volkova',
    role: 'Body Transformation & Calisthenics',
    credentials: 'ISSA Master Coach, Precision Nutrition',
    experience: '8+ Years Experience',
    rating: '4.95',
    image: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=600&q=80',
    bio: 'Focuses on sustainable body recomposition, macro-nutrient balancing, and building raw relative strength through calisthenics.',
    specialties: ['Body Recomp', 'Nutrition Planning', 'Calisthenics'],
  },
];

export default function TrainersSection() {
  const navigate = useNavigate();

  return (
    <section id="trainers" className="section trainers-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-subtitle">ELITE COACHING ROSTER</span>
          <h2 className="section-title">
            TRAIN WITH <span className="text-gradient-orange">CERTIFIED EXPERTS.</span>
          </h2>
          <p className="section-desc">
            Our coaching staff blends master biomechanics credentials with real-world athletic competition experience.
          </p>
        </div>

        {/* Trainers Grid */}
        <div className="grid-3 trainers-grid">
          {trainers.map((trainer) => (
            <Card key={trainer.id} padding="none" hover className="trainer-card">
              <div className="trainer-image-container">
                <img
                  src={trainer.image}
                  alt={trainer.name}
                  className={`trainer-image trainer-image-${trainer.id}`}
                  loading="lazy"
                />
                <div className="trainer-image-overlay"></div>
                <div className="trainer-experience-badge">
                  <Award size={14} />
                  <span>{trainer.experience}</span>
                </div>
              </div>

              <div className="trainer-content">
                <div className="trainer-header">
                  <div className="trainer-title-area">
                    <h3 className="trainer-name">{trainer.name}</h3>
                    <p className="trainer-role">{trainer.role}</p>
                  </div>
                  <div className="trainer-rating">
                    <Star size={15} className="star-icon" />
                    <span>{trainer.rating}</span>
                  </div>
                </div>

                <div className="trainer-credentials">
                  <span className="credential-label">CREDENTIALS:</span>
                  <span className="credential-text">{trainer.credentials}</span>
                </div>

                <p className="trainer-bio">{trainer.bio}</p>

                <div className="trainer-specialties">
                  {trainer.specialties.map((spec, idx) => (
                    <Badge key={idx} variant="outline" size="sm">
                      {spec}
                    </Badge>
                  ))}
                </div>

                <div className="trainer-card-footer">
                  <Button
                    variant="secondary"
                    fullWidth
                    size="sm"
                    icon={Calendar}
                    onClick={() => navigate('/register')}
                  >
                    Request 1-on-1 Session
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
