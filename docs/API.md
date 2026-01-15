# TravelMate API 문서

Base URL: `https://api.travelmate.com/api` (Production)
Local: `http://localhost:8080/api`

## 인증

모든 인증이 필요한 API는 `Authorization` 헤더에 JWT 토큰을 포함해야 합니다.

```
Authorization: Bearer <access_token>
```

---

## 인증 API

### POST /auth/register
회원가입

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "nickname": "닉네임",
  "agreeTerms": true
}
```

**Response** `201 Created`
```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "닉네임"
}
```

### POST /auth/login
로그인

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "닉네임",
    "profileImageUrl": null
  }
}
```

### POST /auth/refresh
토큰 갱신

**Request Body**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 사용자 API

### GET /users/me
내 프로필 조회 (인증 필요)

**Response** `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "닉네임",
  "profileImageUrl": "https://...",
  "bio": "자기소개",
  "followerCount": 100,
  "followingCount": 50
}
```

### GET /users/{userId}
사용자 프로필 조회

**Response** `200 OK`
```json
{
  "id": 2,
  "nickname": "다른사용자",
  "profileImageUrl": "https://...",
  "bio": "자기소개",
  "followerCount": 200,
  "followingCount": 100,
  "isFollowing": false
}
```

---

## 팔로우 API

### POST /users/{userId}/follow
사용자 팔로우 (인증 필요)

**Response** `200 OK`
```json
{
  "success": true,
  "isFollowing": true,
  "isMutual": false,
  "stats": {
    "followerCount": 101,
    "followingCount": 50
  }
}
```

### DELETE /users/{userId}/follow
사용자 언팔로우 (인증 필요)

**Response** `200 OK`
```json
{
  "success": true,
  "isFollowing": false,
  "stats": {
    "followerCount": 100,
    "followingCount": 50
  }
}
```

### GET /users/{userId}/followers
팔로워 목록 조회

**Query Parameters**
- `page` (default: 0)
- `size` (default: 20)

**Response** `200 OK`
```json
{
  "content": [
    {
      "id": 3,
      "nickname": "팔로워1",
      "profileImageUrl": null,
      "isMutual": true
    }
  ],
  "totalElements": 100,
  "totalPages": 5,
  "number": 0,
  "size": 20
}
```

### GET /users/{userId}/following
팔로잉 목록 조회

### GET /users/{userId}/follow-stats
팔로우 통계 조회

**Response** `200 OK`
```json
{
  "userId": 1,
  "followerCount": 100,
  "followingCount": 50
}
```

### GET /users/{userId}/follow-status
팔로우 상태 조회 (인증 필요)

**Response** `200 OK`
```json
{
  "isFollowing": true,
  "isFollowedBy": false,
  "isMutual": false
}
```

---

## 그룹 API

### GET /groups
그룹 목록 조회

**Query Parameters**
- `page` (default: 0)
- `size` (default: 20)
- `keyword` (검색어)
- `status` (RECRUITING, IN_PROGRESS, COMPLETED)

**Response** `200 OK`
```json
{
  "content": [
    {
      "id": 1,
      "name": "서울 여행",
      "description": "서울 여행 그룹",
      "thumbnail": "https://...",
      "memberCount": 5,
      "maxMembers": 10,
      "startDate": "2024-03-01",
      "endDate": "2024-03-05",
      "status": "RECRUITING"
    }
  ],
  "totalElements": 50,
  "totalPages": 3
}
```

### POST /groups
그룹 생성 (인증 필요)

**Request Body**
```json
{
  "name": "제주도 여행",
  "description": "제주도 맛집 투어",
  "maxMembers": 8,
  "startDate": "2024-04-01",
  "endDate": "2024-04-05",
  "destination": "제주도"
}
```

**Response** `201 Created`

### GET /groups/{groupId}
그룹 상세 조회

### POST /groups/{groupId}/join
그룹 가입 (인증 필요)

### DELETE /groups/{groupId}/leave
그룹 탈퇴 (인증 필요)

---

## NFT API

### GET /nft/locations
NFT 수집 가능 장소 목록

