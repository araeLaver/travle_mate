# Fryndo 출시 전 외부 자격증명 체크리스트

코드/설정은 출시 준비가 끝났고, 아래 항목은 **저장소에 담을 수 없는 외부 계정/키**라서
운영자가 직접 발급·설정해야 한다. 각 항목의 placeholder 위치를 함께 적는다.

## 모바일 (travelmate-mobile) — EAS 빌드 전 필수

| # | 항목 | 설정 위치 | 현재 값 (placeholder) |
|---|------|-----------|----------------------|
| 1 | EAS 프로젝트 연결 (`eas init`) | `app.json` → `extra.eas.projectId`, `updates.url` | `your-project-id` |
| 2 | Apple 제출 계정 | `eas.json` → `submit.production.ios` (`appleId`, `ascAppId`, `appleTeamId`) | `your-apple-id@example.com` 등 |
| 3 | Google Play 서비스 계정 키 | `eas.json` → `submit.production.android.serviceAccountKeyPath` | `./google-play-service-account.json` (파일 없음) |
| 4 | Firebase Android 설정 | `app.json` → `android.googleServicesFile` | `./google-services.json` (파일 없음) — FCM 푸시에 필요 |
| 5 | Google Maps Android API 키 | `app.json` → `android.config.googleMaps.apiKey` | `YOUR_GOOGLE_MAPS_API_KEY` — 없으면 Android 지도 백지 |
| 6 | Google OAuth 클라이언트 ID 4종 | `app.json` → `extra.googleIosClientId` / `googleAndroidClientId` / `googleWebClientId` / `googleExpoClientId` | `YOUR_GOOGLE_..._CLIENT_ID` — 없으면 Google 로그인 불가 |
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
