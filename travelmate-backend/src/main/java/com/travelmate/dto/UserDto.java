package com.travelmate.dto;

import com.travelmate.entity.User;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.*;
import org.hibernate.validator.constraints.Length;

import java.time.LocalDateTime;

public class UserDto {
    
    @Data
    public static class RegisterRequest {
        @Email(message = "올바른 이메일 형식을 입력해주세요")
        @NotBlank(message = "이메일은 필수 입력 항목입니다")
        @Length(max = 255, message = "이메일은 255자를 초과할 수 없습니다")
        private String email;

        @NotBlank(message = "비밀번호는 필수 입력 항목입니다")
        @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,20}$",
                message = "비밀번호는 8-20자리며, 대소문자, 숫자, 특수문자를 각각 하나 이상 포함해야 합니다")
        private String password;

        @NotBlank(message = "닉네임은 필수 입력 항목입니다")
        @Length(min = 2, max = 20, message = "닉네임은 2-20자 사이여야 합니다")
        @Pattern(regexp = "^[가-힣a-zA-Z0-9_]+$", message = "닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다")
        private String nickname;

        @Pattern(regexp = "^01[0-9]-\\d{4}-\\d{4}$", message = "휴대폰번호는 010-1234-5678 형식으로 입력해주세요")
        private String phoneNumber;

        private User.TravelStyle travelStyle;
    }
    
    @Data
    public static class LoginRequest {
        @Email(message = "올바른 이메일 형식을 입력해주세요")
        @NotBlank(message = "이메일은 필수 입력 항목입니다")
        @Length(max = 255, message = "이메일은 255자를 초과할 수 없습니다")
        private String email;

        @NotBlank(message = "비밀번호는 필수 입력 항목입니다")
        @Length(min = 1, max = 100, message = "비밀번호 길이가 올바르지 않습니다")
        private String password;
    }
    
    @Data
    public static class LoginResponse {
        private String token;
        private Response user;
    }

    @Data
    public static class RegisterResponse {
        private String token;
        private Response user;
        private String message;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String email;
        private String nickname;
        private String fullName;
        private Integer age;
        private User.Gender gender;
        private String profileImageUrl;
        private String bio;
        private Double currentLatitude;
        private Double currentLongitude;
        private User.TravelStyle travelStyle;
        private java.util.List<String> interests;
        private java.util.List<String> languages;
        private Double rating;
        private Integer reviewCount;
        private Boolean isEmailVerified;
        private Boolean phoneVerified;
        private LocalDateTime lastActivityAt;
        private LocalDateTime createdAt;
    }
    
    @Data
    public static class LocationUpdateRequest {
        @NotNull
        private Long userId;
        
        @NotNull
        private Double latitude;
        
        @NotNull
        private Double longitude;
    }
    
    @Data
    public static class ShakeRequest {
        @NotNull
        private Long userId;
        
        @NotNull
        private Double latitude;
        
        @NotNull
        private Double longitude;
        
        @NotNull
        private Double accelerationX;
        
        @NotNull
        private Double accelerationY;
        
        @NotNull
        private Double accelerationZ;
    }
    
    @Data
    public static class UpdateProfileRequest {
        @Length(min = 2, max = 20, message = "닉네임은 2-20자 사이여야 합니다")
        @Pattern(regexp = "^[가-힣a-zA-Z0-9_]+$", message = "닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다")
        private String nickname;

        @Length(max = 500, message = "자기소개는 500자를 초과할 수 없습니다")
        private String bio;

        @Pattern(regexp = "^(https?://).*\\.(jpg|jpeg|png|gif|webp)$", message = "올바른 이미지 URL 형식이 아닙니다")
        private String profileImageUrl;

        @Pattern(regexp = "^01[0-9]-\\d{4}-\\d{4}$", message = "휴대폰번호는 010-1234-5678 형식으로 입력해주세요")
        private String phoneNumber;

        private User.TravelStyle travelStyle;
    }
    
    @Data
    public static class ReportRequest {
        @NotNull(message = "신고 대상 사용자 ID는 필수입니다")
        @Min(value = 1, message = "올바른 사용자 ID를 입력해주세요")
        private Long reportedUserId;

        @NotBlank(message = "신고 유형은 필수 입력 항목입니다")
        private String reportType;

        @NotBlank(message = "신고 사유는 필수 입력 항목입니다")
        @Length(min = 2, max = 500, message = "신고 사유는 2-500자 사이여야 합니다")
        private String reason;

        @Length(max = 2000, message = "신고 내용은 2000자를 초과할 수 없습니다")
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportResponse {
        private Long id;
        private Long reporterId;
        private Long reportedUserId;
        private String reportType;
        private String reason;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime processedAt;
    }
    
    @Data
    public static class ReviewResponse {
        private Long id;
        private Long reviewerId;
        private String reviewerNickname;
        private String reviewerProfileImageUrl;
        private Integer rating;
        private String comment;
        private LocalDateTime createdAt;
    }
    
    @Data
    public static class WriteReviewRequest {
        @NotNull(message = "리뷰 대상 사용자 ID는 필수입니다")
        @Min(value = 1, message = "올바른 사용자 ID를 입력해주세요")
        private Long reviewedUserId;

        @NotNull(message = "평점은 필수 입력 항목입니다")
        @Min(value = 1, message = "평점은 1점 이상이어야 합니다")
        @Max(value = 5, message = "평점은 5점 이하여야 합니다")
        private Integer rating;

        @Length(max = 500, message = "리뷰 내용은 500자를 초과할 수 없습니다")
        private String comment;
    }
}