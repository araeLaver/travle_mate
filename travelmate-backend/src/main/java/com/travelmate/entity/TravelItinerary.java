package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 여행 일정 Entity
 */
@Entity
@Table(name = "travel_itineraries", schema = "travelmate")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TravelItinerary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "cover_image")
    private String coverImage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ItineraryVisibility visibility = ItineraryVisibility.PRIVATE;

    @Column(name = "share_code", unique = true)
    private String shareCode;

    @Builder.Default
    @Column(name = "view_count")
    private Integer viewCount = 0;

    @Builder.Default
    @Column(name = "like_count")
    private Integer likeCount = 0;

    @Builder.Default
    @Column(name = "copy_count")
    private Integer copyCount = 0;

    @Builder.Default
    @OneToMany(mappedBy = "itinerary", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dayNumber ASC, orderIndex ASC")
    private List<ItineraryItem> items = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "itinerary", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItineraryCollaborator> collaborators = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Helper methods
    public void addItem(ItineraryItem item) {
        items.add(item);
        item.setItinerary(this);
    }

    public void removeItem(ItineraryItem item) {
        items.remove(item);
        item.setItinerary(null);
    }

    public void addCollaborator(ItineraryCollaborator collaborator) {
        collaborators.add(collaborator);
        collaborator.setItinerary(this);
    }

    public void removeCollaborator(ItineraryCollaborator collaborator) {
        collaborators.remove(collaborator);
        collaborator.setItinerary(null);
    }

    public void incrementViewCount() {
        this.viewCount++;
    }

    public void incrementLikeCount() {
        this.likeCount++;
    }

    public void decrementLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--;
        }
    }

    public void incrementCopyCount() {
        this.copyCount++;
    }

    public int getDuration() {
        return (int) (endDate.toEpochDay() - startDate.toEpochDay() + 1);
    }

    public enum ItineraryVisibility {
        PRIVATE,      // 본인만 보기
        LINK_ONLY,    // 링크로 공유
        FOLLOWERS,    // 팔로워에게 공개
        PUBLIC        // 전체 공개
    }
}
