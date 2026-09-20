import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const appSteps = [
  '두리메이트 앱을 실행하고 로그인합니다.',
  '하단 탭에서 "나"(프로필)를 엽니다.',
  '화면 아래쪽 "계정 삭제"를 누릅니다.',
  '안내되는 확인 창에서 두 번 확인하면 즉시 처리됩니다.',
];

const deletedData = [
  '이메일 주소, 비밀번호, 소셜 로그인 연결 정보',
  '닉네임, 이름, 나이, 성별, 자기소개, 프로필 사진',
  '여행 스타일, 관심사, 사용 언어 등 매칭용 프로필',
  '마지막 위치 좌표와 위치 사용 설정',
  '전화번호 및 인증 상태',
  '푸시 알림 토큰(FCM), 로그인 세션 토큰 전체',
];

const retainedData = [
  {
    what: '그룹 가입 이력, 채팅방에 남긴 메시지',
    why: '같은 그룹·채팅방을 쓰던 다른 이용자의 대화 기록이 끊기지 않도록 남깁니다. 보낸 사람은 "탈퇴한 사용자"로만 표시되며 삭제된 계정과 연결되지 않습니다.',
  },
  {
    what: '신고 접수 기록',
    why: '이용자 보호와 분쟁 대응에 필요합니다. 접수 후 3년간 보관한 뒤 파기합니다.',
  },
  {
    what: '접속 로그 등 서버 기록',
    why: '장애 대응과 부정 이용 방지 목적입니다. 최대 90일간 보관한 뒤 자동 삭제됩니다.',
  },
];

const AccountDeletion: React.FC = () => (
  <main className="min-h-screen bg-sand-100 px-4 py-10 text-ink md:px-8">
    <div className="mx-auto max-w-4xl">
      <Link to="/" className="mb-10 inline-flex items-center gap-3">
        <Logo variant="gradient" size="md" />
        <span className="text-2xl font-extrabold tracking-tight text-ink">Doorimate</span>
      </Link>

      <section className="rounded-[20px] bg-white p-8 shadow-[0_10px_30px_rgba(16,16,20,0.1)] md:p-12">
        <p className="text-sm font-extrabold uppercase tracking-[0.32em] text-primary-500">
          Account Deletion
        </p>
        <h1 className="mt-4 font-display text-4xl font-black leading-[1.05] tracking-tight text-ink md:text-5xl">
          계정 및 데이터 삭제 요청
        </h1>
        <p className="mt-6 text-lg leading-8 text-[#4A4A55]">
          두리메이트(Doorimate) 앱의 계정과 개인정보를 삭제하는 방법입니다. 앱 안에서 직접 삭제할 수
          있으며, 앱을 쓸 수 없는 상황이라면 이메일로도 요청할 수 있습니다.
        </p>

        <article className="mt-10 rounded-2xl bg-sand-100 p-6">
          <h2 className="text-xl font-extrabold tracking-tight text-ink">앱에서 직접 삭제하기</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-base leading-8 text-[#4A4A55]">
            {appSteps.map(step => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>

        <article className="mt-5 rounded-2xl bg-sand-100 p-6">
          <h2 className="text-xl font-extrabold tracking-tight text-ink">이메일로 요청하기</h2>
          <p className="mt-3 text-base leading-8 text-[#4A4A55]">
            앱에 로그인할 수 없다면{' '}
            <a
              className="font-extrabold text-primary-500 underline"
              href="mailto:kdowndan@gmail.com?subject=%5B%EB%91%90%EB%A6%AC%EB%A9%94%EC%9D%B4%ED%8A%B8%5D%20%EA%B3%84%EC%A0%95%20%EC%82%AD%EC%A0%9C%20%EC%9A%94%EC%B2%AD"
            >
              kdowndan@gmail.com
            </a>
            으로 가입 이메일 주소를 적어 보내주세요. 본인 확인 후 영업일 기준 7일 이내에 처리하고
            결과를 회신합니다.
          </p>
        </article>

        <article className="mt-5 rounded-2xl bg-sand-100 p-6">
          <h2 className="text-xl font-extrabold tracking-tight text-ink">삭제되는 데이터</h2>
          <p className="mt-3 text-base leading-8 text-[#4A4A55]">
            삭제 요청이 처리되면 아래 정보는 즉시 지워지며 복구할 수 없습니다. 계정은 다시 로그인할
            수 없게 되고, 다른 이용자에게 프로필이 노출되지 않습니다.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-8 text-[#4A4A55]">
            {deletedData.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="mt-5 rounded-2xl bg-sand-100 p-6">
          <h2 className="text-xl font-extrabold tracking-tight text-ink">
            일부 보관되는 데이터와 보관 기간
          </h2>
          <ul className="mt-4 space-y-4 text-base leading-8 text-[#4A4A55]">
            {retainedData.map(item => (
              <li key={item.what}>
                <span className="font-extrabold text-ink">{item.what}</span>
                <br />
                {item.why}
              </li>
            ))}
          </ul>
        </article>

        <div className="mt-10 flex flex-col gap-3 rounded-2xl bg-ink p-6 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-black tracking-tight">문의</h2>
            <p className="mt-2 text-sm leading-6 text-[#A0A0AC]">
              두리메이트(Doorimate) · kdowndan@gmail.com
            </p>
          </div>
          <Link
            to="/legal"
            className="inline-flex h-12 items-center justify-center rounded-[15px] bg-white px-5 font-extrabold text-ink transition hover:bg-sand-100"
          >
            개인정보 안내
          </Link>
        </div>
      </section>
    </div>
  </main>
);

export default AccountDeletion;
