package com.travelmate.dto.itinerary;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.travelmate.entity.ItineraryItem.BookingStatus;
import com.travelmate.entity.ItineraryItem.ItemType;
import lombok.*;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItineraryItemResponse {
    private Long id;
    private Integer dayNumber;
    private Integer orderIndex;
    private ItemType type;
    private String title;
    private String description;
    private String notes;
    private String placeName;
    private String placeAddress;
    private Double latitude;
    private Double longitude;
    private String googlePlaceId;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer durationMinutes;
    private Double estimatedCost;
    private Double actualCost;
    private String currency;
    private String bookingReference;
    private String bookingUrl;
    private BookingStatus bookingStatus;
    private String imageUrl;
    private Long locationCollectionId;
}
