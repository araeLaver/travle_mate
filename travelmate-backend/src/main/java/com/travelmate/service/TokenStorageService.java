package com.travelmate.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@ConditionalOnProperty(name = "app.redis.enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class TokenStorageService implements TokenStorageServiceInterface {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String EMAIL_VERIFICATION_PREFIX = "email:verification:";
    private static final String PASSWORD_RESET_PREFIX = "password:reset:";
    private static final String REFRESH_TOKEN_PREFIX = "refresh:token:";

    // 이메일 인증 토큰 저장 (24시간 유효)
    public void saveEmailVerificationToken(String token, String email) {
        String key = EMAIL_VERIFICATION_PREFIX + token;
        redisTemplate.opsForValue().set(key, email, 24, TimeUnit.HOURS);
        log.debug("Email verification token saved for: {}", email);
    }

    // 이메일 인증 토큰으로 이메일 조회
    public String getEmailByVerificationToken(String token) {
        String key = EMAIL_VERIFICATION_PREFIX + token;
        Object value = redisTemplate.opsForValue().get(key);
        return value != null ? value.toString() : null;
    }

    // 이메일 인증 토큰 삭제
    public void deleteEmailVerificationToken(String token) {
        String key = EMAIL_VERIFICATION_PREFIX + token;
        redisTemplate.delete(key);
        log.debug("Email verification token deleted");
    }

    // 비밀번호 재설정 토큰 저장 (1시간 유효)
    public void savePasswordResetToken(String token, String email) {
        String key = PASSWORD_RESET_PREFIX + token;
        redisTemplate.opsForValue().set(key, email, 1, TimeUnit.HOURS);
        log.debug("Password reset token saved for: {}", email);
    }

    // 비밀번호 재설정 토큰으로 이메일 조회
    public String getEmailByPasswordResetToken(String token) {
        String key = PASSWORD_RESET_PREFIX + token;
        Object value = redisTemplate.opsForValue().get(key);
        return value != null ? value.toString() : null;
    }

    // 비밀번호 재설정 토큰 삭제
    public void deletePasswordResetToken(String token) {
        String key = PASSWORD_RESET_PREFIX + token;
        redisTemplate.delete(key);
        log.debug("Password reset token deleted");
    }

    // Refresh 토큰 저장 (7일 유효)
    public void saveRefreshToken(String userId, String refreshToken) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        redisTemplate.opsForValue().set(key, refreshToken, 7, TimeUnit.DAYS);
        log.debug("Refresh token saved for user: {}", userId);
    }

    // Refresh 토큰 조회
    public String getRefreshToken(String userId) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        Object value = redisTemplate.opsForValue().get(key);
        return value != null ? value.toString() : null;
    }

    // Refresh 토큰 검증
    public boolean validateRefreshToken(String userId, String refreshToken) {
        String storedToken = getRefreshToken(userId);
        return storedToken != null && storedToken.equals(refreshToken);
    }

    // Refresh 토큰 삭제 (로그아웃 시)
    public void deleteRefreshToken(String userId) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        redisTemplate.delete(key);
        log.debug("Refresh token deleted for user: {}", userId);
    }

    // 토큰 존재 여부 확인
    public boolean tokenExists(String prefix, String token) {
        String key = prefix + token;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
}
