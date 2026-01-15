package com.travelmate.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.util.Arrays;

/**
 * 보안 관련 환경변수 검증 설정
 * 애플리케이션 시작 시 필수 보안 설정을 검증합니다.
 */
@Configuration
public class SecurityValidationConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityValidationConfig.class);
    private static final int MIN_JWT_SECRET_LENGTH = 32;
    private static final int MIN_DB_PASSWORD_LENGTH = 8;

    private final Environment environment;

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Value("${spring.redis.password:}")
    private String redisPassword;

    public SecurityValidationConfig(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validateSecurityConfiguration() {
        String[] activeProfiles = environment.getActiveProfiles();
        boolean isProduction = Arrays.asList(activeProfiles).contains("prod");
        boolean isTest = Arrays.asList(activeProfiles).contains("test");

        // 테스트 환경에서는 검증 스킵
        if (isTest) {
            log.info("테스트 환경 - 보안 검증 스킵");
            return;
        }

        log.info("보안 설정 검증 시작 (Profile: {})", String.join(", ", activeProfiles));

        // JWT Secret 검증
        validateJwtSecret(isProduction);

        // 데이터베이스 비밀번호 검증
        validateDbPassword(isProduction);

        // Redis 비밀번호 검증 (프로덕션에서만)
        if (isProduction) {
            validateRedisPassword();
        }

        log.info("보안 설정 검증 완료");
    }

    private void validateJwtSecret(boolean isProduction) {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            String message = "JWT_SECRET 환경변수가 설정되지 않았습니다. " +
                    "다음 명령어로 생성하세요: openssl rand -base64 32";
            if (isProduction) {
                throw new SecurityConfigurationException(message);
            } else {
                log.warn("[보안 경고] {}", message);
            }
        } else if (jwtSecret.length() < MIN_JWT_SECRET_LENGTH) {
            String message = String.format(
                    "JWT_SECRET이 너무 짧습니다 (현재: %d자, 최소: %d자). " +
                            "다음 명령어로 생성하세요: openssl rand -base64 32",
                    jwtSecret.length(), MIN_JWT_SECRET_LENGTH);
            if (isProduction) {
                throw new SecurityConfigurationException(message);
            } else {
                log.warn("[보안 경고] {}", message);
            }
        } else {
            log.info("JWT_SECRET 검증 완료 (길이: {}자)", jwtSecret.length());
        }
    }

    private void validateDbPassword(boolean isProduction) {
        if (dbPassword == null || dbPassword.trim().isEmpty()) {
            String message = "DB_PASSWORD 환경변수가 설정되지 않았습니다.";
            if (isProduction) {
                throw new SecurityConfigurationException(message);
            } else {
                log.warn("[보안 경고] {}", message);
            }
        } else if (dbPassword.length() < MIN_DB_PASSWORD_LENGTH) {
            String message = String.format(
                    "DB_PASSWORD가 너무 짧습니다 (현재: %d자, 최소: %d자)",
                    dbPassword.length(), MIN_DB_PASSWORD_LENGTH);
            if (isProduction) {
                throw new SecurityConfigurationException(message);
            } else {
                log.warn("[보안 경고] {}", message);
            }
        } else {
            log.info("DB_PASSWORD 검증 완료");
        }
    }

    private void validateRedisPassword() {
        if (redisPassword == null || redisPassword.trim().isEmpty()) {
            log.warn("[보안 경고] REDIS_PASSWORD가 설정되지 않았습니다. " +
                    "프로덕션 환경에서는 Redis 인증을 활성화하세요.");
        } else {
            log.info("REDIS_PASSWORD 검증 완료");
        }
    }

    /**
     * 보안 설정 오류 예외
     */
    public static class SecurityConfigurationException extends RuntimeException {
        public SecurityConfigurationException(String message) {
            super("[보안 설정 오류] " + message);
        }
    }
}
