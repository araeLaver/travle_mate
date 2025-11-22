package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "travel_groups", indexes = {
    @Index(name = "idx_travel_groups_creator_id", columnList = "creator_id"),
    @Index(name = "idx_travel_groups_destination", columnList = "destination"),
    @Index(name = "idx_travel_groups_dates", columnList = "start_date, end_date"),
    @Index(name = "idx_travel_groups_active", columnList = "is_active"),
    @Index(name = "idx_travel_groups_public", columnList = "is_public"),
    @Index(name = "idx_travel_groups_travel_style", columnList = "travel_style"),
    @Index(name = "idx_travel_groups_created_at", columnList = "created_at")
})
@EntityListeners(AuditingEntityListener.class)
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TravelGroup {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "title", nullable = false, length = 200)
    private String title;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "destination", nullable = false, length = 100)
    private String destination;
    
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;
    
    @OneToMany(mappedBy = "travelGroup", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<GroupMember> members;
    
    @Column(name = "max_members", nullable = false)
    private Integer maxMembers = 10;
    
    @Column(name = "current_members")
    private Integer currentMembers = 1;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "travel_style", length = 50)
    private User.TravelStyle travelStyle;
    
    @Column(name = "budget_range", length = 50)
    private String budgetRange;
    
    @Column(name = "group_image_url", length = 500)
    private String groupImageUrl;
    
    @Column(name = "meeting_location", length = 200)
    private String meetingLocation;

    @Column(name = "meeting_latitude")
    private Double meetingLatitude;

    @Column(name = "meeting_longitude")
    private Double meetingLongitude;

    @Column(name = "meeting_address", length = 200)
    private String meetingAddress;

    @Column(name = "scheduled_time")
    private LocalDateTime scheduledTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "purpose", length = 50)
    private Purpose purpose;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50, nullable = false)
    private Status status = Status.RECRUITING;
    
    @Column(name = "requirements", columnDefinition = "TEXT")
    private String requirements;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = true;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Purpose {
        LEISURE,
        BUSINESS,
        EDUCATION,
        MEDICAL,
        FAMILY,
        OTHER
    }

    public enum Status {
        RECRUITING,
        ACTIVE,
        COMPLETED,
        CANCELLED
    }
}