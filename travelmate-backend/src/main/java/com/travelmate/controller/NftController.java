package com.travelmate.controller;

import com.travelmate.dto.NftDto;
import com.travelmate.entity.nft.LocationCategory;
import com.travelmate.entity.nft.Rarity;
import com.travelmate.service.nft.NftCollectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/nft")
@RequiredArgsConstructor
@CrossOrigin(origins = {"${app.cors.allowed-origins:http://localhost:3000}"})
public class NftController {

    private final NftCollectionService nftCollectionService;

    /**
     * 수집 가능 장소 목록 조회
     */
    @GetMapping("/collectible-locations")
    public ResponseEntity<Page<NftDto.CollectibleLocationResponse>> getCollectibleLocations(
            @AuthenticationPrincipal String userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long userIdLong = userId != null ? Long.parseLong(userId) : null;
        Page<NftDto.CollectibleLocationResponse> locations =
                nftCollectionService.getCollectibleLocations(userIdLong, pageable);
        return ResponseEntity.ok(locations);
    }

    /**
     * 주변 수집 가능 장소 조회
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<NftDto.CollectibleLocationResponse>> getNearbyLocations(
            @AuthenticationPrincipal String userId,
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "5.0") Double radiusKm) {
        Long userIdLong = userId != null ? Long.parseLong(userId) : null;
        List<NftDto.CollectibleLocationResponse> locations =
                nftCollectionService.getNearbyLocations(userIdLong, latitude, longitude, radiusKm);
        return ResponseEntity.ok(locations);
    }

    /**
     * 카테고리별 장소 조회
     */
    @GetMapping("/collectible-locations/category/{category}")
    public ResponseEntity<Page<NftDto.CollectibleLocationResponse>> getLocationsByCategory(
            @AuthenticationPrincipal String userId,
            @PathVariable LocationCategory category,
            @PageableDefault(size = 20) Pageable pageable) {
        Long userIdLong = userId != null ? Long.parseLong(userId) : null;
        Page<NftDto.CollectibleLocationResponse> locations =
                nftCollectionService.getLocationsByCategory(userIdLong, category, pageable);
        return ResponseEntity.ok(locations);
    }

    /**
     * NFT 수집
     */
    @PostMapping("/collect")
    public ResponseEntity<NftDto.CollectNftResponse> collectNft(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody NftDto.CollectNftRequest request) {
        Long userIdLong = Long.parseLong(userId);
        NftDto.CollectNftResponse response = nftCollectionService.collectNft(userIdLong, request);

        if (response.getSuccess()) {
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 내 NFT 컬렉션 조회
     */
    @GetMapping("/my-collection")
    public ResponseEntity<Page<NftDto.UserNftCollectionResponse>> getMyCollection(
            @AuthenticationPrincipal String userId,
            @PageableDefault(size = 20, sort = "collectedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long userIdLong = Long.parseLong(userId);
        Page<NftDto.UserNftCollectionResponse> collection =
                nftCollectionService.getMyCollection(userIdLong, pageable);
        return ResponseEntity.ok(collection);
    }

    /**
     * 희귀도별 내 컬렉션 조회
     */
    @GetMapping("/my-collection/rarity/{rarity}")
    public ResponseEntity<Page<NftDto.UserNftCollectionResponse>> getMyCollectionByRarity(
            @AuthenticationPrincipal String userId,
            @PathVariable Rarity rarity,
            @PageableDefault(size = 20) Pageable pageable) {
        Long userIdLong = Long.parseLong(userId);
        Page<NftDto.UserNftCollectionResponse> collection =
                nftCollectionService.getMyCollectionByRarity(userIdLong, rarity, pageable);
        return ResponseEntity.ok(collection);
    }

    /**
     * 특정 NFT 상세 조회
     */
    @GetMapping("/collection/{collectionId}")
    public ResponseEntity<NftDto.UserNftCollectionResponse> getNftDetail(
            @AuthenticationPrincipal String userId,
            @PathVariable Long collectionId) {
        Long userIdLong = Long.parseLong(userId);
        NftDto.UserNftCollectionResponse nft = nftCollectionService.getNftDetail(userIdLong, collectionId);
        return ResponseEntity.ok(nft);
    }

    /**
     * 도감 조회
     */
    @GetMapping("/collection-book")
    public ResponseEntity<NftDto.CollectionBookResponse> getCollectionBook(
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        NftDto.CollectionBookResponse collectionBook = nftCollectionService.getCollectionBook(userIdLong);
        return ResponseEntity.ok(collectionBook);
    }

    /**
     * NFT 통계 조회
     */
    @GetMapping("/stats")
    public ResponseEntity<NftDto.UserNftStatsResponse> getUserNftStats(
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        NftDto.UserNftStatsResponse stats = nftCollectionService.getUserNftStats(userIdLong);
        return ResponseEntity.ok(stats);
    }
}
