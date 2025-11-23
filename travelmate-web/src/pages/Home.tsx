import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        {/* Decorative Elements */}
        <div className="hero-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
          <div className="floating-icon floating-1">✈️</div>
          <div className="floating-icon floating-2">🌴</div>
          <div className="floating-icon floating-3">🎒</div>
          <div className="floating-icon floating-4">🗺️</div>
        </div>

        <div className="hero-content">
          {/* Live Badge */}
          <div className="live-badge">
            <span className="live-dot"></span>
            <span>10,000+ travelers online now</span>
          </div>

          {/* Main Title */}
          <h1 className="hero-title">
            Find Your Perfect
            <span className="gradient-text"> Travel Buddy</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle">
            Advanced matching connects you with compatible travel companions.
            Real-time chat, group management, and location-based services all in one app.
          </p>

          {/* CTA Buttons */}
          <div className="hero-buttons">
            <Link to="/register" className="btn-primary-hero">
              <span>Get Started Free</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M6 10H14M14 10L10 6M14 10L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link to="/dashboard" className="btn-secondary-hero">
              <span>Explore Now</span>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="trust-indicators">
            <div className="trust-item">
              <div className="trust-avatars">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="User" />
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bailey" alt="User" />
                <span className="avatar-count">+2k</span>
              </div>
              <span className="trust-text">Joined this week</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <div className="trust-rating">
                <span>⭐</span>
                <strong>4.9</strong>
              </div>
              <span className="trust-text">App Rating</span>
            </div>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="hero-visual">
          <div className="phone-mockup">
            <div className="phone-screen">
              <div className="app-header">
                <span className="app-title">TravelMate</span>
                <span className="notification-dot"></span>
              </div>
              <div className="app-content">
                <div className="match-card">
                  <div className="match-avatar">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Match" />
                    <span className="online-badge"></span>
                  </div>
                  <div className="match-info">
                    <h4>Sarah K.</h4>
                    <p>Adventure • Photography</p>
                  </div>
                  <div className="match-score">92%</div>
                </div>
                <div className="match-card">
                  <div className="match-avatar">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mike" alt="Match" />
                    <span className="online-badge"></span>
                  </div>
                  <div className="match-info">
                    <h4>Mike L.</h4>
                    <p>Culture • Food</p>
                  </div>
                  <div className="match-score">88%</div>
                </div>
                <div className="app-cta">Find More</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <span className="section-tag">Features</span>
            <h2>Everything You Need for the Perfect Trip</h2>
            <p>Discover powerful tools designed to make finding travel companions effortless</p>
          </div>

          <div className="features-grid">
            <div className="feature-card feature-primary">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M9.5 2C5.91 2 3 4.91 3 8.5C3 12.09 5.91 15 9.5 15C13.09 15 16 12.09 16 8.5C16 4.91 13.09 2 9.5 2ZM9.5 13C7.01 13 5 10.99 5 8.5C5 6.01 7.01 4 9.5 4C11.99 4 14 6.01 14 8.5C14 10.99 11.99 13 9.5 13ZM17.4 14.8C18.87 13.33 19.8 11.35 19.8 9.1C19.8 4.64 16.16 1 11.7 1C10.45 1 9.26 1.28 8.19 1.78C8.93 1.28 9.8 1 10.73 1C14.32 1 17.23 3.91 17.23 7.5C17.23 9.75 16.08 11.71 14.35 12.88C15.43 13.32 16.47 13.96 17.4 14.8ZM20 17.5C20 14.46 16.13 12 11.5 12C6.87 12 3 14.46 3 17.5V19H20V17.5Z" fill="currentColor"/>
                </svg>
              </div>
              <h3>Smart Matching</h3>
              <p>Our algorithm analyzes travel styles, interests, and schedules to find your perfect match</p>
              <div className="feature-stat">
                <strong>92%</strong>
                <span>Match Accuracy</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16ZM7 9H9V11H7V9ZM11 9H13V11H11V9ZM15 9H17V11H15V9Z" fill="currentColor"/>
                </svg>
              </div>
              <h3>Real-time Chat</h3>
              <p>WebSocket-based messaging for instant, reliable communication anywhere</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
                </svg>
              </div>
              <h3>Location Services</h3>
              <p>Find nearby travelers and share meetup locations in real-time</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z" fill="currentColor"/>
                </svg>
              </div>
              <h3>Safe & Verified</h3>
              <p>Verified user system and reporting features for safe travel groups</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-value">10K+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">500+</div>
            <div className="stat-label">Active Trips</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">50+</div>
            <div className="stat-label">Countries</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">99%</div>
            <div className="stat-label">Satisfaction</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2>Ready to Start Your Adventure?</h2>
            <p>Join thousands of travelers finding their perfect companions every day</p>
            <Link to="/register" className="cta-button">
              Start Free Today
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M6 10H14M14 10L10 6M14 10L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo">TravelMate</span>
            <p>Find your perfect travel companion</p>
          </div>
          <div className="footer-links">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
          <div className="footer-copyright">
            © 2024 TravelMate. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
