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
| Expo slug | `fryndo` |

후보 선정 시 WHOIS로 미등록을 직접 확인하고 동명 앱·서비스 부재까지 검증했다. 1순위였던 "함께"는
브랜드명이 앱 카피의 일반명사와 충돌해서(→ "함께와 함께 여행을 시작하세요") 탈락시켰다.

**남은 콘솔 작업 (코드는 커밋 `78e72a1`로 완료)**

1. `doorimate.com` 구매 — **사용자 작업**. Gabia 권장(기존에 쓰는 등록기관)
2. Play Console: `com.doorimate.app`으로 앱 신규 생성 → 스토어 등록정보·앱 콘텐츠 선언 재입력, 기존 Fryndo 앱(임시) 삭제
3. Play 서비스 계정 `fryndo-play-publisher@…`에 **새 앱 권한 부여** (계정 단위라 계정 자체는 재사용)
4. ~~Firebase: `com.doorimate.app` Android 앱 추가 → `google-services.json` 교체~~ **완료** (커밋 `eed4aee`)
5. Google OAuth: 새 패키지+SHA-1로 Android 클라이언트 재발급 → `app.json` 반영
   — **미완. `google-services.json`의 `com.doorimate.app` 블록에 `client_type: 1`(SHA-1 Android 클라이언트)이 없고
   `app.json`의 `googleAndroidClientId`도 옛 패키지 것 그대로다 → 지금 빌드하면 안드로이드 구글 로그인이 깨진다.**
6. ~~expo.dev 프로젝트 slug 변경~~ **불필요** — EAS slug는 `fryndo`로 유지하기로 결정(커밋 `7499686`). slug는 외부 노출이 아니고 projectId가 정본.
7. 워드마크 에셋·스토어 스크린샷 재생성
   — 웹 정적 에셋·OG 이미지는 **완료**(커밋 `fa21560`), 인증 화면 3장은 **완료**(커밋 `c6c6901`).
   **마퀴 5장(홈/컬렉션/채팅목록/채팅방/프로필)은 옛 브랜드 노출로 삭제된 상태 → 재촬영 필요.** 지도는 Maps 키 보류로 여전히 미확보.
8. Vercel 프로젝트/Koyeb 커스텀 도메인 새 도메인으로 재설정
   — Koyeb에 `api.fryndo.com` 커스텀 도메인이 ERROR 상태로 **남아 있다(우리 도메인이 아니므로 삭제 대상)**.
9. 재빌드 → 내부 테스트 재출시



## 2026-09-17 진행 (앱 전 화면 실사용 점검 — 결함 9건 수정)

깨끗한 전용 AVD(`doorimate_qa`)를 만들어 로컬 백엔드 + 시드 DB로 전 화면을 실제로 조작하며 점검했다.
**정적 분석으로는 안 나오고 돌려봐야 나오는 것들만 9건 나왔다.**

**기능이 아예 닿지 않던 것 2건**
1. **AI 동행 매칭을 아무도 쓸 수 없었다.** `user.isMatchingEnabled`가 기본 false이고 가입 경로 두 곳이 명시적으로
   false를 넣는데, **앱·웹·API 어디에도 켤 수단이 없었다.** 모든 계정이 400 `MATCHING_NOT_ENABLED`를 받았고
   화면은 그걸 "추천 동행자가 없습니다"로 그려서 꺼진 게 아니라 비어 보였다. 스토어 설명의 1번 기능이다.
   → 프로필 수정 API에 필드 추가 + 화면에서 설명과 함께 켜는 버튼 제공(가입 기본값은 그대로 두었다).
2. **프로필 편집 화면이 없었다.** 메뉴는 `onPress={() => {/* 프로필 편집 페이지 */}}` 빈 스텁이고 화면 자체가 없었다.
   사용자가 여행 스타일·나이·자기소개를 넣을 방법이 없는데 매칭은 바로 그 값으로 점수를 낸다 —
   즉 **모든 추천이 빈 프로필끼리 비교**였다. `EditProfileScreen` 신설.

**출시 빌드에서 깨졌을 것 3건**
3. 프로덕션 프로파일이 등록도 안 된 `api.doorimate.com`을 호출 → **앱이 서버에 못 붙는다.**
4. 지도 탭이 Google Maps 키 없이는 회색 빈 화면 → **Leaflet + OpenStreetMap으로 교체**(키·결제 불필요).
   `react-native-maps`와 플레이스홀더 키 제거.
5. 웹 canonical·og:url이 제3자 도메인 `fryndo.com`을 가리킴.

**실사용에서 바로 보이던 것 4건**
6. 홈·프로필 통계가 항상 0 (`AuthService.convertToDto`가 `totalNftsCollected`/`totalPoints` 누락).
7. 내가 보낸 채팅도 왼쪽 정렬 (`chatService`가 `isMine: false` 하드코딩).
8. 회원가입 비밀번호 힌트가 "8자 이상"인데 서버는 대소문자·숫자·특수문자 요구 → 힌트대로 하면 거절.
   그 거절이 `Request failed with status code 400`으로 노출(서버는 한국어 설명을 보냈는데 axios 메시지가 표시됨).
   → 같은 규칙으로 클라이언트 검증 + `apiClient`가 서버 메시지를 에러에 실어 **모든 화면의 알림이 같이 개선**.
