import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import Logo from '../components/Logo';

/**
 * Play 비공개 테스트 참여 안내.
 *
 * 구글은 "테스터가 되기"를 누른 사람만 인원으로 센다. 설치만 하면 0명으로 잡히기 때문에
 * 이 페이지는 그 한 단계를 가장 크게 보여주는 것이 목적이다.
 */

const OPT_IN_URL = 'https://play.google.com/apps/testing/com.doorimate.app';
const CONTACT = 'kdowndan@gmail.com';

const steps = [
  {
    label: '01',
    title: '안드로이드 폰에서 참여 링크 열기',
    body: '테스트에 쓸 구글 계정으로 로그인된 안드로이드 기기에서 열어야 합니다. PC나 아이폰에서는 참여가 되지 않습니다.',
    icon: DevicePhoneMobileIcon,
  },
  {
    label: '02',
    title: '"테스터가 되기" 누르기',
    body: '이 버튼을 눌러야 테스터로 등록됩니다. 앱만 설치하고 이 단계를 건너뛰면 참여자로 집계되지 않습니다.',
    icon: CheckCircleIcon,
    emphasis: true,
  },
  {
    label: '03',
    title: 'Play 스토어에서 설치',
    body: '참여 후 나타나는 다운로드 링크로 설치합니다. 일반 앱처럼 Play 스토어를 통해 내려받습니다.',
    icon: ArrowTopRightOnSquareIcon,
  },
  {
    label: '04',
    title: '2주 동안 그대로 두기',
    body: '매일 쓰실 필요는 없습니다. 삭제만 하지 않으면 됩니다. 2주가 지나면 지우셔도 괜찮습니다.',
    icon: CalendarDaysIcon,
  },
];

const tryThese = [
  {
    title: '동행 그룹 둘러보기',
    body: '경주·부산·속초·제주·전주 등 실제 일정이 들어간 그룹이 올라가 있습니다. 마음에 드는 그룹에 참여해 보세요.',
    icon: UserGroupIcon,
  },
  {
    title: '동행 추천 받아보기',
    body: '프로필에 여행 스타일과 나이를 넣으면 성향이 맞는 사람을 추천합니다. 추천 이유도 함께 보입니다.',
    icon: MapPinIcon,
  },
  {
    title: '그룹 채팅 써보기',
    body: '그룹에 들어가면 채팅이 열립니다. 메시지와 현재 위치를 보낼 수 있습니다.',
    icon: ChatBubbleLeftRightIcon,
  },
];

const faqs = [
  {
    q: '제 개인정보가 공개되나요?',
    a: '테스터 명단은 개발자만 볼 수 있고, 다른 테스터에게 공개되지 않습니다. 앱 안에서는 직접 입력한 닉네임과 프로필만 다른 사용자에게 보입니다.',
  },
  {
    q: '돈이 드나요?',
    a: '전혀 들지 않습니다. 앱에 결제 기능이 없고, 테스트 기간에도 이후에도 과금되지 않습니다.',
  },
  {
    q: '매일 앱을 켜야 하나요?',
    a: '아니요. 설치 상태만 유지하면 됩니다. 다만 한 번이라도 써 보시고 이상한 점을 알려주시면 큰 도움이 됩니다.',
  },
  {
    q: '첫 로그인이 오래 걸리거나 실패합니다.',
    a: '서버가 무료 요금제라 한동안 요청이 없으면 절전 상태가 됩니다. 깨어나는 첫 요청은 30초 넘게 걸리거나 오류가 날 수 있습니다. 30초쯤 뒤에 한 번 더 시도하시면 이후로는 바로 됩니다.',
  },
  {
    q: '중간에 그만둬도 되나요?',
    a: '됩니다. 다만 인원이 12명 아래로 내려가면 테스트 기간이 처음부터 다시 시작되기 때문에, 가능하면 2주만 채워주시면 정말 감사합니다. 그만두실 때는 미리 한마디만 주세요.',
  },
];

