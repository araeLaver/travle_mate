package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 1:1 매칭 기반 대화 엔티티 (채팅 MVP)
 * - 두 사용자(participant1, participant2) 간 하나의 대화만 존재 (UNIQUE 제약)
 * - 매칭된 pair만 대화를 시작할 수 있음
 */
@Entity
@Table(
    name = "conversations",
    indexes = {
        @Index(name = "idx_conversations_p1",           columnList = "participant1_id"),
        @Index(name = "idx_conversations_p2",           columnList = "participant2_id"),
        @Index(name = "idx_conversations_last_message", columnList = "last_message_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 두 참여자는 항상 id 오름차순으로 저장 (중복 방지)
     * DB UNIQUE 제약: (LEAST(p1,p2), GREATEST(p1,p2))
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant1_id", nullable = false)
    private User participant1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant2_id", nullable = false)
    private User participant2;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Message> messages;

    /**
     * 주어진 userId가 이 대화의 참여자인지 확인
     */
    public boolean hasParticipant(Long userId) {
        return (participant1 != null && userId.equals(participant1.getId()))
            || (participant2 != null && userId.equals(participant2.getId()));
    }

    /**
     * 상대방 유저 반환
     */
    public User otherParticipant(Long myUserId) {
        if (participant1 != null && myUserId.equals(participant1.getId())) {
            return participant2;
        }
        return participant1;
    }
}
