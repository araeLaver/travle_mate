package com.travelmate.entity.nft;

/**
 * NFT 민팅 상태
 */
public enum MintStatus {
    PENDING("대기중"),
    MINTING("민팅중"),
    CONFIRMING("확인중"),
    MINTED("완료"),
    FAILED("실패");

    private final String displayName;

    MintStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
