import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CodeBracketIcon,
  ServerIcon,
  DevicePhoneMobileIcon,
  CloudIcon,
  CpuChipIcon,
  ChartBarIcon,
  BoltIcon,
  ShieldCheckIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const Portfolio: React.FC = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <Logo variant="gradient" size="md" />
              <span className="text-2xl font-bold gradient-text">TravelMate</span>
            </Link>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link to="/" className="btn btn-ghost btn-sm">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-5 dark:opacity-10"></div>

        <div className="container-custom relative z-10">
          <motion.div {...fadeInUp} className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-sm font-semibold mb-6">
              Full-Stack Project Portfolio
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              TravelMate: AI-Powered
              <span className="gradient-text"> Travel Companion Platform</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              A comprehensive full-stack application featuring Spring Boot backend, React frontend,
              real-time WebSocket communication, and intelligent AI matching algorithms
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a href="https://github.com/araeLaver/TravelMate" target="_blank" rel="noopener noreferrer" className="btn btn-primary group">
                <span>View on GitHub</span>
                <ArrowTopRightOnSquareIcon className="h-5 w-5" />
              </a>
              <Link to="/dashboard" className="btn btn-secondary">
                Live Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Project Overview */}
      <section className="section bg-gray-50 dark:bg-gray-800/50">
        <div className="container-custom">
          <motion.div {...fadeInUp} className="mb-12">
            <h2 className="text-4xl font-bold mb-4">Project Overview</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              A modern travel companion matching platform built with enterprise-grade technologies
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: CodeBracketIcon,
                title: 'Full-Stack Development',
                description: 'End-to-end implementation from database design to UI/UX'
              },
              {
                icon: CpuChipIcon,
                title: 'AI-Powered Matching',
                description: 'Hybrid recommendation algorithm with 8 weighted factors'
              },
              {
                icon: BoltIcon,
                title: 'Real-time Features',
                description: 'WebSocket-based chat and live notifications'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card"
              >
                <item.icon className="h-12 w-12 text-primary-600 dark:text-primary-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="section">
        <div className="container-custom">
          <motion.div {...fadeInUp} className="mb-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Technology Stack</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Modern, scalable, and production-ready technologies
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Backend */}
            <motion.div {...fadeInUp} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
                  <ServerIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Backend</h3>
              </div>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>Spring Boot 3.2.0</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>Spring Security + JWT</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>Spring Data JPA</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>WebSocket (STOMP)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>Java 17</span>
                </li>
              </ul>
            </motion.div>

            {/* Frontend */}
            <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
                  <DevicePhoneMobileIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Frontend</h3>
              </div>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>React 18 + TypeScript</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>Tailwind CSS</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>Framer Motion</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>Zustand + React Query</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>SockJS + STOMP</span>
                </li>
              </ul>
            </motion.div>

            {/* Database & Infrastructure */}
            <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
                  <CloudIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Infrastructure</h3>
              </div>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>PostgreSQL 15</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>Redis (Caching)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>Docker + Docker Compose</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>Koyeb (Deployment)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>Nginx</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="section bg-gray-50 dark:bg-gray-800/50">
        <div className="container-custom">
          <motion.div {...fadeInUp} className="mb-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Core Features</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Production-ready features built with scalability in mind
            </p>
          </motion.div>

          <div className="space-y-12">
            {[
              {
                title: 'AI-Powered Matching Algorithm',
                description: 'Hybrid recommendation system combining content-based filtering (70%) and collaborative filtering (30%) with 8 weighted factors',
                details: [
                  'Travel Style Compatibility (25%)',
                  'Interest Matching (20%)',
                  'Location Preferences (15%)',
                  'Group Size & Budget Analysis (20%)',
                  'Real-time Activity Scoring (5%)',
                  'Collaborative Filtering Boost (5%)'
                ],
                metrics: '92% match accuracy'
              },
              {
                title: 'Real-time Communication System',
                description: 'WebSocket-based messaging with STOMP protocol for reliable, instant communication',
                details: [
                  'Private & Group Chat Rooms',
                  'Message Persistence with JPA',
                  'Read Receipts & Typing Indicators',
                  'User Presence Detection',
                  'Notification System (12 types)',
                  'Message History Retrieval'
                ],
                metrics: '<100ms latency'
              },
              {
                title: 'Location-Based Services',
                description: 'Geospatial queries and location intelligence for proximity-based matching',
                details: [
                  'GPS Location Tracking',
                  'Nearby User Discovery (radius-based)',
                  'Meeting Point Coordination',
                  'Kakao Maps API Integration',
                  'Privacy Controls per User',
                  'Phone Shake Matching Feature'
                ],
                metrics: '5km default radius'
              },
              {
                title: 'Security & Authentication',
                description: 'Enterprise-grade security with JWT tokens and comprehensive access control',
                details: [
                  'JWT Access + Refresh Token Strategy',
                  'OAuth2 Social Login (Google, Kakao, Naver)',
                  'Email Verification System',
                  'Password Reset Flow',
                  '2FA Support (Ready)',
                  'Rate Limiting & CORS Protection'
                ],
                metrics: '99.9% uptime'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 mt-4">
                      {feature.details.map((detail, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="lg:w-48 flex lg:flex-col items-center lg:items-end justify-center gap-2">
                    <ChartBarIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    <div className="text-right">
                      <div className="text-2xl font-bold gradient-text">{feature.metrics}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Performance</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* System Architecture */}
      <section className="section">
        <div className="container-custom">
          <motion.div {...fadeInUp} className="mb-12 text-center">
            <h2 className="text-4xl font-bold mb-4">System Architecture</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Scalable, maintainable, and production-ready architecture
            </p>
          </motion.div>

          <motion.div {...fadeInUp} className="card max-w-4xl mx-auto">
            <div className="space-y-8">
              {/* Frontend Layer */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
                  Frontend Layer (React + TypeScript)
                </h3>
                <div className="pl-10 space-y-2 text-gray-600 dark:text-gray-400">
                  <p>• Pages (10): Route-based components</p>
                  <p>• Components (8): Reusable UI elements</p>
                  <p>• State Management: Zustand (client) + React Query (server)</p>
                  <p>• Real-time: SockJS + STOMP WebSocket client</p>
                </div>
              </div>

              <div className="text-center text-2xl">↓</div>

              {/* API Layer */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-lg"></div>
                  API Layer (Spring Boot REST + WebSocket)
                </h3>
                <div className="pl-10 space-y-2 text-gray-600 dark:text-gray-400">
                  <p>• Controllers (12): RESTful endpoints</p>
                  <p>• Security: JWT Filter Chain + OAuth2</p>
                  <p>• WebSocket: STOMP Message Broker</p>
                  <p>• Caching: Redis + Caffeine (8 cache types)</p>
                </div>
              </div>

              <div className="text-center text-2xl">↓</div>

              {/* Business Logic Layer */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg"></div>
                  Business Logic Layer
                </h3>
                <div className="pl-10 space-y-2 text-gray-600 dark:text-gray-400">
                  <p>• Services (15): Core business logic</p>
                  <p>• Recommendation Engine: Hybrid AI algorithm</p>
                  <p>• Location Service: Geospatial processing</p>
                  <p>• Notification Service: Multi-channel delivery</p>
                </div>
              </div>

              <div className="text-center text-2xl">↓</div>

              {/* Data Layer */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg"></div>
                  Data Layer
                </h3>
                <div className="pl-10 space-y-2 text-gray-600 dark:text-gray-400">
                  <p>• Repositories (17): Spring Data JPA</p>
                  <p>• Entities (18): Domain models</p>
                  <p>• PostgreSQL: Primary database</p>
                  <p>• Redis: Session & cache storage</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Technical Highlights */}
      <section className="section bg-gray-50 dark:bg-gray-800/50">
        <div className="container-custom">
          <motion.div {...fadeInUp} className="mb-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Technical Highlights</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Key technical achievements and optimizations
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: ShieldCheckIcon,
                title: 'Security Hardening',
                points: [
                  'JWT token refresh strategy',
                  'CORS & CSP headers',
                  'SQL injection prevention',
                  'XSS protection'
                ]
              },
              {
                icon: BoltIcon,
                title: 'Performance Optimization',
                points: [
                  'Multi-level caching (Redis + L2)',
                  'Database query optimization',
                  'Lazy loading & pagination',
                  'Image compression pipeline'
                ]
              },
              {
                icon: CpuChipIcon,
                title: 'Scalability',
                points: [
                  'Stateless architecture',
                  'Connection pooling (HikariCP)',
                  'Async processing ready',
                  'Horizontal scaling support'
                ]
              },
              {
                icon: ChartBarIcon,
                title: 'Monitoring & DevOps',
                points: [
                  'Spring Actuator metrics',
                  'Prometheus integration ready',
                  'Health check endpoints',
                  'Docker containerization'
                ]
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <ul className="space-y-2">
                      {item.points.map((point, j) => (
                        <li key={j} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container-custom">
          <motion.div
            {...fadeInUp}
            className="gradient-bg rounded-3xl p-12 text-center text-white"
          >
            <h2 className="text-4xl font-bold mb-4">Explore the Live Application</h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              See the platform in action and experience the features firsthand
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/dashboard" className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg">
                Live Demo
              </Link>
              <a
                href="https://github.com/araeLaver/TravelMate"
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-white/10 text-white border-2 border-white/30 hover:bg-white/20 btn-lg"
              >
                <span>GitHub Repository</span>
                <ArrowTopRightOnSquareIcon className="h-5 w-5" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Logo variant="white" size="md" />
              <div>
                <div className="text-white font-bold text-xl">TravelMate</div>
                <div className="text-sm">Full-Stack Portfolio Project</div>
              </div>
            </div>

            <div className="flex gap-8">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              <Link to="/portfolio" className="hover:text-white transition-colors">Portfolio</Link>
            </div>

            <div className="text-sm">
              © 2024 TravelMate. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;
