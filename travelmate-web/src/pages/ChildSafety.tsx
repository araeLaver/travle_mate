import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

/**
 * 아동 안전 표준 (CSAE) 공개 페이지.
 *
 * Google Play는 소셜·데이트 카테고리 앱에 아동 성 착취·학대(CSAE) 대응 기준을 공개하고
 * 신고 연락처를 제시하도록 요구한다. Play Console의 "아동 안전 표준" 선언에 이 URL을 낸다.
 */

const CONTACT = 'kdowndan@gmail.com';
// Play Console의 아동 안전 표준 선언에는 개발자 계정 연락처가 들어간다.
// 그 주소와 이 페이지가 어긋나면 심사에서 문제가 되므로 둘 다 적는다.
const DEVELOPER_CONTACT = 'kimdan2@nate.com';

const standards = [
  {
    title: '만 18세 이상만 이용할 수 있습니다',
    body: '두리메이트는 성인 대상 서비스입니다. Google Play 스토어 등록정보의 대상 연령대를 만 18세 이상으로 선언했으며, 미성년자를 대상으로 하거나 미성년자의 관심을 끄는 콘텐츠를 제공하지 않습니다. 가입 시 생년월일을 기준으로 만 18세 미만임이 확인되면 이용을 제한합니다.',
  },
  {
    title: '아동 성 착취·학대 콘텐츠를 금지합니다',
    body: '아동을 성적으로 묘사하거나 착취하는 모든 콘텐츠(CSAM), 아동에게 접근하려는 그루밍 시도, 미성년자와의 만남을 암시하는 게시물과 메시지를 전면 금지합니다. 이는 프로필, 자기소개, 사진, 그룹 설명, 채팅 메시지 전부에 적용됩니다.',
  },
  {
    title: '누구나 신고할 수 있습니다',
    body: '앱 안에서 사용자 프로필의 신고 기능으로 즉시 신고할 수 있습니다. 앱을 쓰지 않는 분도 아래 연락처로 신고하실 수 있으며, 신고자의 신원은 공개하지 않습니다.',
  },
  {
    title: '신고는 확인 즉시 처리합니다',
    body: '아동 안전 관련 신고는 다른 신고보다 우선해 확인합니다. 사실로 확인되면 해당 계정을 즉시 영구 정지하고, 관련 콘텐츠를 삭제하며, 접근 기록을 보존합니다.',
  },
  {
    title: '관계 기관에 신고합니다',
    body: '아동 성 착취·학대가 확인되거나 합리적으로 의심되는 경우, 대한민국 관계 기관(경찰청 112, 여성가족부 산하 디지털성범죄피해자지원센터) 및 필요 시 NCMEC 등 국제 기관에 신고하고 수사에 협조합니다.',
  },
  {
    title: '기준을 계속 갱신합니다',
    body: '서비스 기능이 바뀌거나 새로운 위험이 확인되면 이 기준과 대응 절차를 갱신하고 이 페이지에 반영합니다.',
  },
];

const reportChannels = [
  {
    label: '앱 내 신고',
    value: '사용자 프로필 → 신고하기',
    note: '가장 빠른 경로입니다. 신고 사유와 설명을 함께 남겨주세요.',
  },
  {
    label: '이메일',
    value: CONTACT,
    note: '앱을 쓰지 않으셔도 신고하실 수 있습니다. 가능하면 닉네임과 화면 캡처를 함께 보내주세요.',
    href: `mailto:${CONTACT}?subject=%5B%EC%95%84%EB%8F%99%20%EC%95%88%EC%A0%84%5D%20%EC%8B%A0%EA%B3%A0`,
  },
  {
    label: '긴급 상황',
    value: '경찰청 112',
    note: '아동이 즉각적인 위험에 처했다고 판단되면 저희보다 먼저 112에 신고해 주세요.',
  },
];

