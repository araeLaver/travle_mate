# 두리메이트(Doorimate) 출시 체크리스트

> ⚠️ 2026-09-07 이전 기록에 나오는 "Fryndo"는 **폐기된 이름**이다. 아래 리브랜딩 항목을 먼저 읽을 것.
> 과거 섹션의 `fryndo-23e4a`(GCP 프로젝트 ID), `fryndo-play-publisher@…`(서비스 계정), `fryndo-web`(Vercel 프로젝트),
> `demo@fryndo.com`(시드 계정)은 **실제로 존재하는 값이라 그대로 유지**한다 — 이름만 바뀌었지 그 리소스들은 살아 있다.

## 2026-09-07 리브랜딩 — Fryndo → 두리메이트

**왜**: `fryndo.com`은 우리 도메인이 아니었다. 파킹이 아니라 **제3자의 "Fryndo — AI 데이팅 앱" 정식 서비스 사이트**이고,
그 사이트가 링크하는 Play 주소가 `com.fryndo.app`으로 우리가 2026-09-01에 선점한 패키지와 동일하다. AI 매칭이라는
인접 카테고리라 충돌 위험이 실질적이어서 이름을 버렸다. **Play 앱이 아직 '임시' 상태여서 가능했던 결정** —
프로덕션에 한 번 나가면 번들 ID는 영구 고정이다.

**새 정체성**

| 항목 | 값 |
|---|---|
| 브랜드 | 두리메이트 / Doorimate ("두리"=둘이·함께 + mate) |
| 스토어 노출명 | `두리메이트 - 여행 동행 매칭` |
| 번들 ID | `com.doorimate.app` |
| 딥링크 | `doorimate://` / `https://doorimate.com` |
| API | `https://api.doorimate.com` |
| Expo slug | `doorimate` |

후보 선정 시 WHOIS로 미등록을 직접 확인하고 동명 앱·서비스 부재까지 검증했다. 1순위였던 "함께"는
브랜드명이 앱 카피의 일반명사와 충돌해서(→ "함께와 함께 여행을 시작하세요") 탈락시켰다.

**남은 콘솔 작업 (코드는 커밋 `78e72a1`로 완료)**

1. `doorimate.com` 구매 — **사용자 작업**. Gabia 권장(기존에 쓰는 등록기관)
2. Play Console: `com.doorimate.app`으로 앱 신규 생성 → 스토어 등록정보·앱 콘텐츠 선언 재입력, 기존 Fryndo 앱(임시) 삭제
3. Play 서비스 계정 `fryndo-play-publisher@…`에 **새 앱 권한 부여** (계정 단위라 계정 자체는 재사용)
4. Firebase: `com.doorimate.app` Android 앱 추가 → `google-services.json` 교체 (현재 파일은 아직 옛 패키지)
5. Google OAuth: 새 패키지+SHA-1로 Android 클라이언트 재발급 → `app.json` 반영
6. expo.dev에서 프로젝트 slug를 `doorimate`로 변경 (app.json이 이미 `doorimate`라 안 맞추면 빌드 실패)
7. 워드마크 에셋·스토어 스크린샷 8장 재생성 (앱 화면에 이름이 노출됨)
8. Vercel 프로젝트/Koyeb 커스텀 도메인 새 도메인으로 재설정
9. 재빌드 → 내부 테스트 재출시

**주의**: `google-services.json`이 아직 `com.fryndo.app`이라 지금 상태로 EAS 빌드를 돌리면 실패한다. 4번이 선행돼야 한다.



## 2026-09-06 진행 (Play 내부 테스트 출시 ✅ + Expo SDK 54 업그레이드)

