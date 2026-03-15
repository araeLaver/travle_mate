package com.travelmate.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 동행 후 상호평가 엔티티
 *
 * <p>MATCHED 상태인 매칭에 한해 양방향 평가를 허용합니다.</p>
 * <p>reviewer + matchRequest 조합의 UniqueConstraint로 중복 평가를 방지합니다.</p>
 */
@Entity
@Table(
    name = "travel_reviews",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_travel_review_reviewer_match",
            columnNames = {"reviewer_id", "match_request_id"}
        )
    },
    indexes = {
        @Index(name = "idx_travel_review_reviewee", columnList = "reviewee_id"),
        @Index(name = "idx_travel_review_match",    columnList = "match_request_id"),
        @Index(name = "idx_travel_review_created",  columnList = "created_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TravelReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 리뷰 작성자 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    /** 리뷰 대상자 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewee_id", nullable = false)
    private User reviewee;

    /** 해당 매칭 요청 (MATCHED 상태여야 리뷰 가능) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_request_id", nullable = false)
    private MatchRequest matchRequest;

    /** 시간 약속 점수 (1-5) */
    @Min(1) @Max(5)
    @Column(name = "punctuality_score", nullable = false)
    private Integer punctualityScore;

    /** 매너 점수 (1-5) */
    @Min(1) @Max(5)
    @Column(name = "manners_score", nullable = false)
    private Integer mannersScore;

    /** 소통 점수 (1-5) */
    @Min(1) @Max(5)
    @Column(name = "communication_score", nullable = false)
    private Integer communicationScore;

    /** 다시 함께 여행하고 싶은지 여부 */
    @Column(name = "would_travel_again", nullable = false)
    @Builder.Default
    private Boolean wouldTravelAgain = false;

    /** 자유 코멘트 (최대 500자) */
    @Column(name = "comment", length = 500)
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // -----------------------------------------------------------------------
    // 비즈니스 헬퍼
    // -----------------------------------------------------------------------

    /**
     * 세 항목 점수의 평균을 반환합니다.
     */
    public double getAverageScore() {
        return (punctualityScore + mannersScore + communicationScore) / 3.0;
    }
}
