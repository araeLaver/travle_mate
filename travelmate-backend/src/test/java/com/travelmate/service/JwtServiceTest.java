package com.travelmate.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

@DisplayName("JwtService 테스트")
class JwtServiceTest {

    private JwtService jwtService;

    // 테스트용 시크릿 키 (최소 256비트 = 32바이트 이상)
    private static final String TEST_SECRET = "test-secret-key-for-jwt-testing-must-be-at-least-256-bits-long";
    private static final Long TEST_EXPIRATION = 3600000L; // 1시간

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", TEST_EXPIRATION);
    }

    @Nested
    @DisplayName("generateToken 테스트")
    class GenerateTokenTest {

        @Test
        @DisplayName("성공 - 기본 역할(USER)로 토큰 생성")
        void generateToken_DefaultRole() {
            // When
            String token = jwtService.generateToken(1L, "test@example.com");

            // Then
            assertThat(token).isNotNull();
            assertThat(token).isNotEmpty();
            assertThat(token.split("\\.")).hasSize(3); // JWT 형식: header.payload.signature
        }

        @Test
        @DisplayName("성공 - 지정된 역할로 토큰 생성")
        void generateToken_WithRole() {
            // When
            String token = jwtService.generateToken(1L, "admin@example.com", "ADMIN");

            // Then
            assertThat(token).isNotNull();
            String role = jwtService.getRoleFromToken(token);
            assertThat(role).isEqualTo("ADMIN");
        }

        @Test
        @DisplayName("토큰에 올바른 사용자 정보 포함")
        void generateToken_ContainsCorrectClaims() {
            // When
            String token = jwtService.generateToken(123L, "user@example.com", "USER");

            // Then
            Long userId = jwtService.getUserIdFromToken(token);
            String email = jwtService.getEmailFromToken(token);
            String role = jwtService.getRoleFromToken(token);

            assertThat(userId).isEqualTo(123L);
            assertThat(email).isEqualTo("user@example.com");
            assertThat(role).isEqualTo("USER");
        }
    }

    @Nested
    @DisplayName("getUserIdFromToken 테스트")
    class GetUserIdFromTokenTest {

        @Test
        @DisplayName("성공 - 토큰에서 사용자 ID 추출")
        void getUserIdFromToken_Success() {
            // Given
            String token = jwtService.generateToken(42L, "test@example.com");

            // When
            Long userId = jwtService.getUserIdFromToken(token);

            // Then
            assertThat(userId).isEqualTo(42L);
        }

        @Test
        @DisplayName("다양한 사용자 ID 값")
        void getUserIdFromToken_VariousIds() {
            // Given & When & Then
            Long[] ids = {1L, 100L, 999999L, Long.MAX_VALUE};

            for (Long id : ids) {
                String token = jwtService.generateToken(id, "test@example.com");
                Long extractedId = jwtService.getUserIdFromToken(token);
                assertThat(extractedId).isEqualTo(id);
            }
        }
    }

    @Nested
    @DisplayName("getEmailFromToken 테스트")
    class GetEmailFromTokenTest {

        @Test
        @DisplayName("성공 - 토큰에서 이메일 추출")
        void getEmailFromToken_Success() {
            // Given
            String token = jwtService.generateToken(1L, "user@example.com");

            // When
            String email = jwtService.getEmailFromToken(token);

            // Then
            assertThat(email).isEqualTo("user@example.com");
        }

        @Test
        @DisplayName("다양한 이메일 형식")
        void getEmailFromToken_VariousFormats() {
            // Given
            String[] emails = {
                    "simple@test.com",
                    "user.name@domain.co.kr",
                    "user+tag@example.org",
                    "한글@example.com"
            };

            // When & Then
            for (String email : emails) {
                String token = jwtService.generateToken(1L, email);
                String extractedEmail = jwtService.getEmailFromToken(token);
                assertThat(extractedEmail).isEqualTo(email);
            }
        }
    }

    @Nested
    @DisplayName("getRoleFromToken 테스트")
    class GetRoleFromTokenTest {

        @Test
        @DisplayName("성공 - 토큰에서 역할 추출")
        void getRoleFromToken_Success() {
            // Given
            String token = jwtService.generateToken(1L, "test@example.com", "ADMIN");

            // When
            String role = jwtService.getRoleFromToken(token);

            // Then
            assertThat(role).isEqualTo("ADMIN");
        }

        @Test
        @DisplayName("기본 역할 - role claim이 없으면 USER 반환")
        void getRoleFromToken_DefaultRole() {
            // Given - 기본 generateToken은 "USER" 역할을 설정
            String token = jwtService.generateToken(1L, "test@example.com");

            // When
            String role = jwtService.getRoleFromToken(token);

            // Then
            assertThat(role).isEqualTo("USER");
        }
    }

    @Nested
    @DisplayName("getAuthoritiesFromToken 테스트")
    class GetAuthoritiesFromTokenTest {

        @Test
        @DisplayName("성공 - USER 역할의 권한")
        void getAuthoritiesFromToken_User() {
            // Given
            String token = jwtService.generateToken(1L, "test@example.com", "USER");

            // When
            List<String> authorities = jwtService.getAuthoritiesFromToken(token);

            // Then
            assertThat(authorities).containsExactly("ROLE_USER");
        }

        @Test
        @DisplayName("성공 - ADMIN 역할의 권한")
        void getAuthoritiesFromToken_Admin() {
            // Given
            String token = jwtService.generateToken(1L, "admin@example.com", "ADMIN");

            // When
            List<String> authorities = jwtService.getAuthoritiesFromToken(token);

            // Then
            assertThat(authorities).containsExactly("ROLE_ADMIN");
        }
    }

    @Nested
    @DisplayName("validateToken 테스트")
    class ValidateTokenTest {

        @Test
        @DisplayName("성공 - 유효한 토큰")
        void validateToken_Valid() {
            // Given
            String token = jwtService.generateToken(1L, "test@example.com");

            // When
            boolean isValid = jwtService.validateToken(token);

            // Then
            assertThat(isValid).isTrue();
        }

        @Test
        @DisplayName("실패 - 잘못된 형식의 토큰")
        void validateToken_Malformed() {
            // Given
            String malformedToken = "not.a.valid.jwt.token";

            // When
            boolean isValid = jwtService.validateToken(malformedToken);

            // Then
            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("실패 - 빈 토큰")
        void validateToken_Empty() {
            // When
            boolean isValid = jwtService.validateToken("");

            // Then
            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("실패 - null 토큰")
        void validateToken_Null() {
            // When
            boolean isValid = jwtService.validateToken(null);

            // Then
            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("실패 - 변조된 토큰")
        void validateToken_Tampered() {
            // Given
            String validToken = jwtService.generateToken(1L, "test@example.com");
            // 토큰 페이로드 변조
            String[] parts = validToken.split("\\.");
            String tamperedToken = parts[0] + ".tamperedPayload." + parts[2];

            // When & Then
            // 변조된 토큰은 SignatureException이 발생하거나 false 반환
            try {
                boolean isValid = jwtService.validateToken(tamperedToken);
                assertThat(isValid).isFalse();
            } catch (io.jsonwebtoken.security.SignatureException e) {
                // SignatureException 발생도 유효하지 않은 토큰으로 간주
                assertThat(e).isNotNull();
            }
        }

        @Test
        @DisplayName("실패 - 다른 키로 서명된 토큰")
        void validateToken_DifferentKey() {
            // Given - 다른 JwtService 인스턴스로 토큰 생성
            JwtService otherService = new JwtService();
            ReflectionTestUtils.setField(otherService, "jwtSecret",
                    "different-secret-key-for-testing-must-be-at-least-256-bits-long");
            ReflectionTestUtils.setField(otherService, "jwtExpiration", TEST_EXPIRATION);

            String tokenFromOther = otherService.generateToken(1L, "test@example.com");

            // When & Then
            // 다른 키로 서명된 토큰은 SignatureException이 발생하거나 false 반환
            try {
                boolean isValid = jwtService.validateToken(tokenFromOther);
                assertThat(isValid).isFalse();
            } catch (io.jsonwebtoken.security.SignatureException e) {
                // SignatureException 발생도 유효하지 않은 토큰으로 간주
                assertThat(e).isNotNull();
            }
        }

        @Test
        @DisplayName("실패 - 만료된 토큰")
        void validateToken_Expired() {
            // Given - 만료 시간을 0으로 설정
            JwtService expiredService = new JwtService();
            ReflectionTestUtils.setField(expiredService, "jwtSecret", TEST_SECRET);
            ReflectionTestUtils.setField(expiredService, "jwtExpiration", 0L); // 즉시 만료

            String expiredToken = expiredService.generateToken(1L, "test@example.com");

            // When
            boolean isValid = jwtService.validateToken(expiredToken);

            // Then
            assertThat(isValid).isFalse();
        }
    }

    @Nested
    @DisplayName("토큰 일관성 테스트")
    class TokenConsistencyTest {

        @Test
        @DisplayName("동일한 입력으로 생성된 토큰은 동일한 정보 포함")
        void tokenConsistency() {
            // Given
            Long userId = 100L;
            String email = "consistent@example.com";
            String role = "USER";

            // When
            String token1 = jwtService.generateToken(userId, email, role);
            String token2 = jwtService.generateToken(userId, email, role);

            // Then - 토큰 자체는 다를 수 있음 (iat가 다를 수 있음)
            // 하지만 추출된 정보는 동일해야 함
            assertThat(jwtService.getUserIdFromToken(token1)).isEqualTo(jwtService.getUserIdFromToken(token2));
            assertThat(jwtService.getEmailFromToken(token1)).isEqualTo(jwtService.getEmailFromToken(token2));
            assertThat(jwtService.getRoleFromToken(token1)).isEqualTo(jwtService.getRoleFromToken(token2));
        }

        @Test
        @DisplayName("생성 후 즉시 검증 가능")
        void tokenImmediatelyValid() {
            // When
            String token = jwtService.generateToken(1L, "test@example.com");

            // Then
            assertThat(jwtService.validateToken(token)).isTrue();
            assertThat(jwtService.getUserIdFromToken(token)).isEqualTo(1L);
            assertThat(jwtService.getEmailFromToken(token)).isEqualTo("test@example.com");
        }
    }

    @Nested
    @DisplayName("경계 조건 테스트")
    class EdgeCaseTest {

        @Test
        @DisplayName("긴 이메일 주소")
        void longEmail() {
            // Given
            String longEmail = "a".repeat(100) + "@" + "b".repeat(100) + ".com";

            // When
            String token = jwtService.generateToken(1L, longEmail);
            String extractedEmail = jwtService.getEmailFromToken(token);

            // Then
            assertThat(extractedEmail).isEqualTo(longEmail);
        }

        @Test
        @DisplayName("특수 문자가 포함된 역할")
        void specialCharactersInRole() {
            // Given
            String specialRole = "SUPER_ADMIN";

            // When
            String token = jwtService.generateToken(1L, "test@example.com", specialRole);
            String extractedRole = jwtService.getRoleFromToken(token);

            // Then
            assertThat(extractedRole).isEqualTo(specialRole);
        }

        @Test
        @DisplayName("최소 사용자 ID")
        void minUserId() {
            // When
            String token = jwtService.generateToken(1L, "test@example.com");
            Long userId = jwtService.getUserIdFromToken(token);

            // Then
            assertThat(userId).isEqualTo(1L);
        }

        @Test
        @DisplayName("큰 사용자 ID")
        void largeUserId() {
            // Given
            Long largeId = 9999999999L;

            // When
            String token = jwtService.generateToken(largeId, "test@example.com");
            Long userId = jwtService.getUserIdFromToken(token);

            // Then
            assertThat(userId).isEqualTo(largeId);
        }
    }
}
