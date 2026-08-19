package com.travelmate.controller;

import com.travelmate.security.AuthenticatedUserId;
import com.travelmate.dto.PushNotificationDto;
import com.travelmate.service.FcmService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Push Notification Controller
 */
@RestController
@RequestMapping("/push")
@RequiredArgsConstructor
@Tag(name = "Push Notifications", description = "푸시 알림 관리 API")
public class PushNotificationController {

    private final FcmService fcmService;

    @PostMapping("/register")
    @Operation(summary = "디바이스 토큰 등록", description = "푸시 알림을 받기 위한 디바이스 토큰을 등록합니다.")
    public ResponseEntity<PushNotificationDto.TokenResponse> registerToken(
            Authentication authentication,
            @Valid @RequestBody PushNotificationDto.RegisterTokenRequest request) {
        Long userId = AuthenticatedUserId.parse(authentication);
        return ResponseEntity.ok(fcmService.registerToken(userId, request));
    }

    @PostMapping("/unregister")
    @Operation(summary = "디바이스 토큰 해제", description = "등록된 디바이스 토큰을 해제합니다.")
    public ResponseEntity<Void> unregisterToken(
            Authentication authentication,
            @Valid @RequestBody PushNotificationDto.UnregisterTokenRequest request) {
        Long userId = AuthenticatedUserId.parse(authentication);
        fcmService.unregisterToken(userId, request.getToken());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/preferences")
    @Operation(summary = "알림 설정 조회", description = "사용자의 알림 설정을 조회합니다.")
    public ResponseEntity<PushNotificationDto.NotificationPreferences> getPreferences(
            Authentication authentication) {
        Long userId = AuthenticatedUserId.parse(authentication);
        return ResponseEntity.ok(fcmService.getPreferences(userId));
    }

    @PutMapping("/preferences")
    @Operation(summary = "알림 설정 수정", description = "사용자의 알림 설정을 수정합니다.")
    public ResponseEntity<PushNotificationDto.NotificationPreferences> updatePreferences(
            Authentication authentication,
            @RequestBody PushNotificationDto.UpdateNotificationPreferencesRequest request) {
        Long userId = AuthenticatedUserId.parse(authentication);
        return ResponseEntity.ok(fcmService.updatePreferences(userId, request));
    }

    @PostMapping("/subscribe/{topic}")
    @Operation(summary = "토픽 구독", description = "특정 토픽의 알림을 구독합니다.")
    public ResponseEntity<Void> subscribeToTopic(
            Authentication authentication,
            @PathVariable String topic) {
        Long userId = AuthenticatedUserId.parse(authentication);
        fcmService.subscribeToTopic(userId, topic);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/subscribe/{topic}")
    @Operation(summary = "토픽 구독 해제", description = "특정 토픽의 알림 구독을 해제합니다.")
    public ResponseEntity<Void> unsubscribeFromTopic(
            Authentication authentication,
            @PathVariable String topic) {
        Long userId = AuthenticatedUserId.parse(authentication);
        fcmService.unsubscribeFromTopic(userId, topic);
        return ResponseEntity.ok().build();
    }
}
