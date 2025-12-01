package com.travelmate.service;

import com.travelmate.dto.UserDto;
import com.travelmate.entity.User;
import com.travelmate.exception.UserException;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import com.travelmate.entity.UserReview;
import com.travelmate.entity.Report;
import com.travelmate.repository.UserReviewRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserReviewRepository userReviewRepository;
    private final EmailService emailService;
    private final ReportService reportService;
    
    public UserDto.Response registerUser(UserDto.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserException("이미 존재하는 이메일입니다.");
        }
        
        if (userRepository.existsByNickname(request.getNickname())) {
            throw new UserException("이미 존재하는 닉네임입니다.");
        }
        
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNickname(request.getNickname());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setTravelStyle(request.getTravelStyle());
        user.setIsActive(true);
        user.setIsLocationEnabled(false);
        user.setIsMatchingEnabled(false);
        user.setPasswordChangedAt(LocalDateTime.now());
        
        User savedUser = userRepository.save(user);
        log.info("새로운 사용자 등록: {}", savedUser.getEmail());

        // 이메일 인증 발송
        emailService.sendVerificationEmail(savedUser.getEmail(), savedUser.getFullName());

        return convertToDto(savedUser);
    }

    public boolean verifyEmail(String token) {
        String email = emailService.getEmailByToken(token);
        if (email == null) {
            return false;
        }

        boolean verified = emailService.verifyEmail(token);
        if (verified) {
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserException("사용자를 찾을 수 없습니다."));
            user.setIsEmailVerified(true);
            userRepository.save(user);
            log.info("이메일 인증 완료: {}", email);
        }
        return verified;
    }

    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UserException("해당 이메일로 등록된 사용자가 없습니다."));

        emailService.sendPasswordResetEmail(email);
        log.info("비밀번호 재설정 요청: {}", email);
    }

    public void resetPassword(String token, String newPassword) {
        String email = emailService.getEmailByToken(token);
        if (email == null) {
            throw new UserException("유효하지 않은 토큰입니다.");
        }

        boolean verified = emailService.verifyEmail(token);
        if (!verified) {
            throw new UserException("만료되었거나 유효하지 않은 토큰입니다.");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UserException("사용자를 찾을 수 없습니다."));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordChangedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("비밀번호 재설정 완료: {}", email);
    }
    
    public UserDto.LoginResponse loginUser(UserDto.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UserException("비밀번호가 일치하지 않습니다.");
        }
        
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        
        UserDto.LoginResponse response = new UserDto.LoginResponse();
        response.setToken(token);
        response.setUser(convertToDto(user));
        
        log.info("사용자 로그인: {}", user.getEmail());
        return response;
    }
    
    @Transactional(readOnly = true)
    public UserDto.Response getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        return convertToDto(user);
    }
    
    public void updateUserLocation(UserDto.LocationUpdateRequest request) {
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        user.setCurrentLatitude(request.getLatitude());
        user.setCurrentLongitude(request.getLongitude());
        user.setIsLocationEnabled(true);
        
        userRepository.save(user);
        log.debug("사용자 위치 업데이트: {} - ({}, {})", 
            user.getId(), request.getLatitude(), request.getLongitude());
    }
    
    @Transactional(readOnly = true)
    public List<UserDto.Response> getNearbyUsers(Double latitude, Double longitude, Double radiusKm) {
        Long currentUserId = getCurrentUserId(); // JWT에서 추출
        
        List<User> nearbyUsers = userRepository.findNearbyUsers(
            currentUserId, latitude, longitude, radiusKm);
        
        return nearbyUsers.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<UserDto.Response> findUsersOnShake(UserDto.ShakeRequest request) {
        // 가속도계 값으로 흔들기 강도 계산
        double shakeIntensity = Math.sqrt(
            Math.pow(request.getAccelerationX(), 2) +
            Math.pow(request.getAccelerationY(), 2) +
            Math.pow(request.getAccelerationZ(), 2)
        );
        
        // 흔들기 강도가 임계값 이상일 때만 검색
        if (shakeIntensity < 15.0) {
            return List.of();
        }
        
        // 흔들기 강도에 따라 검색 반경 조정 (1km ~ 5km)
        double searchRadius = Math.min(5.0, Math.max(1.0, shakeIntensity / 10));
        
        List<User> users = userRepository.findUsersForShake(
            request.getLatitude(), request.getLongitude(), searchRadius);
        
        log.info("폰 흔들기로 {} 반경 {}km 내 {}명의 사용자 발견", 
            request.getUserId(), searchRadius, users.size());
        
        return users.stream()
            .limit(10) // 최대 10명까지만 반환
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional(readOnly = true)
    public boolean existsByNickname(String nickname) {
        return userRepository.existsByNickname(nickname);
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
    
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getName() != null) {
            try {
                return Long.parseLong(authentication.getName());
            } catch (NumberFormatException e) {
                log.warn("Invalid user ID format: {}", authentication.getName());
            }
        }
        return null;
    }
    
    public UserDto.Response updateUserProfile(Long userId, UserDto.UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        if (request.getNickname() != null && !request.getNickname().equals(user.getNickname())) {
            if (userRepository.existsByNickname(request.getNickname())) {
                throw new UserException("이미 존재하는 닉네임입니다.");
            }
            user.setNickname(request.getNickname());
        }
        
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        
        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(request.getProfileImageUrl());
        }
        
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        
        if (request.getTravelStyle() != null) {
            user.setTravelStyle(request.getTravelStyle());
        }
        
        User savedUser = userRepository.save(user);
        log.info("사용자 프로필 업데이트: {}", userId);
        
        return convertToDto(savedUser);
    }
    
    public void updateFcmToken(Long userId, String fcmToken) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        user.setFcmToken(fcmToken);
        userRepository.save(user);
        log.info("FCM 토큰 업데이트: User {}", userId);
    }
    
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        user.setIsActive(false);
        userRepository.save(user);
        log.info("사용자 계정 비활성화: {}", userId);
    }
    
    public UserDto.ReportResponse reportUser(Long reporterId, UserDto.ReportRequest request) {
        Report.ReportType reportType;
        try {
            reportType = Report.ReportType.valueOf(request.getReportType().toUpperCase());
        } catch (IllegalArgumentException e) {
            reportType = Report.ReportType.OTHER;
        }

        Report report = reportService.createReport(
            reporterId,
            request.getReportedUserId(),
            reportType,
            request.getReason(),
            request.getDescription()
        );

        return UserDto.ReportResponse.builder()
            .id(report.getId())
            .reporterId(reporterId)
            .reportedUserId(request.getReportedUserId())
            .reportType(report.getReportType().name())
            .reason(report.getReason())
            .status(report.getStatus().name())
            .createdAt(report.getCreatedAt())
            .build();
    }
    
    @Transactional(readOnly = true)
    public List<UserDto.ReviewResponse> getUserReviews(Long userId) {
        List<UserReview> reviews = userReviewRepository.findByRevieweeId(userId);
        
        return reviews.stream()
            .map(this::convertToReviewDto)
            .collect(Collectors.toList());
    }
    
    public UserDto.ReviewResponse writeReview(Long reviewerId, UserDto.WriteReviewRequest request) {
        User reviewer = userRepository.findById(reviewerId)
            .orElseThrow(() -> new RuntimeException("리뷰어를 찾을 수 없습니다."));
        
        User reviewed = userRepository.findById(request.getReviewedUserId())
            .orElseThrow(() -> new RuntimeException("리뷰 대상자를 찾을 수 없습니다."));
        
        // 중복 리뷰 체크
        if (userReviewRepository.existsByReviewerIdAndRevieweeId(reviewerId, request.getReviewedUserId())) {
            throw new UserException("이미 해당 사용자에 대한 리뷰를 작성했습니다.");
        }
        
        UserReview review = new UserReview();
        review.setReviewer(reviewer);
        review.setReviewee(reviewed);
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        
        UserReview savedReview = userReviewRepository.save(review);
        log.info("사용자 리뷰 작성: {} -> {} (평점: {})", reviewerId, request.getReviewedUserId(), request.getRating());
        
        return convertToReviewDto(savedReview);
    }
    
    private UserDto.ReviewResponse convertToReviewDto(UserReview review) {
        UserDto.ReviewResponse dto = new UserDto.ReviewResponse();
        dto.setId(review.getId());
        dto.setReviewerId(review.getReviewer().getId());
        dto.setReviewerNickname(review.getReviewer().getNickname());
        dto.setReviewerProfileImageUrl(review.getReviewer().getProfileImageUrl());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setCreatedAt(review.getCreatedAt());
        return dto;
    }
}