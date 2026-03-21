package com.travelmate.entity.nft;

/**
 * 업적 유형
 */
public enum AchievementType {
    COLLECTION("수집"),
    REGION("지역 완주"),
    ACTIVITY("활동"),
    SPECIAL("특별"),
    SEASONAL("시즌");

    private final String displayName;

    AchievementType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
