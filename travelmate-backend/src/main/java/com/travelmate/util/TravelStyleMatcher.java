package com.travelmate.util;

import com.travelmate.entity.User.TravelStyle;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * 여행 스타일 호환성 계산 유틸리티
 * - 스타일 간 호환성 점수 계산
 * - 스타일 기반 활동 매칭
 */
public final class TravelStyleMatcher {

    private static final double PERFECT_MATCH_SCORE = 30.0;
    private static final double COMPATIBLE_SCORE = 20.0;
    private static final double WEAK_COMPATIBILITY_SCORE = 10.0;
    private static final double DEFAULT_SCORE = 15.0;

    private static final Map<TravelStyle, Set<TravelStyle>> COMPATIBILITY_MAP;

    static {
        COMPATIBILITY_MAP = new EnumMap<>(TravelStyle.class);
        COMPATIBILITY_MAP.put(TravelStyle.ADVENTURE,
            EnumSet.of(TravelStyle.NATURE, TravelStyle.CULTURE));
        COMPATIBILITY_MAP.put(TravelStyle.RELAXATION,
            EnumSet.of(TravelStyle.CULTURE, TravelStyle.NATURE));
        COMPATIBILITY_MAP.put(TravelStyle.CULTURE,
            EnumSet.of(TravelStyle.RELAXATION, TravelStyle.ADVENTURE, TravelStyle.SHOPPING));
        COMPATIBILITY_MAP.put(TravelStyle.FOOD,
            EnumSet.of(TravelStyle.CULTURE, TravelStyle.SHOPPING, TravelStyle.RELAXATION));
        COMPATIBILITY_MAP.put(TravelStyle.SHOPPING,
            EnumSet.of(TravelStyle.CULTURE, TravelStyle.FOOD));
        COMPATIBILITY_MAP.put(TravelStyle.NATURE,
            EnumSet.of(TravelStyle.ADVENTURE, TravelStyle.RELAXATION));
    }

    private TravelStyleMatcher() {
        // 유틸리티 클래스 - 인스턴스화 방지
    }

    /**
     * 두 여행 스타일의 호환성 점수 계산
     *
     * @param style1 첫 번째 스타일
     * @param style2 두 번째 스타일
     * @return 호환성 점수 (0~30)
     */
    public static double calculateCompatibilityScore(TravelStyle style1, TravelStyle style2) {
        if (style1 == null || style2 == null) {
            return DEFAULT_SCORE;
        }

        if (style1 == style2) {
            return PERFECT_MATCH_SCORE;
        }

        Set<TravelStyle> compatibleStyles = COMPATIBILITY_MAP.get(style1);
        if (compatibleStyles != null && compatibleStyles.contains(style2)) {
            return COMPATIBLE_SCORE;
        }

        return WEAK_COMPATIBILITY_SCORE;
    }

    /**
     * 두 스타일이 호환되는지 확인
     *
     * @param style1 첫 번째 스타일
     * @param style2 두 번째 스타일
     * @return 호환되면 true
     */
    public static boolean isCompatible(TravelStyle style1, TravelStyle style2) {
        if (style1 == null || style2 == null) {
            return false;
        }
        if (style1 == style2) {
            return true;
        }
        Set<TravelStyle> compatibleStyles = COMPATIBILITY_MAP.get(style1);
        return compatibleStyles != null && compatibleStyles.contains(style2);
    }

    /**
     * 활동과 여행 스타일이 매칭되는지 확인
     *
     * @param activity 활동 (예: "식사", "쇼핑", "관광")
     * @param style 여행 스타일
     * @return 매칭되면 true
     */
    public static boolean isActivityMatchingStyle(String activity, TravelStyle style) {
        if (activity == null || style == null) {
            return false;
        }

        return switch (activity.toLowerCase()) {
            case "식사", "맛집", "음식" -> style == TravelStyle.FOOD;
            case "쇼핑", "시장", "마트" -> style == TravelStyle.SHOPPING;
            case "관광", "박물관", "미술관", "역사" -> style == TravelStyle.CULTURE;
            case "하이킹", "등산", "트레킹" ->
                style == TravelStyle.NATURE || style == TravelStyle.ADVENTURE;
            case "휴식", "카페", "스파" -> style == TravelStyle.RELAXATION;
            case "모험", "액티비티", "스포츠" -> style == TravelStyle.ADVENTURE;
            case "자연", "공원", "해변", "산" -> style == TravelStyle.NATURE;
            default -> true; // 기타 활동은 모두 호환
        };
    }

    /**
     * 스타일에 적합한 활동 키워드 목록 반환
     *
     * @param style 여행 스타일
     * @return 관련 활동 키워드 배열
     */
    public static String[] getActivityKeywords(TravelStyle style) {
        if (style == null) {
            return new String[0];
        }

        return switch (style) {
            case ADVENTURE -> new String[]{"모험", "액티비티", "스포츠", "하이킹", "래프팅"};
            case RELAXATION -> new String[]{"휴식", "스파", "카페", "리조트", "힐링"};
            case CULTURE -> new String[]{"관광", "박물관", "미술관", "역사", "유적"};
            case FOOD -> new String[]{"맛집", "음식", "식당", "카페", "음식투어"};
            case SHOPPING -> new String[]{"쇼핑", "시장", "아울렛", "마트", "백화점"};
            case NATURE -> new String[]{"자연", "공원", "해변", "산", "트레킹"};
        };
    }
}
