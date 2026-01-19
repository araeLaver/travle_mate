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

const About: React.FC = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' as const },
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b]">
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
                  트리버디
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                {['About', 'Features', 'Groups'].map(item => (
                  <Link
                    key={item}
                    to={`/${item.toLowerCase()}`}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      item === 'About'
                        ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
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
      <section className="relative pt-40 pb-20">
        <div className="absolute inset-0 gradient-mesh opacity-40 dark:opacity-20" />
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div {...fadeInUp}>
              <span className="inline-block px-4 py-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-sm font-semibold mb-6">
                About Tribuddy
              </span>
            </motion.div>

            <motion.h1
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              여행의 즐거움을
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                함께 나누다
              </span>
            </motion.h1>

            <motion.p
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
            >
              트리버디는 혼자가 아닌 함께하는 여행의 가치를 믿습니다. 전 세계 여행자들과 연결되어
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
              <span className="inline-block px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold mb-4">
                Our Mission
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                모든 여행자에게
                <br />
                완벽한 동반자를
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                트리버디는 여행 스타일, 관심사, 일정이 맞는 여행 동반자를 찾아드립니다. AI 기반 매칭
                시스템으로 최적의 여행 파트너를 추천받고, 실시간 채팅으로 소통하며, 함께 특별한
                추억을 만들어보세요.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <ShieldCheckIcon className="h-5 w-5 text-emerald-500" />
                  <span>검증된 사용자</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <GlobeAltIcon className="h-5 w-5 text-blue-500" />
                  <span>50+ 국가</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <UserGroupIcon className="h-5 w-5 text-violet-500" />
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
                  color: 'violet',
                },
                {
                  icon: ChatBubbleLeftRightIcon,
                  title: '실시간 채팅',
                  desc: '즉시 소통 가능',
                  color: 'cyan',
                },
                { icon: MapPinIcon, title: '위치 기반', desc: '주변 여행자 찾기', color: 'rose' },
                {
                  icon: HeartIcon,
                  title: '안전한 커뮤니티',
                  desc: '신뢰할 수 있는 환경',
                  color: 'emerald',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow"
                >
                  <div
                    className={`w-10 h-10 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-xl flex items-center justify-center mb-3`}
                  >
                    <item.icon
                      className={`h-5 w-5 text-${item.color}-600 dark:text-${item.color}-400`}
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm font-semibold mb-4">
              Our Values
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              트리버디가 추구하는 가치
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: RocketLaunchIcon,
                title: '모험',
                desc: '새로운 장소, 새로운 사람, 새로운 경험. 트리버디와 함께라면 모든 여행이 모험이 됩니다.',
                gradient: 'from-violet-500 to-purple-500',
              },
              {
                icon: UserGroupIcon,
                title: '연결',
                desc: '전 세계 여행자들과 연결되어 문화를 나누고, 우정을 쌓고, 함께 성장합니다.',
                gradient: 'from-cyan-500 to-blue-500',
              },
              {
                icon: LightBulbIcon,
                title: '발견',
                desc: '혼자서는 몰랐던 숨겨진 명소, 로컬 맛집, 특별한 경험을 동반자와 함께 발견합니다.',
                gradient: 'from-amber-500 to-orange-500',
              },
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center mb-6`}
                >
                  <value.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{value.desc}</p>
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
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 p-12 md:p-16 text-center"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                지금 바로 시작하세요
              </h2>
              <p className="text-lg text-white/80 mb-8">
                트리버디와 함께 새로운 여행 동반자를 만나보세요.
                <br />
                무료로 시작할 수 있습니다.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-violet-600 bg-white rounded-2xl hover:bg-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                무료로 시작하기
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
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
              <span className="text-xl font-bold text-gray-900 dark:text-white">트리버디</span>
            </div>

            <div className="flex gap-8 text-sm">
              {['About', 'Login', 'Register', 'Groups'].map(item => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-500">© 2025 Tribuddy</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
