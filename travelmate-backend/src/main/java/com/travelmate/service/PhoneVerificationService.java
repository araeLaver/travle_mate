package com.travelmate.service;

import com.travelmate.entity.User;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class PhoneVerificationService {

    private final UserRepository userRepository;

    @Value("${sms.provider:mock}")
    private String smsProvider;

    @Value("${sms.expiration-minutes:5}")
    private int expirationMinutes;

    @Value("${sms.max-attempts:5}")
    private int maxAttempts;

    private static final SecureRandom RANDOM = new SecureRandom();

    // 인메모리 인증 코드 저장 (프로덕션에서는 Redis 권장)
    private final Map<String, VerificationEntry> verificationStore = new ConcurrentHashMap<>();

    private record VerificationEntry(String code, String phoneNumber, LocalDateTime expiresAt, int attempts) {}

    /**
     * 인증 코드 발송
     */
    @Transactional(readOnly = true)
    public Map<String, String> sendVerificationCode(Long userId, String phoneNumber) {
        // 전화번호 정규화
        String normalized = normalizePhoneNumber(phoneNumber);

        // 발송 쿨다운 체크 (60초)
        String key = "verify:" + userId;
        VerificationEntry existing = verificationStore.get(key);
        if (existing != null && existing.expiresAt().minusMinutes(expirationMinutes - 1).isAfter(LocalDateTime.now())) {
            throw new BusinessException("인증 코드를 이미 발송했습니다. 1분 후 다시 시도해주세요.", HttpStatus.TOO_MANY_REQUESTS);
        }

        // 6자리 인증 코드 생성
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));

        // 저장
        verificationStore.put(key, new VerificationEntry(code, normalized, LocalDateTime.now().plusMinutes(expirationMinutes), 0));

        // SMS 발송
        sendSms(normalized, code);

        log.info("인증 코드 발송: userId={}, phone={}***{}", userId, normalized.substring(0, 3), normalized.substring(normalized.length() - 4));

        return Map.of(
            "message", "인증 코드가 발송되었습니다.",
            "expiresInSeconds", String.valueOf(expirationMinutes * 60)
        );
    }

    /**
     * 인증 코드 검증
     */
    @Transactional
    public Map<String, Object> verifyCode(Long userId, String phoneNumber, String code) {
        String key = "verify:" + userId;
        VerificationEntry entry = verificationStore.get(key);

        if (entry == null) {
            throw new BusinessException("인증 코드가 발송되지 않았습니다. 먼저 인증 코드를 요청해주세요.", HttpStatus.BAD_REQUEST);
        }

        // 만료 확인
        if (entry.expiresAt().isBefore(LocalDateTime.now())) {
            verificationStore.remove(key);
            throw new BusinessException("인증 코드가 만료되었습니다. 다시 요청해주세요.", HttpStatus.BAD_REQUEST);
        }

        // 시도 횟수 확인
        if (entry.attempts() >= maxAttempts) {
            verificationStore.remove(key);
            throw new BusinessException("인증 시도 횟수를 초과했습니다. 새 코드를 요청해주세요.", HttpStatus.TOO_MANY_REQUESTS);
        }

        // 전화번호 일치 확인
        String normalized = normalizePhoneNumber(phoneNumber);
        if (!entry.phoneNumber().equals(normalized)) {
            throw new BusinessException("발송된 전화번호와 일치하지 않습니다.", HttpStatus.BAD_REQUEST);
        }

        // 코드 검증
        if (!entry.code().equals(code.trim())) {
            // 시도 횟수 증가
            verificationStore.put(key, new VerificationEntry(entry.code(), entry.phoneNumber(), entry.expiresAt(), entry.attempts() + 1));
            int remaining = maxAttempts - entry.attempts() - 1;
            throw new BusinessException("인증 코드가 일치하지 않습니다. (남은 시도: " + remaining + "회)", HttpStatus.BAD_REQUEST);
        }

        // 인증 성공 → 사용자 정보 업데이트
        verificationStore.remove(key);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        user.setPhoneNumber(normalized);
        user.setPhoneVerified(true);
        userRepository.save(user);

        log.info("본인 인증 완료: userId={}, phone={}***{}", userId, normalized.substring(0, 3), normalized.substring(normalized.length() - 4));

        return Map.of(
            "verified", true,
            "message", "본인 인증이 완료되었습니다.",
            "phoneNumber", maskPhoneNumber(normalized)
        );
    }

    private void sendSms(String phoneNumber, String code) {
        String message = "[TravelMate] 인증 코드: " + code + " (" + expirationMinutes + "분 이내 입력)";

        switch (smsProvider) {
            case "mock":
                log.info("[Mock SMS] To: {}, Message: {}", phoneNumber, message);
                break;
            default:
                // 실제 프로바이더 연동 시 여기에 구현
                // Twilio, NHN Cloud, Naver SMS, NICE 등
                log.warn("SMS 프로바이더 '{}' 미구현, Mock 발송", smsProvider);
                break;
        }
    }

    private String normalizePhoneNumber(String phone) {
        // 하이픈 제거 + 공백 제거
        String cleaned = phone.replaceAll("[\\s-]", "");
        // +82 → 0 변환
        if (cleaned.startsWith("+82")) {
            cleaned = "0" + cleaned.substring(3);
        }
        // 010 시작 검증
        if (!cleaned.matches("^01[0-9]\\d{7,8}$")) {
            throw new BusinessException("올바른 휴대폰 번호 형식이 아닙니다.", HttpStatus.BAD_REQUEST);
        }
        return cleaned;
    }

    private String maskPhoneNumber(String phone) {
        if (phone.length() < 7) return phone;
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }
}
