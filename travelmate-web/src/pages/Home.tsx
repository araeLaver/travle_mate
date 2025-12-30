import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  GlobeAltIcon,
  HeartIcon,
  CameraIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useTutorial } from '../contexts/TutorialContext';
import { cn } from '../lib/utils';

const Home: React.FC = () => {
  const { startTutorial } = useTutorial();

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' as const },
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] overflow-hidden">
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
                  TravelMate
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                {['Portfolio', 'Features', 'Groups'].map(item => (
                  <Link
                    key={item}
                    to={`/${item.toLowerCase()}`}
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
                  className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
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
        <div
          className="absolute top-20 left-10 w-72 h-72 bg-violet-400/30 rounded-full blur-3xl"
          style={{ animation: 'blob 7s infinite' }}
        />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl"
          style={{ animation: 'blob 7s infinite', animationDelay: '2s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-400/10 rounded-full blur-3xl"
          style={{ animation: 'glow 4s infinite' }}
        />

        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700 mb-8"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                500+ travelers online now
              </span>
            </motion.div>

            <motion.h1
              {...fadeInUp}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8"
            >
              <span className="text-gray-900 dark:text-white">Find Your</span>
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Travel Buddy
              </span>
            </motion.h1>

            <motion.p
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              Connect with like-minded travelers worldwide. Share adventures, create memories, and
              explore together.
            </motion.p>

            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl hover:from-violet-700 hover:to-purple-700 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/25 hover:-translate-y-1"
              >
                Start Exploring
                <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={startTutorial}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 tutorial-guest-mode-btn"
              >
                Take a Tour
              </button>
            </motion.div>
          </div>

          {/* Floating Cards Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {[
                  {
                    name: 'Sarah K.',
                    location: 'Tokyo, Japan',
                    tags: ['Photography', 'Food'],
                    match: 95,
                    gradient: 'from-rose-500 to-pink-500',
                    delay: 0,
                  },
                  {
                    name: 'Alex M.',
                    location: 'Seoul, Korea',
                    tags: ['Adventure', 'Culture'],
                    match: 92,
                    gradient: 'from-violet-500 to-purple-500',
                    delay: 0.1,
                  },
                  {
                    name: 'Emma L.',
                    location: 'Barcelona, Spain',
                    tags: ['Art', 'Music'],
                    match: 88,
                    gradient: 'from-cyan-500 to-blue-500',
                    delay: 0.2,
                  },
                ].map((user, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + user.delay, duration: 0.5 }}
                    className="group"
                  >
                    <div className="card-glass-modern rounded-3xl p-5 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className={cn(
                            'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-xl font-bold',
                            user.gradient
                          )}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {user.name}
                          </h4>
                          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <MapPinIcon className="h-3.5 w-3.5" />
                            {user.location}
                          </div>
                        </div>
                        <div className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold">
                          {user.match}%
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {user.tags.map((tag, j) => (
                          <span
                            key={j}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-24 md:py-32 relative">
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
              Everything you need
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Powerful tools designed to make finding travel companions effortless
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="bento-grid">
            {/* Large Card - Smart Matching */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bento-item bento-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white flex flex-col justify-between overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-6">
                  <SparklesIcon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-3">Smart Matching</h3>
                <p className="text-white/80 text-lg max-w-sm">
                  AI-powered algorithm finds travelers with matching interests, travel styles, and
                  schedules
                </p>
              </div>
              <div className="relative z-10 mt-6">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {[
                      'from-pink-400 to-rose-400',
                      'from-blue-400 to-cyan-400',
                      'from-green-400 to-emerald-400',
                    ].map((g, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-10 h-10 rounded-full bg-gradient-to-br border-2 border-white',
                          g
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-white/90 text-sm font-medium">+2.5k matched today</span>
                </div>
              </div>
            </motion.div>

            {/* Chat Feature */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bento-item bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group hover:border-cyan-200 dark:hover:border-cyan-800"
            >
              <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Real-time Chat
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Instant messaging with read receipts
              </p>
            </motion.div>

            {/* Location Feature */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bento-item bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group hover:border-rose-200 dark:hover:border-rose-800"
            >
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MapPinIcon className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Location Based
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Find travelers near you</p>
            </motion.div>

            {/* Wide Card - Groups */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bento-item bento-wide bg-gradient-to-r from-amber-400 to-orange-500 text-white flex items-center justify-between overflow-hidden"
            >
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Travel Groups</h3>
                <p className="text-white/80 text-sm max-w-xs">
                  Create or join groups heading to the same destination
                </p>
              </div>
              <div className="flex items-center gap-2">
                <UserGroupIcon className="h-12 w-12 text-white/80" />
              </div>
            </motion.div>

            {/* Verified Feature */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bento-item bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
            >
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-4">
                <ShieldCheckIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Verified Users</h3>
              <p className="text-white/80 text-sm">Safe & trusted community</p>
            </motion.div>

            {/* Global Feature */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="bento-item bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group hover:border-violet-200 dark:hover:border-violet-800"
            >
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <GlobeAltIcon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                50+ Countries
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Connect globally</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Travelers Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
          >
            <div>
              <span className="inline-block px-4 py-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm font-semibold mb-4">
                Community
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                Meet Travelers
              </h2>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 font-semibold hover:gap-3 transition-all"
            >
              View all <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Sophie Anderson',
                age: 28,
                location: 'Tokyo, Japan',
                interests: [
                  { icon: CameraIcon, label: 'Photography' },
                  { icon: HeartIcon, label: 'Culture' },
                ],
                bio: 'Exploring hidden gems and capturing moments',
                gradient: 'from-rose-400 to-pink-500',
              },
              {
                name: 'Alex Chen',
                age: 32,
                location: 'Seoul, Korea',
                interests: [
                  { icon: GlobeAltIcon, label: 'Adventure' },
                  { icon: MapPinIcon, label: 'Hiking' },
                ],
                bio: 'Adventure seeker planning Southeast Asia trek',
                gradient: 'from-blue-400 to-cyan-500',
              },
              {
                name: 'Maria Santos',
                age: 25,
                location: 'Barcelona, Spain',
                interests: [
                  { icon: MusicalNoteIcon, label: 'Music' },
                  { icon: SparklesIcon, label: 'Art' },
                ],
                bio: 'Art enthusiast exploring European cities',
                gradient: 'from-violet-400 to-purple-500',
              },
            ].map((user, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start gap-4 mb-5">
                    <div
                      className={cn(
                        'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-2xl font-bold shadow-lg',
                        user.gradient
                      )}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {user.name}, {user.age}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <MapPinIcon className="h-4 w-4" />
                        {user.location}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-5 line-clamp-2">
                    {user.bio}
                  </p>

                  <div className="flex gap-2 mb-5">
                    {user.interests.map((interest, j) => (
                      <div
                        key={j}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg"
                      >
                        <interest.icon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {interest.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/register"
                    className="block w-full py-3 text-center text-sm font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                  >
                    Connect
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Groups Section */}
      <section className="py-24">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
          >
            <div>
              <span className="inline-block px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold mb-4">
                Groups
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                Join a Journey
              </h2>
            </div>
            <Link
              to="/groups"
              className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 font-semibold hover:gap-3 transition-all"
            >
              Browse all <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Southeast Asia Backpackers',
                route: 'Thailand → Vietnam → Cambodia',
                dates: 'Jan 2025',
                members: 5,
                max: 8,
                gradient: 'from-emerald-400 to-teal-500',
              },
              {
                name: 'European Art Tour',
                route: 'Paris → Rome → Barcelona',
                dates: 'Feb 2025',
                members: 3,
                max: 6,
                gradient: 'from-violet-400 to-purple-500',
              },
              {
                name: 'Japan Cherry Blossom',
                route: 'Tokyo → Kyoto → Osaka',
                dates: 'Mar 2025',
                members: 6,
                max: 10,
                gradient: 'from-pink-400 to-rose-500',
              },
            ].map((group, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={cn('h-32 bg-gradient-to-br relative', group.gradient)}>
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-bold text-white text-lg truncate">{group.name}</h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <MapPinIcon className="h-4 w-4" />
                      <span className="truncate">{group.route}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {Array(Math.min(group.members, 3))
                            .fill(0)
                            .map((_, j) => (
                              <div
                                key={j}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 border-2 border-white dark:border-gray-800"
                              />
                            ))}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {group.members}/{group.max}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {group.dates}
                      </span>
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
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 p-12 md:p-20"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Ready to explore?</h2>
              <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto">
                Join thousands of travelers finding their perfect companions every day
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-violet-600 bg-white rounded-2xl hover:bg-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  Get Started Free
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>
                <button
                  onClick={startTutorial}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-white/20 backdrop-blur border border-white/30 rounded-2xl hover:bg-white/30 transition-all duration-300 tutorial-guest-mode-btn"
                >
                  Take a Tour
                </button>
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
              <span className="text-xl font-bold text-gray-900 dark:text-white">TravelMate</span>
            </div>

            <div className="flex gap-8 text-sm">
              {['Login', 'Register', 'Dashboard', 'Groups'].map(item => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-500">© 2025 TravelMate</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
