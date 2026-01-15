package com.travelmate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * 여행 일정 아이템 Entity
 */
@Entity
@Table(name = "itinerary_items", schema = "travelmate")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItineraryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "itinerary_id", nullable = false)
    private TravelItinerary itinerary;

    @Column(name = "day_number", nullable = false)
    private Integer dayNumber;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemType type;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // 위치 정보
    @Column(name = "place_name")
    private String placeName;

    @Column(name = "place_address")
    private String placeAddress;

    private Double latitude;
    private Double longitude;

    @Column(name = "google_place_id")
    private String googlePlaceId;

    // 시간 정보
    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    // 비용 정보
    @Column(name = "estimated_cost")
    private Double estimatedCost;

    @Column(name = "actual_cost")
    private Double actualCost;

    private String currency;

    // 예약 정보
    @Column(name = "booking_reference")
    private String bookingReference;

    @Column(name = "booking_url")
    private String bookingUrl;

    @Column(name = "booking_status")
    @Enumerated(EnumType.STRING)
    private BookingStatus bookingStatus;

    // 이미지
    @Column(name = "image_url")
    private String imageUrl;

    // NFT 연결 (수집한 장소인 경우)
    @Column(name = "location_collection_id")
    private Long locationCollectionId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ItemType {
        ATTRACTION,      // 관광지
        RESTAURANT,      // 식당
        CAFE,            // 카페
        ACCOMMODATION,   // 숙소
        TRANSPORTATION,  // 교통
        ACTIVITY,        // 액티비티
        SHOPPING,        // 쇼핑
        FREE_TIME,       // 자유 시간
        NOTE,            // 메모
        OTHER            // 기타
    }

    public enum BookingStatus {
        NOT_NEEDED,      // 예약 불필요
        PENDING,         // 예약 예정
        BOOKED,          // 예약 완료
        CANCELLED        // 예약 취소
    }
}
