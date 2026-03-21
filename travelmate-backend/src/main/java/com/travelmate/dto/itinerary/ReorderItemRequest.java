package com.travelmate.dto.itinerary;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderItemRequest {

    @NotNull(message = "Item ID is required")
    private Long itemId;

    @NotNull(message = "Day number is required")
    private Integer dayNumber;

    @NotNull(message = "Order index is required")
    private Integer orderIndex;
}
