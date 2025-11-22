package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_user_created", columnList = "user_id, created_at DESC"),
        @Index(name = "idx_user_read", columnList = "user_id, is_read")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(name = "related_id")
    private Long relatedId; // 관련 엔티티 ID (그룹 ID, 메시지 ID 등)

    @Column(name = "related_type")
    private String relatedType; // 관련 엔티티 타입

    @Column(name = "action_url")
    private String actionUrl; // 클릭 시 이동할 URL

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "sent_via_push")
    private boolean sentViaPush = false;

    public enum NotificationType {
        GROUP_INVITE("그룹 초대"),
        GROUP_JOIN("그룹 가입"),
        GROUP_LEAVE("그룹 탈퇴"),
        GROUP_UPDATE("그룹 업데이트"),
        GROUP_DELETE("그룹 삭제"),
        NEW_MESSAGE("새 메시지"),
        MENTION("멘션"),
        COMMENT("댓글"),
        LIKE("좋아요"),
        REVIEW("리뷰"),
        FRIEND_REQUEST("친구 요청"),
        SYSTEM("시스템 알림");

        private final String displayName;

        NotificationType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }
}
