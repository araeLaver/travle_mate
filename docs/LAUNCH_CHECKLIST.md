# Fryndo 출시 전 외부 자격증명 체크리스트

(2026-08-31 갱신) EAS·Firebase·Google OAuth는 완료. 남은 항목만 운영자 작업 필요.

## 2026-09-01 진행 (앱 출시 준비)

- **프리뷰 APK 실기기 검증 완료**: 커밋 `4947797`(다크모드) preview APK를 Android 에뮬레이터(API 36)에 설치·구동 → 크래시 없이 실행, 로그인/회원가입 화면 디자인 시스템대로 렌더, 네비게이션 동작, **다크모드 OS 테마 전환 라이브 반응 확인**.
- **Android production `.aab` 빌드 트리거**: `production` 프로파일 첫 빌드 (store distribution, versionCode 1→2, build `4b71c11f-...`). Play Console 업로드용 실제 아티팩트.
- **`store/metadata.json` URL 교정**: support/privacy/terms/marketing 이 옛 도메인 `travelmate.app` → `fryndo.com`(개인정보/약관은 실제 존재하는 웹 `/legal` 페이지)로 수정.
- **스토어 스크린샷**: 인증 화면 3종(로그인 라이트/다크, 회원가입)만 확보 (`store/screenshots/android/phone/`). 마퀴 화면(홈/지도/컬렉션/채팅/프로필)은 **백엔드 기동 필요** — 미확보.
- **미결 포지셔닝 결정**: `store/metadata.json`은 앱을 "여행 NFT 컬렉션"으로, 웹 `/legal`은 "여행 동행 매칭"으로 규정 — 스토어 설명 방향(특히 Apple의 NFT/블록체인 심사 리스크) 운영자 결정 필요.

## 완료 ✅

- **EAS**: `@downlab/fryndo` (projectId `f9508e1a-...`), Android 키스토어 EAS 관리
- **Firebase**: 프로젝트 `fryndo-23e4a` (Spark 무료 요금제 — Blaze 업그레이드 발생했었으나 다운그레이드 완료), Android 앱 `com.fryndo.app`, `google-services.json` 저장소 반영
- **Google OAuth**: 동의 화면(외부) + 클라이언트 3종 (`app.json` 반영; 웹 secret은 루트 `.env`)
- **IAP**: expo-in-app-purchases 제거(사장된 패키지) → `src/lib/iapShim` — 스토어 결제는 정식 출시 시 react-native-iap/RevenueCat로 교체

## 모바일 — 남은 항목

| # | 항목 | 설정 위치 | 상태 |
|---|------|-----------|------|
| 1 | Apple 제출 계정 ($99/년) | `eas.json` → `submit.production.ios` | placeholder |
| 2 | Google Play 서비스 계정 키 ($25) | `eas.json` → `submit.production.android` | 파일 없음 |
| 3 | FCM V1 서비스 계정 키 | Firebase 콘솔 → 서비스 계정 → 새 비공개 키 → expo.dev Credentials 업로드 | 미등록 (푸시 테스트 전까지 불필요; 자동 다운로드 차단으로 수동 발급 필요) |
| 4 | Google Maps Android API 키 | `app.json` → `android.config.googleMaps.apiKey` | **보류** — Maps SDK는 결제 계정 필수라 사용자 결정으로 스킵. 활성화하려면 GCP 결제 연결 후 키 발급 |
| 5 | Sentry DSN (모바일) | `app.json` → `extra.sentryDsn` + EAS secret `SENTRY_AUTH_TOKEN` | 계정 미생성. 계정 생성은 운영자 직접 (빌드는 `SENTRY_DISABLE_AUTO_UPLOAD=true`로 우회 중) |
| 7 | Sentry DSN (모바일) | `app.json` → `extra.sentryDsn` | placeholder — 미설정 시 초기화를 건너뛰도록 가드됨 (`src/lib/sentry.ts`) |

주의:
- 번들 ID는 `com.fryndo.app` 으로 확정했다. **스토어 첫 제출 후에는 변경 불가.**
- 딥링크/유니버설 링크는 `fryndo.com` 기준. `https://fryndo.com/.well-known/apple-app-site-association` 및
  `assetlinks.json` 을 웹 서버에 배포해야 유니버설 링크가 동작한다.
- IAP 상품 ID는 `fryndo.premium.monthly` 등 (`src/services/paymentService.ts`) — App Store Connect /
  Play Console에 동일 ID로 상품을 등록할 것.

## 웹 (travelmate-web) — 배포 시 env로 주입

| # | 항목 | 설정 위치 | 비고 |
|---|------|-----------|------|
| 1 | AdSense 퍼블리셔 ID | env `REACT_APP_ADSENSE_CLIENT` (ca-pub-...) | 미설정 시 광고 슬롯이 렌더링되지 않음 (안전) |
| 2 | Sentry DSN (웹) | env `REACT_APP_SENTRY_DSN` | 미설정 시 초기화 건너뜀 |
| 3 | OAuth 키 (Google/Kakao/Naver) | env `REACT_APP_GOOGLE_CLIENT_ID` 등 | 로컬 `.env`에는 있음(git 미추적) — 배포 환경에도 주입 필요 |
| 4 | Kakao Map API 키 | env `REACT_APP_KAKAO_MAP_API_KEY` | |

Dockerfile/docker-compose에 위 env가 build-arg로 배선되어 있음.

## 공통 / 인프라

- 도메인: `fryndo.com` / `api.fryndo.com` DNS + TLS 준비.
- 백엔드 운영 secrets (JWT secret, DB 비밀번호, OAuth secret 등)는 `.env.example` 참고해 운영 `.env` 구성.
- Sentry 조직/프로젝트: `fryndo` / `fryndo-mobile`, `fryndo-web` 이름으로 생성 (`app.json` plugins, `sentry.ts` release와 일치).
