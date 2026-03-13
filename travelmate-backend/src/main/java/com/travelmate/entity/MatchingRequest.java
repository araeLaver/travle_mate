package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 동반자 매칭 요청 Entity
 * - 요청 명세 기준 matching_requests 테이블
 * - fromUser -> toUser 방향의 매칭 요청 관리
 */
@Entity
@Table(name = "matching_requests", indexes = {
    @Index(name = "idx_matching_req_from_user", columnList = "from_user_id"),
    @Index(name = "idx_matching_req_to_user", columnList = "to_user_id"),
    @Index(name = "idx_matching_req_status", columnList = "status"),
    @Index(name = "idx_matching_req_from_status", columnList = "from_user_id, status"),
    @Index(name = "idx_matching_req_to_status", columnList = "to_user_id, status")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 매칭 요청을 보낸 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_user_id", nullable = false)
    private User fromUser;

    /**
     * 매칭 요청을 받은 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_user_id", nullable = false)
    private User toUser;

    /**
     * 매칭 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private MatchingStatus status = MatchingStatus.PENDING;

    /**
     * 호환성 점수 (0~100)
     */
    @Column(name = "compatibility_score")
    private Double compatibilityScore;

    /**
     * 생성 시각 (JPA Auditing)
     */
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 응답 시각 (수락 또는 거절 시 설정)
     */
    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    /**
     * 매칭 상태 열거형
     */
    public enum MatchingStatus {
        PENDING,    // 대기 중
        ACCEPTED,   // 수락됨
        REJECTED,   // 거절됨
        CANCELLED   // 요청자가 취소
    }

    /**
     * 자기 자신에게 요청 방지
     */
    @PrePersist
    private void validateNotSelfRequest() {
        if (fromUser != null && toUser != null
                && fromUser.getId() != null
                && fromUser.getId().equals(toUser.getId())) {
            throw new IllegalStateException("자기 자신에게 매칭 요청을 보낼 수 없습니다.");
        }
    }
}
