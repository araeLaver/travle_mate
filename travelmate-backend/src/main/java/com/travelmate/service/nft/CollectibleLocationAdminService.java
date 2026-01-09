package com.travelmate.service.nft;

import com.travelmate.dto.NftDto;
import com.travelmate.entity.nft.CollectibleLocation;
import com.travelmate.entity.nft.LocationCategory;
import com.travelmate.entity.nft.Rarity;
import com.travelmate.repository.nft.CollectibleLocationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 수집 가능 장소 관리 (Admin)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CollectibleLocationAdminService {

    private final CollectibleLocationRepository collectibleLocationRepository;

    /**
     * 장소 목록 조회 (Admin)
     */
    @Transactional(readOnly = true)
    public Page<NftDto.CollectibleLocationAdminResponse> getAllLocations(Pageable pageable) {
        Page<CollectibleLocation> locations = collectibleLocationRepository.findAll(pageable);
        return locations.map(this::toAdminResponse);
    }

    /**
     * 장소 상세 조회
     */
    @Transactional(readOnly = true)
    public NftDto.CollectibleLocationAdminResponse getLocation(Long id) {
        CollectibleLocation location = collectibleLocationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("장소를 찾을 수 없습니다: " + id));
        return toAdminResponse(location);
    }

    /**
     * 장소 생성
     */
    @Transactional
    public NftDto.CollectibleLocationAdminResponse createLocation(NftDto.CreateLocationRequest request) {
        CollectibleLocation location = CollectibleLocation.builder()
                .name(request.getName())
                .description(request.getDescription())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .collectRadius(request.getCollectRadius() != null ? request.getCollectRadius().doubleValue() : 50.0)
                .category(request.getCategory())
                .rarity(request.getRarity())
                .country(request.getCountry())
                .city(request.getCity())
                .region(request.getRegion())
                .imageUrl(request.getImageUrl())
                .nftImageUrl(request.getNftImageUrl())
                .nftMetadataUri(request.getNftMetadataUri())
                .pointReward(request.getPointReward())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .isSeasonalEvent(request.getIsSeasonalEvent() != null ? request.getIsSeasonalEvent() : false)
                .eventStartAt(request.getEventStartAt())
                .eventEndAt(request.getEventEndAt())
                .build();

        location = collectibleLocationRepository.save(location);

        log.info("수집 장소 생성: id={}, name={}", location.getId(), location.getName());

        return toAdminResponse(location);
    }

    /**
     * 장소 수정
     */
    @Transactional
    public NftDto.CollectibleLocationAdminResponse updateLocation(Long id, NftDto.UpdateLocationRequest request) {
        CollectibleLocation location = collectibleLocationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("장소를 찾을 수 없습니다: " + id));

        if (request.getName() != null) location.setName(request.getName());
        if (request.getDescription() != null) location.setDescription(request.getDescription());
        if (request.getLatitude() != null) location.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) location.setLongitude(request.getLongitude());
        if (request.getCollectRadius() != null) location.setCollectRadius(request.getCollectRadius().doubleValue());
        if (request.getCategory() != null) location.setCategory(request.getCategory());
        if (request.getRarity() != null) location.setRarity(request.getRarity());
        if (request.getCountry() != null) location.setCountry(request.getCountry());
        if (request.getCity() != null) location.setCity(request.getCity());
        if (request.getRegion() != null) location.setRegion(request.getRegion());
        if (request.getImageUrl() != null) location.setImageUrl(request.getImageUrl());
        if (request.getNftImageUrl() != null) location.setNftImageUrl(request.getNftImageUrl());
        if (request.getNftMetadataUri() != null) location.setNftMetadataUri(request.getNftMetadataUri());
        if (request.getPointReward() != null) location.setPointReward(request.getPointReward());
        if (request.getIsActive() != null) location.setIsActive(request.getIsActive());
        if (request.getIsSeasonalEvent() != null) location.setIsSeasonalEvent(request.getIsSeasonalEvent());
        if (request.getEventStartAt() != null) location.setEventStartAt(request.getEventStartAt());
        if (request.getEventEndAt() != null) location.setEventEndAt(request.getEventEndAt());

        location = collectibleLocationRepository.save(location);

        log.info("수집 장소 수정: id={}, name={}", location.getId(), location.getName());

        return toAdminResponse(location);
    }

    /**
     * 장소 활성화/비활성화
     */
    @Transactional
    public void toggleActive(Long id) {
        CollectibleLocation location = collectibleLocationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("장소를 찾을 수 없습니다: " + id));

        location.setIsActive(!location.getIsActive());
        collectibleLocationRepository.save(location);

        log.info("장소 상태 변경: id={}, isActive={}", location.getId(), location.getIsActive());
    }

    /**
     * 장소 삭제
     */
    @Transactional
    public void deleteLocation(Long id) {
        CollectibleLocation location = collectibleLocationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("장소를 찾을 수 없습니다: " + id));

        collectibleLocationRepository.delete(location);

        log.info("수집 장소 삭제: id={}, name={}", id, location.getName());
    }

    /**
     * 시즌 이벤트 장소 조회
     */
    @Transactional(readOnly = true)
    public List<NftDto.CollectibleLocationAdminResponse> getSeasonalEvents() {
        List<CollectibleLocation> locations = collectibleLocationRepository
                .findByIsSeasonalEventTrueAndIsActiveTrue();
        return locations.stream().map(this::toAdminResponse).toList();
    }

    /**
     * 카테고리별 통계
     */
    @Transactional(readOnly = true)
    public NftDto.LocationStatsResponse getLocationStats() {
        long total = collectibleLocationRepository.count();
        long active = collectibleLocationRepository.countByIsActiveTrue();
        long seasonal = collectibleLocationRepository.countByIsSeasonalEventTrue();

        // 희귀도별 카운트
        int commonCount = collectibleLocationRepository.countByRarity(Rarity.COMMON);
        int rareCount = collectibleLocationRepository.countByRarity(Rarity.RARE);
        int epicCount = collectibleLocationRepository.countByRarity(Rarity.EPIC);
        int legendaryCount = collectibleLocationRepository.countByRarity(Rarity.LEGENDARY);

        return NftDto.LocationStatsResponse.builder()
                .totalLocations((int) total)
                .activeLocations((int) active)
                .seasonalEvents((int) seasonal)
                .commonCount(commonCount)
                .rareCount(rareCount)
                .epicCount(epicCount)
                .legendaryCount(legendaryCount)
                .build();
    }

    /**
     * 대량 장소 생성 (CSV/JSON import)
     */
    @Transactional
    public int bulkCreateLocations(List<NftDto.CreateLocationRequest> requests) {
        int created = 0;
        for (NftDto.CreateLocationRequest request : requests) {
            try {
                createLocation(request);
                created++;
            } catch (Exception e) {
                log.error("장소 생성 실패: name={}, error={}", request.getName(), e.getMessage());
            }
        }
        log.info("대량 장소 생성 완료: {}/{}", created, requests.size());
        return created;
    }

    // ===== Helper Methods =====

    private NftDto.CollectibleLocationAdminResponse toAdminResponse(CollectibleLocation loc) {
        return NftDto.CollectibleLocationAdminResponse.builder()
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
                .nftMetadataUri(loc.getNftMetadataUri())
                .pointReward(loc.getPointReward() != null ? loc.getPointReward().longValue() : 0L)
                .isActive(loc.getIsActive())
                .isSeasonalEvent(loc.getIsSeasonalEvent())
                .eventStartAt(loc.getEventStartAt())
                .eventEndAt(loc.getEventEndAt())
                .createdAt(loc.getCreatedAt())
                .updatedAt(loc.getUpdatedAt())
                .build();
    }
}
