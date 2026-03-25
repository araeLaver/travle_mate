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
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import PageBackground from '../components/PageBackground';
import { cn } from '../lib/utils';

const Portfolio: React.FC = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' as const },
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] overflow-hidden">
      <PageBackground />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50">
        <div className="mx-4 mt-4">
          <div className="max-w-6xl mx-auto bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg shadow-gray-200/20 dark:shadow-black/20">
            <div className="flex items-center justify-between h-16 px-6">
              <Link to="/" className="flex items-center gap-3 group">
                <Logo
                  variant="gradient"
                  size="md"
                  className="group-hover:scale-110 transition-transform duration-300"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  Fryndo
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                {['Home', 'Features', 'Groups'].map(item => (
                  <Link
                    key={item}
                    to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                  >
                    {item}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 md:pt-48 md:pb-32">
        {/* Background */}
        <div className="absolute inset-0 gradient-mesh opacity-60 dark:opacity-40" />

        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700 mb-8"
            >
              <CodeBracketIcon className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Full-Stack Project Portfolio
              </span>
            </motion.div>

            <motion.h1
              {...fadeInUp}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8"
            >
              <span className="text-gray-900 dark:text-white">Advanced</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Travel Platform
              </span>
            </motion.h1>

            <motion.p
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              A comprehensive full-stack application featuring Spring Boot backend, React frontend,
              real-time WebSocket communication, and intelligent matching algorithms.
            </motion.p>

            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <a
                href="https://github.com/araeLaver/travle_mate"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-1"
              >
                View on GitHub
                <ArrowTopRightOnSquareIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                Live Demo
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Project Overview - Bento Grid */}
      <section className="py-24 md:py-32 relative">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold mb-4">
              Overview
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Project Highlights
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              A modern travel companion matching platform built with enterprise-grade technologies
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="bento-grid">
            {/* Large Card - Full Stack */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bento-item bento-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex flex-col justify-between overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-6">
                  <CodeBracketIcon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-3">Full-Stack Development</h3>
                <p className="text-white/80 text-lg max-w-sm">
                  End-to-end implementation from database design to modern UI/UX with React & Spring
                  Boot
                </p>
              </div>
              <div className="relative z-10 mt-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg text-sm font-medium">
                    18 Entities
                  </span>
                  <span className="px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg text-sm font-medium">
                    17 Repositories
                  </span>
                  <span className="px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg text-sm font-medium">
                    15 Services
                  </span>
                </div>
              </div>
            </motion.div>

            {/* AI Matching */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bento-item bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group hover:border-violet-200 dark:hover:border-violet-800"
            >
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CpuChipIcon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                AI Matching Algorithm
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                8 weighted factors with 92% accuracy
              </p>
            </motion.div>

            {/* Real-time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bento-item bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group hover:border-cyan-200 dark:hover:border-cyan-800"
            >
              <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BoltIcon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Real-time Features
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                WebSocket chat with &lt;100ms latency
              </p>
            </motion.div>

            {/* Wide Card - Tech Stack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bento-item bento-wide bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-between overflow-hidden"
            >
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Modern Tech Stack</h3>
                <p className="text-white/80 text-sm max-w-xs">
                  Spring Boot 3.2 + React 18 + TypeScript + PostgreSQL + Redis
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ServerIcon className="h-12 w-12 text-white/80" />
              </div>
            </motion.div>

            {/* Security */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bento-item bg-gradient-to-br from-rose-500 to-pink-600 text-white"
            >
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-4">
                <ShieldCheckIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Enterprise Security</h3>
              <p className="text-white/80 text-sm">JWT + OAuth2 + 2FA Ready</p>
            </motion.div>

            {/* Deployment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="bento-item bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group hover:border-amber-200 dark:hover:border-amber-800"
            >
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CloudIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Cloud Deployed
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Docker + Koyeb (Full Stack)
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold mb-4">
              Technology
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Technology Stack
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Modern, scalable, and production-ready technologies
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ServerIcon,
                title: 'Backend',
                gradient: 'from-emerald-400 to-teal-500',
                items: [
                  'Spring Boot 3.2.0',
                  'Spring Security + JWT',
                  'Spring Data JPA',
                  'WebSocket (STOMP)',
                  'Java 17',
                ],
              },
              {
                icon: DevicePhoneMobileIcon,
                title: 'Frontend',
                gradient: 'from-violet-400 to-purple-500',
                items: [
                  'React 18 + TypeScript',
                  'Tailwind CSS',
                  'Framer Motion',
                  'Zustand + React Query',
                  'SockJS + STOMP',
                ],
              },
              {
                icon: CloudIcon,
                title: 'Infrastructure',
                gradient: 'from-blue-400 to-cyan-500',
                items: [
                  'PostgreSQL 15',
                  'Redis (Caching)',
                  'Docker + Docker Compose',
                  'Koyeb (Deployment)',
                  'Nginx',
                ],
              },
            ].map((stack, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white',
                      stack.gradient
                    )}
                  >
                    <stack.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{stack.title}</h3>
                </div>
                <ul className="space-y-3">
                  {stack.items.map((item, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-3 text-gray-600 dark:text-gray-400"
                    >
                      <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-24">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-sm font-semibold mb-4">
              Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Core Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Production-ready features built with scalability in mind
            </p>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                title: 'Advanced Matching Algorithm',
                description:
                  'Hybrid recommendation system combining content-based filtering (70%) and collaborative filtering (30%)',
                details: [
                  'Travel Style Compatibility (25%)',
                  'Interest Matching (20%)',
                  'Location Preferences (15%)',
                  'Group Size & Budget (20%)',
                ],
                metrics: '92%',
                metricsLabel: 'Match Accuracy',
                gradient: 'from-violet-500 to-purple-600',
              },
              {
                title: 'Real-time Communication',
                description:
                  'WebSocket-based messaging with STOMP protocol for reliable instant communication',
                details: [
                  'Private & Group Chat',
                  'Read Receipts',
                  'Typing Indicators',
                  '12 Notification Types',
                ],
                metrics: '<100ms',
                metricsLabel: 'Latency',
                gradient: 'from-cyan-500 to-blue-600',
              },
              {
                title: 'Location-Based Services',
                description:
                  'Geospatial queries and location intelligence for proximity-based matching',
                details: [
                  'GPS Location Tracking',
                  'Nearby User Discovery',
                  'Kakao Maps Integration',
                  'Phone Shake Matching',
                ],
                metrics: '5km',
                metricsLabel: 'Default Radius',
                gradient: 'from-emerald-500 to-teal-600',
              },
              {
                title: 'Security & Authentication',
                description:
                  'Enterprise-grade security with JWT tokens and comprehensive access control',
                details: [
                  'JWT Access + Refresh',
                  'OAuth2 Social Login',
                  'Email Verification',
                  'Rate Limiting',
                ],
                metrics: '99.9%',
                metricsLabel: 'Uptime',
                gradient: 'from-rose-500 to-pink-600',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-xl font-bold flex-shrink-0',
                          feature.gradient
                        )}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 mt-6 pl-16">
                      {feature.details.map((detail, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                        >
                          <div className="w-1.5 h-1.5 bg-violet-600 rounded-full" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="lg:w-48 flex lg:flex-col items-center justify-center gap-2 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                    <ChartBarIcon className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        {feature.metrics}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {feature.metricsLabel}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-12 md:p-20"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Explore the Project
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto">
                See the platform in action and explore the codebase
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-emerald-600 bg-white rounded-2xl hover:bg-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  Live Demo
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>
                <a
                  href="https://github.com/araeLaver/travle_mate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-white/20 backdrop-blur border border-white/30 rounded-2xl hover:bg-white/30 transition-all duration-300"
                >
                  GitHub Repository
                  <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-gray-800">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Logo variant="gradient" size="md" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Fryndo</span>
            </div>

            <div className="flex gap-8 text-sm">
              {['Home', 'Portfolio', 'Dashboard', 'Groups'].map(item => (
                <Link
                  key={item}
                  to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-500">© 2025 Fryndo</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;
