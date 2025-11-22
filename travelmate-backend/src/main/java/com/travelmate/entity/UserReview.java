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
    private Integer rating; // 1-5점
    
    private String comment;
    
    @Enumerated(EnumType.STRING)
    private ReviewType reviewType;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    public enum ReviewType {
        POSITIVE, NEUTRAL, NEGATIVE
    }
}