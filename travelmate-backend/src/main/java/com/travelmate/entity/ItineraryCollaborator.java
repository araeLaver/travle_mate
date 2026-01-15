package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 일정 공동 편집자 Entity
 */
@Entity
@Table(name = "itinerary_collaborators", schema = "travelmate",
        uniqueConstraints = @UniqueConstraint(columnNames = {"itinerary_id", "user_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItineraryCollaborator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "itinerary_id", nullable = false)
    private TravelItinerary itinerary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CollaboratorRole role = CollaboratorRole.VIEWER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private InviteStatus status = InviteStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by")
    private User invitedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    public enum CollaboratorRole {
        VIEWER,          // 조회만 가능
        EDITOR,          // 편집 가능
        ADMIN            // 관리자 (협업자 초대 가능)
    }

    public enum InviteStatus {
        PENDING,         // 초대 대기 중
        ACCEPTED,        // 수락
        DECLINED         // 거절
    }

    public void accept() {
        this.status = InviteStatus.ACCEPTED;
        this.acceptedAt = LocalDateTime.now();
    }

    public void decline() {
        this.status = InviteStatus.DECLINED;
    }
}
