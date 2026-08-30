import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const sections = [
  {
    title: '서비스 성격',
    body: 'Fryndo는 공개 베타 단계의 여행 동행 매칭 서비스입니다. 사용자는 자신의 여행 일정, 목적지, 관심사, 프로필 정보를 기반으로 다른 사용자 또는 그룹과 연결될 수 있습니다.',
  },
  {
    title: '안전 안내',
    body: 'Fryndo는 사용자 간 연결을 돕지만 오프라인 만남의 결과를 보증하지 않습니다. 첫 만남은 공개된 장소에서 진행하고, 금전 거래나 신분증 공유 등 민감한 요청은 피해야 합니다.',
  },
  {
    title: '수집될 수 있는 정보',
    body: '회원 가입 및 서비스 이용 과정에서 계정 정보, 프로필 정보, 여행 일정, 관심사, 채팅/매칭 활동 기록, 기기 및 접속 로그가 서비스 운영과 안전 관리를 위해 처리될 수 있습니다.',
  },
  {
    title: '정보 이용 목적',
    body: '수집 정보는 계정 운영, 여행 동행 추천, 그룹/채팅 기능 제공, 부정 이용 방지, 서비스 품질 개선, 법령상 의무 이행을 위해 사용됩니다.',
  },
  {
    title: '베타 운영 고지',
    body: '공개 베타 기간에는 기능, 정책, 보관 기간, 외부 연동 범위가 변경될 수 있습니다. 정식 결제 또는 유료 기능 제공 전에는 별도 고지를 진행합니다.',
  },
];

const Legal: React.FC = () => (
  <main className="min-h-screen bg-sand-100 px-4 py-10 text-ink md:px-8">
    <div className="mx-auto max-w-4xl">
      <Link to="/" className="mb-10 inline-flex items-center gap-3">
        <Logo variant="gradient" size="md" />
        <span className="text-2xl font-extrabold tracking-tight text-ink">Fryndo</span>
      </Link>

      <section className="rounded-[20px] bg-white p-8 shadow-[0_10px_30px_rgba(16,16,20,0.1)] md:p-12">
        <p className="text-sm font-extrabold uppercase tracking-[0.32em] text-primary-500">
          Legal Notice
        </p>
        <h1 className="mt-4 font-display text-4xl font-black leading-[1.05] tracking-tight text-ink md:text-5xl">
          이용약관 및 개인정보 안내
        </h1>
        <p className="mt-6 text-lg leading-8 text-[#4A4A55]">
          시행일: 2026년 7월 4일. 이 문서는 공개 베타 출시를 위한 기본 안내이며, 정식 약관은 서비스
          운영 범위 확정에 따라 보강될 수 있습니다.
        </p>

        <div className="mt-10 space-y-5">
          {sections.map(section => (
            <article key={section.title} className="rounded-2xl bg-sand-100 p-6">
              <h2 className="text-xl font-extrabold tracking-tight text-ink">{section.title}</h2>
              <p className="mt-3 text-base leading-8 text-[#4A4A55]">{section.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 rounded-2xl bg-ink p-6 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-black tracking-tight">문의 및 삭제 요청</h2>
            <p className="mt-2 text-sm leading-6 text-[#A0A0AC]">
              계정, 프로필, 매칭 정보 삭제 요청은 운영자에게 직접 전달하거나 서비스 내 문의 채널이
              열리는 즉시 해당 채널을 통해 접수합니다.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center rounded-[15px] bg-white px-5 font-extrabold text-ink transition hover:bg-sand-100"
          >
            홈으로
          </Link>
        </div>
      </section>
    </div>
  </main>
);

export default Legal;
