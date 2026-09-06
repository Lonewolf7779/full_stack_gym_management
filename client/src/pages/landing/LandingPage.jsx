import React from 'react';
import HeroSection from './sections/HeroSection';
import AboutSection from './sections/AboutSection';
import FeaturesSection from './sections/FeaturesSection';
import MembershipsSection from './sections/MembershipsSection';
import TrainersSection from './sections/TrainersSection';
import WhyChooseUsSection from './sections/WhyChooseUsSection';
import TestimonialsSection from './sections/TestimonialsSection';
import CtaSection from './sections/CtaSection';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <main className="landing-page-main">
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <MembershipsSection />
      <TrainersSection />
      <WhyChooseUsSection />
      <TestimonialsSection />
      <CtaSection />
    </main>
  );
}
