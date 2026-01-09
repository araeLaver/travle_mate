package com.travelmate.entity.nft;

/**
 * 수집 가능 장소 카테고리
 */
public enum LocationCategory {
    LANDMARK("랜드마크"),
    TOURIST_SPOT("관광지"),
    HIDDEN_GEM("숨은 명소"),
    EVENT("이벤트"),
    CULTURAL_HERITAGE("문화유산"),
    NATURE("자연"),
    CITY("도시");

    private final String displayName;

    LocationCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
