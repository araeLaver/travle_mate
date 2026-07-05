import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
  LockClosedIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useTutorial } from '../contexts/TutorialContext';

const navItems = [
  { label: '왜 Fryndo인가', href: '#why' },
  { label: '안전 기준', href: '#safety' },
  { label: '사용 방법', href: '#how' },
];

const trustSignals = ['검증 프로필 우선', '일정 기반 매칭', '대화 전 안전 신호', '공개 베타 운영'];

const featureCards = [
  {
    title: '일정이 맞는 사람부터',
    body: '목적지, 출발일, 여행 기간을 먼저 맞춰서 실제로 함께 움직일 수 있는 후보를 보여줍니다.',
    icon: CalendarDaysIcon,
    tone: 'bg-[#FFFDF7] border-[#E5DCC8]',
  },
  {
    title: '여행 성향 매칭',
    body: '예산, 속도, 관심사, 오전형/야간형 같은 여행 습관을 기준으로 대화 전에 궁합을 확인합니다.',
    icon: SparklesIcon,
    tone: 'bg-[#14213D] border-[#14213D] text-white',
  },
  {
    title: '그룹과 채팅 연결',
    body: '혼자 찾기 어렵다면 같은 목적지 그룹에 들어가고, 매칭 후에는 채팅으로 바로 계획을 이어갑니다.',
    icon: ChatBubbleLeftRightIcon,
    tone: 'bg-[#FFFDF7] border-[#E5DCC8]',
  },
];

const safetyItems = [
  {
    title: '프로필 완성도',
    body: '사진, 관심사, 여행 스타일을 기반으로 대화 전 신뢰도를 파악합니다.',
  },
  { title: '일정 겹침', body: '같은 지역에 같은 날짜로 움직일 가능성이 높은 사람을 우선합니다.' },
  { title: '대화 전 맥락', body: '무작위 채팅보다 목적지와 계획 중심으로 대화를 시작합니다.' },
];

const steps = [
  {
    label: '01',
    title: '여행 프로필 만들기',
    body: '가고 싶은 곳, 날짜, 여행 속도, 관심사를 간단히 입력합니다.',
  },
  {
    label: '02',
    title: '맞는 메이트 확인',
    body: '일정과 성향이 겹치는 후보, 그룹, 여행 계획을 비교합니다.',
  },
  {
    label: '03',
    title: '채팅으로 계획 확정',
    body: '대화로 일정과 역할을 맞추고 함께 움직일 준비를 마칩니다.',
  },
];

