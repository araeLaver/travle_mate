package com.travelmate.dto.itinerary;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "좋아요 응답")
public class LikeResponse {
    @Schema(description = "좋아요 여부", example = "true")
    private boolean liked;
}
