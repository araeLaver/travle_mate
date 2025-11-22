package com.travelmate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 검색 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchRequestDto {

    // 키워드 검색
    private String keyword;

    // 필터
    private String travelStyle;
    private List<String> tags;
    private String destination;

    // 멤버 수 범위
    private Integer minMembers;
    private Integer maxMembers;

    // 날짜 범위
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    // 지리적 검색
    private Double latitude;
    private Double longitude;
    private Double radius; // km 단위

    // 정렬
    private String sortBy; // createdAt, currentMembers, startDate
    private String sortOrder; // asc, desc

    // 페이징
    private Integer page;
    private Integer size;
}