- **내부 테스트 트랙 출시 완료** — `1.0.0 (versionCode 4)`가 활성 상태로 내부 테스터에게 배포됨. 참여 링크는 Play Console → 내부 테스트 → 테스터 → "링크 복사".
- **Expo SDK 52 → 54 업그레이드 (필수였음)**: Google Play는 2026-08-31부터 신규 앱에 `targetSdk 36`(Android 16)을 요구한다. 기존 `.aab`(vc2)는 targetSdk 34여서 Play API가 거부했다 — 콘솔에 수동 드래그해도 동일하게 거부됐을 것. Expo 52의 상한이 34이므로 54(RN 0.81 / targetSdk 36)로 올려 재빌드했다. 세부는 커밋 `9b61fc0` 참조.
- **업로드 자동화 구축**: Play Console에는 더 이상 "API 액세스" 메뉴가 없다. 현행 경로는 GCP 서비스 계정 → Play Console 사용자 초대다.
  - `gcloud services enable androidpublisher.googleapis.com --project=fryndo-23e4a`
  - 서비스 계정 `fryndo-play-publisher@fryndo-23e4a.iam.gserviceaccount.com`, 키는 `travelmate-mobile/google-play-service-account.json`(gitignore, `eas.json`이 참조)
  - Play Console → 사용자 및 권한에서 위 이메일 초대, Fryndo 앱 권한 7개 부여
  - 업로드: `rtk proxy npx --yes eas-cli@23.2.0 submit --platform android --profile preview --id <buildId> --non-interactive` (preview 프로파일 = internal 트랙)
- **앱 콘텐츠 선언 10건 전부 완료**. 오늘 마무리한 것: 광고 ID 선언(=아니요. `.aab` 매니페스트에 `AD_ID` 권한도 광고 SDK도 없음을 확인), 개인정보처리방침 URL을 `fryndo.com/privacy`(웹에 라우트 없음 → 파킹 페이지)에서 실제로 살아있는 `https://fryndo-web.vercel.app/legal`로 교정. **DNS 연결 후 `https://fryndo.com/legal`로 다시 바꿀 것.**
- **프로덕션까지 남은 관문(시간 소요)**: 개인 개발자 계정은 프로덕션 액세스 신청 전에 **12명 이상 테스터로 14일 이상 비공개 테스트**를 실행해야 한다. 내부 테스트는 이 요건에 산입되지 않는다.

## 2026-09-05 진행 (마퀴 스크린샷 + 런칭 버그 3건 수정)

- **마퀴 스크린샷 확보 완료**: 로컬 백엔드(dev, :8180) + 에뮬레이터(Expo Go) 조합으로 데모 계정(demo@fryndo.com)에 시드 데이터(NFT 3개·1250포인트·여행그룹 2개·채팅 4메시지)를 구성하고 캡처. `store/screenshots/android/phone/`에 04_home / 05_collection / 06_chat_list / 07_chat_room / 08_profile 추가. **지도 화면은 Maps API 키 보류 결정으로 빈 지도라 미확보** — 키 발급 후 촬영 필요.
- **런칭 버그 3건 발견·수정** (스크린샷 작업 중 실사용에서 발견):
  1. `ProfileScreen.tsx` — `user.totalPoints`가 undefined일 때 `toLocaleString()` 호출로 **프로필 화면 렌더 크래시** → `?? 0` 가드.
  2. `CacheConfig.java` — Redis 캐시 직렬화 매퍼에 JavaTimeModule이 없어 `@Cacheable`이 걸린 **`/api/users/me`가 500** (LocalDateTime 직렬화 실패) → 커스텀 ObjectMapper 등록.
  3. `TravelGroupRepository.java` — 위치 파라미터 없이 `/api/groups` 호출 시 null Double이 bytea로 바인딩돼 **500 (`radians(bytea)`)** → 위치 필터 유무로 쿼리 분리.
- **API 계약 보강**: `UserDto.Response`에 `totalNftsCollected`·`totalPoints` 추가 (모바일 홈/프로필 통계가 항상 0으로 나오던 계약 공백 해소).
- 로컬 개발 인프라 메모: colima + `docker compose up -d postgres redis`. 호스트 5432/8080은 타 프로젝트가 점유 → postgres는 `docker-compose.override.yml`(gitignored)로 **15432**, 백엔드는 `SERVER_PORT=8180`으로 기동. 에뮬레이터 위치는 `appops set com.android.shell android:mock_location allow` 후 `cmd location providers add-test-provider`로 주입해야 fused가 인식.

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
