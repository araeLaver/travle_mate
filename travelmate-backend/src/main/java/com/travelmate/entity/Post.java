package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Post {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Lob
    @Column(nullable = false)
    private String content;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;
    
    @Column(name = "location_name")
    private String locationName;
    
    @Column(name = "location_latitude")
    private Double locationLatitude;
    
    @Column(name = "location_longitude")
    private Double locationLongitude;
    
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PostImage> images;
    
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Comment> comments;
    
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PostLike> likes;
    
    @Column(name = "view_count")
    private Integer viewCount = 0;
    
    @Column(name = "like_count")
    private Integer likeCount = 0;
    
    @Column(name = "comment_count")
    private Integer commentCount = 0;
    
    @Column(name = "is_pinned")
    private Boolean isPinned = false;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum Category {
        TRAVEL_TIP,        // 여행 팁
        DESTINATION_INFO,  // 여행지 정보
        TRAVEL_REVIEW,     // 여행 후기
        FOOD_RECOMMEND,    // 맛집 추천
        ACCOMMODATION,     // 숙소 정보
        TRANSPORTATION,    // 교통 정보
        BUDGET_INFO,       // 예산/비용 정보
        TRAVEL_ROUTE,      // 여행 루트
        SAFETY_INFO,       // 안전 정보
        CULTURE_INFO,      // 문화/관습 정보
        SHOPPING,          // 쇼핑 정보
        ACTIVITY,          // 액티비티
        PHOTOGRAPHY,       // 여행 사진
        QUESTION,          // 질문
        FREE_TALK          // 자유 게시판
    }
}