package com.travelmate.dto.itinerary;

import com.travelmate.entity.ItineraryCollaborator.CollaboratorRole;
import com.travelmate.entity.ItineraryCollaborator.InviteStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollaboratorResponse {
    private Long id;
    private Long userId;
    private String username;
    private String profileImage;
    private CollaboratorRole role;
    private InviteStatus status;
    private LocalDateTime invitedAt;
    private LocalDateTime acceptedAt;
    private Long itineraryId;
    private String itineraryTitle;
}
