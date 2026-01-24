# Fryndo 개발자 가이드

이 문서는 Fryndo 프로젝트에 기여하려는 개발자를 위한 가이드입니다.

## 목차

1. [개발 환경 설정](#개발-환경-설정)
2. [프로젝트 구조](#프로젝트-구조)
3. [코딩 컨벤션](#코딩-컨벤션)
4. [테스트 작성](#테스트-작성)
5. [API 개발](#api-개발)
6. [프론트엔드 개발](#프론트엔드-개발)
7. [Git 워크플로우](#git-워크플로우)

---

## 개발 환경 설정

### 필수 도구

```bash
# Java 17
java -version  # openjdk 17.x.x

# Node.js 20
node -v  # v20.x.x

# Maven
mvn -v  # Apache Maven 3.8+

# Docker (선택)
docker -v  # Docker version 24.x
```

### IDE 설정

#### VS Code 추천 익스텐션
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "vscjava.vscode-java-pack",
    "pivotal.vscode-spring-boot"
  ]
}
```

#### IntelliJ IDEA 설정
- Lombok 플러그인 설치
- Annotation Processing 활성화
- Code Style: Google Java Style

### 로컬 개발 시작

```bash
# 1. 저장소 클론
git clone https://github.com/your-repo/travelmate.git
cd travelmate

# 2. 백엔드 실행
cd travelmate-backend
cp .env.example .env  # 환경변수 설정
./mvnw spring-boot:run

# 3. 프론트엔드 실행 (새 터미널)
cd travelmate-web
cp .env.example .env.local  # 환경변수 설정
npm install --legacy-peer-deps
npm start
```

---

## 프로젝트 구조

### 백엔드 (Spring Boot)

```
travelmate-backend/
├── src/main/java/com/travelmate/
│   ├── config/              # 설정 클래스
│   │   ├── SecurityConfig.java
│   │   ├── WebSocketConfig.java
│   │   └── RedisConfig.java
│   ├── controller/          # REST 컨트롤러
│   │   ├── AuthController.java
│   │   ├── GroupController.java
│   │   └── NftController.java
│   ├── service/             # 비즈니스 로직
│   │   ├── AuthService.java
│   │   ├── FollowService.java
│   │   └── nft/
│   │       ├── NftMintingService.java
│   │       └── LocationReviewService.java
│   ├── repository/          # 데이터 액세스
│   ├── model/               # JPA 엔티티
│   ├── dto/                 # 요청/응답 DTO
│   └── exception/           # 예외 처리
├── src/main/resources/
│   ├── application.yml      # 기본 설정
│   ├── application-dev.yml  # 개발 설정
│   └── application-prod.yml # 운영 설정
└── src/test/java/           # 테스트
```

### 프론트엔드 (React)

```
travelmate-web/
├── src/
│   ├── components/          # 재사용 컴포넌트
│   │   ├── auth/            # 인증 관련
│   │   ├── chat/            # 채팅 관련
│   │   ├── nft/             # NFT 관련
│   │   └── social/          # 소셜 관련
│   ├── pages/               # 페이지 컴포넌트
│   ├── services/            # API 서비스
│   ├── hooks/               # 커스텀 훅
│   ├── store/               # Zustand 스토어
│   ├── contexts/            # React Context
│   ├── types/               # TypeScript 타입
│   └── lib/                 # 유틸리티
├── cypress/                 # E2E 테스트
└── public/                  # 정적 파일
```

---

## 코딩 컨벤션

### Java (백엔드)

```java
// 클래스명: PascalCase
public class UserService { }

// 메서드/변수: camelCase
public void createUser(CreateUserDto dto) { }

// 상수: UPPER_SNAKE_CASE
public static final int MAX_RETRY_COUNT = 3;

// DTO는 record 사용 권장
public record CreateUserRequest(
    @NotBlank String email,
    @NotBlank String password
) { }
```

### TypeScript (프론트엔드)

```typescript
// 컴포넌트: PascalCase
export const UserProfile: React.FC<Props> = () => { };

// 함수/변수: camelCase
const fetchUserData = async () => { };

// 타입/인터페이스: PascalCase
interface UserResponse {
  id: number;
  email: string;
}

// 상수: UPPER_SNAKE_CASE
const API_BASE_URL = '/api';
```

### ESLint & Prettier

```bash
# 린트 검사
npm run lint

# 린트 자동 수정
npm run lint:fix

# 코드 포맷팅
npm run format
```

---

## 테스트 작성

### 백엔드 테스트

```java
@ExtendWith(MockitoExtension.class)
class FollowServiceTest {
    @Mock
    private UserFollowRepository followRepository;

    @InjectMocks
    private FollowService followService;

    @Test
    @DisplayName("팔로우 성공 테스트")
    void follow_Success() {
        // Given
        when(followRepository.existsByFollowerIdAndFollowingId(1L, 2L))
            .thenReturn(false);

        // When
        FollowResponse result = followService.follow(1L, 2L);

        // Then
        assertThat(result.isFollowing()).isTrue();
        verify(followRepository).save(any(UserFollow.class));
    }
}
```

### 프론트엔드 테스트

```typescript
// 단위 테스트 (Jest)
describe('useFollow hook', () => {
  it('should follow a user successfully', async () => {
    mockFollowService.follow.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useFollow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(2);
    });

    expect(mockFollowService.follow).toHaveBeenCalledWith(2);
  });
});
```

```typescript
// E2E 테스트 (Cypress)
describe('Follow System', () => {
  it('should follow a user', () => {
    cy.intercept('POST', '**/api/users/2/follow', {
      statusCode: 200,
      body: { success: true },
    }).as('followUser');

    cy.visit('/profile/2');
    cy.get('button').contains('팔로우').click();
    cy.wait('@followUser');

    cy.get('button').contains('팔로잉').should('be.visible');
  });
});
```

---

## API 개발

### 새 API 엔드포인트 추가

1. **DTO 정의** (`dto/` 폴더)
```java
public record CreateReviewRequest(
    @NotNull @Min(1) @Max(5) Integer rating,
    @Size(max = 500) String comment,
    Season visitSeason
) { }
```

2. **Service 구현** (`service/` 폴더)
```java
@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;

    @Transactional
    public ReviewResponse createReview(Long locationId, CreateReviewRequest request, Long userId) {
        // 비즈니스 로직
    }
}
```

3. **Controller 구현** (`controller/` 폴더)
```java
@RestController
@RequestMapping("/api/locations/{locationId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse createReview(
            @PathVariable Long locationId,
            @Valid @RequestBody CreateReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return reviewService.createReview(locationId, request, getUserId(userDetails));
    }
}
```

4. **테스트 작성**
```java
@WebMvcTest(ReviewController.class)
class ReviewControllerTest {
    @Test
    void createReview_Success() throws Exception {
        mockMvc.perform(post("/api/locations/1/reviews")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated());
    }
}
```

---

## 프론트엔드 개발

### 새 페이지 추가

1. **페이지 컴포넌트 생성** (`pages/` 폴더)
```typescript
// pages/NewFeature.tsx
const NewFeature: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">새 기능</h1>
    </div>
  );
};

