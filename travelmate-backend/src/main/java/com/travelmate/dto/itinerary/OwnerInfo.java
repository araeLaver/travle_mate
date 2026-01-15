package com.travelmate.dto.itinerary;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerInfo {
    private Long id;
    private String username;
    private String profileImage;
}
