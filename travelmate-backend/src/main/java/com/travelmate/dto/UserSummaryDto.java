package com.travelmate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 동반자 매칭 추천 및 요청에서 사용되는 사용자 요약 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDto {

    /** 사용자 ID */
    private Long id;

    /** 닉네임 */
    private String nickname;

    /** 프로필 이미지 URL */
    private String profileImageUrl;

    /** 여행 스타일 (ADVENTURE, CULTURE, FOOD, RELAXATION, NATURE, SHOPPING) */
    private String travelStyle;

    /** 자기소개 */
    private String bio;

    /** 나이 */
    private Integer age;

    /** 성별 */
    private String gender;

    /** 사용 언어 목록 */
    private List<String> languages;

    /** 관심사 목록 */
    private List<String> interests;

    /** 평균 평점 */
    private Double rating;

    /** 리뷰 수 */
    private Integer reviewCount;

    /** 예산 선호도 (BUDGET, MEDIUM, COMFORT, LUXURY) */
    private String budgetPreference;

    /** 호환성 점수 (추천 목록에서만 사용, 0~100) */
    private Double compatibilityScore;
}
