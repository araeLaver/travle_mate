package com.travelmate.controller;

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
        Long userId = Long.parseLong(authentication.getName());
        return ResponseEntity.ok(fcmService.registerToken(userId, request));
    }

    @PostMapping("/unregister")
    @Operation(summary = "디바이스 토큰 해제", description = "등록된 디바이스 토큰을 해제합니다.")
    public ResponseEntity<Void> unregisterToken(
            Authentication authentication,
            @Valid @RequestBody PushNotificationDto.UnregisterTokenRequest request) {
        Long userId = Long.parseLong(authentication.getName());
        fcmService.unregisterToken(userId, request.getToken());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/subscribe/{topic}")
    @Operation(summary = "토픽 구독", description = "특정 토픽의 알림을 구독합니다.")
    public ResponseEntity<Void> subscribeToTopic(
            Authentication authentication,
            @PathVariable String topic) {
        Long userId = Long.parseLong(authentication.getName());
        fcmService.subscribeToTopic(userId, topic);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/subscribe/{topic}")
    @Operation(summary = "토픽 구독 해제", description = "특정 토픽의 알림 구독을 해제합니다.")
    public ResponseEntity<Void> unsubscribeFromTopic(
            Authentication authentication,
            @PathVariable String topic) {
        Long userId = Long.parseLong(authentication.getName());
        fcmService.unsubscribeFromTopic(userId, topic);
        return ResponseEntity.ok().build();
    }
}
