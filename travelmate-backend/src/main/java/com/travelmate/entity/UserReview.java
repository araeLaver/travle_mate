package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_reviews", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"reviewer_id", "reviewee_id", "travel_group_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserReview {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewee_id")
    private User reviewee;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "travel_group_id")
    private TravelGroup travelGroup;
    
    @Column(nullable = false)
    private Integer rating; // 1-5점 (종합 평점)

    private String comment;

    @Enumerated(EnumType.STRING)
    private ReviewType reviewType;

    /** 시간약속 점수 (1-5, nullable) */
    @Column(name = "punctuality_score")
    private Integer punctualityScore;

    /** 매너 점수 (1-5, nullable) */
    @Column(name = "manner_score")
    private Integer mannerScore;

    /** 소통 점수 (1-5, nullable) */
    @Column(name = "communication_score")
    private Integer communicationScore;

    /** 재동행의사 점수 (1-5, nullable) */
    @Column(name = "companion_again_score")
    private Integer companionAgainScore;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public enum ReviewType {
        POSITIVE, NEUTRAL, NEGATIVE
    }
}