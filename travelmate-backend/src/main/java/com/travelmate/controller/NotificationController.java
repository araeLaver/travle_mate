package com.travelmate.controller;

import com.travelmate.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * 알림 목록 조회
     */
    @GetMapping
    public ResponseEntity<Page<NotificationService.NotificationDto>> getNotifications(
            @AuthenticationPrincipal String userId,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<NotificationService.NotificationDto> notifications =
                notificationService.getNotifications(Long.parseLong(userId), pageable);

        return ResponseEntity.ok(notifications);
    }

    /**
     * 읽지 않은 알림 조회
     */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationService.NotificationDto>> getUnreadNotifications(
            @AuthenticationPrincipal String userId) {

        List<NotificationService.NotificationDto> notifications =
                notificationService.getUnreadNotifications(Long.parseLong(userId));

        return ResponseEntity.ok(notifications);
    }

    /**
     * 읽지 않은 알림 개수
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal String userId) {

        long count = notificationService.getUnreadCount(Long.parseLong(userId));
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * 알림 읽음 처리
     */
    @PostMapping("/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal String userId,
            @RequestBody List<Long> notificationIds) {

        notificationService.markAsRead(notificationIds, Long.parseLong(userId));
        return ResponseEntity.ok().build();
    }

    /**
     * 모든 알림 읽음 처리
     */
    @PostMapping("/read/all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal String userId) {

        notificationService.markAllAsRead(Long.parseLong(userId));
        return ResponseEntity.ok().build();
    }

    /**
     * 알림 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id) {

        notificationService.deleteNotification(id, Long.parseLong(userId));
        return ResponseEntity.ok().build();
    }
}
