package com.travelmate.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    // 임시로 메모리에 저장 (실제로는 Redis나 DB 사용 권장)
    private final Map<String, VerificationToken> verificationTokens = new ConcurrentHashMap<>();

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public String sendVerificationEmail(String email, String fullName) {
        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = new VerificationToken(
            email,
            token,
            System.currentTimeMillis() + TimeUnit.HOURS.toMillis(24) // 24시간 유효
        );

        verificationTokens.put(token, verificationToken);

        // 실제로는 이메일 발송 (SMTP, SendGrid, AWS SES 등 사용)
        String verificationLink = frontendUrl + "/verify-email?token=" + token;

        log.info("이메일 인증 링크 생성: {} -> {}", email, verificationLink);
        log.info("=================================================");
        log.info("📧 이메일 인증 링크 (개발 모드):");
        log.info("수신자: {}", email);
        log.info("링크: {}", verificationLink);
        log.info("유효기간: 24시간");
        log.info("=================================================");

        // TODO: 실제 이메일 발송 구현
        // emailSender.send(email, "TravelMate 이메일 인증", emailTemplate);

        return token;
    }

    public boolean verifyEmail(String token) {
        VerificationToken verificationToken = verificationTokens.get(token);

        if (verificationToken == null) {
            log.warn("유효하지 않은 인증 토큰: {}", token);
            return false;
        }

        if (System.currentTimeMillis() > verificationToken.expiryTime) {
            verificationTokens.remove(token);
            log.warn("만료된 인증 토큰: {}", token);
            return false;
        }

        verificationTokens.remove(token);
        log.info("이메일 인증 성공: {}", verificationToken.email);
        return true;
    }

    public String getEmailByToken(String token) {
        VerificationToken verificationToken = verificationTokens.get(token);
        return verificationToken != null ? verificationToken.email : null;
    }

    public String sendPasswordResetEmail(String email) {
        String token = UUID.randomUUID().toString();
        VerificationToken resetToken = new VerificationToken(
            email,
            token,
            System.currentTimeMillis() + TimeUnit.HOURS.toMillis(1) // 1시간 유효
        );

        verificationTokens.put(token, resetToken);

        String resetLink = frontendUrl + "/reset-password?token=" + token;

        log.info("비밀번호 재설정 링크 생성: {} -> {}", email, resetLink);
        log.info("=================================================");
        log.info("🔑 비밀번호 재설정 링크 (개발 모드):");
        log.info("수신자: {}", email);
        log.info("링크: {}", resetLink);
        log.info("유효기간: 1시간");
        log.info("=================================================");

        return token;
    }

    // 이메일 인증 토큰 정보를 담는 내부 클래스
    private static class VerificationToken {
        String email;
        String token;
        long expiryTime;

        VerificationToken(String email, String token, long expiryTime) {
            this.email = email;
            this.token = token;
            this.expiryTime = expiryTime;
        }
    }
}