const Home: React.FC = () => {
  const { startTutorial } = useTutorial();

  return (
    <div className="min-h-screen overflow-hidden bg-[#F7F2E8] text-[#14213D] selection:bg-[#F97316] selection:text-white">
      <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-8" aria-label="주요 메뉴">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-[1.5rem] border border-[#E5DCC8]/80 bg-[#FFFDF7]/85 px-4 shadow-[0_24px_80px_rgba(20,33,61,0.12)] backdrop-blur-xl md:px-6">
          <Link to="/" className="flex items-center gap-3" aria-label="Fryndo 홈">
            <Logo variant="gradient" size="md" />
            <span className="font-display text-2xl font-black tracking-[-0.04em] text-[#14213D]">
              Fryndo
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-bold text-[#52606D] transition hover:bg-[#F7F2E8] hover:text-[#14213D]"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-bold text-[#52606D] transition hover:text-[#14213D] md:inline-flex"
            >
              로그인
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-[#14213D] px-4 py-2.5 text-sm font-black text-white shadow-[0_14px_30px_rgba(20,33,61,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0F172A] md:px-5"
            >
              메이트 찾기
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content">
        <section className="relative min-h-screen px-4 pb-20 pt-32 md:px-8 md:pb-28 md:pt-40">
          <div className="absolute left-[-18rem] top-24 h-[34rem] w-[34rem] rounded-full bg-[#2DD4BF]/20 blur-3xl" />
          <div className="absolute right-[-10rem] top-16 h-[38rem] w-[38rem] rounded-full bg-[#F97316]/20 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#F7F2E8] to-transparent" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            >
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#E5DCC8] bg-[#FFFDF7]/80 px-4 py-2 shadow-sm backdrop-blur">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2DD4BF] opacity-70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#2DD4BF]" />
                </span>
                <span className="text-sm font-black text-[#14213D]">공개 베타 출시 중</span>
                <span className="hidden text-sm font-semibold text-[#52606D] sm:inline">
                  일정 기반 여행 동행 매칭
                </span>
              </div>

              <h1 className="font-display text-[4.2rem] font-black leading-[0.9] tracking-[-0.075em] text-[#14213D] sm:text-[5.8rem] lg:text-[7.2rem]">
                혼자 떠나도,
                <br />
                <span className="relative inline-block text-[#F97316]">
                  혼자가 아닌
                  <span className="absolute -bottom-2 left-1 h-3 w-[96%] rounded-full bg-[#2DD4BF]/45" />
                </span>
                <br />
                여행.
              </h1>

              <p className="mt-8 max-w-2xl text-xl font-medium leading-9 text-[#52606D] md:text-2xl md:leading-10">
                Fryndo는 목적지, 일정, 여행 성향, 검증 신호를 기준으로 지금 함께 움직일 수 있는 여행
                메이트를 찾는 서비스입니다.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#F97316] px-7 py-4 text-base font-black text-white shadow-[0_22px_50px_rgba(249,115,22,0.35)] transition hover:-translate-y-1 hover:bg-[#EA580C]"
                >
                  지금 메이트 찾기
                  <ArrowRightIcon className="h-5 w-5 transition group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/groups"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-[#E5DCC8] bg-[#FFFDF7] px-7 py-4 text-base font-black text-[#14213D] shadow-sm transition hover:-translate-y-1 hover:border-[#F97316]/50"
                >
                  여행 그룹 둘러보기
                </Link>
                <button
                  onClick={startTutorial}
                  className="tutorial-guest-mode-btn inline-flex items-center justify-center rounded-full px-5 py-4 text-base font-black text-[#52606D] transition hover:text-[#14213D]"
                >
                  60초 둘러보기
                </button>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 md:grid-cols-4">
                {trustSignals.map(signal => (
                  <div
                    key={signal}
                    className="rounded-2xl border border-[#E5DCC8] bg-[#FFFDF7]/75 px-4 py-3 text-sm font-black text-[#14213D] shadow-sm"
                  >
                    <CheckBadgeIcon className="mb-2 h-5 w-5 text-[#2DD4BF]" />
                    {signal}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 34, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.75, delay: 0.1, ease: 'easeOut' }}
              className="relative"
            >
              <div className="absolute -left-6 top-14 hidden rounded-[2rem] bg-[#14213D] px-6 py-5 text-white shadow-2xl md:block">
                <p className="text-sm font-bold text-white/60">오늘의 매칭 기준</p>
                <p className="mt-1 font-display text-3xl font-black tracking-[-0.04em]">
                  일정 + 신뢰
                </p>
              </div>

              <div className="rounded-[2.5rem] border border-[#E5DCC8] bg-[#FFFDF7] p-5 shadow-[0_34px_100px_rgba(20,33,61,0.18)] md:p-7">
                <div className="rounded-[2rem] bg-[#14213D] p-6 text-white">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#2DD4BF]">
                        Route Card
                      </p>
                      <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.055em]">
                        서울 → 후쿠오카
                      </h2>
                      <p className="mt-2 text-white/65">3박 4일 · 음식 여행 · 오전형</p>
                    </div>
                    <div className="rounded-full bg-white/10 p-3">
                      <MapPinIcon className="h-7 w-7 text-[#F97316]" />
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-3 gap-3">
                    {['82%', '4명', 'Beta'].map((value, index) => (
                      <div
                        key={value}
                        className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur"
                      >
                        <div className="font-display text-2xl font-black">{value}</div>
                        <div className="mt-1 text-xs font-bold text-white/55">
                          {index === 0 ? '일정 겹침' : index === 1 ? '후보' : '출시 상태'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    { label: '검증 프로필', value: '완료', icon: ShieldCheckIcon },
                    { label: '선호 여행 속도', value: '여유형', icon: ClockIconFallback },
                    { label: '대화 가능 상태', value: '지금 가능', icon: ChatBubbleLeftRightIcon },
                  ].map(item => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-3xl border border-[#E5DCC8] bg-[#F7F2E8]/70 px-5 py-4"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFFDF7] text-[#F97316]">
                          <item.icon className="h-6 w-6" />
                        </span>
                        <span className="font-bold text-[#52606D]">{item.label}</span>
                      </div>
                      <span className="font-black text-[#14213D]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="why" className="px-4 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.32em] text-[#F97316]">
                  Why Fryndo
                </p>
                <h2 className="mt-4 max-w-3xl font-display text-5xl font-black leading-[0.95] tracking-[-0.06em] md:text-6xl">
                  그냥 친구 찾기가 아니라, 여행을 같이 완주할 사람 찾기.
                </h2>
              </div>
              <p className="max-w-md text-lg font-medium leading-8 text-[#52606D]">
                여행 동행은 취향만 맞아서는 부족합니다. 일정, 목적지, 안전 신호가 동시에 맞아야 실제
                약속으로 이어집니다.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {featureCards.map((card, index) => (
                <motion.article
                  key={card.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: index * 0.08 }}
                  className={`rounded-[2rem] border p-7 shadow-sm ${card.tone}`}
                >
                  <div className="mb-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F97316] text-white shadow-lg shadow-[#F97316]/25">
                    <card.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-display text-3xl font-black tracking-[-0.05em]">
                    {card.title}
                  </h3>
                  <p
                    className={`mt-4 text-base font-medium leading-8 ${index === 1 ? 'text-white/70' : 'text-[#52606D]'}`}
                  >
                    {card.body}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="safety" className="px-4 py-20 md:px-8 md:py-28">
          <div className="mx-auto grid max-w-7xl gap-8 rounded-[2.5rem] bg-[#14213D] p-6 text-white md:grid-cols-[0.9fr_1.1fr] md:p-12">
            <div className="rounded-[2rem] bg-[#FFFDF7] p-8 text-[#14213D]">
              <LockClosedIcon className="h-12 w-12 text-[#F97316]" />
              <h2 className="mt-8 font-display text-5xl font-black leading-none tracking-[-0.06em]">
                안전 기준을 숨기지 않습니다.
              </h2>
              <p className="mt-6 text-lg font-medium leading-8 text-[#52606D]">
                Fryndo는 공개 베타 단계부터 신뢰 신호를 화면 전면에 둡니다. 빠른 매칭보다 안전하게
                대화할 수 있는 맥락이 우선입니다.
              </p>
            </div>

            <div className="grid gap-4">
              {safetyItems.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-[1.75rem] border border-white/10 bg-white/[0.07] p-6"
                >
                  <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#2DD4BF] font-display text-lg font-black text-[#083C36]">
                    {index + 1}
                  </div>
                  <h3 className="font-display text-3xl font-black tracking-[-0.04em]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base font-medium leading-7 text-white/65">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="px-4 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-black uppercase tracking-[0.32em] text-[#F97316]">
                How it works
              </p>
              <h2 className="mt-4 font-display text-5xl font-black leading-[0.95] tracking-[-0.06em] md:text-6xl">
                3단계면 충분합니다.
              </h2>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {steps.map(step => (
                <div
                  key={step.label}
                  className="rounded-[2rem] border border-[#E5DCC8] bg-[#FFFDF7] p-7"
                >
                  <div className="font-display text-6xl font-black tracking-[-0.08em] text-[#F97316]">
                    {step.label}
                  </div>
                  <h3 className="mt-8 font-display text-3xl font-black tracking-[-0.05em]">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-base font-medium leading-8 text-[#52606D]">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-8 md:pb-28">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#F97316] p-8 text-white shadow-[0_34px_90px_rgba(249,115,22,0.3)] md:p-14">
            <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.32em] text-white/70">
                  Launch Beta
                </p>
                <h2 className="mt-4 max-w-3xl font-display text-5xl font-black leading-[0.95] tracking-[-0.06em] md:text-6xl">
                  지금 공개 베타에서 첫 여행 메이트를 찾아보세요.
                </h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-4 font-black text-[#F97316] transition hover:-translate-y-1 hover:bg-[#FFF7ED]"
                >
                  무료로 시작하기
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>
                <Link
                  to="/legal"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-4 font-black text-white transition hover:bg-white/10"
                >
                  약관/개인정보 안내
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E5DCC8] bg-[#FFFDF7] px-4 py-10 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Logo variant="gradient" size="sm" />
            <span className="font-display text-xl font-black tracking-[-0.04em]">Fryndo</span>
            <span className="rounded-full bg-[#F7F2E8] px-3 py-1 text-xs font-black text-[#52606D]">
              Public Beta
            </span>
          </div>
          <div className="flex flex-wrap gap-5 text-sm font-bold text-[#52606D]">
            <Link to="/about" className="hover:text-[#14213D]">
              소개
            </Link>
            <Link to="/groups" className="hover:text-[#14213D]">
              그룹
            </Link>
            <Link to="/legal" className="hover:text-[#14213D]">
              약관/개인정보
            </Link>
          </div>
          <p className="text-sm font-semibold text-[#52606D]">
            © 2026 Fryndo. Built for safer travel matching.
          </p>
        </div>
      </footer>
    </div>
  );
};

const ClockIconFallback = GlobeAltIcon;

export default Home;
