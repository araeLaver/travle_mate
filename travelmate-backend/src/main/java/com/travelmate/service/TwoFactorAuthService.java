package com.travelmate.service;

import com.travelmate.entity.TwoFactorAuth;
import com.travelmate.entity.User;
import com.travelmate.exception.UserException;
import com.travelmate.repository.TwoFactorAuthRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class TwoFactorAuthService {
    
    private final TwoFactorAuthRepository twoFactorAuthRepository;
    
    private static final String TOTP_ALGORITHM = "HmacSHA1";
    private static final int TOTP_DIGITS = 6;
    private static final long TOTP_PERIOD = 30L; // 30초
    private static final int BACKUP_CODE_COUNT = 10;
    private static final SecureRandom secureRandom = new SecureRandom();
    
    /**
     * 2FA 설정 초기화
     */
    @Transactional
    public TwoFactorAuth initializeTwoFactorAuth(User user, TwoFactorAuth.TwoFactorMethod method) {
        // 기존 설정이 있다면 삭제
        twoFactorAuthRepository.findByUser(user).ifPresent(existing -> {
            twoFactorAuthRepository.delete(existing);
        });
        
        String secretKey = generateSecretKey();
        List<String> backupCodes = generateBackupCodes();
        
        TwoFactorAuth twoFactorAuth = TwoFactorAuth.builder()
            .user(user)
            .secretKey(secretKey)
            .method(method)
            .backupCodes(String.join(",", backupCodes))
            .isEnabled(false) // 검증 완료 후 활성화
            .build();
        
        TwoFactorAuth saved = twoFactorAuthRepository.save(twoFactorAuth);
        
        log.info("2FA 초기화 완료: userId={}, method={}", user.getId(), method);
        return saved;
    }
    
    /**
     * 2FA 활성화 (검증 완료 후)
     */
    @Transactional
    public boolean enableTwoFactorAuth(User user, String verificationCode) {
        TwoFactorAuth twoFactorAuth = twoFactorAuthRepository.findByUser(user)
            .orElseThrow(() -> new UserException.InvalidTokenException());
        
        if (twoFactorAuth.getIsEnabled()) {
            throw new IllegalStateException("2FA가 이미 활성화되어 있습니다.");
        }
        
        boolean isValid = verifyTotpCode(twoFactorAuth.getSecretKey(), verificationCode);
        
        if (isValid) {
            twoFactorAuth.setIsEnabled(true);
            twoFactorAuth.setVerifiedAt(LocalDateTime.now());
            twoFactorAuthRepository.save(twoFactorAuth);
            
            log.info("2FA 활성화 완료: userId={}", user.getId());
            return true;
        } else {
            throw new UserException.InvalidVerificationCodeException();
        }
    }
    
    /**
     * 2FA 비활성화
     */
    @Transactional
    public void disableTwoFactorAuth(User user, String verificationCode) {
        TwoFactorAuth twoFactorAuth = twoFactorAuthRepository.findByUser(user)
            .orElseThrow(() -> new UserException.InvalidTokenException());
        
        if (!twoFactorAuth.getIsEnabled()) {
            return; // 이미 비활성화됨
        }
        
        boolean isValid = verifyTotpCode(twoFactorAuth.getSecretKey(), verificationCode);
        
        if (isValid) {
            twoFactorAuthRepository.delete(twoFactorAuth);
            log.info("2FA 비활성화 완료: userId={}", user.getId());
        } else {
            throw new UserException.InvalidVerificationCodeException();
        }
    }
    
    /**
     * 2FA 코드 검증
     */
    public boolean verifyTwoFactorCode(User user, String code) {
        TwoFactorAuth twoFactorAuth = twoFactorAuthRepository.findByUser(user)
            .orElse(null);
        
        if (twoFactorAuth == null || !twoFactorAuth.getIsEnabled()) {
            return true; // 2FA가 설정되지 않은 경우 통과
        }
        
        // TOTP 코드 검증
        if (verifyTotpCode(twoFactorAuth.getSecretKey(), code)) {
            twoFactorAuth.setLastUsedAt(LocalDateTime.now());
            twoFactorAuthRepository.save(twoFactorAuth);
            return true;
        }
        
        // 백업 코드 검증
        if (verifyBackupCode(twoFactorAuth, code)) {
            return true;
        }
        
        log.warn("2FA 코드 검증 실패: userId={}", user.getId());
        return false;
    }
    
    /**
     * QR 코드용 URI 생성
     */
    public String generateQrCodeUri(User user, String secretKey, String issuer) {
        String accountName = user.getEmail();
        
        return String.format(
            "otpauth://totp/%s:%s?secret=%s&issuer=%s&digits=%d&period=%d",
            issuer,
            accountName,
            secretKey,
            issuer,
            TOTP_DIGITS,
            TOTP_PERIOD
        );
    }
    
    /**
     * 백업 코드 조회
     */
    public List<String> getBackupCodes(User user) {
        TwoFactorAuth twoFactorAuth = twoFactorAuthRepository.findByUser(user)
            .orElseThrow(() -> new UserException.InvalidTokenException());
        
        if (twoFactorAuth.getBackupCodes() != null) {
            return List.of(twoFactorAuth.getBackupCodes().split(","));
        }
        
        return List.of();
    }
    
    /**
     * 새로운 백업 코드 생성
     */
    @Transactional
    public List<String> regenerateBackupCodes(User user) {
        TwoFactorAuth twoFactorAuth = twoFactorAuthRepository.findByUser(user)
            .orElseThrow(() -> new UserException.InvalidTokenException());
        
        List<String> newBackupCodes = generateBackupCodes();
        twoFactorAuth.setBackupCodes(String.join(",", newBackupCodes));
        twoFactorAuthRepository.save(twoFactorAuth);
        
        log.info("백업 코드 재생성 완료: userId={}", user.getId());
        return newBackupCodes;
    }
    
    /**
     * TOTP 코드 검증
     */
    private boolean verifyTotpCode(String secretKey, String code) {
        if (code == null || code.length() != TOTP_DIGITS) {
            return false;
        }
        
        try {
            long currentTime = System.currentTimeMillis() / 1000L;
            long timeWindow = currentTime / TOTP_PERIOD;
            
            // 현재 시간 윈도우와 이전/다음 윈도우 검증 (시간 동기화 오차 고려)
            for (int i = -1; i <= 1; i++) {
                String expectedCode = generateTotpCode(secretKey, timeWindow + i);
                if (code.equals(expectedCode)) {
                    return true;
                }
            }
            
            return false;
        } catch (Exception e) {
            log.error("TOTP 코드 검증 중 오류 발생", e);
            return false;
        }
    }
    
    /**
     * TOTP 코드 생성
     */
    private String generateTotpCode(String secretKey, long timeWindow) 
            throws NoSuchAlgorithmException, InvalidKeyException {
        
        byte[] decodedKey = Base64.getDecoder().decode(secretKey);
        
        // 시간 윈도우를 8바이트로 변환
        ByteBuffer buffer = ByteBuffer.allocate(8);
        buffer.putLong(timeWindow);
        byte[] timeBytes = buffer.array();
        
        // HMAC-SHA1 해시 계산
        Mac mac = Mac.getInstance(TOTP_ALGORITHM);
        mac.init(new SecretKeySpec(decodedKey, TOTP_ALGORITHM));
        byte[] hash = mac.doFinal(timeBytes);
        
        // Dynamic truncation
        int offset = hash[hash.length - 1] & 0xF;
        int code = ((hash[offset] & 0x7F) << 24) |
                   ((hash[offset + 1] & 0xFF) << 16) |
                   ((hash[offset + 2] & 0xFF) << 8) |
                   (hash[offset + 3] & 0xFF);
        
        code = code % (int) Math.pow(10, TOTP_DIGITS);
        
        return String.format("%0" + TOTP_DIGITS + "d", code);
    }
    
    /**
     * 백업 코드 검증
     */
    private boolean verifyBackupCode(TwoFactorAuth twoFactorAuth, String code) {
        if (twoFactorAuth.getBackupCodes() == null || code == null) {
            return false;
        }
        
        List<String> backupCodes = List.of(twoFactorAuth.getBackupCodes().split(","));
        
        if (backupCodes.contains(code)) {
            // 사용된 백업 코드 제거
            List<String> remainingCodes = backupCodes.stream()
                .filter(backupCode -> !backupCode.equals(code))
                .collect(Collectors.toList());
            
            twoFactorAuth.setBackupCodes(String.join(",", remainingCodes));
            twoFactorAuthRepository.save(twoFactorAuth);
            
            log.info("백업 코드 사용됨: userId={}", twoFactorAuth.getUser().getId());
            return true;
        }
        
        return false;
    }
    
    /**
     * 32바이트 비밀 키 생성
     */
    private String generateSecretKey() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getEncoder().encodeToString(bytes);
    }
    
    /**
     * 백업 코드 생성 (8자리 숫자)
     */
    private List<String> generateBackupCodes() {
        return IntStream.range(0, BACKUP_CODE_COUNT)
            .mapToObj(i -> String.format("%08d", secureRandom.nextInt(100000000)))
            .collect(Collectors.toList());
    }
}