**Query Parameters**
- `latitude` (현재 위도)
- `longitude` (현재 경도)
- `radius` (검색 반경, km)

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "name": "경복궁",
    "latitude": 37.5796,
    "longitude": 126.977,
    "rarity": "LEGENDARY",
    "isCollected": false,
    "collectRadius": 100,
    "description": "조선 왕조의 정궁"
  }
]
```

### POST /nft/collect/{locationId}
NFT 수집 (인증 필요)

**Request Body**
```json
{
  "latitude": 37.5796,
  "longitude": 126.977
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "nft": {
    "id": 1,
    "locationName": "경복궁",
    "imageUrl": "https://...",
    "rarity": "LEGENDARY",
    "collectedAt": "2024-01-15T10:00:00Z"
  },
  "message": "경복궁 NFT를 수집했습니다!"
}
```

### GET /nft/collection
내 NFT 컬렉션 조회 (인증 필요)

**Query Parameters**
- `page` (default: 0)
- `size` (default: 20)
- `rarity` (COMMON, RARE, EPIC, LEGENDARY)
- `mintStatus` (NOT_MINTED, MINTING, MINTED, FAILED)

**Response** `200 OK`
```json
{
  "content": [
    {
      "id": 1,
      "locationName": "남산타워",
      "imageUrl": "https://...",
      "rarity": "EPIC",
      "collectedAt": "2024-01-15T10:00:00Z",
      "mintStatus": "MINTED",
      "tokenId": 12345,
      "transactionHash": "0x123abc..."
    }
  ],
  "totalElements": 15,
  "totalPages": 1
}
```

### POST /nft/mint/{collectionId}
NFT 민팅 요청 (인증 필요)

**Request Body**
```json
{
  "walletAddress": "0x1234567890abcdef..."
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "status": "MINTING",
  "message": "민팅이 시작되었습니다."
}
```

### GET /nft/mint/status/{collectionId}
민팅 상태 조회 (인증 필요)

**Response** `200 OK`
```json
{
  "status": "COMPLETED",
  "tokenId": 12345,
  "transactionHash": "0x123abc...",
  "openseaUrl": "https://opensea.io/assets/...",
  "polygonscanUrl": "https://polygonscan.com/tx/..."
}
```

---

## 리뷰 API

### GET /locations/{locationId}/reviews
장소 리뷰 목록 조회

**Query Parameters**
- `page` (default: 0)
- `size` (default: 20)
- `sort` (RECENT, HELPFUL)

**Response** `200 OK`
```json
{
  "content": [
    {
      "id": 1,
      "userId": 2,
      "userNickname": "여행러",
      "userProfileImageUrl": null,
      "rating": 5,
      "comment": "정말 아름다운 곳이에요!",
      "visitSeason": "SPRING",
      "helpfulCount": 10,
      "isHelpful": false,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "totalElements": 50,
  "totalPages": 3
}
```

### POST /locations/{locationId}/reviews
리뷰 작성 (인증 필요)

**Request Body**
```json
{
  "rating": 5,
  "comment": "정말 아름다운 곳이에요!",
  "visitSeason": "SPRING"
}
```

**Response** `201 Created`

### PUT /reviews/{reviewId}
리뷰 수정 (인증 필요, 본인만)

### DELETE /reviews/{reviewId}
리뷰 삭제 (인증 필요, 본인만)

### POST /reviews/{reviewId}/helpful
도움됨 토글 (인증 필요)

**Response** `200 OK`
```json
{
  "isHelpful": true,
  "helpfulCount": 11
}
```

### GET /locations/{locationId}/reviews/stats
리뷰 통계 조회

**Response** `200 OK`
```json
{
  "averageRating": 4.5,
  "totalReviews": 50,
  "ratingDistribution": {
    "5": 30,
    "4": 15,
    "3": 3,
    "2": 1,
    "1": 1
  }
}
```

---

## 채팅 API

### GET /chat/rooms
채팅방 목록 (인증 필요)

**Response** `200 OK`
```json
[
  {
    "id": 1,
    "name": "서울 여행 채팅",
    "type": "GROUP",
    "lastMessage": "안녕하세요!",
    "lastMessageAt": "2024-01-15T10:00:00Z",
    "unreadCount": 3,
    "participants": [
      {
        "id": 2,
        "nickname": "참여자1",
        "profileImageUrl": null
      }
    ]
  }
]
```

### GET /chat/rooms/{roomId}/messages
메시지 목록 조회 (인증 필요)

**Query Parameters**
- `before` (이전 메시지 조회용 커서)
- `limit` (default: 50)

**Response** `200 OK`
```json
{
  "messages": [
    {
      "id": 1,
      "senderId": 2,
      "senderNickname": "보낸사람",
      "content": "안녕하세요!",
      "type": "TEXT",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "hasMore": true,
  "nextCursor": "eyJpZCI6MTAwfQ=="
}
```

---

## 알림 API

### GET /notifications
알림 목록 조회 (인증 필요)

**Query Parameters**
- `page` (default: 0)
- `size` (default: 20)

**Response** `200 OK`
```json
{
  "content": [
    {
      "id": 1,
      "type": "FOLLOW",
      "title": "새로운 팔로워",
      "message": "홍길동님이 회원님을 팔로우합니다.",
      "isRead": false,
      "createdAt": "2024-01-15T10:00:00Z",
      "data": {
        "userId": 2
      }
    }
  ],
  "totalElements": 100
}
```

### GET /notifications/unread/count
읽지 않은 알림 수 (인증 필요)

**Response** `200 OK`
```json
{
  "count": 5
}
```

### POST /notifications/read
알림 읽음 처리 (인증 필요)

**Request Body**
```json
[1, 2, 3]
```

### POST /notifications/read/all
모든 알림 읽음 처리 (인증 필요)

---

## 에러 응답

### 형식
```json
{
  "error": "에러 메시지",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### 주요 에러 코드

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | BAD_REQUEST | 잘못된 요청 |
| 401 | UNAUTHORIZED | 인증 필요 |
| 403 | FORBIDDEN | 권한 없음 |
| 404 | NOT_FOUND | 리소스 없음 |
| 409 | CONFLICT | 중복/충돌 |
| 429 | TOO_MANY_REQUESTS | 요청 제한 초과 |
| 500 | INTERNAL_ERROR | 서버 오류 |

---

## WebSocket

### 연결
```javascript
const socket = new SockJS('/ws');
const stompClient = Stomp.over(socket);

stompClient.connect({
  Authorization: 'Bearer ' + accessToken
}, onConnected, onError);
```

### 구독

**채팅 메시지**
```javascript
stompClient.subscribe('/topic/chat/' + roomId, (message) => {
  const msg = JSON.parse(message.body);
  // 메시지 처리
});
```

**알림**
```javascript
stompClient.subscribe('/user/queue/notifications', (notification) => {
  const noti = JSON.parse(notification.body);
  // 알림 처리
});
```

### 메시지 전송
```javascript
stompClient.send('/app/chat/' + roomId, {}, JSON.stringify({
  content: '메시지 내용',
  type: 'TEXT'
}));
```
