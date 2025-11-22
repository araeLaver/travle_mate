# Travel Mate Backend API

## 🚀 프로젝트 개요

Travel Mate는 여행지에서 동일한 목적을 가진 여행자들을 연결하는 플랫폼입니다.

### 핵심 기능
- **폰 흔들기 매칭**: 가속도계를 활용한 실시간 여행자 발견
- **위치 기반 서비스**: GPS 기반 주변 여행자 및 그룹 검색  
- **실시간 채팅**: WebSocket 기반 1:1, 그룹, 여행그룹 채팅
- **여행자 커뮤니티**: 15개 카테고리의 여행 정보 공유 게시판
- **스마트 추천**: 여행 스타일 기반 동행자 추천

## 🏗️ 기술 스택

### Backend
- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: H2 (개발), PostgreSQL (운영)
- **Security**: Spring Security + JWT
- **Real-time**: WebSocket + STOMP
- **Build Tool**: Maven

### 주요 의존성
```xml
- Spring Boot Starter Web
- Spring Boot Starter Data JPA  
- Spring Boot Starter Security
- Spring Boot Starter WebSocket
- JWT (jjwt 0.11.5)
- Lombok
- H2 Database
- PostgreSQL Driver
```

## 📁 프로젝트 구조

```
src/main/java/com/travelmate/
├── config/             # 설정 클래스
│   ├── SecurityConfig.java
│   ├── WebSocketConfig.java
│   └── AsyncConfig.java
├── controller/         # REST API 컨트롤러
│   ├── UserController.java
│   ├── PostController.java
│   ├── TravelGroupController.java
│   ├── ChatController.java
│   └── RecommendationController.java
├── dto/               # 데이터 전송 객체
│   ├── UserDto.java
│   ├── PostDto.java
│   ├── TravelGroupDto.java
│   └── ChatDto.java
├── entity/            # JPA 엔티티
│   ├── User.java
│   ├── Post.java
│   ├── TravelGroup.java
│   ├── ChatRoom.java
│   └── ChatMessage.java
├── repository/        # 데이터 액세스 레이어
├── service/          # 비즈니스 로직
├── security/         # JWT 보안 관련
└── exception/        # 예외 처리
```

## 🔧 설정 및 실행

### 1. 환경 요구사항
- Java 17+
- Maven 3.6+

### 2. 애플리케이션 실행
```bash
# 프로젝트 클론
git clone [repository-url]
cd travel-mate-backend

# 의존성 설치 및 실행
mvn clean install
mvn spring-boot:run
```

### 3. 접속 정보
- **API Server**: http://localhost:8080
- **H2 Console**: http://localhost:8080/h2-console
- **WebSocket**: ws://localhost:8080/ws

## 📚 API 문서

### 인증 API
```http
POST /api/users/register    # 회원가입
POST /api/users/login       # 로그인
```

### 사용자 API  
```http
GET  /api/users/profile/{id}     # 프로필 조회
PUT  /api/users/location         # 위치 업데이트
GET  /api/users/nearby           # 주변 사용자 검색
POST /api/users/shake            # 폰 흔들기 매칭
```

### 게시판 API
```http
GET    /api/posts                # 게시글 목록
POST   /api/posts                # 게시글 작성
GET    /api/posts/{id}           # 게시글 상세
PUT    /api/posts/{id}           # 게시글 수정
DELETE /api/posts/{id}           # 게시글 삭제
POST   /api/posts/{id}/like      # 좋아요
GET    /api/posts/trending       # 인기 게시글
GET    /api/posts/nearby         # 주변 게시글
```

### 여행 그룹 API
```http
GET  /api/travel-groups          # 그룹 목록
POST /api/travel-groups          # 그룹 생성
GET  /api/travel-groups/{id}     # 그룹 상세
POST /api/travel-groups/{id}/join # 그룹 참가
POST /api/travel-groups/{id}/leave # 그룹 탈퇴
```

### 채팅 API
```http
GET  /api/chat/rooms             # 채팅방 목록
POST /api/chat/rooms             # 채팅방 생성
GET  /api/chat/rooms/{id}/messages # 메시지 조회
```

### WebSocket 엔드포인트
```
/app/chat.send    # 메시지 전송
/app/chat.join    # 채팅방 입장
/app/chat.leave   # 채팅방 퇴장

/topic/chat/{roomId}      # 채팅방 구독
/topic/notifications      # 알림 구독
/topic/matching          # 매칭 알림 구독
```

## 🔐 인증 및 보안

### JWT 토큰
- **Header**: `Authorization: Bearer {token}`
- **만료시간**: 24시간
- **갱신**: 로그인 시 새 토큰 발급

### 보안 설정
- CORS 허용
- CSRF 비활성화 (JWT 사용)
- Session 비사용 (Stateless)

## 📊 주요 기능 상세

### 1. 폰 흔들기 매칭
```java
// 가속도계 데이터 기반 흔들기 감지
double shakeIntensity = sqrt(x² + y² + z²);
double searchRadius = min(intensity/10 * baseRadius, maxRadius);
```

### 2. 위치 기반 검색
```sql
-- 구면 거리 계산 (Haversine Formula)
6371 * acos(cos(radians(lat1)) * cos(radians(lat2)) * 
cos(radians(lng2) - radians(lng1)) + 
sin(radians(lat1)) * sin(radians(lat2))) <= radius
```

### 3. 실시간 알림
- WebSocket을 통한 즉시 알림
- 매칭, 그룹 참가, 채팅 메시지 등
- 푸시 알림 준비 (FCM 연동 예정)

## 🚧 개발 예정 기능

### Phase 2
- [ ] 결제 시스템 (비용 분담)
- [ ] 파일 업로드 (AWS S3)
- [ ] 푸시 알림 (FCM)
- [ ] 다국어 지원

### Phase 3  
- [ ] AI 추천 알고리즘
- [ ] 블록체인 리뷰 시스템
- [ ] 음성 채팅
- [ ] AR 기능

## 🐛 이슈 및 개선사항

### 알려진 이슈
- [ ] 대량 사용자 접속 시 성능 최적화 필요
- [ ] 실시간 위치 추적 배터리 최적화
- [ ] 채팅 메시지 암호화 구현 예정

### 성능 최적화
- [ ] Redis 캐싱 도입
- [ ] 데이터베이스 인덱스 최적화
- [ ] CDN 연동 (이미지)

## 🤝 기여 가이드

1. Fork the Project
2. Create Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit Changes (`git commit -m 'Add AmazingFeature'`)
4. Push to Branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 연락처

- **개발자**: [Your Name]
- **이메일**: [your.email@example.com]
- **프로젝트 링크**: [https://github.com/yourusername/travel-mate-backend]

---

**Travel Mate** - 여행이 더 즐거워지는 순간 🌍✈️