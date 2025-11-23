import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ChartBarIcon,
  ClockIcon,
  GlobeAltIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { cn } from '../lib/utils';

const HomeNew: React.FC = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <Logo variant="gradient" size="md" className="group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold gradient-text">TravelMate</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/portfolio" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium">
                Portfolio
              </Link>
              <Link to="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium">
                Features
              </Link>
              <Link to="/groups" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium">
                Groups
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link to="/login" className="btn btn-ghost btn-sm hidden md:inline-flex">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 gradient-bg opacity-5 dark:opacity-10"></div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-400/20 dark:bg-primary-600/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="text-center lg:text-left"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-sm font-semibold mb-6">
                <SparklesIcon className="h-4 w-4" />
                <span>Smart Travel Companion Matching</span>
              </motion.div>

              <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance">
                Find Your Perfect
                <span className="gradient-text"> Travel Buddy</span>
              </motion.h1>

              <motion.p variants={fadeInUp} className="text-xl text-gray-600 dark:text-gray-400 mb-8 text-balance">
                Connect with compatible travelers worldwide using our advanced matching algorithm.
                Real-time chat, location-based discovery, and smart group management.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link to="/register" className="btn btn-primary btn-lg group">
                  <span>Start Exploring</span>
                  <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/portfolio" className="btn btn-secondary btn-lg">
                  View Portfolio
                </Link>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex items-center justify-center lg:justify-start gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 border-2 border-white dark:border-gray-900"></div>
                    ))}
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">10K+ Active Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-yellow-500">
                    {'★'.repeat(5)}
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">4.9/5 Rating</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative"
            >
              {/* Phone Mockup */}
              <div className="relative mx-auto w-full max-w-md">
                <div className="absolute inset-0 gradient-bg rounded-3xl blur-2xl opacity-30"></div>
                <div className="relative bg-gray-900 rounded-3xl p-3 shadow-2xl">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
                    {/* App Header */}
                    <div className="gradient-bg p-4 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Logo variant="white" size="sm" />
                          <span className="font-bold">TravelMate</span>
                        </div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                      <div className="text-sm opacity-90">Find travelers near you</div>
                    </div>

                    {/* Match Cards */}
                    <div className="p-4 space-y-3">
                      {[
                        { name: 'Sarah K.', tags: 'Adventure • Photography', match: 92, online: true },
                        { name: 'Mike L.', tags: 'Culture • Food', match: 88, online: true },
                        { name: 'Emma T.', tags: 'Nature • Hiking', match: 85, online: false }
                      ].map((user, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:shadow-md transition-shadow"
                        >
                          <div className="relative">
                            <div className={cn(
                              "w-12 h-12 rounded-full bg-gradient-to-br",
                              i === 0 && "from-pink-400 to-purple-400",
                              i === 1 && "from-blue-400 to-cyan-400",
                              i === 2 && "from-green-400 to-emerald-400"
                            )}></div>
                            {user.online && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{user.name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{user.tags}</div>
                          </div>
                          <div className="text-xs font-bold gradient-text">{user.match}%</div>
                        </motion.div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <div className="p-4 pt-0">
                      <div className="gradient-bg text-white text-center py-3 rounded-lg font-semibold text-sm">
                        Discover More Matches
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -left-4 top-1/4 card-glass p-4 shadow-lg hidden lg:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold gradient-text">500+</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Active Groups</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute -right-4 bottom-1/4 card-glass p-4 shadow-lg hidden lg:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold gradient-text">10K+</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Messages Daily</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-gray-50 dark:bg-gray-800/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-sm font-semibold mb-4">
              Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need for the
              <span className="gradient-text"> Perfect Trip</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Discover powerful tools designed to make finding travel companions effortless and enjoyable
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: SparklesIcon,
                title: 'Smart Matching',
                description: 'Advanced algorithm analyzes travel styles, interests, and schedules for perfect matches',
                stat: '92% accuracy'
              },
              {
                icon: ChatBubbleLeftRightIcon,
                title: 'Real-time Chat',
                description: 'WebSocket-based messaging for instant, reliable communication anywhere',
                stat: 'Instant delivery'
              },
              {
                icon: MapPinIcon,
                title: 'Location Services',
                description: 'Find nearby travelers and share meetup locations in real-time with GPS',
                stat: '5km radius'
              },
              {
                icon: ShieldCheckIcon,
                title: 'Safe & Verified',
                description: 'Verified user system and comprehensive reporting for secure travel groups',
                stat: '99% trusted'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card group cursor-pointer"
              >
                <div className="mb-4 w-12 h-12 gradient-bg rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{feature.description}</p>
                <div className="inline-flex px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-xs font-semibold">
                  {feature.stat}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Users Section - Browse without login */}
      <section className="section">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-sm font-semibold mb-4">
              Explore Without Signup
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Meet Your Future <span className="gradient-text">Travel Companions</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Browse active travelers looking for companions. No signup required to explore!
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[
              {
                name: 'Sophie Anderson',
                age: 28,
                location: 'Tokyo, Japan',
                interests: ['Photography', 'Culture', 'Food'],
                bio: 'Looking for travel buddies to explore hidden gems in Tokyo! Love trying local food and taking photos.',
                online: true,
                gradient: 'from-pink-400 to-rose-400'
              },
              {
                name: 'Alex Chen',
                age: 32,
                location: 'Seoul, South Korea',
                interests: ['Hiking', 'Adventure', 'History'],
                bio: 'Adventure seeker planning a trek through Southeast Asia. Join me for an unforgettable journey!',
                online: true,
                gradient: 'from-blue-400 to-cyan-400'
              },
              {
                name: 'Maria Santos',
                age: 25,
                location: 'Barcelona, Spain',
                interests: ['Art', 'Music', 'Nightlife'],
                bio: 'Art enthusiast exploring European cities. Looking for culture-loving travel companions.',
                online: false,
                gradient: 'from-purple-400 to-pink-400'
              },
              {
                name: 'David Kim',
                age: 30,
                location: 'Bangkok, Thailand',
                interests: ['Food', 'Markets', 'Street Art'],
                bio: 'Foodie on a quest to find the best street food in Asia. Let\'s eat our way through the continent!',
                online: true,
                gradient: 'from-orange-400 to-red-400'
              },
              {
                name: 'Emma Wilson',
                age: 27,
                location: 'Paris, France',
                interests: ['Museums', 'Wine', 'Fashion'],
                bio: 'Paris-based traveler planning trips to wine regions. Looking for sophisticated travel partners.',
                online: true,
                gradient: 'from-green-400 to-emerald-400'
              },
              {
                name: 'Lucas Silva',
                age: 29,
                location: 'Rio de Janeiro, Brazil',
                interests: ['Beach', 'Sports', 'Music'],
                bio: 'Beach volleyball player exploring coastal cities. Join me for sun, sand, and great vibes!',
                online: false,
                gradient: 'from-yellow-400 to-orange-400'
              }
            ].map((user, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card group"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    <div className={cn("w-16 h-16 rounded-full bg-gradient-to-br", user.gradient)}></div>
                    {user.online && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-1">{user.name}, {user.age}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <MapPinIcon className="h-4 w-4" />
                      <span className="truncate">{user.location}</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">"{user.bio}"</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {user.interests.map((interest, j) => (
                    <span key={j} className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-xs font-semibold">
                      {interest}
                    </span>
                  ))}
                </div>

                <Link
                  to="/register"
                  className="btn btn-primary w-full btn-sm group-hover:shadow-md"
                >
                  Connect Now
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/register" className="btn btn-primary btn-lg group">
              <span>View All Travelers</span>
              <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section gradient-bg text-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: UserGroupIcon, value: '10K+', label: 'Active Users' },
              { icon: GlobeAltIcon, value: '50+', label: 'Countries' },
              { icon: ChartBarIcon, value: '500+', label: 'Active Trips' },
              { icon: ClockIcon, value: '<1s', label: 'Match Speed' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <stat.icon className="h-8 w-8 mx-auto mb-3 opacity-80" />
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm opacity-80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl gradient-bg p-12 md:p-16 text-center text-white"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Ready to Start Your Adventure?
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join thousands of travelers finding their perfect companions every day
              </p>
              <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg group">
                <span>Get Started Free</span>
                <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
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
                <div className="text-sm">Find your perfect travel companion</div>
              </div>
            </div>

            <div className="flex gap-8">
              <Link to="/login" className="hover:text-white transition-colors">Login</Link>
              <Link to="/register" className="hover:text-white transition-colors">Register</Link>
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

export default HomeNew;