9. `그룹 찾기`가 이미 가입한 그룹을 나열하고, 누르면 다시 "참여하시겠습니까?" (`isJoinedByCurrentUser`가
   `DetailResponse`에만 있어 목록 응답에서 누락). 오프라인 배너가 `position:absolute`로 각 화면 헤더를 덮던 것도 수정.

**검증 완료(앱에서 직접)**: 회원가입→자동로그인, 프로필 저장(DB 반영 확인), 그룹 생성→채팅방 자동생성→메시지 전송,
매칭 옵트인→추천 노출(호환도 75%/65%), 지도 마커 탭→수집 시트, 다크모드.
스크린샷 8장 확보(홈·컬렉션·채팅목록·채팅방·프로필·매칭·지도 + 인증 3종).

**에뮬레이터 주의**: `DOW963_API36_QA`에는 다른 프로젝트 앱(대본·입주해)이 깔려 있어 포그라운드를 계속 뺏는다.
이 앱 작업은 `doorimate_qa`(포트 5560)를 쓸 것. adb `input text`는 한글을 못 넣으므로 폼 입력은 영문으로 하거나
필드 이동은 `keyevent 61`(TAB)을 쓴다.

## 2026-09-13 진행 (웹 출시 준비 — 브랜드/SEO 표면 정리)

리브랜딩 커밋이 React 앱은 바꿨지만 `travelmate-web/public/`은 건드리지 않아서, **크롤러가 보는 표면 전체가 아직 Fryndo였고
canonical·og:url이 제3자 서비스인 `fryndo.com`을 가리키고 있었다.** 커밋 `fa21560`으로 정리:

- `index.html` — title/description/keywords/author/OG/Twitter 전부 두리메이트, canonical·og:url → `doorimate.com`
- og:image를 **절대 URL로 교체**(카카오·페이스북 크롤러는 `%PUBLIC_URL%` 상대경로를 해석하지 못함) + width/height/alt 추가
- `manifest.json` — PWA 이름, theme/background color를 디자인 토큰 `#F5F4F1`로 통일(`#F7F2E8`로 index.html과 어긋나 있었음)
- `robots.txt` 사이트맵 주소, `sitemap.xml` 6개 URL → `doorimate.com`
- `firebase-messaging-sw.js` 알림 기본 제목, CSS `--fryndo-*` 토큰 12개 → `--doorimate-*`
- **정적 에셋 재생성** — PWA 아이콘 8종·`favicon.ico`·알림 배지가 아직 **옛 "F" 레터마크 + 구 팔레트**였다(앱은 이미 컴퍼스 마크).
  `travelmate-mobile/assets/icon.png`에서 다시 뽑아 앱/웹 마크를 일치시키고, `og-image.png`(1200×630)는 컴퍼스+두리메이트 워드마크로 새로 제작.
- 검증: `tsc` 클린, 웹 테스트 56스위트 / 603 통과.

**스토어 URL은 일부러 되돌렸다** (커밋 `c99b543`): `store/metadata.json`의 support/privacy/terms/marketing이 리브랜딩 일괄 치환으로
아직 등록도 안 된 `doorimate.com`을 가리키게 됐는데, **Play는 개인정보처리방침 URL의 접속 가능 여부를 검사**하므로
도메인이 살아날 때까지 `https://fryndo-web.vercel.app/legal`로 유지한다. `eas.json`의 preview 프로파일도 같은 이유로
`staging-api.doorimate.com` 대신 Koyeb 주소를 직접 호출한다(production 프로파일은 `api.doorimate.com` 유지 — 어차피 도메인 대기).

**⚠️ 백엔드 콜드스타트 342초** (2026-09-13 실측, Koyeb 런타임 로그): 딥슬립에서 깨어난 인스턴스가
`Started TravelMateApplication in 342.658 seconds`. 그 사이 `/api/actuator/health`는 `livenessState: DOWN` /
`readinessState: OUT_OF_SERVICE`를 반환하는데 **이건 버그가 아니라 기동이 끝나기 전의 기본값**이다(Tomcat은 포트를 먼저 열고
`ApplicationReadyEvent`는 나중에 발행됨). 진짜 문제는 **공개 베타 첫 요청이 최대 6분 걸린다는 것** — 출시 전 해결 필요.
헬스체크 grace가 300s라 342s는 그 한도도 넘는다.

**웹 배포 경로 메모**: 소스는 `travelmate-web`, 배포는 `araeLaver/fryndo-web`(비공개 스냅샷 리포)를 Vercel이 빌드.
`vercel.json`이 `/api/*`를 Koyeb으로 리라이트한다. 리브랜딩 반영하려면 스냅샷 리포에 동기화 후 푸시 = 라이브 배포.
Vercel 프로젝트(`prj_PdEZ…`)에 현재 붙은 도메인은 자동 발급 `*.vercel.app` 3개뿐이다.

