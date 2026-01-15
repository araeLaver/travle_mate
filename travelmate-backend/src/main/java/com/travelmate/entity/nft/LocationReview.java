package com.travelmate.entity.nft;

import com.travelmate.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "location_reviews",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"reviewer_id", "location_id"},
        name = "uk_location_review_user_location"
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private CollectibleLocation location;

    @Column(nullable = false)
    private Integer rating; // 1-5점

    @Column(length = 1000)
    private String comment; // 리뷰 내용

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private VisitedSeason visitedSeason; // 방문 계절

    @ElementCollection
    @CollectionTable(name = "location_review_photos", joinColumns = @JoinColumn(name = "review_id"))
    @Column(name = "photo_url")
    @Builder.Default
    private List<String> photoUrls = new ArrayList<>(); // 사진 URL 목록

    @Column(nullable = false)
    @Builder.Default
    private Integer helpfulCount = 0; // 도움됨 수

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // 도움됨 수 증가
    public void incrementHelpfulCount() {
        this.helpfulCount++;
    }

    // 도움됨 수 감소
    public void decrementHelpfulCount() {
        if (this.helpfulCount > 0) {
            this.helpfulCount--;
        }
    }

    // 방문 계절 열거형
    public enum VisitedSeason {
        SPRING("봄"),
        SUMMER("여름"),
        FALL("가을"),
        WINTER("겨울");

        private final String displayName;

        VisitedSeason(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}
