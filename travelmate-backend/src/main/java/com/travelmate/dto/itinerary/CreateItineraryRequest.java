package com.travelmate.dto.itinerary;

import com.travelmate.entity.TravelItinerary.ItineraryVisibility;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "여행 일정 생성 요청")
public class CreateItineraryRequest {

    @Schema(description = "일정 제목", example = "제주도 3박 4일 여행", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Title is required")
    private String title;

    @Schema(description = "일정 설명", example = "제주도의 아름다운 명소를 둘러보는 여행")
    private String description;

    @Schema(description = "여행 시작일", example = "2024-03-01", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @Schema(description = "여행 종료일", example = "2024-03-04", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @Schema(description = "커버 이미지 URL")
    private String coverImage;

    @Schema(description = "공개 범위", example = "PRIVATE", defaultValue = "PRIVATE")
    private ItineraryVisibility visibility;
}