## 2026-09-14 진행 (웹 라이브 배포 + 백엔드 성능 결함 3건 수정)

**웹 라이브 반영 완료** — `fryndo-web.vercel.app`이 두리메이트 브랜드로 서빙된다.
막혔던 원인은 **Vercel Hobby 플랜의 커밋 작성자 규칙**이었다: 비공개 리포는 **커밋 author가 Hobby 팀 소유자
(`araelaver@gmail.com`)여야** 배포가 돈다. 다른 이메일로 커밋하면 빌드조차 시작되지 않고 `state: BLOCKED`로 떨어진다
(빌드 로그 0건, errorLink는 troubleshoot-project-collaboration#account-configuration). 09-05 배포가 성공했던 건
그게 git push가 아니라 **프로젝트 최초 import**였기 때문. → **스냅샷 리포 커밋은 반드시 `araelaver@gmail.com`으로 할 것.**

**canonical/OG/sitemap을 라이브 호스트로 되돌림** (커밋 `550e1da`): 도메인 구매를 미루기로 한 이상
`doorimate.com`을 가리키면 카카오·페북 미리보기 이미지가 안 뜨고 색인도 안 된다. 도메인 구매 시 이 4곳만 되돌리면 된다.
같은 이유로 **모바일 프로덕션 프로파일도 `api.doorimate.com` → Koyeb 주소로 교정**(커밋 `db418a2`) —
그대로 뒀으면 프로덕션 `.aab`가 서버에 아예 붙지 못했다.

**백엔드 실측 결함 3건 (커밋 `55e273e`)** — 라이브 API를 실제로 호출해보다 발견:

1. **JWT를 요청당 4번 파싱**하고 있었다. `JwtAuthenticationFilter`가 `validateToken` → `getUserIdFromToken` →
   `getEmailFromToken` → `getAuthoritiesFromToken`을 차례로 부르는데 **네 메서드가 각각 서명키를 새로 유도하고
   파서를 새로 만들어 HS512 검증을 처음부터 다시 했다.** 성능 aspect에 찍힌 실측치가 3590ms/5311ms/3311ms/1491ms —
   요청 하나에 CPU 14초. 이게 커넥션 풀을 굶겨서 **로그인 6번 만에 서비스가 통째로 멎었다**(Hikari
   `Connection is not available ... total=0`). 한 번만 파싱하도록 고치고 서명키는 캐시. STOMP CONNECT도 동일(3번→1번).
2. **매핑 없는 경로가 500 + 전체 스택트레이스**였다. 오타 URL 하나가 스택트레이스 수백 개를 쏟아내 0.1 vCPU에서는
   그 자체가 장애다. `NoResourceFoundException` → 404 핸들러 추가.
3. **요청마다 헤더·본문·응답헤더를 INFO로 로깅**하고 있었다. 운영에서는 `RequestLoggingFilter`만 WARN으로 낮춤
   (추적 필요하면 그 줄만 INFO로).

**수정 전후 (라이브 측정)**

| 항목 | 전 | 후 |
|---|---|---|
| 콜드 기동 | 342.7s | **52.5s** |
| 인증 요청 6연속 | 전부 60s 타임아웃 + 서비스 멎음 | 전부 200, 정상 유지 |
| 조회 API(워밍) | — | 0.5~1.0s |
| 로그인(워밍) | — | 2.5~4.0s |

콜드 기동 단축은 **Koyeb 환경변수 2개**가 prod 프로파일을 덮어쓰고 있던 것을 해제해서 얻었다:
`SPRING_JPA_HIBERNATE_DDL_AUTO=update`(부팅마다 엔티티 58개 스키마 대조) → `validate`,
`SPRING_SQL_INIT_MODE=always` → `never`. 초기 스키마 부트스트랩용이었는데 역할이 끝난 뒤에도 켜져 있었다.

**남은 성능 제약(무료 플랜의 구조적 한계)**
- **DB는 싱가포르(`sin`), 앱은 프랑크푸르트(`fra`)** — 쿼리마다 대륙 왕복(~170ms). 앱을 `sin`으로 옮기려 했으나
  **무료 인스턴스는 `sin`에서 제공되지 않는다**(400). DB를 `fra`로 옮기는 건 가능해 보이나 무료 DB 쿼터를 건드릴 수 있어 보류.
- 로그인 2.5~4초는 대부분 **BCrypt(strength 10, Spring 기본값) × 0.1 vCPU**다. 강도를 낮추는 건 보안 후퇴라 하지 않음.
- **무료 Postgres 컴퓨트 쿼터 7.9h/12.5h 사용** — 월 한도에 걸리면 DB가 멈춘다. 출시 전 확인 필요.
- 점검용 계정 `qa-check-20260913@example.com`(id 19)이 운영 DB에 남아 있다.

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
| 4 | ~~Google Maps Android API 키~~ | — | **불필요** — 2026-09-17에 지도를 Leaflet + OpenStreetMap으로 교체해 키·결제 없이 동작한다 |
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
