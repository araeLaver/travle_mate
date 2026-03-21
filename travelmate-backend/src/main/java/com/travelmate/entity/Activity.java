package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "activities", indexes = {
        @Index(name = "idx_activity_actor_created", columnList = "actor_id, created_at DESC"),
        @Index(name = "idx_activity_type_created", columnList = "type, created_at DESC"),
        @Index(name = "idx_activity_target", columnList = "target_type, target_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 활동을 수행한 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    /**
     * 활동 유형
     */
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ActivityType type;

    /**
     * 대상 엔티티 타입 (POST, COMMENT, USER, NFT 등)
     */
    @Column(name = "target_type", length = 50)
    private String targetType;

    /**
     * 대상 엔티티 ID
     */
    @Column(name = "target_id")
    private Long targetId;

    /**
     * 부가 정보 (JSON 형태로 저장)
     */
    @Column(name = "metadata", length = 2000)
    private String metadata;

    /**
     * 공개 여부
     */
    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private Boolean isPublic = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum ActivityType {
        // 게시글 관련
        POST_CREATED("게시글 작성"),
        POST_LIKED("게시글 좋아요"),
        POST_COMMENTED("게시글 댓글"),
        POST_SHARED("게시글 공유"),

        // 사용자 관련
        USER_FOLLOWED("사용자 팔로우"),
        USER_JOINED("회원 가입"),

        // NFT 관련
        NFT_COLLECTED("NFT 수집"),
        NFT_MINTED("NFT 민팅"),
        NFT_LISTED("NFT 등록"),
        NFT_SOLD("NFT 판매"),
        NFT_PURCHASED("NFT 구매"),

        // 리뷰 관련
        REVIEW_CREATED("리뷰 작성"),
        REVIEW_HELPFUL("리뷰 도움됨"),

        // 업적 관련
        ACHIEVEMENT_UNLOCKED("업적 달성"),
        LEVEL_UP("레벨 업"),

        // 그룹/채팅 관련
        GROUP_JOINED("그룹 가입"),
        GROUP_CREATED("그룹 생성");

        private final String displayName;

        ActivityType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}
