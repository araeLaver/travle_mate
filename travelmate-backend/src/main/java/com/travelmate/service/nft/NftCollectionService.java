package com.travelmate.service.nft;

import com.travelmate.dto.NftDto;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.*;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.CollectibleLocationRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NftCollectionService {

    private final CollectibleLocationRepository collectibleLocationRepository;
    private final UserNftCollectionRepository userNftCollectionRepository;
    private final UserRepository userRepository;
    private final PointService pointService;
    private final GpsVerificationService gpsVerificationService;
    private final AchievementService achievementService;

    /**
     * NFT 수집 가능 장소 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<NftDto.CollectibleLocationResponse> getCollectibleLocations(
            Long userId,
            Pageable pageable) {

        Page<CollectibleLocation> locations = collectibleLocationRepository.findByIsActiveTrue(pageable);

        return locations.map(loc -> toCollectibleLocationResponse(loc, userId, null));
    }

    /**
     * 주변 수집 가능 장소 조회
     */
    @Transactional(readOnly = true)
    public List<NftDto.CollectibleLocationResponse> getNearbyLocations(
            Long userId,
            Double latitude,
            Double longitude,
            Double radiusKm) {

        List<CollectibleLocation> locations = collectibleLocationRepository
                .findNearbyActiveLocations(latitude, longitude, radiusKm);

        return locations.stream()
                .map(loc -> {
                    double distance = gpsVerificationService.calculateDistance(
                            latitude, longitude, loc.getLatitude(), loc.getLongitude());
                    return toCollectibleLocationResponse(loc, userId, distance);
                })
                .toList();
    }

    /**
     * 카테고리별 장소 조회
     */
    @Transactional(readOnly = true)
    public Page<NftDto.CollectibleLocationResponse> getLocationsByCategory(
            Long userId,
            LocationCategory category,
            Pageable pageable) {

        Page<CollectibleLocation> locations = collectibleLocationRepository
                .findByCategoryAndIsActiveTrue(category, pageable);

        return locations.map(loc -> toCollectibleLocationResponse(loc, userId, null));
    }

    /**
     * NFT 수집
     */
    @Transactional
    public NftDto.CollectNftResponse collectNft(Long userId, NftDto.CollectNftRequest request) {
        // 1. 장소 조회
        CollectibleLocation location = collectibleLocationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new RuntimeException("수집 가능한 장소를 찾을 수 없습니다"));

        if (!location.getIsActive()) {
            throw new IllegalStateException("현재 수집이 불가능한 장소입니다");
        }

        // 2. 시즌 이벤트 확인
        if (location.getIsSeasonalEvent()) {
            LocalDateTime now = LocalDateTime.now();
            if (location.getEventStartAt() != null && now.isBefore(location.getEventStartAt())) {
                throw new IllegalStateException("이벤트가 아직 시작되지 않았습니다");
            }
            if (location.getEventEndAt() != null && now.isAfter(location.getEventEndAt())) {
                throw new IllegalStateException("이벤트가 종료되었습니다");
            }
        }

        // 3. 이미 수집했는지 확인
        boolean alreadyCollected = userNftCollectionRepository
                .existsByUserIdAndLocationId(userId, location.getId());
        if (alreadyCollected) {
            throw new IllegalStateException("이미 수집한 장소입니다");
        }

        // 4. GPS 검증 (GpsVerificationService 사용)
        GpsVerificationService.GpsVerificationRequest gpsRequest = new GpsVerificationService.GpsVerificationRequest(
                userId,
                request.getLatitude(),
                request.getLongitude(),
                location.getLatitude(),
                location.getLongitude(),
                location.getCollectRadius().intValue(),
                request.getGpsAccuracy(),
                request.getIsMockLocation(),
                request.getDeviceId()
        );

        GpsVerificationService.GpsVerificationResult verificationResult = gpsVerificationService.verify(gpsRequest);

        if (!verificationResult.isValid()) {
            return NftDto.CollectNftResponse.builder()
                    .success(false)
                    .message(verificationResult.getMessage())
                    .build();
        }

        // 5. 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        // 6. NFT 컬렉션 생성
        UserNftCollection nftCollection = UserNftCollection.builder()
                .user(user)
                .location(location)
                .mintStatus(MintStatus.PENDING) // 블록체인 민팅은 별도 처리
                .collectedLatitude(request.getLatitude())
                .collectedLongitude(request.getLongitude())
                .collectedAt(LocalDateTime.now())
                .deviceId(request.getDeviceId())
                .gpsAccuracy(request.getGpsAccuracy() != null ? String.valueOf(request.getGpsAccuracy()) : null)
                .isVerified(true)
                .verificationMethod("GPS_DISTANCE")
                .earnedPoints(location.getPointReward())
                .build();

        nftCollection = userNftCollectionRepository.save(nftCollection);

        // 7. 포인트 지급
        Long pointReward = location.getPointReward() != null ? location.getPointReward().longValue() : 0L;
        pointService.earnPoints(
                userId,
                pointReward,
                PointSource.NFT_COLLECT,
                location.getName() + " NFT 수집",
                nftCollection.getId(),
                "NFT_COLLECTION"
        );

        // 8. 사용자 통계 업데이트
        user.setTotalNftsCollected(user.getTotalNftsCollected() + 1);
        user.setUniqueLocationsVisited(user.getUniqueLocationsVisited() + 1);
        userRepository.save(user);

        // 9. 업적 체크
        List<NftDto.AchievementUnlocked> unlockedAchievements = achievementService.checkAchievementsOnCollect(userId);

        log.info("NFT 수집 성공: userId={}, locationId={}, points={}",
                userId, location.getId(), location.getPointReward());

        return NftDto.CollectNftResponse.builder()
                .success(true)
                .message("NFT를 성공적으로 수집했습니다!")
                .nftCollection(toUserNftCollectionResponse(nftCollection))
                .earnedPoints(pointReward)
                .unlockedAchievements(unlockedAchievements)
                .build();
    }

    /**
     * 내 NFT 컬렉션 조회
     */
    @Transactional(readOnly = true)
    public Page<NftDto.UserNftCollectionResponse> getMyCollection(Long userId, Pageable pageable) {
        Page<UserNftCollection> collections = userNftCollectionRepository
                .findByUserIdOrderByCollectedAtDesc(userId, pageable);
        return collections.map(this::toUserNftCollectionResponse);
    }

    /**
     * 희귀도별 컬렉션 조회
     */
    @Transactional(readOnly = true)
    public Page<NftDto.UserNftCollectionResponse> getMyCollectionByRarity(
            Long userId,
            Rarity rarity,
            Pageable pageable) {
        Page<UserNftCollection> collections = userNftCollectionRepository
                .findByUserIdAndRarity(userId, rarity, pageable);
        return collections.map(this::toUserNftCollectionResponse);
    }

    /**
     * 특정 NFT 상세 조회
     */
    @Transactional(readOnly = true)
    public NftDto.UserNftCollectionResponse getNftDetail(Long userId, Long collectionId) {
        UserNftCollection collection = userNftCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new RuntimeException("NFT를 찾을 수 없습니다"));

        if (!collection.getUser().getId().equals(userId)) {
            throw new RuntimeException("접근 권한이 없습니다");
        }

        return toUserNftCollectionResponse(collection);
    }

    /**
     * 도감 조회
     */
    @Transactional(readOnly = true)
    public NftDto.CollectionBookResponse getCollectionBook(Long userId) {
        // 전체 통계
        int totalLocations = (int) collectibleLocationRepository.count();
        int collectedLocations = userNftCollectionRepository.countDistinctLocationsByUserId(userId);

        // 희귀도별 통계
        int commonCollected = userNftCollectionRepository.countByUserIdAndRarity(userId, Rarity.COMMON);
        int rareCollected = userNftCollectionRepository.countByUserIdAndRarity(userId, Rarity.RARE);
        int epicCollected = userNftCollectionRepository.countByUserIdAndRarity(userId, Rarity.EPIC);
        int legendaryCollected = userNftCollectionRepository.countByUserIdAndRarity(userId, Rarity.LEGENDARY);

        NftDto.CollectionStats stats = NftDto.CollectionStats.builder()
                .totalLocations(totalLocations)
                .collectedLocations(collectedLocations)
                .completionRate(totalLocations > 0 ? (double) collectedLocations / totalLocations * 100 : 0)
                .commonCollected(commonCollected)
                .rareCollected(rareCollected)
                .epicCollected(epicCollected)
                .legendaryCollected(legendaryCollected)
                .build();

        // 지역별 통계
        List<Object[]> regionStats = userNftCollectionRepository.getCollectionProgressByRegion(userId);
        List<NftDto.RegionCollection> regions = regionStats.stream()
                .map(row -> NftDto.RegionCollection.builder()
                        .region((String) row[0])
                        .country((String) row[1])
                        .total(((Number) row[2]).intValue())
                        .collected(((Number) row[3]).intValue())
                        .completionRate(((Number) row[4]).doubleValue())
                        .build())
                .toList();

        // 카테고리별 통계
        List<Object[]> categoryStats = userNftCollectionRepository.getCollectionProgressByCategory(userId);
        List<NftDto.CategoryCollection> categories = categoryStats.stream()
                .map(row -> NftDto.CategoryCollection.builder()
                        .category(LocationCategory.valueOf((String) row[0]))
                        .total(((Number) row[1]).intValue())
                        .collected(((Number) row[2]).intValue())
                        .completionRate(((Number) row[3]).doubleValue())
                        .build())
                .toList();

        return NftDto.CollectionBookResponse.builder()
                .stats(stats)
                .regions(regions)
                .categories(categories)
                .build();
    }

    /**
     * 사용자 NFT 통계
     */
    @Transactional(readOnly = true)
    public NftDto.UserNftStatsResponse getUserNftStats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        NftDto.CollectionBookResponse collectionBook = getCollectionBook(userId);

        return NftDto.UserNftStatsResponse.builder()
                .totalNftsCollected(user.getTotalNftsCollected())
                .uniqueLocationsVisited(user.getUniqueLocationsVisited())
                .totalPointsEarned(pointService.getBalance(userId).getLifetimeEarned())
                .globalRank(user.getGlobalRank())
                .regionRank(user.getRegionRank())
                .collectionStats(collectionBook.getStats())
                .build();
    }

    // ===== DTO 변환 =====

    private NftDto.CollectibleLocationResponse toCollectibleLocationResponse(
            CollectibleLocation loc,
            Long userId,
            Double distance) {

        boolean isCollected = userId != null &&
                userNftCollectionRepository.existsByUserIdAndLocationId(userId, loc.getId());

        return NftDto.CollectibleLocationResponse.builder()
                .id(loc.getId())
                .name(loc.getName())
                .description(loc.getDescription())
                .latitude(loc.getLatitude())
                .longitude(loc.getLongitude())
                .collectRadius(loc.getCollectRadius() != null ? loc.getCollectRadius().intValue() : 50)
                .category(loc.getCategory())
                .rarity(loc.getRarity())
                .country(loc.getCountry())
                .city(loc.getCity())
                .region(loc.getRegion())
                .imageUrl(loc.getImageUrl())
                .nftImageUrl(loc.getNftImageUrl())
                .pointReward(loc.getPointReward() != null ? loc.getPointReward().longValue() : 0L)
                .isCollected(isCollected)
                .isSeasonalEvent(loc.getIsSeasonalEvent())
                .eventEndAt(loc.getEventEndAt())
                .distance(distance)
                .build();
    }

    private NftDto.UserNftCollectionResponse toUserNftCollectionResponse(UserNftCollection collection) {
        CollectibleLocation loc = collection.getLocation();

        return NftDto.UserNftCollectionResponse.builder()
                .id(collection.getId())
                .location(NftDto.CollectibleLocationSummary.builder()
                        .id(loc.getId())
                        .name(loc.getName())
                        .imageUrl(loc.getImageUrl())
                        .nftImageUrl(loc.getNftImageUrl())
                        .rarity(loc.getRarity())
                        .category(loc.getCategory())
                        .city(loc.getCity())
                        .country(loc.getCountry())
                        .build())
                .tokenId(collection.getTokenId())
                .mintStatus(collection.getMintStatus())
                .collectedAt(collection.getCollectedAt())
                .earnedPoints(collection.getEarnedPoints() != null ? collection.getEarnedPoints().longValue() : 0L)
                .isVerified(collection.getIsVerified())
                .build();
    }
}
