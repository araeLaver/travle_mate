package com.travelmate.entity.nft;

/**
 * 포인트 거래 유형
 */
public enum PointTransactionType {
    EARN("획득"),
    SPEND("사용"),
    TRANSFER_IN("전송받음"),
    TRANSFER_OUT("전송함");

    private final String displayName;

    PointTransactionType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
