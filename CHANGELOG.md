# TravelMate 변경 내역

## 2025-12-30 - UI/UX 전면 개편

### 개요
전체 페이지에 모던 Glassmorphism 디자인 시스템을 적용하여 일관된 사용자 경험을 제공합니다.

---

### 디자인 시스템

#### 색상 팔레트
- **배경 그라데이션**: `#1e1b4b` → `#312e81` → `#4c1d95` (다크 바이올렛)
- **강조 그라데이션**: `#8b5cf6` → `#ec4899` (보라-핑크)
- **텍스트**: `#ffffff`, `rgba(255,255,255,0.7)`, `rgba(255,255,255,0.5)`

#### 공통 스타일
- Glassmorphism 효과: `backdrop-filter: blur(20px)`
- 반투명 배경: `rgba(255,255,255,0.1)`
- 부드러운 테두리: `border: 1px solid rgba(255,255,255,0.15)`
- 둥근 모서리: `border-radius: 24px ~ 32px`
- 애니메이션 mesh 배경 (radial gradient)

---

### 페이지별 변경사항

#### 1. Home (홈페이지)
- **파일**: `Home.tsx`, `Home.css`
- 히어로 섹션 glassmorphism 적용
- 애니메이션 배경 블롭 추가
- Feature 카드 현대화
- CTA 버튼 그라데이션 적용

#### 2. Login (로그인)
- **파일**: `Login.tsx`, `Auth.css`
- 애니메이션 배경 블롭 (3개)
- Glassmorphism 로그인 카드
- 소셜 로그인 버튼 (Google, Kakao)
- 에러 상태 시각화 개선

#### 3. Register (회원가입)
- **파일**: `Register.tsx`, `Auth.css`
- 애니메이션 배경 블롭
- 중복확인 버튼 상태별 스타일링
  - 기본: 보라 그라데이션
  - 사용가능: 초록 그라데이션
  - 사용불가: 빨강 그라데이션

#### 4. Dashboard (대시보드)
- **파일**: `Dashboard.tsx`, `Dashboard.css`
- 통계 카드 glassmorphism 적용
- 위치 정보 카드 현대화
- 레이더 애니메이션 개선
- 발견된 유저 카드 리디자인
- 빠른 액션 그리드 추가

#### 5. Groups (여행 그룹)
- **파일**: `Groups.tsx`, `Groups.css`
- 탭 네비게이션 glassmorphism
- 검색/필터 섹션 현대화
- 그룹 카드 hover 애니메이션
- 상태 뱃지 스타일링
- 반응형 그리드 레이아웃

#### 6. Profile (프로필)
- **파일**: `Profile.tsx`, `Profile.css`
- 커버 섹션 오버레이
- 프로필 아바타 glassmorphism
- 통계 그리드 (4열)
- 탭 네비게이션 현대화
- 폼 요소 다크 테마 스타일링
- 관심사/언어 토글 버튼

---

### 기술적 개선사항

#### 코드 품질
- 인라인 스타일 제거 → CSS 클래스 사용
- TypeScript 타입 안전성 개선 (`any` 타입 제거)
- ESLint 경고 수정

#### 구조 개선
- 각 페이지에 `.{page}-content` wrapper div 추가
- z-index 레이어 관리 개선
- CSS 애니메이션 키프레임 표준화

#### 반응형 디자인
- 데스크톱: 1400px max-width
- 태블릿: 1024px, 768px breakpoints
- 모바일: 576px breakpoint

---

### 배포 정보
- **플랫폼**: Koyeb
- **URL**: https://various-belva-untab-1a59bee2.koyeb.app
- **배포 방식**: GitHub 연동 자동 배포

---

### 관련 커밋
- `687e9e1` - feat: 홈화면 디자인 대폭 개선
- `7a43676` - feat: 전체 페이지 모던 glassmorphism 디자인 적용
