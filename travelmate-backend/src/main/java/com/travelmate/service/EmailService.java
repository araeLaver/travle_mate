package com.travelmate.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TokenStorageService tokenStorageService;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    public String sendVerificationEmail(String email, String fullName) {
        String token = UUID.randomUUID().toString();

        tokenStorageService.saveEmailVerificationToken(token, email);
        String verificationLink = frontendUrl + "/verify-email?token=" + token;

        if (mailEnabled && !mailFrom.isEmpty()) {
            sendEmailAsync(email, "TravelMate 이메일 인증", buildVerificationEmailHtml(fullName, verificationLink));
        } else {
            log.info("=================================================");
            log.info("[DEV] 이메일 인증 링크:");
            log.info("수신자: {}", email);
            log.info("링크: {}", verificationLink);
            log.info("=================================================");
        }

        return token;
    }

    public String sendPasswordResetEmail(String email) {
        String token = UUID.randomUUID().toString();

        tokenStorageService.savePasswordResetToken(token, email);
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        if (mailEnabled && !mailFrom.isEmpty()) {
            sendEmailAsync(email, "TravelMate 비밀번호 재설정", buildPasswordResetEmailHtml(resetLink));
        } else {
            log.info("=================================================");
            log.info("[DEV] 비밀번호 재설정 링크:");
            log.info("수신자: {}", email);
            log.info("링크: {}", resetLink);
            log.info("=================================================");
        }

        return token;
    }

    @Async
    public void sendEmailAsync(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailFrom);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("이메일 발송 완료: {}", to);
        } catch (MessagingException e) {
            log.error("이메일 발송 실패: {} - {}", to, e.getMessage());
        }
    }

    public boolean verifyEmail(String token) {
        String email = tokenStorageService.getEmailByVerificationToken(token);

        if (email == null) {
            log.warn("유효하지 않은 인증 토큰: {}", token);
            return false;
        }

        tokenStorageService.deleteEmailVerificationToken(token);
        log.info("이메일 인증 성공: {}", email);
        return true;
    }

    public String getEmailByToken(String token) {
        // 이메일 인증 토큰 먼저 확인
        String email = tokenStorageService.getEmailByVerificationToken(token);
        if (email != null) {
            return email;
        }
        // 비밀번호 재설정 토큰 확인
        return tokenStorageService.getEmailByPasswordResetToken(token);
    }

    public boolean verifyPasswordResetToken(String token) {
        String email = tokenStorageService.getEmailByPasswordResetToken(token);
        return email != null;
    }

    public void invalidatePasswordResetToken(String token) {
        tokenStorageService.deletePasswordResetToken(token);
    }

    private String buildVerificationEmailHtml(String fullName, String verificationLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Apple SD Gothic Neo', sans-serif; background: #f5f5f5; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 40px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #4F46E5; margin: 0; }
                    .content { color: #333; line-height: 1.6; }
                    .button { display: inline-block; background: #4F46E5; color: white; padding: 15px 30px;
                              text-decoration: none; border-radius: 8px; margin: 20px 0; }
                    .footer { margin-top: 30px; color: #888; font-size: 12px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>TravelMate</h1>
                    </div>
                    <div class="content">
                        <p>안녕하세요, %s님!</p>
                        <p>TravelMate에 가입해 주셔서 감사합니다.</p>
                        <p>아래 버튼을 클릭하여 이메일 인증을 완료해 주세요.</p>
                        <p style="text-align: center;">
                            <a href="%s" class="button">이메일 인증하기</a>
                        </p>
                        <p>이 링크는 24시간 동안 유효합니다.</p>
                    </div>
                    <div class="footer">
                        <p>본 메일은 발신 전용입니다.</p>
                        <p>&copy; 2024 TravelMate. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(fullName, verificationLink);
    }

    private String buildPasswordResetEmailHtml(String resetLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Apple SD Gothic Neo', sans-serif; background: #f5f5f5; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 40px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #4F46E5; margin: 0; }
                    .content { color: #333; line-height: 1.6; }
                    .button { display: inline-block; background: #EF4444; color: white; padding: 15px 30px;
                              text-decoration: none; border-radius: 8px; margin: 20px 0; }
                    .footer { margin-top: 30px; color: #888; font-size: 12px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>TravelMate</h1>
                    </div>
                    <div class="content">
                        <p>비밀번호 재설정 요청을 받았습니다.</p>
                        <p>아래 버튼을 클릭하여 새 비밀번호를 설정해 주세요.</p>
                        <p style="text-align: center;">
                            <a href="%s" class="button">비밀번호 재설정</a>
                        </p>
                        <p>이 링크는 1시간 동안 유효합니다.</p>
                        <p style="color: #888;">본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
                    </div>
                    <div class="footer">
                        <p>본 메일은 발신 전용입니다.</p>
                        <p>&copy; 2024 TravelMate. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(resetLink);
    }
}
