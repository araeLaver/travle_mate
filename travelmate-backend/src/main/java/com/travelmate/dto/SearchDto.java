package com.travelmate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class SearchDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private String keyword;
        private String travelStyle;
        private List<String> tags;
        private String destination;
        private Integer minMembers;
        private Integer maxMembers;
        private LocalDate startDate;
        private LocalDate endDate;
        private Double latitude;
        private Double longitude;
        private Double radius;
        private String sortBy;
        private String sortOrder;
        private Integer page;
        private Integer size;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Result {
        private List<GroupResult> results;
        private long totalResults;
        private int page;
        private int size;
        private long took;
    }

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
        private LocalDate startDate;
        private LocalDate endDate;
        private LocalDateTime createdAt;
        private double score;
    }
}
