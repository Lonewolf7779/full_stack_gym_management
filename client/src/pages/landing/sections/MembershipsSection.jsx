import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Sparkles, Shield, ArrowRight } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Ideal for independent lifters seeking essential gym floor access.',
    priceMonthly: 29,
    priceAnnual: 24,
    popular: false,
    badge: 'Starter',
    features: [
      'Full Gym Floor & Weights Access',
      'Standard Locker Room & Showers',
      'Free Fitness & Body Composition Assessment',
      'IronForge Mobile Member Portal Access',
      'Standard Operating Hours (6am - 10pm)',
    ],
    notIncluded: [
      'Personal Trainer Consultation',
      'Unlimited Group Studio Classes',
      '24/7 RFID Keycard Access',
      'Sauna & Recovery Lounge',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    tagline: 'Our most popular choice for committed athletes seeking balanced results.',
    priceMonthly: 59,
    priceAnnual: 49,
    popular: true,
    badge: 'Most Popular',
    features: [
      'Everything in Basic Plan',
      'Unlimited Group & HIIT Studio Classes',
      '1 Complimentary 1-on-1 PT Session per Month',
      'Customized Workout Plan Generation',
      'Guest Pass (1 free pass per month)',
      'Nutrition & Macro Guidance Checklist',
    ],
    notIncluded: [
      '24/7 All-Hours Facility Access',
      'Private VIP Recovery & Sauna Suite',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Elite',
    tagline: 'The ultimate VIP tier with round-the-clock access & dedicated trainer support.',
    priceMonthly: 99,
    priceAnnual: 84,
    popular: false,
    badge: 'VIP All-Inclusive',
    features: [
      'Everything in Standard Plan',
      '24/7 Unlimited RFID Card Access',
      'Dedicated Assigned Personal Coach',
      'Weekly Workout Split & Progress Reviews',
      'Infrared Sauna & Recovery Lounge Access',
      'Complimentary Protein Shakes (2 per week)',
      'Unlimited Monthly Guest Passes',
    ],
    notIncluded: [],
  },
];

export default function MembershipsSection() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'

  return (
    <section id="memberships" className="section memberships-section">
      <div className="glow-ambient-cyan" style={{ top: '10%', right: '-150px' }}></div>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-subtitle">MEMBERSHIP TIERS</span>
          <h2 className="section-title">
            FLEXIBLE PLANS BUILT FOR <span className="text-gradient-orange">YOUR GOALS.</span>
          </h2>
          <p className="section-desc">
            No initiation surprises, no hidden cancellation penalties. Select the tier that empowers your routine.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="billing-toggle-wrapper">
            <button
              className={`toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly Billing
            </button>
            <button
              className={`toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
              onClick={() => setBillingCycle('annual')}
            >
              Annual Billing <span className="save-badge">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid-3 pricing-grid">
          {plans.map((plan) => {
            const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
            return (
              <Card
                key={plan.id}
                className={`pricing-card ${plan.popular ? 'pricing-card-popular' : ''}`}
                hoverEffect={true}
                glow={plan.popular}
                padding="normal"
              >
                {plan.popular && (
                  <div className="popular-ribbon">
                    <Sparkles size={14} />
                    <span>RECOMMENDED</span>
                  </div>
                )}

                <div className="pricing-card-header">
                  <div className="plan-title-row">
                    <h3 className="plan-name">{plan.name}</h3>
                    <Badge variant={plan.popular ? 'primary' : 'outline'} size="sm">
                      {plan.badge}
                    </Badge>
                  </div>
                  <p className="plan-tagline">{plan.tagline}</p>

                  <div className="price-display">
                    <span className="currency">$</span>
                    <span className="amount">{price}</span>
                    <span className="period">/month</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <span className="billed-note">Billed annually (${price * 12}/yr)</span>
                  )}
                </div>

                <div className="pricing-divider"></div>

                <div className="plan-features-list">
                  <span className="features-headline">Included Features:</span>
                  <ul>
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="feature-item-yes">
                        <Check size={17} className="check-icon" />
                        <span>{feat}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((feat, idx) => (
                      <li key={idx} className="feature-item-no">
                        <span className="cross-dot">&times;</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pricing-card-footer">
                  <Button
                    variant={plan.popular ? 'primary' : 'secondary'}
                    fullWidth
                    size="lg"
                    icon={ArrowRight}
                    onClick={() => navigate('/register')}
                  >
                    Select {plan.name}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
