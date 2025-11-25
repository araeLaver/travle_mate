package com.travelmate.service;

import com.travelmate.entity.Notification;
import com.travelmate.entity.User;
import com.travelmate.repository.NotificationRepository;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    
    public void sendNotification(Long userId, String message) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("message", message);
        notification.put("timestamp", LocalDateTime.now());
        notification.put("type", "SYSTEM");
        
        // WebSocket으로 실시간 알림 전송
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/topic/notifications",
            notification
        );
        
        log.debug("알림 전송: User {} - {}", userId, message);
        
        sendPushNotification(userId, message);
    }
    
    public void sendGroupNotification(Long groupId, String message) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("message", message);
        notification.put("timestamp", LocalDateTime.now());
        notification.put("type", "GROUP");
        notification.put("groupId", groupId);
        
        // 그룹 채널로 브로드캐스트
        messagingTemplate.convertAndSend(
            "/topic/group/" + groupId,
            notification
        );
        
        log.debug("그룹 알림 전송: Group {} - {}", groupId, message);
    }
    
    public void sendLocationShareNotification(Long userId, Double latitude, Double longitude, String locationName) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "LOCATION_SHARE");
        notification.put("latitude", latitude);
        notification.put("longitude", longitude);
        notification.put("locationName", locationName);
        notification.put("timestamp", LocalDateTime.now());
        
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/topic/location",
            notification
        );
        
        log.debug("위치 공유 알림: User {} - ({}, {})", userId, latitude, longitude);
    }
    
    public void sendMatchingNotification(Long userId, Long matchedUserId, String matchedUserNickname) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "MATCHING");
        notification.put("matchedUserId", matchedUserId);
        notification.put("matchedUserNickname", matchedUserNickname);
        notification.put("message", String.format("%s님과 매칭되었습니다!", matchedUserNickname));
        notification.put("timestamp", LocalDateTime.now());
        
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/topic/matching",
            notification
        );
        
        log.info("매칭 알림: User {} matched with User {}", userId, matchedUserId);
    }
    
    // 푸시 알림 전송 (FCM 연동)
    private void sendPushNotification(Long userId, String message) {
        try {
            // FCM 토큰은 사용자 설정에서 관리
            // 실제 운영 시 FCM SDK 연동 필요
            log.info("푸시 알림 대기: User {} - {}", userId, message);
            
            // FCM 메시지 포맷 준비
            Map<String, String> data = new HashMap<>();
            data.put("title", "TravelMate");
            data.put("body", message);
            data.put("userId", userId.toString());
            
            // FCM 전송 로직은 별도 구현 필요
            // fcmService.sendToUser(userId, data);
            
        } catch (Exception e) {
            log.error("푸시 알림 전송 실패: User {}", userId, e);
        }
    }
    
    public void sendJoinRequestNotification(Long groupId, Long requesterId, String requesterName) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "JOIN_REQUEST");
        notification.put("groupId", groupId);
        notification.put("requesterId", requesterId);
        notification.put("requesterName", requesterName);
        notification.put("message", String.format("%s님이 그룹 가입을 요청했습니다", requesterName));
        notification.put("timestamp", LocalDateTime.now());
        
        messagingTemplate.convertAndSend(
            "/topic/group/" + groupId + "/admin",
            notification
        );
        
        log.info("가입 요청 알림: Group {} - Requester {}", groupId, requesterId);
    }

    // ===== 새로운 영속성 기반 알림 시스템 =====

    /**
     * 알림 생성 및 저장 (DB + WebSocket)
     */
    @Async
    @Transactional
    public void createAndSendNotification(
            Long userId,
            Notification.NotificationType type,
            String title,
            String message,
            String actionUrl,
            Long relatedId,
            String relatedType) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .actionUrl(actionUrl)
                .relatedId(relatedId)
                .relatedType(relatedType)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        log.info("Notification created: {} for user {}", notification.getId(), userId);

        // WebSocket 실시간 전송
        sendWebSocketNotification(userId, notification);

        // FCM 푸시 (사용자가 FCM 토큰이 있으면)
        if (user.getFcmToken() != null && !user.getFcmToken().isEmpty()) {
            sendPushNotificationEnhanced(user.getFcmToken(), title, message, notification);
        }
    }

    private void sendWebSocketNotification(Long userId, Notification notification) {
        try {
            NotificationDto dto = convertToDto(notification);
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    dto
            );
            log.info("WebSocket notification sent to user {}", userId);
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification", e);
        }
    }

    @Async
    public void sendPushNotificationEnhanced(String fcmToken, String title, String body, Notification notification) {
        try {
            log.info("Push notification would be sent to token: {}", fcmToken);
            // FCM 구현은 firebase-admin SDK 추가 후 구현
        } catch (Exception e) {
            log.error("Failed to send push notification", e);
        }
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> getNotifications(Long userId, Pageable pageable) {
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return notifications.map(this::convertToDto);
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getUnreadNotifications(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        return notifications.stream().map(this::convertToDto).toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(List<Long> notificationIds, Long userId) {
        int updated = notificationRepository.markAsRead(notificationIds, userId, LocalDateTime.now());
        log.info("Marked {} notifications as read for user {}", updated, userId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        int updated = notificationRepository.markAllAsRead(userId, LocalDateTime.now());
        log.info("Marked all {} notifications as read for user {}", updated, userId);
    }

    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        notificationRepository.delete(notification);
        log.info("Notification {} deleted by user {}", notificationId, userId);
    }

    @Transactional
    public void cleanupOldNotifications(int daysToKeep) {
        LocalDateTime beforeDate = LocalDateTime.now().minusDays(daysToKeep);
        int deleted = notificationRepository.deleteOldNotifications(beforeDate);
        log.info("Deleted {} old notifications (older than {} days)", deleted, daysToKeep);
    }

    // Helper methods

    /**
     * 간단한 시스템 알림 생성
     */
    public void createNotification(Long userId, String title, String message, String type) {
        try {
            createAndSendNotification(
                userId,
                Notification.NotificationType.SYSTEM,
                title,
                message,
                null,
                null,
                type
            );
        } catch (Exception e) {
            log.error("시스템 알림 생성 실패: userId={}, title={}", userId, title, e);
        }
    }

    public void notifyGroupInvite(Long userId, Long groupId, String groupName, String inviterName) {
        createAndSendNotification(
                userId,
                Notification.NotificationType.GROUP_INVITE,
                "그룹 초대",
                inviterName + "님이 '" + groupName + "' 그룹에 초대했습니다.",
                "/groups/" + groupId,
                groupId,
                "GROUP"
        );
    }

    public void notifyGroupJoin(Long userId, Long groupId, String groupName, String memberName) {
        createAndSendNotification(
                userId,
                Notification.NotificationType.GROUP_JOIN,
                "새 멤버 가입",
                memberName + "님이 '" + groupName + "' 그룹에 가입했습니다.",
                "/groups/" + groupId,
                groupId,
                "GROUP"
        );
    }

    public void notifyNewMessage(Long userId, Long chatRoomId, String senderName, String messagePreview) {
        createAndSendNotification(
                userId,
                Notification.NotificationType.NEW_MESSAGE,
                "새 메시지",
                senderName + ": " + messagePreview,
                "/chat/" + chatRoomId,
                chatRoomId,
                "CHAT"
        );
    }

    private NotificationDto convertToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .actionUrl(notification.getActionUrl())
                .relatedId(notification.getRelatedId())
                .relatedType(notification.getRelatedType())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .build();
    }

    @lombok.Builder
    @lombok.Getter
    public static class NotificationDto {
        private Long id;
        private Notification.NotificationType type;
        private String title;
        private String message;
        private String actionUrl;
        private Long relatedId;
        private String relatedType;
        private boolean isRead;
        private LocalDateTime createdAt;
        private LocalDateTime readAt;
    }
}