package com.travelmate.service;

import com.travelmate.exception.UserException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PasswordService 테스트")
class PasswordServiceTest {

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PasswordService passwordService;

    @Nested
    @DisplayName("validatePassword 테스트")
    class ValidatePasswordTest {

        @Test
        @DisplayName("성공 - 유효한 비밀번호")
        void validatePassword_Valid() {
            // Given - 연속문자 없는 유효한 비밀번호
            String validPassword = "MyStr0ng!Pass";

            // When & Then
            assertThatCode(() -> passwordService.validatePassword(validPassword))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("실패 - null 비밀번호")
        void validatePassword_Null() {
            // When & Then
            assertThatThrownBy(() -> passwordService.validatePassword(null))
                    .isInstanceOf(UserException.PasswordPolicyException.class)
                    .hasMessageContaining("최소 8자리");
        }

        @Test
        @DisplayName("실패 - 너무 짧은 비밀번호")
        void validatePassword_TooShort() {
            // When & Then
            assertThatThrownBy(() -> passwordService.validatePassword("Ab@1234"))
                    .isInstanceOf(UserException.PasswordPolicyException.class)
                    .hasMessageContaining("최소 8자리");
        }

        @Test
        @DisplayName("실패 - 너무 긴 비밀번호")
        void validatePassword_TooLong() {
            // Given
            String longPassword = "A".repeat(100) + "a@1" + "b".repeat(30);

            // When & Then
            assertThatThrownBy(() -> passwordService.validatePassword(longPassword))
                    .isInstanceOf(UserException.PasswordPolicyException.class)
                    .hasMessageContaining("최대 128자리");
        }

        @Test
        @DisplayName("실패 - 소문자 없음")
        void validatePassword_NoLowercase() {
            // When & Then
            assertThatThrownBy(() -> passwordService.validatePassword("TEST@1234"))
                    .isInstanceOf(UserException.PasswordPolicyException.class)
                    .hasMessageContaining("소문자");
        }

        @Test
        @DisplayName("실패 - 대문자 없음")
        void validatePassword_NoUppercase() {
            // When & Then
            assertThatThrownBy(() -> passwordService.validatePassword("test@1234"))
                    .isInstanceOf(UserException.PasswordPolicyException.class)
                    .hasMessageContaining("대문자");
        }

        @Test
        @DisplayName("실패 - 숫자 없음")
        void validatePassword_NoDigit() {
            // When & Then
            assertThatThrownBy(() -> passwordService.validatePassword("Test@abcd"))
                    .isInstanceOf(UserException.PasswordPolicyException.class)
                    .hasMessageContaining("숫자");
        }

        @Test
        @DisplayName("실패 - 특수문자 없음")
        void validatePassword_NoSpecialChar() {
            // When & Then
            assertThatThrownBy(() -> passwordService.validatePassword("Test12345"))
                    .isInstanceOf(UserException.PasswordPolicyException.class)
                    .hasMessageContaining("특수문자");
        }

        @ParameterizedTest
        @ValueSource(strings = {"Teeest@9xY", "Test@111aB", "Testaaa@9X"})
        @DisplayName("실패 - 연속된 문자 포함")
        void validatePassword_SequentialChars(String password) {
            // When & Then - 3개 이상 같은 문자 연속 (eee, 111, aaa)
            assertThatThrownBy(() -> passwordService.validatePassword(password))
                    .isInstanceOf(UserException.PasswordPolicyException.class)
                    .hasMessageContaining("연속된");
        }

        @ParameterizedTest
        @ValueSource(strings = {"Test@123456", "Test@789012"})
        @DisplayName("실패 - 연속된 숫자 포함")
        void validatePassword_SequentialNumbers(String password) {
            // When & Then
            assertThatThrownBy(() -> passwordService.validatePassword(password))
                    .isInstanceOf(UserException.PasswordPolicyException.class)
                    .hasMessageContaining("연속된");
        }

        @ParameterizedTest
        @ValueSource(strings = {"Xpassword@9", "MyAdmin!xY2", "Xwelcome@9Z"})
        @DisplayName("실패 - 일반적인 약한 비밀번호")
        void validatePassword_CommonPasswords(String password) {
            // When & Then - "password", "admin", "welcome"이 포함됨 (대소문자 무관)
            assertThatThrownBy(() -> passwordService.validatePassword(password))
                    .isInstanceOf(UserException.PasswordPolicyException.class)
                    .hasMessageContaining("일반적인");
        }
    }

    @Nested
    @DisplayName("validatePasswordSimilarity 테스트")
    class ValidatePasswordSimilarityTest {

