package com.travelmate.dto.nft;

import com.travelmate.entity.nft.MintStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class MintingDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MintingRequest {
        private String walletAddress;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MintingResponse {
        private Long collectionId;
        private Long locationId;
        private String locationName;
        private MintStatus mintStatus;
        private String walletAddress;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MintingStatusResponse {
        private Long collectionId;
        private Long locationId;
        private String locationName;
        private String nftImageUrl;
        private String rarity;
        private MintStatus mintStatus;
        private String tokenId;
        private String transactionHash;
        private String contractAddress;
        private String walletAddress;

        // 트랜잭션 확인을 위한 URL
        public String getPolygonscanUrl() {
            if (transactionHash != null && !transactionHash.isEmpty()) {
                return "https://amoy.polygonscan.com/tx/" + transactionHash;
            }
            return null;
        }

        // NFT 상세 보기 URL
        public String getOpenseaUrl() {
            if (tokenId != null && contractAddress != null) {
                return "https://testnets.opensea.io/assets/amoy/" + contractAddress + "/" + tokenId;
            }
            return null;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MintableNftResponse {
        private Long collectionId;
        private Long locationId;
        private String locationName;
        private String locationDescription;
        private String nftImageUrl;
        private String rarity;
        private MintStatus mintStatus;
        private LocalDateTime collectedAt;
        private Integer earnedPoints;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MintingStatsResponse {
        private long totalCollected;
        private long mintedCount;
        private long pendingCount;
        private long mintingCount;
        private long failedCount;
    }
}
