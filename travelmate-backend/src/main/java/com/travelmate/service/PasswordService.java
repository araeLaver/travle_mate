package com.travelmate.service;

import com.travelmate.exception.UserException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordService {
    
    private final PasswordEncoder passwordEncoder;
    
    // 비밀번호 정책 패턴
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
    );
    
    // 연속된 문자 패턴
    private static final Pattern SEQUENTIAL_PATTERN = Pattern.compile(
        "(.)\\1{2,}|" +  // 같은 문자 3개 이상 연속
        "(012|123|234|345|456|567|678|789|890)|" + // 숫자 연속
        "(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)", // 알파벳 연속
        Pattern.CASE_INSENSITIVE
    );
    
    // 일반적인 약한 비밀번호 패턴
    private static final String[] COMMON_PASSWORDS = {
        "password", "12345678", "qwerty", "abc123", "password123",
        "admin", "letmein", "welcome", "monkey", "1234567890"
    };
    
    /**
     * 비밀번호 정책 검증
     */
    public void validatePassword(String password) {
        if (password == null || password.length() < 8) {
            throw new UserException.PasswordPolicyException("비밀번호는 최소 8자리 이상이어야 합니다.");
        }
        
        if (password.length() > 128) {
            throw new UserException.PasswordPolicyException("비밀번호는 최대 128자리까지 가능합니다.");
        }
        
        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            throw new UserException.PasswordPolicyException(
                "비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 하나 이상 포함해야 합니다.");
        }
        
        if (SEQUENTIAL_PATTERN.matcher(password).find()) {
            throw new UserException.PasswordPolicyException(
                "비밀번호에 연속된 문자나 숫자를 사용할 수 없습니다.");
        }
        
        // 일반적인 약한 비밀번호 체크
        String lowerPassword = password.toLowerCase();
        for (String commonPassword : COMMON_PASSWORDS) {
            if (lowerPassword.contains(commonPassword)) {
                throw new UserException.PasswordPolicyException(
                    "너무 일반적인 비밀번호입니다. 다른 비밀번호를 사용해주세요.");
            }
        }
        
        log.debug("비밀번호 정책 검증 완료");
    }
    
    /**
     * 비밀번호와 사용자 정보의 유사성 검사
     */
    public void validatePasswordSimilarity(String password, String email, String nickname, String fullName) {
        String lowerPassword = password.toLowerCase();
        
        // 이메일과 유사성 검사
        if (email != null) {
            String emailLocal = email.split("@")[0].toLowerCase();
            if (emailLocal.length() >= 4 && lowerPassword.contains(emailLocal)) {
                throw new UserException.PasswordPolicyException(
                    "비밀번호에 이메일과 유사한 내용을 포함할 수 없습니다.");
            }
        }
        
        // 닉네임과 유사성 검사
        if (nickname != null && nickname.length() >= 4) {
            if (lowerPassword.contains(nickname.toLowerCase())) {
                throw new UserException.PasswordPolicyException(
                    "비밀번호에 닉네임과 유사한 내용을 포함할 수 없습니다.");
            }
        }
        
        // 이름과 유사성 검사
        if (fullName != null && fullName.length() >= 4) {
            if (lowerPassword.contains(fullName.toLowerCase().replaceAll("\\s+", ""))) {
                throw new UserException.PasswordPolicyException(
                    "비밀번호에 이름과 유사한 내용을 포함할 수 없습니다.");
            }
        }
    }
    
    /**
     * 비밀번호 암호화
     */
    public String encodePassword(String rawPassword) {
        validatePassword(rawPassword);
        return passwordEncoder.encode(rawPassword);
    }
    
    /**
     * 비밀번호 검증
     */
    public boolean matches(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
    
    /**
     * 비밀번호 강도 점수 계산 (0-100)
     */
    public int calculatePasswordStrength(String password) {
        if (password == null || password.isEmpty()) {
            return 0;
        }
        
        int score = 0;
        
        // 길이 점수 (최대 25점)
        if (password.length() >= 8) score += 10;
        if (password.length() >= 12) score += 10;
        if (password.length() >= 16) score += 5;
        
        // 문자 종류 점수 (각 15점)
        if (password.matches(".*[a-z].*")) score += 15; // 소문자
        if (password.matches(".*[A-Z].*")) score += 15; // 대문자
        if (password.matches(".*\\d.*")) score += 15; // 숫자
        if (password.matches(".*[@$!%*?&].*")) score += 15; // 특수문자
        
        // 복잡성 보너스 (최대 10점)
        if (password.matches(".*[a-z].*[A-Z].*\\d.*[@$!%*?&].*")) {
            score += 10; // 모든 문자 종류 포함
        }
        
        // 약한 패턴 페널티
        if (SEQUENTIAL_PATTERN.matcher(password).find()) {
            score -= 20;
        }
        
        for (String commonPassword : COMMON_PASSWORDS) {
            if (password.toLowerCase().contains(commonPassword)) {
                score -= 30;
                break;
            }
        }
        
        return Math.max(0, Math.min(100, score));
    }
    
    /**
     * 비밀번호 강도 텍스트 반환
     */
    public String getPasswordStrengthText(int score) {
        if (score < 30) return "매우 약함";
        if (score < 50) return "약함";
        if (score < 70) return "보통";
        if (score < 90) return "강함";
        return "매우 강함";
    }
}