const ChildSafety: React.FC = () => (
  <div className="min-h-screen bg-sand-100 text-ink selection:bg-primary-500 selection:text-white">
    <header className="border-b border-[#F2F1ED] bg-white">
      <div className="mx-auto flex h-[76px] max-w-5xl items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-3" aria-label="두리메이트 홈">
          <Logo variant="gradient" size="md" />
          <span className="text-xl font-extrabold tracking-tight text-ink">Doorimate</span>
        </Link>
        <Link to="/" className="text-sm font-bold text-[#4A4A55] transition hover:text-ink">
          홈으로
        </Link>
      </div>
    </header>

    <main className="mx-auto max-w-3xl px-4 py-14 md:px-8 md:py-20">
      <p className="text-sm font-extrabold uppercase tracking-[0.32em] text-primary-500">
        Child Safety Standards
      </p>
      <h1 className="mt-4 font-display text-[40px] font-black leading-[1.06] tracking-tight text-ink md:text-[52px]">
        아동 안전 기준
      </h1>
      <p className="mt-7 text-lg leading-8 text-[#4A4A55]">
        두리메이트(Doorimate)는 아동 성 착취 및 학대(CSAE)에 반대하며, 서비스가 그런 목적에 이용되지
        않도록 아래 기준을 운영합니다. 이 문서는 Google Play의 아동 안전 표준 정책에 따라
        공개합니다.
      </p>
      <p className="mt-4 text-sm font-semibold text-[#9A9AA4]">최종 갱신: 2026년 9월 21일</p>

      <section className="mt-12 space-y-4">
        {standards.map((item, index) => (
          <article
            key={item.title}
            className="rounded-[20px] border border-sand-300 bg-white p-6 md:p-7"
          >
            <div className="flex items-start gap-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 font-display text-base font-black text-primary-500">
                {index + 1}
              </span>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-ink">{item.title}</h2>
                <p className="mt-3 text-base leading-8 text-[#74747F]">{item.body}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="font-display text-3xl font-black tracking-tight text-ink">신고 창구</h2>
        <p className="mt-4 text-base leading-8 text-[#4A4A55]">
          아동 안전과 관련된 문제를 발견하시면 아래 어느 경로로든 알려주세요.
        </p>
        <div className="mt-7 space-y-3">
          {reportChannels.map(channel => (
            <div key={channel.label} className="rounded-[20px] bg-white p-6">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-primary-500">
                {channel.label}
              </p>
              {channel.href ? (
                <a
                  href={channel.href}
                  className="mt-3 block break-all font-display text-2xl font-black tracking-tight text-ink underline decoration-primary-200 underline-offset-4 hover:decoration-primary-500"
                >
                  {channel.value}
                </a>
              ) : (
                <p className="mt-3 break-all font-display text-2xl font-black tracking-tight text-ink">
                  {channel.value}
                </p>
              )}
              <p className="mt-3 text-[15px] leading-7 text-[#74747F]">{channel.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-[24px] bg-ink p-7 text-white md:p-10">
        <h2 className="font-display text-2xl font-black tracking-tight md:text-3xl">운영 책임자</h2>
        <p className="mt-4 text-base leading-8 text-[#A0A0AC]">
          두리메이트(Doorimate) · 아동 안전 담당 연락처
        </p>
        <ul className="mt-3 space-y-2 text-base leading-8 text-[#A0A0AC]">
          <li>
            신고 접수{' '}
            <a href={`mailto:${CONTACT}`} className="font-bold text-white underline">
              {CONTACT}
            </a>
          </li>
          <li>
            개발자 계정 연락처{' '}
            <a href={`mailto:${DEVELOPER_CONTACT}`} className="font-bold text-white underline">
              {DEVELOPER_CONTACT}
            </a>
          </li>
        </ul>
        <p className="mt-4 text-sm leading-7 text-[#A0A0AC]">
          두 주소 모두 아동 안전 신고 접수와 Google을 포함한 관계 기관의 문의 응대에 사용됩니다.
          어느 쪽으로 보내셔도 같은 담당자가 확인합니다.
        </p>
      </section>

      <div className="mt-14 flex flex-wrap gap-5 text-sm font-semibold text-[#74747F]">
        <Link to="/legal" className="hover:text-ink">
          약관 및 개인정보 안내
        </Link>
        <Link to="/account-deletion" className="hover:text-ink">
          계정 삭제
        </Link>
        <Link to="/tester" className="hover:text-ink">
          테스터 참여
        </Link>
      </div>
    </main>
  </div>
);

export default ChildSafety;
