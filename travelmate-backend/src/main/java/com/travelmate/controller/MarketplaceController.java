package com.travelmate.controller;

import com.travelmate.dto.NftDto;
import com.travelmate.entity.nft.Rarity;
import com.travelmate.service.nft.MarketplaceService;
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

@RestController
@RequestMapping("/api/marketplace")
@RequiredArgsConstructor
@CrossOrigin(origins = {"${app.cors.allowed-origins:http://localhost:3000}"})
public class MarketplaceController {

    private final MarketplaceService marketplaceService;

    /**
     * 마켓플레이스 리스팅 목록 조회
     */
    @GetMapping("/listings")
    public ResponseEntity<Page<NftDto.MarketplaceListingResponse>> getActiveListings(
            @PageableDefault(size = 20, sort = "listedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<NftDto.MarketplaceListingResponse> listings = marketplaceService.getActiveListings(pageable);
        return ResponseEntity.ok(listings);
    }

    /**
     * 가격 범위로 리스팅 조회
     */
    @GetMapping("/listings/price")
    public ResponseEntity<Page<NftDto.MarketplaceListingResponse>> getListingsByPriceRange(
            @RequestParam Long minPrice,
            @RequestParam Long maxPrice,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<NftDto.MarketplaceListingResponse> listings =
                marketplaceService.getListingsByPriceRange(minPrice, maxPrice, pageable);
        return ResponseEntity.ok(listings);
    }

    /**
     * 희귀도별 리스팅 조회
     */
    @GetMapping("/listings/rarity/{rarity}")
    public ResponseEntity<Page<NftDto.MarketplaceListingResponse>> getListingsByRarity(
            @PathVariable Rarity rarity,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<NftDto.MarketplaceListingResponse> listings =
                marketplaceService.getListingsByRarity(rarity, pageable);
        return ResponseEntity.ok(listings);
    }

    /**
     * NFT 판매 등록
     */
    @PostMapping("/list")
    public ResponseEntity<NftDto.MarketplaceListingResponse> createListing(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody NftDto.CreateListingRequest request) {
        Long userIdLong = Long.parseLong(userId);
        NftDto.MarketplaceListingResponse listing = marketplaceService.createListing(userIdLong, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(listing);
    }

    /**
     * NFT 구매
     */
    @PostMapping("/buy/{listingId}")
    public ResponseEntity<NftDto.BuyNftResponse> buyNft(
            @AuthenticationPrincipal String userId,
            @PathVariable Long listingId) {
        Long userIdLong = Long.parseLong(userId);
        NftDto.BuyNftResponse response = marketplaceService.buyNft(userIdLong, listingId);
        return ResponseEntity.ok(response);
    }

    /**
     * 판매 취소
     */
    @DeleteMapping("/listings/{listingId}")
    public ResponseEntity<Void> cancelListing(
            @AuthenticationPrincipal String userId,
            @PathVariable Long listingId) {
        Long userIdLong = Long.parseLong(userId);
        marketplaceService.cancelListing(userIdLong, listingId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 내 판매 리스팅 조회
     */
    @GetMapping("/my-listings")
    public ResponseEntity<Page<NftDto.MarketplaceListingResponse>> getMyListings(
            @AuthenticationPrincipal String userId,
            @PageableDefault(size = 20, sort = "listedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long userIdLong = Long.parseLong(userId);
        Page<NftDto.MarketplaceListingResponse> listings = marketplaceService.getMyListings(userIdLong, pageable);
        return ResponseEntity.ok(listings);
    }

    /**
     * 내 구매 내역 조회
     */
    @GetMapping("/my-purchases")
    public ResponseEntity<Page<NftDto.MarketplaceListingResponse>> getMyPurchases(
            @AuthenticationPrincipal String userId,
            @PageableDefault(size = 20, sort = "soldAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long userIdLong = Long.parseLong(userId);
        Page<NftDto.MarketplaceListingResponse> purchases = marketplaceService.getMyPurchases(userIdLong, pageable);
        return ResponseEntity.ok(purchases);
    }
}
