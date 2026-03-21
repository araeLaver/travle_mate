package com.travelmate.entity.nft;

/**
 * 마켓플레이스 리스팅 상태
 */
public enum ListingStatus {
    ACTIVE("판매중"),
    SOLD("판매완료"),
    CANCELLED("취소됨"),
    EXPIRED("만료됨");

    private final String displayName;

    ListingStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
