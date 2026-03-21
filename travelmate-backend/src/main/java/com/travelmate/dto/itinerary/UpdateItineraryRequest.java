package com.travelmate.dto.itinerary;

import com.travelmate.entity.TravelItinerary.ItineraryVisibility;
import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateItineraryRequest {
    private String title;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String coverImage;
    private ItineraryVisibility visibility;
}
