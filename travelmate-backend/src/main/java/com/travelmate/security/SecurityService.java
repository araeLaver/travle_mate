package com.travelmate.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityService {

    // SQL Injection 패턴들
    private static final Pattern[] SQL_INJECTION_PATTERNS = {
        Pattern.compile(".*('|(\\-\\-)|(;)|(\\|)|(\\*)).*", Pattern.CASE_INSENSITIVE),
        Pattern.compile(".*(union|select|insert|delete|update|drop|create|alter|exec|execute).*", Pattern.CASE_INSENSITIVE),
        Pattern.compile(".*script.*", Pattern.CASE_INSENSITIVE)
    };

    // XSS 패턴들
    private static final Pattern[] XSS_PATTERNS = {
        Pattern.compile(".*<.*script.*>.*", Pattern.CASE_INSENSITIVE),
        Pattern.compile(".*javascript:.*", Pattern.CASE_INSENSITIVE),
        Pattern.compile(".*on(load|error|click|mouse).*=.*", Pattern.CASE_INSENSITIVE)
    };

    /**
     * 사용자가 특정 사용자 ID에 대한 접근 권한을 가지고 있는지 확인
     */
    public boolean hasUserAccess(Authentication authentication, Long userId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        try {
            Long currentUserId = Long.parseLong(authentication.getName());
            
            // 자신의 정보에만 접근 가능
            boolean hasAccess = currentUserId.equals(userId);
            
            if (!hasAccess) {
                log.warn("Unauthorized access attempt: User {} trying to access User {}", 
                    currentUserId, userId);
            }
            
            return hasAccess;
            
        } catch (NumberFormatException e) {
            log.error("Invalid user ID format in authentication: {}", authentication.getName());
            return false;
        }
    }

    /**
     * 관리자 권한 확인
     */
    public boolean hasAdminRole(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        return authentication.getAuthorities().stream()
            .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
    }

    /**
     * SQL Injection 공격 탐지
     */
    public boolean containsSqlInjection(String input) {
        if (input == null) {
            return false;
        }

        for (Pattern pattern : SQL_INJECTION_PATTERNS) {
            if (pattern.matcher(input).matches()) {
                log.warn("SQL Injection attempt detected: {}", sanitizeForLogging(input));
                return true;
            }
        }
        return false;
    }

    /**
     * XSS 공격 탐지
     */
    public boolean containsXss(String input) {
        if (input == null) {
            return false;
        }

        for (Pattern pattern : XSS_PATTERNS) {
            if (pattern.matcher(input).matches()) {
                log.warn("XSS attempt detected: {}", sanitizeForLogging(input));
                return true;
            }
        }
        return false;
    }

    /**
     * 입력값 검증 및 정제
     */
    public String sanitizeInput(String input) {
        if (input == null) {
            return null;
        }

        // HTML 태그 제거
        String sanitized = input.replaceAll("<[^>]*>", "");
        
        // SQL 특수 문자 이스케이프
        sanitized = sanitized.replace("'", "''");
        sanitized = sanitized.replace(";", "");
        sanitized = sanitized.replace("--", "");
        
        // 스크립트 관련 키워드 제거
        sanitized = sanitized.replaceAll("(?i)javascript:", "");
        sanitized = sanitized.replaceAll("(?i)script", "");
        
        return sanitized;
    }

    /**
     * 파일 업로드 보안 검증
     */
    public boolean isValidFileType(String fileName, String contentType) {
        if (fileName == null || contentType == null) {
            return false;
        }

        // 허용된 이미지 타입만 업로드 가능
        String[] allowedTypes = {
            "image/jpeg", "image/png", "image/gif", "image/webp"
        };

        String[] allowedExtensions = {
            ".jpg", ".jpeg", ".png", ".gif", ".webp"
        };

        boolean validContentType = false;
        for (String type : allowedTypes) {
            if (type.equals(contentType.toLowerCase())) {
                validContentType = true;
                break;
            }
        }

        boolean validExtension = false;
        String lowerFileName = fileName.toLowerCase();
        for (String ext : allowedExtensions) {
            if (lowerFileName.endsWith(ext)) {
                validExtension = true;
                break;
            }
        }

        if (!validContentType || !validExtension) {
            log.warn("Invalid file upload attempt: fileName={}, contentType={}", 
                fileName, contentType);
        }

        return validContentType && validExtension;
    }

    /**
     * 파일명 보안 검증
     */
    public boolean isValidFileName(String fileName) {
        if (fileName == null || fileName.trim().isEmpty()) {
            return false;
        }

        // 디렉토리 트래버설 공격 방지
        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            log.warn("Directory traversal attempt in filename: {}", sanitizeForLogging(fileName));
            return false;
        }

        // 특수 문자 제한
        if (fileName.matches(".*[<>:\"|?*].*")) {
            log.warn("Invalid characters in filename: {}", sanitizeForLogging(fileName));
            return false;
        }

        return true;
    }

    /**
     * 비밀번호 강도 검증
     */
    public boolean isStrongPassword(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }

        // 최소 8자, 대문자, 소문자, 숫자, 특수문자 포함
        boolean hasUpper = password.matches(".*[A-Z].*");
        boolean hasLower = password.matches(".*[a-z].*");
        boolean hasDigit = password.matches(".*\\d.*");
        boolean hasSpecial = password.matches(".*[!@#$%^&*(),.?\":{}|<>].*");

        return hasUpper && hasLower && hasDigit && hasSpecial;
    }

    /**
     * 이메일 형식 검증
     */
    public boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        Pattern emailPattern = Pattern.compile(
            "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        );
        
        return emailPattern.matcher(email).matches();
    }

    /**
     * IP 주소 검증 및 블랙리스트 체크
     */
    public boolean isBlockedIP(String ipAddress) {
        // 실제 구현에서는 데이터베이스나 Redis에서 블랙리스트를 확인
        // 여기서는 예시로 로컬 IP 대역을 체크
        
        if (ipAddress == null) {
            return true;
        }

        // 알려진 악성 IP 대역 (예시)
        String[] blockedRanges = {
            "192.168.1.100", // 예시 차단 IP
            "10.0.0.1"       // 예시 차단 IP
        };

        for (String blocked : blockedRanges) {
            if (blocked.equals(ipAddress)) {
                log.warn("Blocked IP access attempt: {}", ipAddress);
                return true;
            }
        }

        return false;
    }

    /**
     * 사용자 세션 검증
     */
    public boolean isValidUserSession(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        // JWT 토큰의 유효성과 만료 시간 체크는 JwtAuthenticationFilter에서 처리
        // 여기서는 추가적인 세션 검증 로직 구현
        
        try {
            Long userId = Long.parseLong(authentication.getName());
            
            // 사용자가 활성 상태인지 확인
            // 실제 구현에서는 UserService를 통해 사용자 상태 확인
            
            return true;
            
        } catch (NumberFormatException e) {
            log.error("Invalid user session format: {}", authentication.getName());
            return false;
        }
    }

    /**
     * 로깅용 문자열 정제 (민감 정보 제거)
     */
    private String sanitizeForLogging(String input) {
        if (input == null) {
            return "null";
        }
        
        // 너무 긴 문자열은 자름
        if (input.length() > 100) {
            input = input.substring(0, 100) + "...";
        }
        
        // 개행 문자 제거 (로그 인젝션 방지)
        input = input.replace("\n", "\\n").replace("\r", "\\r");
        
        return input;
    }

    /**
     * 지리적 위치 검증 (위도, 경도)
     */
    public boolean isValidLocation(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return false;
        }

        // 위도: -90 ~ 90, 경도: -180 ~ 180
        boolean validLatitude = latitude >= -90.0 && latitude <= 90.0;
        boolean validLongitude = longitude >= -180.0 && longitude <= 180.0;

        if (!validLatitude || !validLongitude) {
            log.warn("Invalid location coordinates: lat={}, lng={}", latitude, longitude);
        }

        return validLatitude && validLongitude;
    }
}