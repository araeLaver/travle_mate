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
    <div className="min-h-screen bg-sand-100 dark:bg-[#0a0a0b] overflow-hidden">
      <PageBackground />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50">
        <div className="mx-4 mt-4">
          <div className="max-w-6xl mx-auto bg-white/85 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-[#F2F1ED] dark:border-gray-800/50 shadow-[0_10px_30px_rgba(16,16,20,0.06)] dark:shadow-black/20">
            <div className="flex items-center justify-between h-16 px-6">
              <Link to="/" className="flex items-center gap-3 group">
                <Logo
                  variant="gradient"
                  size="md"
                  className="group-hover:scale-110 transition-transform duration-300"
                />
                <span className="text-xl font-extrabold tracking-tight text-ink dark:text-white">
                  Fryndo
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                {['Home', 'Features', 'Groups'].map(item => (
                  <Link
                    key={item}
                    to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                    className="px-4 py-2 text-sm font-semibold text-[#4A4A55] dark:text-gray-400 hover:text-ink dark:hover:text-white hover:bg-sand-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                  >
                    {item}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link
                  to="/login"
                  className="inline-flex items-center h-[42px] px-5 text-sm font-extrabold text-white bg-primary-500 rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-[0_8px_22px_rgba(74,58,255,0.3)]"
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
              className="inline-flex items-center h-8 gap-2 px-4 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-8"
            >
              <CodeBracketIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-bold text-primary-600 dark:text-primary-300">
                Full-Stack Project Portfolio
              </span>
            </motion.div>

            <motion.h1
              {...fadeInUp}
              className="font-display text-5xl md:text-6xl lg:text-[62px] font-black tracking-tight mb-8"
            >
              <span className="text-ink dark:text-white">Advanced</span>
              <br />
              <span className="text-primary-500 dark:text-primary-400">Travel Platform</span>
            </motion.h1>

            <motion.p
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-[#4A4A55] dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
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
                className="group inline-flex h-14 items-center justify-center gap-2 px-8 text-base font-extrabold text-white bg-primary-500 rounded-[15px] hover:bg-primary-700 transition-all duration-300 shadow-[0_8px_22px_rgba(74,58,255,0.3)] hover:-translate-y-1"
              >
                View on GitHub
                <ArrowTopRightOnSquareIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <Link
                to="/dashboard"
                className="inline-flex h-14 items-center justify-center gap-2 px-8 text-base font-bold text-ink dark:text-gray-300 bg-white dark:bg-gray-800 border-[1.5px] border-sand-400 dark:border-gray-700 rounded-[15px] hover:border-primary-400 hover:text-primary-600 dark:hover:border-gray-600 transition-all duration-300 hover:-translate-y-1"
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
            <span className="inline-flex items-center h-8 px-4 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 rounded-full text-sm font-bold mb-4">
              Overview
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight text-ink dark:text-white mb-4">
              Project Highlights
            </h2>
            <p className="text-lg text-[#4A4A55] dark:text-gray-400 max-w-2xl mx-auto">
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
              className="bento-item bento-lg bg-ink text-white flex flex-col justify-between overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/25 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-primary-400">
                  <CodeBracketIcon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
                  Full-Stack Development
                </h3>
                <p className="text-[#A0A0AC] text-lg max-w-sm">
                  End-to-end implementation from database design to modern UI/UX with React & Spring
                  Boot
                </p>
              </div>
              <div className="relative z-10 mt-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 bg-white/10 rounded-[10px] text-sm font-bold">
                    18 Entities
                  </span>
                  <span className="px-3 py-1.5 bg-white/10 rounded-[10px] text-sm font-bold">
                    17 Repositories
                  </span>
                  <span className="px-3 py-1.5 bg-white/10 rounded-[10px] text-sm font-bold">
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
              className="bento-item bg-white dark:bg-gray-800 border border-sand-300 dark:border-gray-700 group hover:border-primary-200 dark:hover:border-primary-800"
            >
              <div className="w-11 h-11 bg-primary-100 dark:bg-primary-900/30 rounded-[14px] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CpuChipIcon className="h-6 w-6 text-primary-500 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-ink dark:text-white mb-2">
                AI Matching Algorithm
              </h3>
              <p className="text-[#74747F] dark:text-gray-400 text-sm">
                8 weighted factors with 92% accuracy
              </p>
            </motion.div>

            {/* Real-time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bento-item bg-white dark:bg-gray-800 border border-sand-300 dark:border-gray-700 group hover:border-primary-200 dark:hover:border-primary-800"
            >
              <div className="w-11 h-11 bg-primary-100 dark:bg-primary-900/30 rounded-[14px] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BoltIcon className="h-6 w-6 text-primary-500 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-ink dark:text-white mb-2">
                Real-time Features
              </h3>
              <p className="text-[#74747F] dark:text-gray-400 text-sm">
                WebSocket chat with &lt;100ms latency
              </p>
            </motion.div>

            {/* Wide Card - Tech Stack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bento-item bento-wide bg-primary-500 text-white flex items-center justify-between overflow-hidden"
            >
              <div className="relative z-10">
                <h3 className="text-xl font-extrabold tracking-tight mb-2">Modern Tech Stack</h3>
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
              className="bento-item bg-primary-700 text-white"
            >
              <div className="w-11 h-11 bg-white/10 rounded-[14px] flex items-center justify-center mb-4">
                <ShieldCheckIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight mb-2">Enterprise Security</h3>
              <p className="text-white/80 text-sm">JWT + OAuth2 + 2FA Ready</p>
            </motion.div>

            {/* Deployment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="bento-item bg-white dark:bg-gray-800 border border-sand-300 dark:border-gray-700 group hover:border-primary-200 dark:hover:border-primary-800"
            >
              <div className="w-11 h-11 bg-primary-100 dark:bg-primary-900/30 rounded-[14px] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CloudIcon className="h-6 w-6 text-primary-500 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-ink dark:text-white mb-2">
                Cloud Deployed
              </h3>
              <p className="text-[#74747F] dark:text-gray-400 text-sm">
                Docker + Koyeb (Full Stack)
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-24 bg-sand-200 dark:bg-gray-900/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center h-8 px-4 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 rounded-full text-sm font-bold mb-4">
              Technology
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight text-ink dark:text-white mb-4">
              Technology Stack
            </h2>
            <p className="text-lg text-[#4A4A55] dark:text-gray-400 max-w-2xl mx-auto">
              Modern, scalable, and production-ready technologies
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ServerIcon,
                title: 'Backend',
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
                className="bg-white dark:bg-gray-800 rounded-[20px] p-6 dark:border dark:border-gray-700 hover:shadow-[0_10px_30px_rgba(16,16,20,0.1)] dark:hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={cn(
                      'w-11 h-11 rounded-[14px] flex items-center justify-center',
                      'bg-primary-100 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400'
                    )}
                  >
                    <stack.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-extrabold tracking-tight text-ink dark:text-white">
                    {stack.title}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {stack.items.map((item, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-3 text-[#4A4A55] dark:text-gray-400"
                    >
                      <CheckCircleIcon className="h-5 w-5 text-success flex-shrink-0" />
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
            <span className="inline-flex items-center h-8 px-4 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 rounded-full text-sm font-bold mb-4">
              Features
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight text-ink dark:text-white mb-4">
              Core Features
            </h2>
            <p className="text-lg text-[#4A4A55] dark:text-gray-400 max-w-2xl mx-auto">
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
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-[20px] p-8 dark:border dark:border-gray-700 hover:shadow-[0_10px_30px_rgba(16,16,20,0.1)] transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-[14px] flex items-center justify-center text-xl font-extrabold flex-shrink-0',
                          'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 font-display'
                        )}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="text-2xl font-extrabold tracking-tight text-ink dark:text-white mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-[#4A4A55] dark:text-gray-400">{feature.description}</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 mt-6 pl-16">
                      {feature.details.map((detail, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-2 text-sm text-[#4A4A55] dark:text-gray-400"
                        >
                          <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="lg:w-48 flex lg:flex-col items-center justify-center gap-2 p-6 bg-sand-100 dark:bg-gray-700/50 rounded-2xl">
                    <ChartBarIcon className="h-8 w-8 text-primary-500 dark:text-primary-400" />
                    <div className="text-center">
                      <div className="font-display text-3xl font-black text-primary-600 dark:text-primary-400">
                        {feature.metrics}
                      </div>
                      <div className="text-sm font-semibold text-[#74747F] dark:text-gray-400">
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
            className="relative overflow-hidden rounded-[24px] bg-ink p-12 md:p-20"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight text-white mb-6">
                Explore the Project
              </h2>
              <p className="text-xl text-[#A0A0AC] mb-10 max-w-xl mx-auto">
                See the platform in action and explore the codebase
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/dashboard"
                  className="inline-flex h-[58px] items-center justify-center gap-2 px-8 text-base font-extrabold text-ink bg-white rounded-[15px] hover:bg-sand-100 transition-all duration-300 hover:-translate-y-1"
                >
                  Live Demo
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>
                <a
                  href="https://github.com/araeLaver/travle_mate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-[58px] items-center justify-center gap-2 px-8 text-base font-bold text-white border border-white/25 rounded-[15px] hover:bg-white/10 transition-all duration-300"
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
      <footer className="py-12 border-t border-[#F2F1ED] bg-white dark:bg-transparent dark:border-gray-800">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Logo variant="gradient" size="md" />
              <span className="text-xl font-extrabold tracking-tight text-ink dark:text-white">
                Fryndo
              </span>
            </div>

            <div className="flex gap-8 text-[13px] font-semibold">
              {['Home', 'Portfolio', 'Dashboard', 'Groups'].map(item => (
                <Link
                  key={item}
                  to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                  className="text-[#74747F] dark:text-gray-400 hover:text-ink dark:hover:text-white transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>

            <div className="text-[13px] font-semibold text-[#9A9AA4] dark:text-gray-500">
              © 2025 Fryndo
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;
