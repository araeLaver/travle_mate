package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookmarks",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_bookmark_user_target",
                columnNames = {"user_id", "target_type", "target_id"}
        ),
        indexes = {
                @Index(name = "idx_bookmark_user_created", columnList = "user_id, created_at DESC"),
                @Index(name = "idx_bookmark_user_type", columnList = "user_id, target_type"),
                @Index(name = "idx_bookmark_target", columnList = "target_type, target_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 북마크한 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 북마크 대상 타입
     */
    @Column(name = "target_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private TargetType targetType;

    /**
     * 북마크 대상 ID
     */
    @Column(name = "target_id", nullable = false)
    private Long targetId;

    /**
     * 폴더/컬렉션 이름 (사용자가 분류할 수 있음)
     */
    @Column(name = "folder_name", length = 100)
    private String folderName;

    /**
     * 메모
     */
    @Column(name = "note", length = 500)
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum TargetType {
        POST("게시글"),
        LOCATION("장소"),
        NFT("NFT"),
        USER("사용자"),
        GROUP("그룹");

        private final String displayName;

        TargetType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}
