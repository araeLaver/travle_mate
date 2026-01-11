package com.travelmate.service;

import com.travelmate.dto.AuthDto;
import com.travelmate.dto.UserDto;
import com.travelmate.entity.RefreshToken;
import com.travelmate.entity.User;
import com.travelmate.exception.UserException;
import com.travelmate.repository.RefreshTokenRepository;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.jwt.expiration}")
    private Long jwtExpiration;

    @Value("${app.jwt.refresh-expiration}")
    private Long refreshExpiration;

    /**
     * 로그인 처리 - Access Token + Refresh Token 발급
     */
    public AuthDto.LoginResponse login(UserDto.LoginRequest request, String deviceId, String deviceName,
                                       String ipAddress, String userAgent) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new UserException("사용자를 찾을 수 없습니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UserException("비밀번호가 일치하지 않습니다.");
        }

        // Access Token 생성
        String accessToken = jwtService.generateToken(user.getId(), user.getEmail());

        // Refresh Token 생성 및 저장
        String refreshToken = createRefreshToken(user, deviceId, deviceName, ipAddress, userAgent);

        log.info("사용자 로그인: {} (deviceId: {})", user.getEmail(), deviceId);

        return AuthDto.LoginResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .expiresIn(jwtExpiration / 1000)  // 초 단위
            .tokenType("Bearer")
            .user(convertToDto(user))
            .build();
    }

    /**
     * 토큰 갱신 - Refresh Token으로 새 Access Token 발급
     */
    public AuthDto.TokenResponse refreshToken(String refreshTokenStr, String deviceId) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenStr)
            .orElseThrow(() -> new UserException("유효하지 않은 refresh token입니다."));

        if (!refreshToken.isValid()) {
            throw new UserException("만료되었거나 취소된 refresh token입니다.");
        }

        User user = refreshToken.getUser();

        // 새 Access Token 생성
        String newAccessToken = jwtService.generateToken(user.getId(), user.getEmail());

        // Refresh Token 마지막 사용 시간 업데이트
        refreshToken.setLastUsedAt(LocalDateTime.now());
        refreshTokenRepository.save(refreshToken);

        log.info("토큰 갱신: userId={}", user.getId());

        return AuthDto.TokenResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(refreshTokenStr)  // 기존 refresh token 유지
            .expiresIn(jwtExpiration / 1000)
            .tokenType("Bearer")
            .build();
    }

    /**
     * 로그아웃 - Refresh Token 무효화
     */
    public void logout(Long userId, String refreshTokenStr, boolean logoutAll) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserException("사용자를 찾을 수 없습니다."));

        if (logoutAll) {
            // 모든 기기에서 로그아웃
            refreshTokenRepository.revokeAllByUser(user);
            log.info("사용자 전체 로그아웃: userId={}", userId);
        } else if (refreshTokenStr != null) {
            // 특정 토큰만 무효화
            refreshTokenRepository.findByToken(refreshTokenStr).ifPresent(token -> {
                token.setIsRevoked(true);
                refreshTokenRepository.save(token);
            });
            log.info("사용자 로그아웃: userId={}", userId);
        }
    }

    /**
     * OAuth 소셜 로그인
     */
    public AuthDto.LoginResponse oauthLogin(AuthDto.OAuthLoginRequest request, String ipAddress, String userAgent) {
        // OAuth 제공자로부터 사용자 정보 가져오기
        AuthDto.OAuthUserInfo userInfo = getOAuthUserInfo(request.getProvider(), request.getAccessToken());

        // 기존 사용자 확인 또는 새 사용자 생성
        User user = userRepository.findByEmail(userInfo.getEmail())
            .orElseGet(() -> createOAuthUser(userInfo));

        // Access Token 생성
        String accessToken = jwtService.generateToken(user.getId(), user.getEmail());

        // Refresh Token 생성 및 저장
        String refreshToken = createRefreshToken(user, request.getDeviceId(),
            request.getDeviceName(), ipAddress, userAgent);

        log.info("OAuth 로그인: {} (provider: {})", user.getEmail(), request.getProvider());

        return AuthDto.LoginResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .expiresIn(jwtExpiration / 1000)
            .tokenType("Bearer")
            .user(convertToDto(user))
            .build();
    }

    /**
     * OAuth 제공자로부터 사용자 정보 가져오기
     */
    private AuthDto.OAuthUserInfo getOAuthUserInfo(String provider, String accessToken) {
        return switch (provider.toLowerCase()) {
            case "google" -> getGoogleUserInfo(accessToken);
            case "kakao" -> getKakaoUserInfo(accessToken);
            case "naver" -> getNaverUserInfo(accessToken);
            default -> throw new UserException("지원하지 않는 OAuth 제공자입니다: " + provider);
        };
    }

    private AuthDto.OAuthUserInfo getGoogleUserInfo(String accessToken) {
        // 1. 먼저 토큰 유효성 검증 (tokeninfo 엔드포인트)
        verifyGoogleToken(accessToken);

        // 2. 토큰이 유효하면 사용자 정보 조회
        String url = "https://www.googleapis.com/oauth2/v2/userinfo";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> body = response.getBody();
            if (body == null) throw new UserException("Google 응답이 비어있습니다.");
            String id = (String) body.get("id");
            String email = (String) body.get("email");
            if (id == null || email == null) throw new UserException("Google 필수 정보가 없습니다.");

            return AuthDto.OAuthUserInfo.builder()
                .provider("google").providerId(id).email(email)
                .name((String) body.get("name")).profileImageUrl((String) body.get("picture")).build();
        } catch (UserException e) { throw e;
        } catch (Exception e) {
            log.error("Google OAuth 실패", e);
            throw new UserException("Google 인증에 실패했습니다.");
        }
    }

    /**
     * Google 토큰 유효성 검증
     * tokeninfo 엔드포인트를 통해 토큰의 유효성, 만료 시간, 발급자를 검증
     */
    @SuppressWarnings("unchecked")
    private void verifyGoogleToken(String accessToken) {
        String tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo?access_token=" + accessToken;

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(tokenInfoUrl, Map.class);
            Map<String, Object> tokenInfo = response.getBody();

            if (tokenInfo == null) {
                throw new UserException("Google 토큰 검증 실패: 응답이 비어있습니다.");
            }

            // 에러 응답 확인
            if (tokenInfo.containsKey("error")) {
                String error = (String) tokenInfo.get("error");
                String errorDescription = (String) tokenInfo.get("error_description");
                log.warn("Google 토큰 검증 실패: {} - {}", error, errorDescription);
                throw new UserException("Google 토큰이 유효하지 않습니다: " + error);
            }

            // 토큰 만료 시간 확인
            Object expiresInObj = tokenInfo.get("expires_in");
            if (expiresInObj != null) {
                int expiresIn;
                if (expiresInObj instanceof String) {
                    expiresIn = Integer.parseInt((String) expiresInObj);
                } else if (expiresInObj instanceof Number) {
                    expiresIn = ((Number) expiresInObj).intValue();
                } else {
                    throw new UserException("Google 토큰 만료 시간 형식 오류");
                }

                if (expiresIn <= 0) {
                    throw new UserException("Google 토큰이 만료되었습니다.");
                }
            }

            log.debug("Google 토큰 검증 성공: email={}", tokenInfo.get("email"));

        } catch (UserException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google 토큰 검증 중 오류", e);
            throw new UserException("Google 토큰 검증에 실패했습니다.");
        }
    }

    @SuppressWarnings("unchecked")
    private AuthDto.OAuthUserInfo getKakaoUserInfo(String accessToken) {
        // 1. 토큰 유효성 검증
        verifyKakaoToken(accessToken);

        // 2. 사용자 정보 조회
        String url = "https://kapi.kakao.com/v2/user/me";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> body = response.getBody();
            if (body == null) throw new UserException("카카오 응답이 비어있습니다.");
            Map<String, Object> account = (Map<String, Object>) body.get("kakao_account");
            if (account == null) throw new UserException("카카오 계정 정보가 없습니다.");
            String email = (String) account.get("email");
            if (email == null) throw new UserException("카카오 이메일이 없습니다.");
            Map<String, Object> profile = (Map<String, Object>) account.get("profile");

            return AuthDto.OAuthUserInfo.builder()
                .provider("kakao").providerId(String.valueOf(body.get("id"))).email(email)
                .name(profile != null ? (String) profile.get("nickname") : null)
                .profileImageUrl(profile != null ? (String) profile.get("profile_image_url") : null).build();
        } catch (UserException e) { throw e;
        } catch (Exception e) {
            log.error("Kakao OAuth 실패", e);
            throw new UserException("카카오 인증에 실패했습니다.");
        }
    }

    /**
     * 카카오 토큰 유효성 검증
     */
    @SuppressWarnings("unchecked")
    private void verifyKakaoToken(String accessToken) {
        String tokenInfoUrl = "https://kapi.kakao.com/v1/user/access_token_info";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(tokenInfoUrl, HttpMethod.GET, entity, Map.class);
            Map<String, Object> tokenInfo = response.getBody();

            if (tokenInfo == null) {
                throw new UserException("카카오 토큰 검증 실패: 응답이 비어있습니다.");
            }

            // 토큰 만료 시간 확인 (expires_in은 초 단위)
            Object expiresInObj = tokenInfo.get("expires_in");
            if (expiresInObj != null) {
                int expiresIn = ((Number) expiresInObj).intValue();
                if (expiresIn <= 0) {
                    throw new UserException("카카오 토큰이 만료되었습니다.");
                }
            }

            log.debug("카카오 토큰 검증 성공: id={}", tokenInfo.get("id"));

        } catch (UserException e) {
            throw e;
        } catch (Exception e) {
            log.error("카카오 토큰 검증 중 오류", e);
            throw new UserException("카카오 토큰 검증에 실패했습니다.");
        }
    }

    @SuppressWarnings("unchecked")
    private AuthDto.OAuthUserInfo getNaverUserInfo(String accessToken) {
        // 1. 토큰 유효성 검증 (네이버는 별도 검증 엔드포인트가 없으므로 사용자 정보 조회로 검증)
        // 사용자 정보 조회 실패 시 토큰이 유효하지 않은 것으로 간주

        // 2. 사용자 정보 조회
        String url = "https://openapi.naver.com/v1/nid/me";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> body = response.getBody();
            if (body == null) throw new UserException("네이버 응답이 비어있습니다.");

            // 응답 코드 확인 (네이버 API는 resultcode를 반환)
            String resultCode = (String) body.get("resultcode");
            if (!"00".equals(resultCode)) {
                String message = (String) body.get("message");
                log.warn("네이버 토큰 검증 실패: resultcode={}, message={}", resultCode, message);
                throw new UserException("네이버 토큰이 유효하지 않습니다: " + message);
            }

            Map<String, Object> data = (Map<String, Object>) body.get("response");
            if (data == null) throw new UserException("네이버 사용자 정보가 없습니다.");
            String id = (String) data.get("id");
            String email = (String) data.get("email");
            if (id == null || email == null) throw new UserException("네이버 필수 정보가 없습니다.");

            log.debug("네이버 토큰 검증 및 사용자 정보 조회 성공: id={}", id);

            return AuthDto.OAuthUserInfo.builder()
                .provider("naver").providerId(id).email(email)
                .name((String) data.get("name")).profileImageUrl((String) data.get("profile_image")).build();
        } catch (UserException e) { throw e;
        } catch (Exception e) {
            log.error("Naver OAuth 실패", e);
            throw new UserException("네이버 인증에 실패했습니다.");
        }
    }

    /**
     * OAuth 사용자 생성
     */
    private User createOAuthUser(AuthDto.OAuthUserInfo userInfo) {
        User user = new User();
        user.setEmail(userInfo.getEmail());
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));  // 임의의 비밀번호
        user.setNickname(generateUniqueNickname(userInfo.getName()));
        user.setFullName(userInfo.getName());
        user.setProfileImageUrl(userInfo.getProfileImageUrl());
        user.setIsActive(true);
        user.setIsEmailVerified(true);  // OAuth 사용자는 이메일 인증 완료로 처리
        user.setIsLocationEnabled(false);
        user.setIsMatchingEnabled(false);

        User savedUser = userRepository.save(user);
        log.info("새로운 OAuth 사용자 생성: {} (provider: {})", savedUser.getEmail(), userInfo.getProvider());

        return savedUser;
    }

    /**
     * 유니크한 닉네임 생성
     */
    private String generateUniqueNickname(String baseName) {
        String nickname = baseName != null ? baseName : "여행자";

        // 특수문자 제거 및 길이 제한
        nickname = nickname.replaceAll("[^가-힣a-zA-Z0-9_]", "");
        if (nickname.length() > 15) {
            nickname = nickname.substring(0, 15);
        }
        if (nickname.isEmpty()) {
            nickname = "여행자";
        }

        // 중복 체크
        String originalNickname = nickname;
        int suffix = 1;
        while (userRepository.existsByNickname(nickname)) {
            nickname = originalNickname + suffix++;
        }

        return nickname;
    }

    /**
     * Refresh Token 생성 및 저장
     */
    private String createRefreshToken(User user, String deviceId, String deviceName,
                                      String ipAddress, String userAgent) {
        // 같은 기기의 이전 토큰 무효화
        if (deviceId != null) {
            refreshTokenRepository.revokeAllByUserAndDevice(user, deviceId);
        }

        String token = UUID.randomUUID().toString();

        RefreshToken refreshToken = RefreshToken.builder()
            .token(token)
            .user(user)
            .deviceId(deviceId)
            .deviceName(deviceName)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .expiresAt(LocalDateTime.now().plusSeconds(refreshExpiration / 1000))
            .isRevoked(false)
            .build();

        refreshTokenRepository.save(refreshToken);
        return token;
    }

    private UserDto.Response convertToDto(User user) {
        return UserDto.Response.builder()
            .id(user.getId())
            .email(user.getEmail())
            .nickname(user.getNickname())
            .fullName(user.getFullName())
            .age(user.getAge())
            .gender(user.getGender())
            .profileImageUrl(user.getProfileImageUrl())
            .bio(user.getBio())
            .currentLatitude(user.getCurrentLatitude())
            .currentLongitude(user.getCurrentLongitude())
            .travelStyle(user.getTravelStyle())
            .interests(user.getInterests())
            .languages(user.getLanguages())
            .rating(user.getRating())
            .reviewCount(user.getReviewCount())
            .isEmailVerified(user.getIsEmailVerified())
            .phoneVerified(user.getPhoneVerified())
            .lastActivityAt(user.getLastActivityAt())
            .createdAt(user.getCreatedAt())
            .build();
    }
}
