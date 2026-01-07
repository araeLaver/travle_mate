package com.travelmate.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Redis가 비활성화된 환경을 위한 인메모리 토큰 저장 서비스
 * 주의: 서버 재시작 시 모든 토큰이 초기화됨
 */
@Service
@ConditionalOnProperty(name = "app.redis.enabled", havingValue = "false", matchIfMissing = true)
@Slf4j
public class InMemoryTokenStorageService implements TokenStorageServiceInterface {

    private final Map<String, TokenEntry> tokenStore = new ConcurrentHashMap<>();

    private static final String EMAIL_VERIFICATION_PREFIX = "email:verification:";
    private static final String PASSWORD_RESET_PREFIX = "password:reset:";
    private static final String REFRESH_TOKEN_PREFIX = "refresh:token:";

    private record TokenEntry(String value, Instant expiresAt) {
        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    @Override
    public void saveEmailVerificationToken(String token, String email) {
        String key = EMAIL_VERIFICATION_PREFIX + token;
        tokenStore.put(key, new TokenEntry(email, Instant.now().plusSeconds(24 * 60 * 60))); // 24 hours
        log.debug("Email verification token saved (in-memory) for: {}", email);
    }

    @Override
    public String getEmailByVerificationToken(String token) {
        String key = EMAIL_VERIFICATION_PREFIX + token;
        return getValueIfValid(key);
    }

    @Override
    public void deleteEmailVerificationToken(String token) {
        String key = EMAIL_VERIFICATION_PREFIX + token;
        tokenStore.remove(key);
        log.debug("Email verification token deleted (in-memory)");
    }

    @Override
    public void savePasswordResetToken(String token, String email) {
        String key = PASSWORD_RESET_PREFIX + token;
        tokenStore.put(key, new TokenEntry(email, Instant.now().plusSeconds(60 * 60))); // 1 hour
        log.debug("Password reset token saved (in-memory) for: {}", email);
    }

    @Override
    public String getEmailByPasswordResetToken(String token) {
        String key = PASSWORD_RESET_PREFIX + token;
        return getValueIfValid(key);
    }

    @Override
    public void deletePasswordResetToken(String token) {
        String key = PASSWORD_RESET_PREFIX + token;
        tokenStore.remove(key);
        log.debug("Password reset token deleted (in-memory)");
    }

    @Override
    public void saveRefreshToken(String userId, String refreshToken) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        tokenStore.put(key, new TokenEntry(refreshToken, Instant.now().plusSeconds(7 * 24 * 60 * 60))); // 7 days
        log.debug("Refresh token saved (in-memory) for user: {}", userId);
    }

    @Override
    public String getRefreshToken(String userId) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        return getValueIfValid(key);
    }

    @Override
    public boolean validateRefreshToken(String userId, String refreshToken) {
        String storedToken = getRefreshToken(userId);
        return storedToken != null && storedToken.equals(refreshToken);
    }

    @Override
    public void deleteRefreshToken(String userId) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        tokenStore.remove(key);
        log.debug("Refresh token deleted (in-memory) for user: {}", userId);
    }

    @Override
    public boolean tokenExists(String prefix, String token) {
        String key = prefix + token;
        TokenEntry entry = tokenStore.get(key);
        if (entry == null || entry.isExpired()) {
            if (entry != null) tokenStore.remove(key);
            return false;
        }
        return true;
    }

    private String getValueIfValid(String key) {
        TokenEntry entry = tokenStore.get(key);
        if (entry == null || entry.isExpired()) {
            if (entry != null) tokenStore.remove(key);
            return null;
        }
        return entry.value();
    }
}
