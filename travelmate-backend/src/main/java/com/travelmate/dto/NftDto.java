package com.travelmate.dto;

import com.travelmate.entity.nft.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public class NftDto {

    // ===== 포인트 관련 DTO =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PointBalanceResponse {
        private Long totalPoints;
        private Long lifetimeEarned;
        private Long lifetimeSpent;
        private Long seasonPoints;
        private Integer currentRank;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PointTransactionResponse {
        private Long id;
        private PointTransactionType type;
        private Long amount;
        private Long balanceAfter;
        private PointSource source;
        private String description;
        private LocalDateTime createdAt;
    }

    @Data
    public static class PointTransferRequest {
        @NotNull(message = "받는 사람 ID는 필수입니다")
        private Long receiverId;

        @NotNull(message = "포인트 수량은 필수입니다")
        @Min(value = 1, message = "최소 1 포인트 이상 전송해야 합니다")
        private Long amount;

        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaderboardEntry {
        private Integer rank;
        private Long userId;
        private String nickname;
        private String profileImageUrl;
        private Long totalPoints;
        private Integer totalNftsCollected;
    }

    // ===== NFT 수집 관련 DTO =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollectibleLocationResponse {
        private Long id;
        private String name;
        private String description;
        private Double latitude;
        private Double longitude;
        private Integer collectRadius;
        private LocationCategory category;
        private Rarity rarity;
        private String country;
        private String city;
        private String region;
        private String imageUrl;
        private String nftImageUrl;
        private Long pointReward;
        private Boolean isCollected;
        private Boolean isSeasonalEvent;
        private LocalDateTime eventEndAt;
        private Double distance; // 현재 위치로부터의 거리 (m)
    }

    @Data
    public static class CollectNftRequest {
        @NotNull(message = "장소 ID는 필수입니다")
        private Long locationId;

        @NotNull(message = "현재 위도는 필수입니다")
        @DecimalMin(value = "-90.0", message = "위도는 -90 이상이어야 합니다")
        @DecimalMax(value = "90.0", message = "위도는 90 이하여야 합니다")
        private Double latitude;

        @NotNull(message = "현재 경도는 필수입니다")
        @DecimalMin(value = "-180.0", message = "경도는 -180 이상이어야 합니다")
        @DecimalMax(value = "180.0", message = "경도는 180 이하여야 합니다")
        private Double longitude;

        private Float gpsAccuracy;
        private String deviceId;
        private Boolean isMockLocation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollectNftResponse {
        private Boolean success;
        private String message;
        private UserNftCollectionResponse nftCollection;
        private Long earnedPoints;
        private List<AchievementUnlocked> unlockedAchievements;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AchievementUnlocked {
        private Long achievementId;
        private String name;
        private String description;
        private String iconUrl;
        private Rarity rarity;
        private Long pointReward;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserNftCollectionResponse {
        private Long id;
        private CollectibleLocationSummary location;
        private String tokenId;
        private MintStatus mintStatus;
        private LocalDateTime collectedAt;
        private Long earnedPoints;
        private Boolean isVerified;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollectibleLocationSummary {
        private Long id;
        private String name;
        private String imageUrl;
        private String nftImageUrl;
        private Rarity rarity;
        private LocationCategory category;
        private String city;
        private String country;
    }

    // ===== 업적 관련 DTO =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AchievementResponse {
        private Long id;
        private String code;
        private String name;
        private String description;
        private String iconUrl;
        private String badgeImageUrl;
        private AchievementType type;
        private Rarity rarity;
        private Long pointReward;
        private Boolean grantsBadgeNft;
        private Integer currentProgress;
        private Integer targetProgress;
        private Boolean isCompleted;
        private LocalDateTime completedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AchievementStatsResponse {
        private Integer totalAchievements;
        private Integer completedAchievements;
        private Long totalPointsFromAchievements;
        private Integer badgeNftsEarned;
    }

    // ===== 도감 관련 DTO =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollectionBookResponse {
        private CollectionStats stats;
        private List<RegionCollection> regions;
        private List<CategoryCollection> categories;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollectionStats {
        private Integer totalLocations;
        private Integer collectedLocations;
        private Double completionRate;
        private Integer commonCollected;
        private Integer rareCollected;
        private Integer epicCollected;
        private Integer legendaryCollected;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegionCollection {
        private String region;
        private String country;
        private Integer total;
        private Integer collected;
        private Double completionRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryCollection {
        private LocationCategory category;
        private Integer total;
        private Integer collected;
        private Double completionRate;
    }

    // ===== 마켓플레이스 관련 DTO =====

    @Data
    public static class CreateListingRequest {
        @NotNull(message = "NFT 컬렉션 ID는 필수입니다")
        private Long nftCollectionId;

        @NotNull(message = "가격은 필수입니다")
        @Min(value = 1, message = "최소 가격은 1 포인트입니다")
        private Long priceInPoints;

        private Integer durationDays; // 판매 기간 (기본 7일)
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MarketplaceListingResponse {
        private Long id;
        private UserNftCollectionResponse nftCollection;
        private SellerInfo seller;
        private Long priceInPoints;
        private ListingStatus status;
        private LocalDateTime listedAt;
        private LocalDateTime expiresAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SellerInfo {
        private Long id;
        private String nickname;
        private String profileImageUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BuyNftResponse {
        private Boolean success;
        private String message;
        private UserNftCollectionResponse nftCollection;
        private Long pointsSpent;
        private Long remainingBalance;
    }

    // ===== 지갑 관련 DTO =====

    @Data
    public static class ConnectWalletRequest {
        @NotBlank(message = "지갑 주소는 필수입니다")
        @Pattern(regexp = "^0x[a-fA-F0-9]{40}$", message = "유효한 이더리움 지갑 주소가 아닙니다")
        private String walletAddress;

        @NotBlank(message = "서명은 필수입니다")
        private String signature;

        @NotBlank(message = "메시지는 필수입니다")
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WalletStatusResponse {
        private Boolean isConnected;
        private String walletAddress;
        private Boolean isVerified;
        private Integer totalOnChainNfts;
    }

    // ===== 통계 관련 DTO =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserNftStatsResponse {
        private Integer totalNftsCollected;
        private Integer uniqueLocationsVisited;
        private Long totalPointsEarned;
        private Integer globalRank;
        private Integer regionRank;
        private Integer completedAchievements;
        private CollectionStats collectionStats;
    }

    // ===== Admin 관련 DTO =====

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollectibleLocationAdminResponse {
        private Long id;
        private String name;
        private String description;
        private Double latitude;
        private Double longitude;
        private Integer collectRadius;
        private LocationCategory category;
        private Rarity rarity;
        private String country;
        private String city;
        private String region;
        private String imageUrl;
        private String nftImageUrl;
        private String nftMetadataUri;
        private Long pointReward;
        private Boolean isActive;
        private Boolean isSeasonalEvent;
        private LocalDateTime eventStartAt;
        private LocalDateTime eventEndAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateLocationRequest {
        @NotBlank(message = "장소 이름은 필수입니다")
        private String name;

        private String description;

        @NotNull(message = "위도는 필수입니다")
        @DecimalMin(value = "-90.0", message = "위도는 -90 이상이어야 합니다")
        @DecimalMax(value = "90.0", message = "위도는 90 이하여야 합니다")
        private Double latitude;

        @NotNull(message = "경도는 필수입니다")
        @DecimalMin(value = "-180.0", message = "경도는 -180 이상이어야 합니다")
        @DecimalMax(value = "180.0", message = "경도는 180 이하여야 합니다")
        private Double longitude;

        private Integer collectRadius; // 기본값 50m

        @NotNull(message = "카테고리는 필수입니다")
        private LocationCategory category;

        @NotNull(message = "희귀도는 필수입니다")
        private Rarity rarity;

        private String country;
        private String city;
        private String region;
        private String imageUrl;
        private String nftImageUrl;
        private String nftMetadataUri;
        private Integer pointReward;
        private Boolean isActive;
        private Boolean isSeasonalEvent;
        private LocalDateTime eventStartAt;
        private LocalDateTime eventEndAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateLocationRequest {
        private String name;
        private String description;
        private Double latitude;
        private Double longitude;
        private Integer collectRadius;
        private LocationCategory category;
        private Rarity rarity;
        private String country;
        private String city;
        private String region;
        private String imageUrl;
        private String nftImageUrl;
        private String nftMetadataUri;
        private Integer pointReward;
        private Boolean isActive;
        private Boolean isSeasonalEvent;
        private LocalDateTime eventStartAt;
        private LocalDateTime eventEndAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationStatsResponse {
        private Integer totalLocations;
        private Integer activeLocations;
        private Integer seasonalEvents;
        private Integer commonCount;
        private Integer rareCount;
        private Integer epicCount;
        private Integer legendaryCount;
    }
}
