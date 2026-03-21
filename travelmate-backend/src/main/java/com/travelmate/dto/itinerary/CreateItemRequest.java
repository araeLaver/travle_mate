package com.travelmate.dto.itinerary;

import com.travelmate.entity.ItineraryItem.BookingStatus;
import com.travelmate.entity.ItineraryItem.ItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateItemRequest {

    @NotNull(message = "Day number is required")
    private Integer dayNumber;

    private Integer orderIndex;

    @NotNull(message = "Item type is required")
    private ItemType type;

    @NotBlank(message = "Title is required")
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
    private String currency;
    private String bookingReference;
    private String bookingUrl;
    private BookingStatus bookingStatus;
    private String imageUrl;
    private Long locationCollectionId;
}
