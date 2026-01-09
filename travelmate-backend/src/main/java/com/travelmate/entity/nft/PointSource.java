package com.travelmate.entity.nft;

/**
 * 포인트 획득/사용 출처
 */
public enum PointSource {
    NFT_COLLECT("NFT 수집"),
    GROUP_ACTIVITY("그룹 활동"),
    ACHIEVEMENT("업적 달성"),
    DAILY_LOGIN("일일 접속"),
    MARKETPLACE_PURCHASE("마켓 구매"),
    MARKETPLACE_SALE("마켓 판매"),
    TRANSFER("포인트 전송"),
    EVENT_REWARD("이벤트 보상"),
    REFERRAL("친구 초대"),
    ADMIN("관리자 지급");

    private final String displayName;

    PointSource(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
