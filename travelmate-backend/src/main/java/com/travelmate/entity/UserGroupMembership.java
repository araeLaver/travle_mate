package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 사용자-그룹 멤버십 엔티티
 */
@Entity
@Table(name = "user_group_memberships")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserGroupMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "travel_group_id", nullable = false)
    private TravelGroup travelGroup;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MembershipRole role;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MembershipStatus status;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @Column
    private LocalDateTime leftAt;

    public enum MembershipRole {
        LEADER,
        MEMBER
    }

    public enum MembershipStatus {
        ACTIVE,
        LEFT,
        KICKED,
        PENDING
    }
}
