package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "group_members",
    indexes = {
        @Index(name = "idx_group_members_travel_group_id", columnList = "travel_group_id"),
        @Index(name = "idx_group_members_user_id", columnList = "user_id"),
        @Index(name = "idx_group_members_status", columnList = "status")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_travel_group_user", columnNames = {"travel_group_id", "user_id"})
    }
)
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupMember {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "travel_group_id", nullable = false)
    private TravelGroup travelGroup;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20, nullable = false)
    private Role role = Role.MEMBER;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private Status status = Status.PENDING;
    
    @CreationTimestamp
    @Column(name = "joined_at")
    private LocalDateTime joinedAt;
    
    public enum Role {
        CREATOR, ADMIN, MEMBER
    }
    
    public enum Status {
        PENDING, ACCEPTED, REJECTED
    }
}