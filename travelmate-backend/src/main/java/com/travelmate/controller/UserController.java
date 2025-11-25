package com.travelmate.controller;

import com.travelmate.dto.UserDto;
import com.travelmate.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    
    @PostMapping("/register")
    public ResponseEntity<UserDto.Response> register(@Valid @RequestBody UserDto.RegisterRequest request) {
        UserDto.Response response = userService.registerUser(request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/login")
    public ResponseEntity<UserDto.LoginResponse> login(@Valid @RequestBody UserDto.LoginRequest request) {
        UserDto.LoginResponse response = userService.loginUser(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmailDuplicate(@RequestParam String email) {
        boolean exists = userService.existsByEmail(email);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @GetMapping("/check-nickname")
    public ResponseEntity<Map<String, Boolean>> checkNicknameDuplicate(@RequestParam String nickname) {
        boolean exists = userService.existsByNickname(nickname);
        return ResponseEntity.ok(Map.of("exists", exists));
    }
    
    @GetMapping("/profile/{id}")
    public ResponseEntity<UserDto.Response> getProfile(@PathVariable Long id) {
        UserDto.Response response = userService.getUserProfile(id);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/location")
    public ResponseEntity<Void> updateLocation(@Valid @RequestBody UserDto.LocationUpdateRequest request) {
        userService.updateUserLocation(request);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/nearby")
    public ResponseEntity<List<UserDto.Response>> getNearbyUsers(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "5.0") Double radiusKm) {
        List<UserDto.Response> nearbyUsers = userService.getNearbyUsers(latitude, longitude, radiusKm);
        return ResponseEntity.ok(nearbyUsers);
    }
    
    @PostMapping("/shake")
    public ResponseEntity<List<UserDto.Response>> findUsersOnShake(
            @Valid @RequestBody UserDto.ShakeRequest request) {
        List<UserDto.Response> users = userService.findUsersOnShake(request);
        return ResponseEntity.ok(users);
    }
    
    @PutMapping("/profile")
    public ResponseEntity<UserDto.Response> updateProfile(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody UserDto.UpdateProfileRequest request) {
        Long userIdLong = Long.parseLong(userId);
        UserDto.Response response = userService.updateUserProfile(userIdLong, request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/me")
    public ResponseEntity<UserDto.Response> getMyProfile(
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        UserDto.Response response = userService.getUserProfile(userIdLong);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/fcm-token")
    public ResponseEntity<Void> updateFcmToken(
            @AuthenticationPrincipal String userId,
            @RequestBody Map<String, String> request) {
        Long userIdLong = Long.parseLong(userId);
        String fcmToken = request.get("fcmToken");
        userService.updateFcmToken(userIdLong, fcmToken);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount(
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        userService.deleteUser(userIdLong);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/report")
    public ResponseEntity<Void> reportUser(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody UserDto.ReportRequest request) {
        Long reporterId = Long.parseLong(userId);
        userService.reportUser(reporterId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
    
    @GetMapping("/reviews/{userId}")
    public ResponseEntity<List<UserDto.ReviewResponse>> getUserReviews(@PathVariable Long userId) {
        List<UserDto.ReviewResponse> reviews = userService.getUserReviews(userId);
        return ResponseEntity.ok(reviews);
    }
    
    @PostMapping("/reviews")
    public ResponseEntity<UserDto.ReviewResponse> writeReview(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody UserDto.WriteReviewRequest request) {
        Long reviewerId = Long.parseLong(userId);
        UserDto.ReviewResponse response = userService.writeReview(reviewerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Map<String, Object>> verifyEmail(@RequestParam String token) {
        boolean verified = userService.verifyEmail(token);
        if (verified) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "이메일 인증이 완료되었습니다."
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "유효하지 않거나 만료된 토큰입니다."
            ));
        }
    }

    @PostMapping("/request-password-reset")
    public ResponseEntity<Map<String, String>> requestPasswordReset(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        userService.requestPasswordReset(email);
        return ResponseEntity.ok(Map.of(
            "message", "비밀번호 재설정 링크가 이메일로 전송되었습니다."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        userService.resetPassword(token, newPassword);
        return ResponseEntity.ok(Map.of(
            "message", "비밀번호가 성공적으로 변경되었습니다."
        ));
    }
}