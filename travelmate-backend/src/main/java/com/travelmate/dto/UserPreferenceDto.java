package com.travelmate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 사용자 여행 선호도 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferenceDto {

    private Long userId;
    private String nickname;

    // 여행 스타일
    private List<String> travelStyles; // BACKPACKER, LUXURY, CULTURAL, ADVENTURE, RELAXATION

    // 선호 지역
    private List<String> preferredRegions; // ASIA, EUROPE, AMERICAS, OCEANIA, AFRICA

    // 관심사
    private List<String> interests; // FOOD, HISTORY, NATURE, SHOPPING, PHOTOGRAPHY, SPORTS

    // 여행 빈도
    private String travelFrequency; // FREQUENT, OCCASIONAL, RARE

    // 선호 그룹 크기
    private Integer preferredGroupSizeMin;
    private Integer preferredGroupSizeMax;

    // 나이대
    private Integer ageGroup; // 20, 30, 40, 50...

    // 성별
    private String gender; // MALE, FEMALE, OTHER, ANY

    // 언어
    private List<String> languages; // KOREAN, ENGLISH, JAPANESE, CHINESE...

    // 예산 범위
    private String budgetRange; // LOW, MEDIUM, HIGH, LUXURY
}
