package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 여행 일정 댓글 Entity
 */
@Entity
@Table(name = "itinerary_comments", schema = "travelmate",
        indexes = {
                @Index(name = "idx_itinerary_comment_itinerary", columnList = "itinerary_id"),
                @Index(name = "idx_itinerary_comment_user", columnList = "user_id"),
                @Index(name = "idx_itinerary_comment_parent", columnList = "parent_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItineraryComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "itinerary_id", nullable = false)
    private TravelItinerary itinerary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private ItineraryComment parent;

    @Builder.Default
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<ItineraryComment> replies = new ArrayList<>();

    @Builder.Default
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Helper methods
    public void addReply(ItineraryComment reply) {
        replies.add(reply);
        reply.setParent(this);
    }

    public void removeReply(ItineraryComment reply) {
        replies.remove(reply);
        reply.setParent(null);
    }

    public void softDelete() {
        this.isDeleted = true;
        this.content = "삭제된 댓글입니다.";
    }

    public boolean isReply() {
        return this.parent != null;
    }
}
