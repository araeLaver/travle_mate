import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
  GlobeAltIcon,
  HeartIcon,
  RocketLaunchIcon,
  LightBulbIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import SEOHead from '../components/SEOHead';

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

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Fryndo',
  applicationCategory: 'TravelApplication',
  operatingSystem: 'Web',
  url: 'https://fryndo.com',
  description:
    'Fryndo는 AI 기반 매칭 시스템으로 취향이 맞는 여행 동반자를 연결하는 플랫폼입니다. 50개 이상 국가, 10,000명 이상의 여행자 커뮤니티.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KRW',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '1200',
  },
};

const About: React.FC = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' as const },
  };

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-[#0a0a0b]">
      <SEOHead
        title="Fryndo 소개 - 여행 동반자 매칭 플랫폼"
        description="Fryndo는 AI 기반 매칭으로 취향이 맞는 여행 동반자를 연결합니다. 50개 이상 국가, 10,000명 이상의 여행자와 함께 특별한 여행을 만들어보세요."
        canonical="https://fryndo.com/about"
        jsonLd={aboutJsonLd}
      />
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
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      item.path === '/about'
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/20 font-bold'
                        : 'text-[#4A4A55] dark:text-gray-400 hover:text-ink dark:hover:text-white hover:bg-sand-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link
                  to="/login"
                  className="hidden md:inline-flex items-center h-[42px] px-4 text-sm font-bold text-ink bg-sand-200 dark:bg-gray-800 dark:text-gray-200 rounded-xl hover:bg-sand-400 dark:hover:bg-gray-700 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center h-[42px] px-5 text-sm font-extrabold text-white bg-primary-500 rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-[0_8px_22px_rgba(74,58,255,0.3)]"
                >
                  시작하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20">
        <div className="absolute inset-0 gradient-mesh opacity-40 dark:opacity-20" />
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div {...fadeInUp}>
              <span className="inline-flex items-center h-8 px-4 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 rounded-full text-sm font-bold mb-6">
                Fryndo 소개
              </span>
            </motion.div>

            <motion.h1
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl md:text-6xl font-black tracking-tight text-ink dark:text-white mb-6"
            >
              여행의 즐거움을
              <br />
              <span className="text-primary-500 dark:text-primary-400">함께 나누다</span>
            </motion.h1>

            <motion.p
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-[#4A4A55] dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
            >
              Fryndo는 혼자가 아닌 함께하는 여행의 가치를 믿습니다. 전 세계 여행자들과 연결되어
              특별한 여행 경험을 만들어보세요.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center h-8 px-4 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 rounded-full text-sm font-bold mb-4">
                미션
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight text-ink dark:text-white mb-6">
                모든 여행자에게
                <br />
                완벽한 동반자를
              </h2>
              <p className="text-[#4A4A55] dark:text-gray-400 mb-6 leading-relaxed">
                Fryndo는 여행 스타일, 관심사, 일정이 맞는 여행 동반자를 찾아드립니다. AI 기반 매칭
                시스템으로 최적의 여행 파트너를 추천받고, 실시간 채팅으로 소통하며, 함께 특별한
                추억을 만들어보세요.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#4A4A55] dark:text-gray-400">
                  <ShieldCheckIcon className="h-5 w-5 text-success" />
                  <span>검증된 사용자</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#4A4A55] dark:text-gray-400">
                  <GlobeAltIcon className="h-5 w-5 text-primary-500" />
                  <span>50+ 국가</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#4A4A55] dark:text-gray-400">
                  <UserGroupIcon className="h-5 w-5 text-primary-500" />
                  <span>10,000+ 여행자</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                {
                  icon: SparklesIcon,
                  title: 'AI 매칭',
                  desc: '취향에 맞는 동반자 추천',
                },
                {
                  icon: ChatBubbleLeftRightIcon,
                  title: '실시간 채팅',
                  desc: '즉시 소통 가능',
                },
                { icon: MapPinIcon, title: '위치 기반', desc: '주변 여행자 찾기' },
                {
                  icon: HeartIcon,
                  title: '안전한 커뮤니티',
                  desc: '신뢰할 수 있는 환경',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-5 dark:border dark:border-gray-700 hover:shadow-[0_10px_30px_rgba(16,16,20,0.1)] transition-shadow"
                >
                  <div className="w-11 h-11 bg-primary-100 dark:bg-primary-900/30 rounded-[14px] flex items-center justify-center mb-3">
                    <item.icon className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                  </div>
                  <h3 className="font-extrabold text-ink dark:text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-[#74747F] dark:text-gray-400">{item.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-sand-200 dark:bg-gray-900/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center h-8 px-4 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 rounded-full text-sm font-bold mb-4">
              가치
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight text-ink dark:text-white mb-4">
              Fryndo가 추구하는 가치
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: RocketLaunchIcon,
                title: '모험',
                desc: '새로운 장소, 새로운 사람, 새로운 경험. Fryndo와 함께라면 모든 여행이 모험이 됩니다.',
              },
              {
                icon: UserGroupIcon,
                title: '연결',
                desc: '전 세계 여행자들과 연결되어 문화를 나누고, 우정을 쌓고, 함께 성장합니다.',
              },
              {
                icon: LightBulbIcon,
                title: '발견',
                desc: '혼자서는 몰랐던 숨겨진 명소, 로컬 맛집, 특별한 경험을 동반자와 함께 발견합니다.',
              },
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-[20px] p-8 dark:border dark:border-gray-700 hover:shadow-[0_10px_30px_rgba(16,16,20,0.1)] transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-11 h-11 bg-primary-100 dark:bg-primary-900/30 rounded-[14px] flex items-center justify-center mb-6">
                  <value.icon className="h-6 w-6 text-primary-500 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-ink dark:text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-[#74747F] dark:text-gray-400 leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[24px] bg-ink p-12 md:p-16 text-center"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="font-display text-3xl md:text-[36px] font-black tracking-tight text-white mb-6">
                지금 바로 시작하세요
              </h2>
              <p className="text-lg text-[#A0A0AC] mb-8">
                Fryndo와 함께 새로운 여행 동반자를 만나보세요.
                <br />
                무료로 시작할 수 있습니다.
              </p>
              <Link
                to="/register"
                className="inline-flex h-[58px] items-center justify-center gap-2 px-8 text-base font-extrabold text-ink bg-white rounded-[15px] hover:bg-sand-100 transition-all duration-300 hover:-translate-y-1"
              >
                무료로 시작하기
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
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
              {footerItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-[#74747F] dark:text-gray-400 hover:text-ink dark:hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="text-[13px] font-semibold text-[#9A9AA4] dark:text-gray-500">
              &copy; 2026 Fryndo
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