export default NewFeature;
```

2. **라우트 추가** (`App.tsx`)
```typescript
const NewFeature = lazy(() => import('./pages/NewFeature'));

// Routes 내부
<Route
  path="/new-feature"
  element={
    <ProtectedRoute>
      <Layout>
        <NewFeature />
      </Layout>
    </ProtectedRoute>
  }
/>
```

3. **서비스 함수 생성** (`services/` 폴더)
```typescript
// services/newFeatureService.ts
export const newFeatureService = {
  getData: async (): Promise<DataResponse> => {
    return apiClient.get('/new-feature');
  },
};
```

4. **커스텀 훅 생성** (`hooks/` 폴더)
```typescript
// hooks/useNewFeature.ts
export function useNewFeature() {
  return useQuery({
    queryKey: ['newFeature'],
    queryFn: newFeatureService.getData,
  });
}
```

---

## Git 워크플로우

### 브랜치 전략

```
main          # 프로덕션 브랜치
├── develop   # 개발 브랜치
│   ├── feature/NFT-123-add-minting    # 기능 브랜치
│   ├── fix/NFT-124-fix-collection     # 버그 수정
│   └── refactor/NFT-125-optimize      # 리팩토링
└── hotfix/critical-fix                # 긴급 수정
```

### 커밋 메시지 컨벤션

```bash
# 형식
<type>(<scope>): <subject>

# 타입
feat     # 새로운 기능
fix      # 버그 수정
docs     # 문서 수정
style    # 코드 포맷팅
refactor # 리팩토링
test     # 테스트 추가
chore    # 빌드, 설정 변경

# 예시
feat(nft): add minting progress indicator
fix(auth): resolve token refresh race condition
docs(readme): update API documentation
```

### PR 체크리스트

- [ ] 코드 린트 통과 (`npm run lint`)
- [ ] 테스트 통과 (`npm test`)
- [ ] 빌드 성공 (`npm run build`)
- [ ] 변경사항에 대한 테스트 추가
- [ ] 문서 업데이트 (필요한 경우)

---

## 문의

- Issues: [GitHub Issues](https://github.com/your-repo/travelmate/issues)
- Discussions: [GitHub Discussions](https://github.com/your-repo/travelmate/discussions)
