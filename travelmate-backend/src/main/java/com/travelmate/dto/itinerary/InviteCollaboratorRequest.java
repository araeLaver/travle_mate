package com.travelmate.dto.itinerary;

import com.travelmate.entity.ItineraryCollaborator.CollaboratorRole;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteCollaboratorRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    private CollaboratorRole role;
}
