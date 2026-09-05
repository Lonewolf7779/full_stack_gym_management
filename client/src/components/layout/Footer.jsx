import React from 'react';
import { Dumbbell, MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter, Youtube, ShieldCheck } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-col brand-col">
            <div className="footer-logo">
              <div className="footer-logo-icon">
                <Dumbbell size={24} />
              </div>
              <span className="footer-logo-title">IRON<span className="logo-highlight">FORGE</span></span>
            </div>
            <p className="footer-about">
              Empowering individuals of all fitness levels with state-of-the-art equipment, elite coaching, personalized workout plans, and an inspiring community.
            </p>
            <div className="footer-socials">
              <a href="#instagram" className="social-link" aria-label="Instagram"><Instagram size={18} /></a>
              <a href="#facebook" className="social-link" aria-label="Facebook"><Facebook size={18} /></a>
              <a href="#twitter" className="social-link" aria-label="Twitter"><Twitter size={18} /></a>
              <a href="#youtube" className="social-link" aria-label="YouTube"><Youtube size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><button onClick={() => scrollTo('home')}>Home</button></li>
              <li><button onClick={() => scrollTo('about')}>About Gym</button></li>
              <li><button onClick={() => scrollTo('features')}>Key Features</button></li>
              <li><button onClick={() => scrollTo('memberships')}>Membership Plans</button></li>
              <li><button onClick={() => scrollTo('trainers')}>Personal Trainers</button></li>
              <li><button onClick={() => scrollTo('why-us')}>Why Choose Us</button></li>
            </ul>
          </div>

          {/* Operating Hours */}
          <div className="footer-col">
            <h4 className="footer-heading">Operating Hours</h4>
            <ul className="footer-hours-list">
              <li>
                <span className="day">Monday - Friday</span>
                <span className="time">5:00 AM - 11:00 PM</span>
              </li>
              <li>
                <span className="day">Saturday</span>
                <span className="time">6:00 AM - 10:00 PM</span>
              </li>
              <li>
                <span className="day">Sunday</span>
                <span className="time">7:00 AM - 8:00 PM</span>
              </li>
              <li className="vip-badge-item">
                <ShieldCheck size={16} className="text-highlight" />
                <span>24/7 Access for VIP Members</span>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="footer-col">
            <h4 className="footer-heading">Contact & Location</h4>
            <div className="footer-contact-list">
              <div className="contact-item">
                <MapPin size={18} className="contact-icon" />
                <span>450 Grand Avenue, Olympic Boulevard, Metro City</span>
              </div>
              <div className="contact-item">
                <Phone size={18} className="contact-icon" />
                <span>+1 (800) 555-IRON (4766)</span>
              </div>
              <div className="contact-item">
                <Mail size={18} className="contact-icon" />
                <span>contact@ironforgefitness.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p className="copyright">
            &copy; {new Date().getFullYear()} IronForge Fitness &bull; Full-Stack Gym Management System. Built for College Project.
          </p>
          <div className="footer-badges">
            <span className="badge-tech">Node.js + Express</span>
            <span className="badge-tech">MongoDB + Mongoose</span>
            <span className="badge-tech">React SPA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
