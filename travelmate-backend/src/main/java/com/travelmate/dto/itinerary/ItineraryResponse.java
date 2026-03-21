package com.travelmate.dto.itinerary;

import com.travelmate.entity.TravelItinerary.ItineraryVisibility;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "여행 일정 응답")
public class ItineraryResponse {
    @Schema(description = "일정 ID", example = "1")
    private Long id;

    @Schema(description = "일정 제목", example = "제주도 3박 4일 여행")
    private String title;

    @Schema(description = "일정 설명", example = "제주도의 아름다운 명소를 둘러보는 여행")
    private String description;

    @Schema(description = "여행 시작일", example = "2024-03-01")
    private LocalDate startDate;

    @Schema(description = "여행 종료일", example = "2024-03-04")
    private LocalDate endDate;

    @Schema(description = "여행 일수", example = "4")
    private int duration;

    @Schema(description = "커버 이미지 URL")
    private String coverImage;

    @Schema(description = "공개 범위", example = "PUBLIC")
    private ItineraryVisibility visibility;

    @Schema(description = "공유 코드 (LINK_ONLY 이상에서 사용)", example = "abc123xyz")
    private String shareCode;

    @Schema(description = "조회수", example = "150")
    private Integer viewCount;

    @Schema(description = "좋아요 수", example = "25")
    private Integer likeCount;

    @Schema(description = "복사 횟수", example = "5")
    private Integer copyCount;

    @Schema(description = "일정 아이템 수", example = "12")
    private int itemCount;

    @Schema(description = "작성자 정보")
    private OwnerInfo owner;

    @Schema(description = "현재 사용자가 소유자인지 여부", example = "true")
    private boolean isOwner;

    @Schema(description = "현재 사용자가 좋아요 했는지 여부", example = "false")
    private boolean isLiked;

    @Schema(description = "생성 일시")
    private LocalDateTime createdAt;

    @Schema(description = "일정 아이템 목록 (상세 조회 시)")
    private List<ItineraryItemResponse> items;

    @Schema(description = "협업자 목록 (상세 조회 시)")
    private List<CollaboratorResponse> collaborators;
}
