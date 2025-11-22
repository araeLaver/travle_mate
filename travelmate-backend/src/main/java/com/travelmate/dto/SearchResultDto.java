package com.travelmate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 검색 결과 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResultDto {

    private List<GroupResult> results;
    private Long totalResults;
    private Integer page;
    private Integer size;
    private Float took; // 검색 소요 시간 (초)

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroupResult {
        private Long id;
        private String name;
        private String description;
        private String destination;
        private String travelStyle;
        private List<String> tags;
        private Integer currentMembers;
        private Integer maxMembers;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private LocalDateTime createdAt;
        private Float score; // 검색 점수
    }
}
