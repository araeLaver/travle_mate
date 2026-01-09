package com.travelmate.entity.nft;

/**
 * NFT 희귀도 등급
 */
public enum Rarity {
    COMMON(100, "일반"),
    RARE(300, "레어"),
    EPIC(700, "에픽"),
    LEGENDARY(2000, "레전더리");

    private final int basePointReward;
    private final String displayName;

    Rarity(int basePointReward, String displayName) {
        this.basePointReward = basePointReward;
        this.displayName = displayName;
    }

    public int getBasePointReward() {
        return basePointReward;
    }

    public String getDisplayName() {
        return displayName;
    }
}
