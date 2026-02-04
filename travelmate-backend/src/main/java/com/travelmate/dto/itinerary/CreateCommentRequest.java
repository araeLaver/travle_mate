package com.travelmate.dto.itinerary;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "댓글 생성 요청")
public class CreateCommentRequest {

    @NotBlank(message = "댓글 내용은 필수입니다")
    @Size(max = 1000, message = "댓글은 1000자를 초과할 수 없습니다")
    @Schema(description = "댓글 내용", example = "정말 좋은 일정이네요!", required = true)
    private String content;

    @Schema(description = "부모 댓글 ID (대댓글인 경우)", example = "1")
    private Long parentId;
}