const TesterProgram: React.FC = () => (
  <div className="min-h-screen bg-sand-100 text-ink selection:bg-primary-500 selection:text-white">
    <header className="border-b border-[#F2F1ED] bg-white">
      <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-3" aria-label="두리메이트 홈">
          <Logo variant="gradient" size="md" />
          <span className="text-xl font-extrabold tracking-tight text-ink">Doorimate</span>
        </Link>
        <Link to="/" className="text-sm font-bold text-[#4A4A55] transition hover:text-ink">
          홈으로
        </Link>
      </div>
    </header>

    <main className="mx-auto max-w-4xl px-4 py-14 md:px-8 md:py-20">
      {/* Hero */}
      <div className="inline-flex h-8 items-center gap-2.5 rounded-full bg-primary-100 px-4">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-500 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
        </span>
        <span className="text-sm font-bold text-primary-600">비공개 테스터 모집 중</span>
      </div>

      <h1 className="mt-6 font-display text-[40px] font-black leading-[1.06] tracking-tight text-ink md:text-[56px]">
        출시 전 두리메이트를
        <br />
        먼저 써 주실 분을 찾습니다.
      </h1>

      <p className="mt-7 max-w-2xl text-lg leading-8 text-[#4A4A55]">
        두리메이트는 Google Play 정식 출시를 준비하고 있습니다. 개인 개발자가 앱을 출시하려면
        <strong className="font-extrabold text-ink">
          {' '}
          12명 이상이 14일 동안 비공개 테스트에 참여
        </strong>
        해야 합니다. 딱 그만큼만 도와주시면 됩니다.
      </p>

      {/* 참여 CTA */}
      <section className="mt-12 rounded-[24px] bg-ink p-7 text-white md:p-10">
        <p className="text-sm font-extrabold uppercase tracking-[0.32em] text-primary-400">
          Join the closed test
        </p>
        {/* index.css의 h1~h6 기본 색(text-gray-900)이 상속색을 이기므로 어두운 배경에서는 직접 지정한다 */}
        <h2 className="mt-4 font-display text-3xl font-black tracking-tight text-white md:text-4xl">
          안드로이드 폰에서 이 버튼을 눌러주세요.
        </h2>
        <p className="mt-4 text-base leading-7 text-[#A0A0AC]">
          아래 링크를 연 다음 <strong className="text-white">&ldquo;테스터가 되기&rdquo;</strong> 를
          꼭 눌러주셔야 참여로 집계됩니다.
        </p>

        <a
          href={OPT_IN_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex h-[58px] w-full items-center justify-center gap-3 rounded-[15px] bg-white px-7 text-base font-extrabold text-ink transition hover:bg-sand-100 sm:w-auto"
        >
          테스트 참여 페이지 열기
          <ArrowTopRightOnSquareIcon className="h-5 w-5" />
        </a>

        <p className="mt-5 break-all rounded-2xl bg-white/[0.06] px-5 py-4 font-mono text-sm text-[#A0A0AC]">
          {OPT_IN_URL}
        </p>

        <div className="mt-6 flex gap-4 rounded-2xl bg-white/[0.06] p-5">
          <ExclamationTriangleIcon className="h-6 w-6 shrink-0 text-primary-400" />
          <p className="text-sm leading-7 text-[#A0A0AC]">
            링크가 열리지 않거나 &ldquo;테스트를 사용할 수 없습니다&rdquo;라고 나오면 아직 준비 중인
            것입니다.{' '}
            <a href={`mailto:${CONTACT}`} className="font-bold text-white underline">
              {CONTACT}
            </a>
            로 사용하실 구글 계정 주소를 보내주시면 명단에 추가하고 다시 안내드리겠습니다.
          </p>
        </div>
      </section>

      {/* 단계 */}
      <section className="mt-16">
        <h2 className="font-display text-3xl font-black tracking-tight text-ink md:text-4xl">
          참여 방법은 4단계입니다.
        </h2>
        <div className="mt-8 grid gap-4">
          {steps.map(step => (
            <article
              key={step.label}
              className={`flex gap-5 rounded-[20px] border bg-white p-6 md:p-7 ${
                step.emphasis ? 'border-primary-500 ring-4 ring-primary-100' : 'border-sand-300'
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${
                  step.emphasis ? 'bg-primary-500 text-white' : 'bg-primary-100 text-primary-500'
                }`}
              >
                <step.icon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-display text-xl font-black tracking-tight text-primary-500">
                    {step.label}
                  </span>
                  <h3 className="text-lg font-extrabold tracking-tight text-ink">{step.title}</h3>
                  {step.emphasis && (
                    <span className="rounded-full bg-primary-500 px-3 py-1 text-xs font-extrabold text-white">
                      가장 중요
                    </span>
                  )}
                </div>
                <p className="mt-3 text-base leading-8 text-[#74747F]">{step.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 체험 포인트 */}
      <section className="mt-16">
        <h2 className="font-display text-3xl font-black tracking-tight text-ink md:text-4xl">
          설치하시면 이런 걸 써보실 수 있습니다.
        </h2>
        <p className="mt-4 text-base leading-8 text-[#4A4A55]">
          둘러보기 편하시라고 실제 여행 그룹과 프로필을 미리 넣어뒀습니다.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {tryThese.map(item => (
            <article
              key={item.title}
              className="rounded-[20px] border border-sand-300 bg-white p-6"
            >
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary-100 text-primary-500">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold tracking-tight text-ink">{item.title}</h3>
              <p className="mt-3 text-[15px] leading-7 text-[#74747F]">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-16">
        <h2 className="font-display text-3xl font-black tracking-tight text-ink md:text-4xl">
          자주 묻는 것
        </h2>
        <div className="mt-8 space-y-3">
          {faqs.map(faq => (
            <details
              key={faq.q}
              className="group rounded-[20px] border border-sand-300 bg-white p-6 md:p-7"
            >
              <summary className="cursor-pointer list-none text-lg font-extrabold tracking-tight text-ink marker:hidden">
                <span className="flex items-start justify-between gap-4">
                  {faq.q}
                  <span className="mt-1 shrink-0 text-primary-500 transition group-open:rotate-90">
                    <ArrowRightIcon className="h-5 w-5" />
                  </span>
                </span>
              </summary>
              <p className="mt-4 text-base leading-8 text-[#74747F]">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 문의 */}
      <section className="mt-16 rounded-[24px] bg-white p-7 md:p-10">
        <EnvelopeIcon className="h-11 w-11 text-primary-500" />
        <h2 className="mt-6 font-display text-3xl font-black tracking-tight text-ink">
          막히는 게 있으면 편하게 알려주세요.
        </h2>
        <p className="mt-4 text-base leading-8 text-[#4A4A55]">
          버그든 불편한 점이든 &ldquo;이건 왜 이래요&rdquo; 한 줄이든 다 도움이 됩니다. 테스트
          기간에 받은 의견은 정식 출시 전에 반영합니다.
        </p>
        <a
          href={`mailto:${CONTACT}?subject=%5B%EB%91%90%EB%A6%AC%EB%A9%94%EC%9D%B4%ED%8A%B8%5D%20%ED%85%8C%EC%8A%A4%ED%8A%B8%20%EC%9D%98%EA%B2%AC`}
          className="mt-7 inline-flex h-[54px] items-center justify-center gap-3 rounded-[15px] bg-primary-500 px-7 font-extrabold text-white transition hover:bg-primary-700"
        >
          의견 보내기
          <ArrowRightIcon className="h-5 w-5" />
        </a>
      </section>

      <div className="mt-14 flex flex-wrap gap-5 text-sm font-semibold text-[#74747F]">
        <Link to="/legal" className="hover:text-ink">
          약관 및 개인정보 안내
        </Link>
        <Link to="/child-safety" className="hover:text-ink">
          아동 안전 기준
        </Link>
        <Link to="/account-deletion" className="hover:text-ink">
          계정 삭제
        </Link>
      </div>
    </main>
  </div>
);

export default TesterProgram;
