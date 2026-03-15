package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 1:1 채팅 메시지 엔티티 (채팅 MVP)
 *
 * 인덱스:
 *   - (conversation_id, created_at DESC) — 메시지 페이지네이션
 *   - (conversation_id, is_read)          — 읽지 않은 메시지 수 집계
 */
@Entity
@Table(
    name = "messages",
    indexes = {
        @Index(name = "idx_messages_conv_created", columnList = "conversation_id, created_at"),
        @Index(name = "idx_messages_conv_read",    columnList = "conversation_id, is_read")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
