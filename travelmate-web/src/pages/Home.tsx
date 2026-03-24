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
  UserPlusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useTutorial } from '../contexts/TutorialContext';
import { cn } from '../lib/utils';
import AdBanner from '../components/ads/AdBanner';

const navItems = [
  { label: '소개', path: '/about' },
  { label: '기능', path: '/features' },
  { label: '그룹', path: '/groups' },
];

const footerItems = [
  { label: '소개', path: '/about' },
  { label: '로그인', path: '/login' },
  { label: '회원가입', path: '/register' },
  { label: '그룹', path: '/groups' },
];

const HERO_BG =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1920&q=80';
const CTA_BG =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80';
const STATS_BG =
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1920&q=80';

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
                  Fryndo
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link
                  to="/login"
                  className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  로그인
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                  시작하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 md:pt-48 md:pb-32 min-h-[90vh] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/90 dark:from-[#0a0a0b]/80 dark:via-[#0a0a0b]/60 dark:to-[#0a0a0b]/90" />
        </div>

        {/* Blob animations */}
        <div
          className="absolute top-20 left-10 w-72 h-72 bg-violet-400/20 rounded-full blur-3xl"
          style={{ animation: 'blob 7s infinite' }}
        />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/15 rounded-full blur-3xl"
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-full shadow-md shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700 mb-8"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                지금 바로 여행 동반자를 찾아보세요
              </span>
            </motion.div>

            <motion.h1
              {...fadeInUp}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8"
            >
              <span className="text-gray-900 dark:text-white">나만의</span>
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                여행 동반자 찾기
              </span>
            </motion.h1>

            <motion.p
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              전 세계 취향이 맞는 여행자와 연결하세요. 함께 모험하고, 추억을 만들고, 새로운 세상을
              탐험하세요.
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
                탐험 시작하기
                <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={startTutorial}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 tutorial-guest-mode-btn"
              >
                둘러보기
              </button>
            </motion.div>
          </div>
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
              주요 기능
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              필요한 모든 것
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              여행 동반자를 쉽게 찾을 수 있는 강력한 도구
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
                <h3 className="text-2xl md:text-3xl font-bold mb-3">스마트 매칭</h3>
                <p className="text-white/80 text-lg max-w-sm">
                  AI 기반 알고리즘이 관심사, 여행 스타일, 일정이 맞는 여행자를 찾아드립니다
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
                  <span className="text-white/90 text-sm font-medium">오늘 +2,500명 매칭</span>
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">실시간 채팅</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                읽음 확인이 가능한 즉시 메시지
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">위치 기반</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">주변 여행자 찾기</p>
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
                <h3 className="text-xl font-bold mb-2">여행 그룹</h3>
                <p className="text-white/80 text-sm max-w-xs">
                  같은 목적지로 향하는 그룹에 참여하거나 만들어보세요
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
              <h3 className="text-xl font-bold mb-2">검증된 사용자</h3>
              <p className="text-white/80 text-sm">안전하고 신뢰할 수 있는 커뮤니티</p>
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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">50+ 국가</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">전 세계와 연결</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ad Banner */}
      <div className="container-custom py-8">
        <AdBanner adSlot="HOME_TOP" adFormat="horizontal" className="max-w-4xl mx-auto" />
      </div>

      {/* How It Works Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm font-semibold mb-4">
              시작하기
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              이렇게 사용하세요
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              간단한 3단계로 여행 동반자를 찾아보세요
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: 1,
                icon: UserPlusIcon,
                title: '가입하기',
                description:
                  '여행 스타일과 관심사를 설정하세요. 프로필이 풍부할수록 더 정확한 매칭이 가능합니다.',
                gradient: 'from-rose-500 to-pink-500',
                bgColor: 'bg-rose-100 dark:bg-rose-900/30',
                textColor: 'text-rose-600 dark:text-rose-400',
              },
              {
                step: 2,
                icon: SparklesIcon,
                title: '매칭 받기',
                description:
                  'AI가 딱 맞는 여행 동반자를 추천합니다. 여행지, 일정, 취향까지 분석합니다.',
                gradient: 'from-violet-500 to-purple-500',
                bgColor: 'bg-violet-100 dark:bg-violet-900/30',
                textColor: 'text-violet-600 dark:text-violet-400',
              },
              {
                step: 3,
                icon: ChatBubbleLeftRightIcon,
                title: '함께 떠나기',
                description:
                  '실시간 채팅으로 여행을 계획하세요. 그룹을 만들어 함께 모험을 시작하세요.',
                gradient: 'from-cyan-500 to-blue-500',
                bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
                textColor: 'text-cyan-600 dark:text-cyan-400',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1 text-center h-full">
                  {/* Step Number */}
                  <div
                    className={cn(
                      'inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br text-white text-sm font-bold mb-6',
                      item.gradient
                    )}
                  >
                    {item.step}
                  </div>

                  {/* Icon */}
                  <div
                    className={cn(
                      'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6',
                      item.bgColor
                    )}
                  >
                    <item.icon className={cn('h-8 w-8', item.textColor)} />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Connector Line (between cards) */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src={STATS_BG} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gray-900/75 backdrop-blur-sm" />
        </div>

        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-white/10 text-white/90 rounded-full text-sm font-semibold mb-4 backdrop-blur">
              실적
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">숫자로 보는 Fryndo</h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              전 세계 여행자들이 Fryndo와 함께하고 있습니다
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: '50+', label: '국가', icon: GlobeAltIcon },
              { value: '10,000+', label: '여행자', icon: UserGroupIcon },
              { value: '95%', label: '매칭 만족도', icon: SparklesIcon },
              { value: '24시간', label: '평균 응답', icon: ClockIcon },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-colors">
                  <stat.icon className="h-8 w-8 text-white/70 mx-auto mb-4" />
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-sm text-white/60 font-medium">{stat.label}</div>
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
            className="relative overflow-hidden rounded-[2.5rem] p-12 md:p-20"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img src={CTA_BG} alt="" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/85 via-purple-600/85 to-pink-600/85" />
            </div>

            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                여행을 시작할 준비가 되셨나요?
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto">
                매일 수천 명의 여행자가 완벽한 동반자를 찾고 있습니다
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-violet-600 bg-white rounded-2xl hover:bg-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  무료로 시작하기
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>
                <button
                  onClick={startTutorial}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-white/20 backdrop-blur border border-white/30 rounded-2xl hover:bg-white/30 transition-all duration-300 tutorial-guest-mode-btn"
                >
                  둘러보기
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
              <span className="text-xl font-bold text-gray-900 dark:text-white">Fryndo</span>
            </div>

            <div className="flex gap-8 text-sm">
              {footerItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-500">&copy; 2026 Fryndo</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
