# Fryndo

여행 동반자를 찾는 소셜 플랫폼 + NFT 위치 수집 시스템

[![CI](https://github.com/your-repo/travelmate/actions/workflows/ci.yml/badge.svg)](https://github.com/your-repo/travelmate/actions/workflows/ci.yml)
[![CD](https://github.com/your-repo/travelmate/actions/workflows/cd.yml/badge.svg)](https://github.com/your-repo/travelmate/actions/workflows/cd.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://various-belva-untab-1a59bee2.koyeb.app)
[![Backend API](https://img.shields.io/badge/API-running-blue)](https://various-belva-untab-1a59bee2.koyeb.app/api)
[![codecov](https://codecov.io/gh/your-repo/travelmate/branch/main/graph/badge.svg)](https://codecov.io/gh/your-repo/travelmate)

## 주요 기능

### 핵심 기능
- **사용자 관리**: 회원가입, 로그인, 프로필 관리, 소셜 로그인
- **여행 그룹**: 여행 동반자 모집 및 그룹 관리
- **실시간 채팅**: WebSocket 기반 실시간 메시징 (이미지, 위치 공유)
- **위치 기반 서비스**: 근처 여행지 및 동반자 추천

### NFT 수집 시스템
- **위치 기반 NFT 수집**: GPS로 특정 장소 방문 시 NFT 수집
- **블록체인 민팅**: Polygon 네트워크에 NFT 발행
- **희귀도 시스템**: Common, Rare, Epic, Legendary 등급
- **리뷰 시스템**: 수집한 장소에 대한 리뷰 및 평점

### 소셜 기능
- **팔로우 시스템**: 사용자 간 팔로우/언팔로우
- **리더보드**: 포인트 및 NFT 수집 순위
- **알림 시스템**: 실시간 알림 (WebSocket)

### UI/UX
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **다크모드**: 사용자 테마 설정
- **튜토리얼**: 신규 사용자 온보딩

## 빠른 시작

### 배포된 서비스 이용

프로덕션 URL: https://various-belva-untab-1a59bee2.koyeb.app

비회원으로도 데모 여행자 프로필을 둘러볼 수 있습니다.

### 로컬 개발 환경 설정

백엔드 실행:
```bash
cd travelmate-backend
./mvnw spring-boot:run
```

프론트엔드 실행:
```bash
cd travelmate-web
npm install
npm start
```

### Docker로 실행

```bash
# 전체 스택 실행
docker-compose up --build

# 백엔드만 실행
cd travelmate-backend
docker build -t travelmate-backend .
docker run -p 8080:8080 travelmate-backend

# 프론트엔드만 실행
cd travelmate-web
docker build -t travelmate-web .
docker run -p 80:80 travelmate-web
```

## 서비스 접속

### 프로덕션
- 웹 애플리케이션: https://various-belva-untab-1a59bee2.koyeb.app
- API 서버: https://various-belva-untab-1a59bee2.koyeb.app/api

### 로컬 개발
- 웹 애플리케이션: http://localhost:3000
- API 서버: http://localhost:8080/api
- WebSocket: ws://localhost:8080/ws
- H2 콘솔 (개발용): http://localhost:8080/h2-console

## 기술 스택

### 백엔드
- 프레임워크: Spring Boot 3.2.0
- 언어: Java 17
- 데이터베이스: H2 (개발) / PostgreSQL (운영)
- 보안: Spring Security + JWT
- 실시간 통신: WebSocket (STOMP)
- 빌드 도구: Maven

### 프론트엔드
- 프레임워크: React 18 + TypeScript
- 스타일링: Tailwind CSS 3.4.1
- 빌드 설정: CRACO (Create React App Configuration Override)
- 애니메이션: Framer Motion
- 아이콘: Hero Icons
- HTTP 클라이언트: Axios
- 라우팅: React Router DOM v6

### 인프라
- 배포 플랫폼: Koyeb (Cloud Platform)
- 컨테이너화: Docker (Multi-stage builds)
- 오케스트레이션: Kubernetes (Kustomize)
- 웹 서버: Nginx
- CI/CD: GitHub Actions
- 캐시: Redis 7
- 모니터링: Prometheus + Grafana
- 로깅: ELK Stack (Logstash)

### PWA 지원
- 오프라인 캐싱: Service Worker
- 푸시 알림: Firebase Cloud Messaging
- 앱 설치: Web App Manifest

## 프로젝트 구조

```
Fryndo/
├── travelmate-backend/         # Spring Boot API 서버
│   ├── src/main/java/
│   │   └── com/travelmate/
│   │       ├── config/         # 설정 (Security, WebSocket, CORS, Redis)
│   │       ├── controller/     # REST API 엔드포인트
│   │       ├── service/        # 비즈니스 로직
│   │       ├── repository/     # 데이터 액세스
│   │       ├── model/          # 엔티티 클래스
│   │       └── dto/            # 데이터 전송 객체
│   ├── Dockerfile
│   └── pom.xml
│
├── travelmate-web/             # React 웹 애플리케이션
│   ├── src/
│   │   ├── components/         # 재사용 가능한 컴포넌트
│   │   ├── pages/              # 페이지 컴포넌트
│   │   ├── services/           # API 서비스
│   │   ├── hooks/              # React Hooks
│   │   ├── store/              # Zustand 상태관리
│   │   └── contexts/           # React Context
│   ├── cypress/                # E2E 테스트
│   ├── public/
│   │   ├── manifest.json       # PWA 설정
│   │   └── service-worker.js   # 오프라인 캐싱
│   └── package.json
│
├── blockchain/                 # 스마트 컨트랙트 (Solidity)
├── k8s/                        # Kubernetes 매니페스트
│   ├── kustomization.yaml
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   └── ingress.yaml
├── monitoring/                 # Prometheus/Grafana 설정
├── logging/                    # ELK Stack 설정
├── docs/                       # 프로젝트 문서
├── .github/workflows/          # GitHub Actions CI/CD
├── docker-compose.yml
└── docker-compose.prod.yml
```

## 환경 설정

### 백엔드 환경 변수

```bash
# JWT 보안 키 (필수)
JWT_SECRET=your-jwt-secret-key-min-256-bits

# 데이터베이스 (PostgreSQL 사용 시)
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/travelmate
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your-password

# CORS 설정
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

자세한 설정은 `travelmate-backend/.env.example` 파일을 참고하세요.

### 프론트엔드 환경 변수

```bash
# API 서버 URL
REACT_APP_API_URL=http://localhost:8080/api

# WebSocket URL
REACT_APP_WS_URL=ws://localhost:8080/ws

# OAuth (선택사항)
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_KAKAO_APP_KEY=your-kakao-app-key
REACT_APP_NAVER_CLIENT_ID=your-naver-client-id
REACT_APP_KAKAO_MAP_API_KEY=your-kakao-map-key
```

자세한 설정은 `travelmate-web/.env.example` 파일을 참고하세요.

## 개발 환경 요구사항

### 필수 도구
- Java: 17 이상
- Node.js: 18 이상
- Maven: 3.8 이상
- Docker: 최신 버전 (선택사항)

### 권장 IDE
- 백엔드: IntelliJ IDEA, Eclipse, VS Code
- 프론트엔드: VS Code, WebStorm

## UI/UX 특징

- 모던한 디자인 시스템: Tailwind CSS 기반 컴포넌트 라이브러리
- 애니메이션: Framer Motion으로 부드러운 전환 효과
- 반응형 레이아웃: 모바일, 태블릿, 데스크톱 완벽 지원
- 다크모드: 시스템 설정 자동 감지 및 수동 전환
- 접근성: WCAG 2.1 AA 준수

## 주요 API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신

### 사용자
- `GET /api/users/me` - 내 프로필 조회
- `PUT /api/users/me` - 프로필 수정
- `GET /api/users/{id}` - 사용자 조회

### 그룹
- `GET /api/groups` - 그룹 목록
- `POST /api/groups` - 그룹 생성
- `GET /api/groups/{id}` - 그룹 상세
- `POST /api/groups/{id}/join` - 그룹 가입

### 채팅
- `GET /api/chat/rooms` - 채팅방 목록
- `GET /api/chat/rooms/{id}/messages` - 메시지 조회
- WebSocket `/ws` - 실시간 메시징

## 배포 가이드

### Koyeb 배포

1. GitHub 연동
   - Koyeb 계정에서 GitHub 저장소 연결

2. 백엔드 서비스 생성
   ```
   Builder: Dockerfile
   Dockerfile path: travelmate-backend/Dockerfile
   Port: 8080
   Health check: /health
   ```

3. 프론트엔드 서비스 생성
   ```
   Builder: Dockerfile
   Dockerfile path: travelmate-web/Dockerfile
   Port: 80
   Health check: /health
   ```

4. 환경 변수 설정
   - 백엔드: JWT_SECRET, DB 설정
   - 프론트엔드: REACT_APP_API_URL, REACT_APP_WS_URL

### Docker Compose 배포

```bash
# 개발 모드 실행
docker-compose up -d

# 프로덕션 모드 실행
docker-compose -f docker-compose.prod.yml up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

### Kubernetes 배포

```bash
# Kustomize로 전체 리소스 배포
kubectl apply -k k8s/

# 네임스페이스 확인
kubectl get all -n travelmate

# 개별 리소스 배포
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# 로그 확인
kubectl logs -f deployment/travelmate-backend -n travelmate

# 스케일링
kubectl scale deployment travelmate-backend --replicas=3 -n travelmate
```

### 모니터링 설정

```bash
# Prometheus + Grafana 실행
docker-compose -f monitoring/docker-compose.yml up -d

# 접속 URL
# - Grafana: http://localhost:3001 (admin/admin)
# - Prometheus: http://localhost:9090

# 주요 메트릭
# - nft_collection_total: NFT 수집 횟수
# - api_request_duration_seconds: API 응답 시간
# - jvm_memory_used_bytes: JVM 메모리 사용량
```

## 트러블슈팅

### Tailwind CSS가 컴파일되지 않는 경우
```bash
cd travelmate-web
rm -rf node_modules package-lock.json
npm install
npm run build
```

### WebSocket 연결 실패
- CORS 설정 확인: `application.yml`의 `allowed-origins`
- WebSocket URL 프로토콜 확인: `ws://` (HTTP) 또는 `wss://` (HTTPS)

### Koyeb 배포 실패
- Dockerfile 경로 확인
- 환경 변수 설정 확인
- 빌드 로그에서 에러 메시지 확인

## 테스트

### 백엔드 테스트
```bash
cd travelmate-backend
mvn test                    # 단위 테스트 실행
mvn test jacoco:report      # 커버리지 리포트 생성
```

### 프론트엔드 테스트
```bash
cd travelmate-web
npm test                    # 단위 테스트 (watch 모드)
npm run test:coverage       # 커버리지 리포트 생성
npm run cypress:open        # E2E 테스트 (GUI)
npm run cypress:run         # E2E 테스트 (Headless)
```

### 테스트 구조
```
travelmate-web/
├── src/**/*.test.ts        # 단위 테스트
└── cypress/
    ├── e2e/                # E2E 테스트
    │   ├── auth.cy.ts      # 인증 플로우
    │   ├── groups.cy.ts    # 그룹 기능
    │   ├── nft.cy.ts       # NFT 기능
    │   └── social.cy.ts    # 소셜 기능
    └── support/            # Cypress 설정

travelmate-backend/
└── src/test/java/          # JUnit 테스트
```

## CI/CD

### GitHub Actions 워크플로우

- **CI (`ci.yml`)**: PR 및 push 시 자동 실행
  - Frontend: Lint, Test, Build
  - Backend: Test, Coverage, Build JAR
  - E2E: Cypress 테스트 (main 브랜치)

- **CD (`cd.yml`)**: main 브랜치 또는 태그 push 시
  - Docker 이미지 빌드 및 GHCR 푸시
  - Staging 자동 배포 (main)
  - Production 배포 (v* 태그)

### 로컬 CI 실행
```bash
# Frontend
cd travelmate-web
npm run lint && npm test -- --watchAll=false && npm run build

# Backend
cd travelmate-backend
mvn clean verify
```

## 기여하기

1. Fork 프로젝트
2. 기능 브랜치 생성 (`git checkout -b feature/새기능`)
3. 변경사항 커밋 (`git commit -m 'feat: 새기능 추가'`)
4. 브랜치 푸시 (`git push origin feature/새기능`)
5. Pull Request 생성

### 커밋 컨벤션
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가
- `chore`: 빌드 업무, 패키지 매니저 수정

## 문서

| 문서 | 설명 |
|------|------|
| [API 문서](docs/API.md) | REST API 엔드포인트 상세 |
| [개발자 가이드](docs/DEVELOPER_GUIDE.md) | 개발 환경 설정 및 코딩 컨벤션 |
| [OAuth 설정](travelmate-web/OAUTH_SETUP.md) | SNS 로그인 연동 가이드 |
| [기여 가이드](CONTRIBUTING.md) | 브랜치 전략 및 PR 가이드 |
| [변경 이력](CHANGELOG.md) | 버전별 변경 내역 |

---

Made by Fryndo Team