        @Test
        @DisplayName("성공 - 유사성 없음")
        void validatePasswordSimilarity_NoSimilarity() {
            // Given
            String password = "MyStr0ng!Pass";
            String email = "user@example.com";
            String nickname = "coolguy";
            String fullName = "Kim Lee";

            // When & Then
            assertThatCode(() -> passwordService.validatePasswordSimilarity(password, email, nickname, fullName))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("실패 - 이메일과 유사")
        void validatePasswordSimilarity_SimilarToEmail() {
            // Given - "testuser"가 이메일 로컬 파트와 유사
            String password = "Testuser@9!aB";
            String email = "testuser@example.com";

            // When & Then
            assertThatThrownBy(() -> passwordService.validatePasswordSimilarity(password, email, null, null))
                    .isInstanceOf(UserException.PasswordPolicyException.class)
                    .hasMessageContaining("이메일");
        }

        @Test
        @DisplayName("실패 - 닉네임과 유사")
        void validatePasswordSimilarity_SimilarToNickname() {
            // Given - 닉네임이 비밀번호에 포함됨
            String password = "Coolguy@9!xY";
            String nickname = "coolguy";

            // When & Then
            assertThatThrownBy(() -> passwordService.validatePasswordSimilarity(password, null, nickname, null))
                    .isInstanceOf(UserException.PasswordPolicyException.class)
                    .hasMessageContaining("닉네임");
        }

        @Test
        @DisplayName("실패 - 이름과 유사")
        void validatePasswordSimilarity_SimilarToFullName() {
            // Given - 이름(공백제거)이 비밀번호에 포함됨
            String password = "Kimlee@9!abC";
            String fullName = "Kim Lee";

            // When & Then
            assertThatThrownBy(() -> passwordService.validatePasswordSimilarity(password, null, null, fullName))
                    .isInstanceOf(UserException.PasswordPolicyException.class)
                    .hasMessageContaining("이름");
        }

        @Test
        @DisplayName("성공 - 짧은 이메일/닉네임/이름은 무시")
        void validatePasswordSimilarity_ShortValuesIgnored() {
            // Given - 4자 미만의 값들은 검사하지 않음
            String password = "MyStr0ng!Pass";
            String email = "ab@x.com"; // local part "ab" is less than 4 chars
            String nickname = "abc"; // less than 4 chars
            String fullName = "Kim"; // less than 4 chars

            // When & Then
            assertThatCode(() -> passwordService.validatePasswordSimilarity(password, email, nickname, fullName))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("성공 - null 값들은 무시")
        void validatePasswordSimilarity_NullValuesIgnored() {
            // Given
            String password = "MyStr0ng!Pass";

            // When & Then
            assertThatCode(() -> passwordService.validatePasswordSimilarity(password, null, null, null))
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("encodePassword 테스트")
    class EncodePasswordTest {

        @Test
        @DisplayName("성공 - 비밀번호 암호화")
        void encodePassword_Success() {
            // Given - 연속문자 없는 유효한 비밀번호
            String rawPassword = "MyStr0ng!Pass";
            String encodedPassword = "$2a$10$encodedPasswordHash";

            when(passwordEncoder.encode(rawPassword)).thenReturn(encodedPassword);

            // When
            String result = passwordService.encodePassword(rawPassword);

            // Then
            assertThat(result).isEqualTo(encodedPassword);
            verify(passwordEncoder).encode(rawPassword);
        }

        @Test
        @DisplayName("실패 - 유효하지 않은 비밀번호는 암호화 전 검증 실패")
        void encodePassword_InvalidPassword() {
            // Given
            String invalidPassword = "weak";

            // When & Then
            assertThatThrownBy(() -> passwordService.encodePassword(invalidPassword))
                    .isInstanceOf(UserException.PasswordPolicyException.class);

            verify(passwordEncoder, never()).encode(anyString());
        }
    }

    @Nested
    @DisplayName("matches 테스트")
    class MatchesTest {

        @Test
        @DisplayName("성공 - 비밀번호 일치")
        void matches_Success() {
            // Given
            String rawPassword = "MyStr0ng!Pass";
            String encodedPassword = "$2a$10$encodedPasswordHash";

            when(passwordEncoder.matches(rawPassword, encodedPassword)).thenReturn(true);

            // When
            boolean result = passwordService.matches(rawPassword, encodedPassword);

            // Then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("실패 - 비밀번호 불일치")
        void matches_Fail() {
            // Given
            String rawPassword = "Wr0ng!Pass";
            String encodedPassword = "$2a$10$encodedPasswordHash";

            when(passwordEncoder.matches(rawPassword, encodedPassword)).thenReturn(false);

            // When
            boolean result = passwordService.matches(rawPassword, encodedPassword);

            // Then
            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("calculatePasswordStrength 테스트")
    class CalculatePasswordStrengthTest {

        @Test
        @DisplayName("0점 - null 또는 빈 문자열")
        void calculatePasswordStrength_Empty() {
            assertThat(passwordService.calculatePasswordStrength(null)).isEqualTo(0);
            assertThat(passwordService.calculatePasswordStrength("")).isEqualTo(0);
        }

        @Test
        @DisplayName("낮은 점수 - 짧고 간단한 비밀번호")
        void calculatePasswordStrength_Weak() {
            // Given - 8자리, 소문자만 (연속 패턴 없음)
            int score = passwordService.calculatePasswordStrength("qwrtpljh");

            // Then - 길이 10점 + 소문자 15점 = 25점
            assertThat(score).isEqualTo(25);
        }

        @Test
        @DisplayName("중간 점수 - 적절한 조합")
        void calculatePasswordStrength_Medium() {
            // Given - 10자리, 소문자+대문자+숫자 (연속문자 없음)
            int score = passwordService.calculatePasswordStrength("Testtst8X7");

            // Then - 길이 10점 + 소문자 15점 + 대문자 15점 + 숫자 15점 = 55점
            assertThat(score).isEqualTo(55);
        }

        @Test
        @DisplayName("높은 점수 - 강력한 비밀번호")
        void calculatePasswordStrength_Strong() {
            // Given - 16자리 이상, 모든 문자 종류 포함 (연속문자, 일반비밀번호 없음)
            // 보너스 패턴: 소문자 -> 대문자 -> 숫자 -> 특수문자 순서로 등장
            int score = passwordService.calculatePasswordStrength("qwX9@rtY!mnZ8xy!");

            // Then - 길이 25점 + 소문자 15점 + 대문자 15점 + 숫자 15점 + 특수문자 15점 + 보너스 10점 = 95점
            assertThat(score).isEqualTo(95);
        }

        @Test
        @DisplayName("페널티 - 연속된 문자 포함")
        void calculatePasswordStrength_WithSequential() {
            // Given - 연속된 문자 포함
            int score = passwordService.calculatePasswordStrength("Test@111abc");

            // Then - 기본 점수에서 -20점 페널티
            assertThat(score).isLessThan(70);
        }

        @Test
        @DisplayName("페널티 - 일반적인 비밀번호 포함")
        void calculatePasswordStrength_WithCommonPassword() {
            // Given - "password" 포함
            int score = passwordService.calculatePasswordStrength("MyPassword@1");

            // Then - 기본 점수에서 -30점 페널티
            assertThat(score).isLessThan(70);
        }

        @Test
        @DisplayName("최소 0점, 최대 100점")
        void calculatePasswordStrength_Bounds() {
            // 매우 약한 비밀번호
            int weakScore = passwordService.calculatePasswordStrength("password123");
            assertThat(weakScore).isBetween(0, 100);

            // 매우 강한 비밀번호
            int strongScore = passwordService.calculatePasswordStrength("MyStr0ng@P@ssw0rd!XYZ");
            assertThat(strongScore).isBetween(0, 100);
        }
    }

    @Nested
    @DisplayName("getPasswordStrengthText 테스트")
    class GetPasswordStrengthTextTest {

        @Test
        @DisplayName("매우 약함 - 30점 미만")
        void getPasswordStrengthText_VeryWeak() {
            assertThat(passwordService.getPasswordStrengthText(0)).isEqualTo("매우 약함");
            assertThat(passwordService.getPasswordStrengthText(29)).isEqualTo("매우 약함");
        }

        @Test
        @DisplayName("약함 - 30~49점")
        void getPasswordStrengthText_Weak() {
            assertThat(passwordService.getPasswordStrengthText(30)).isEqualTo("약함");
            assertThat(passwordService.getPasswordStrengthText(49)).isEqualTo("약함");
        }

        @Test
        @DisplayName("보통 - 50~69점")
        void getPasswordStrengthText_Medium() {
            assertThat(passwordService.getPasswordStrengthText(50)).isEqualTo("보통");
            assertThat(passwordService.getPasswordStrengthText(69)).isEqualTo("보통");
        }

        @Test
        @DisplayName("강함 - 70~89점")
        void getPasswordStrengthText_Strong() {
            assertThat(passwordService.getPasswordStrengthText(70)).isEqualTo("강함");
            assertThat(passwordService.getPasswordStrengthText(89)).isEqualTo("강함");
        }

        @Test
        @DisplayName("매우 강함 - 90점 이상")
        void getPasswordStrengthText_VeryStrong() {
            assertThat(passwordService.getPasswordStrengthText(90)).isEqualTo("매우 강함");
            assertThat(passwordService.getPasswordStrengthText(100)).isEqualTo("매우 강함");
        }
    }
}
