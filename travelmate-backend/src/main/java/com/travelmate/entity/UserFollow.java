package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_follows",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_user_follows_follower_following",
                columnNames = {"follower_id", "following_id"}
        ),
        indexes = {
                @Index(name = "idx_user_follows_follower", columnList = "follower_id"),
                @Index(name = "idx_user_follows_following", columnList = "following_id"),
                @Index(name = "idx_user_follows_created_at", columnList = "created_at")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFollow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 팔로우하는 사람 (팔로워)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", nullable = false)
    private User follower;

    /**
     * 팔로우 대상 (팔로잉)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "following_id", nullable = false)
    private User following;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 자기 자신을 팔로우하는지 검증
     */
    @PrePersist
    @PreUpdate
    private void validateNotSelfFollow() {
        if (follower != null && following != null && follower.getId().equals(following.getId())) {
            throw new IllegalStateException("자기 자신을 팔로우할 수 없습니다.");
        }
    }
}
