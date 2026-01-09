package com.travelmate.service.nft;

import com.travelmate.dto.NftDto;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.*;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.NftMarketplaceListingRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketplaceService {

    private final NftMarketplaceListingRepository marketplaceListingRepository;
    private final UserNftCollectionRepository userNftCollectionRepository;
    private final UserRepository userRepository;
    private final PointService pointService;

    private static final int DEFAULT_LISTING_DURATION_DAYS = 7;
    private static final int MAX_LISTING_DURATION_DAYS = 30;

    /**
     * 마켓플레이스 리스팅 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<NftDto.MarketplaceListingResponse> getActiveListings(Pageable pageable) {
        Page<NftMarketplaceListing> listings = marketplaceListingRepository.findActiveListings(pageable);
        return listings.map(this::toListingResponse);
    }

    /**
     * 가격 범위로 리스팅 조회
     */
    @Transactional(readOnly = true)
    public Page<NftDto.MarketplaceListingResponse> getListingsByPriceRange(
            Long minPrice, Long maxPrice, Pageable pageable) {
        Page<NftMarketplaceListing> listings = marketplaceListingRepository
                .findByPriceRange(minPrice, maxPrice, pageable);
        return listings.map(this::toListingResponse);
    }

    /**
     * 희귀도별 리스팅 조회
     */
    @Transactional(readOnly = true)
    public Page<NftDto.MarketplaceListingResponse> getListingsByRarity(Rarity rarity, Pageable pageable) {
        Page<NftMarketplaceListing> listings = marketplaceListingRepository.findByRarity(rarity, pageable);
        return listings.map(this::toListingResponse);
    }

    /**
     * NFT 판매 등록
     */
    @Transactional
    public NftDto.MarketplaceListingResponse createListing(Long sellerId, NftDto.CreateListingRequest request) {
        // 1. NFT 컬렉션 조회
        UserNftCollection nftCollection = userNftCollectionRepository.findById(request.getNftCollectionId())
                .orElseThrow(() -> new RuntimeException("NFT를 찾을 수 없습니다"));

        // 2. 소유권 확인
        if (!nftCollection.getUser().getId().equals(sellerId)) {
            throw new RuntimeException("해당 NFT의 소유자가 아닙니다");
        }

        // 3. 이미 판매 중인지 확인
        boolean isListed = marketplaceListingRepository.isNftListed(request.getNftCollectionId());
        if (isListed) {
            throw new IllegalStateException("이미 판매 중인 NFT입니다");
        }

        // 4. 판매자 조회
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        // 5. 리스팅 기간 설정
        int durationDays = request.getDurationDays() != null
                ? Math.min(request.getDurationDays(), MAX_LISTING_DURATION_DAYS)
                : DEFAULT_LISTING_DURATION_DAYS;

        LocalDateTime expiresAt = LocalDateTime.now().plusDays(durationDays);

        // 6. 리스팅 생성
        NftMarketplaceListing listing = NftMarketplaceListing.builder()
                .seller(seller)
                .nftCollection(nftCollection)
                .priceInPoints(request.getPriceInPoints())
                .status(ListingStatus.ACTIVE)
                .listedAt(LocalDateTime.now())
                .expiresAt(expiresAt)
                .build();

        listing = marketplaceListingRepository.save(listing);

        log.info("NFT 판매 등록: listingId={}, sellerId={}, nftId={}, price={}",
                listing.getId(), sellerId, nftCollection.getId(), request.getPriceInPoints());

        return toListingResponse(listing);
    }

    /**
     * NFT 구매
     */
    @Transactional
    public NftDto.BuyNftResponse buyNft(Long buyerId, Long listingId) {
        // 1. 리스팅 조회
        NftMarketplaceListing listing = marketplaceListingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("판매 리스팅을 찾을 수 없습니다"));

        // 2. 상태 확인
        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new IllegalStateException("판매 중인 NFT가 아닙니다");
        }

        // 3. 만료 확인
        if (listing.getExpiresAt() != null && listing.getExpiresAt().isBefore(LocalDateTime.now())) {
            listing.setStatus(ListingStatus.EXPIRED);
            marketplaceListingRepository.save(listing);
            throw new IllegalStateException("판매 기간이 만료되었습니다");
        }

        // 4. 자기 자신 구매 방지
        if (listing.getSeller().getId().equals(buyerId)) {
            throw new IllegalStateException("본인의 NFT는 구매할 수 없습니다");
        }

        // 5. 구매자 조회
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        // 6. 포인트 잔액 확인
        Long price = listing.getPriceInPoints();
        if (!pointService.hasEnoughPoints(buyerId, price)) {
            throw new IllegalStateException("포인트가 부족합니다");
        }

        // 7. 포인트 차감 (구매자)
        pointService.spendPoints(
                buyerId,
                price,
                PointSource.MARKETPLACE_PURCHASE,
                listing.getNftCollection().getLocation().getName() + " NFT 구매",
                listingId,
                "MARKETPLACE_PURCHASE"
        );

        // 8. 포인트 지급 (판매자)
        pointService.earnPoints(
                listing.getSeller().getId(),
                price,
                PointSource.MARKETPLACE_SALE,
                listing.getNftCollection().getLocation().getName() + " NFT 판매",
                listingId,
                "MARKETPLACE_SALE"
        );

        // 9. NFT 소유권 이전
        UserNftCollection nftCollection = listing.getNftCollection();
        nftCollection.setUser(buyer);
        userNftCollectionRepository.save(nftCollection);

        // 10. 리스팅 상태 업데이트
        listing.setBuyer(buyer);
        listing.setStatus(ListingStatus.SOLD);
        listing.setSoldAt(LocalDateTime.now());
        marketplaceListingRepository.save(listing);

        // 11. 사용자 통계 업데이트
        buyer.setTotalNftsCollected(buyer.getTotalNftsCollected() + 1);
        userRepository.save(buyer);

        User seller = listing.getSeller();
        seller.setTotalNftsCollected(seller.getTotalNftsCollected() - 1);
        userRepository.save(seller);

        log.info("NFT 구매 완료: listingId={}, buyerId={}, sellerId={}, price={}",
                listingId, buyerId, seller.getId(), price);

        // 12. 구매자의 남은 잔액 조회
        Long remainingBalance = pointService.getBalance(buyerId).getTotalPoints();

        return NftDto.BuyNftResponse.builder()
                .success(true)
                .message("NFT를 성공적으로 구매했습니다!")
                .nftCollection(toUserNftCollectionResponse(nftCollection))
                .pointsSpent(price)
                .remainingBalance(remainingBalance)
                .build();
    }

    /**
     * 판매 취소
     */
    @Transactional
    public void cancelListing(Long sellerId, Long listingId) {
        NftMarketplaceListing listing = marketplaceListingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("판매 리스팅을 찾을 수 없습니다"));

        if (!listing.getSeller().getId().equals(sellerId)) {
            throw new RuntimeException("해당 리스팅의 판매자가 아닙니다");
        }

        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new IllegalStateException("취소할 수 없는 상태입니다");
        }

        listing.setStatus(ListingStatus.CANCELLED);
        marketplaceListingRepository.save(listing);

        log.info("판매 취소: listingId={}, sellerId={}", listingId, sellerId);
    }

    /**
     * 내 판매 리스팅 조회
     */
    @Transactional(readOnly = true)
    public Page<NftDto.MarketplaceListingResponse> getMyListings(Long sellerId, Pageable pageable) {
        Page<NftMarketplaceListing> listings = marketplaceListingRepository
                .findBySellerIdOrderByListedAtDesc(sellerId, pageable);
        return listings.map(this::toListingResponse);
    }

    /**
     * 내 구매 내역 조회
     */
    @Transactional(readOnly = true)
    public Page<NftDto.MarketplaceListingResponse> getMyPurchases(Long buyerId, Pageable pageable) {
        Page<NftMarketplaceListing> listings = marketplaceListingRepository
                .findByBuyerIdAndStatusOrderBySoldAtDesc(buyerId, ListingStatus.SOLD, pageable);
        return listings.map(this::toListingResponse);
    }

    /**
     * 만료된 리스팅 자동 처리 (스케줄러에서 호출)
     */
    @Transactional
    public int processExpiredListings() {
        int updated = marketplaceListingRepository.updateExpiredListings();
        if (updated > 0) {
            log.info("만료된 리스팅 {} 건 처리 완료", updated);
        }
        return updated;
    }

    // ===== Helper Methods =====

    private NftDto.MarketplaceListingResponse toListingResponse(NftMarketplaceListing listing) {
        User seller = listing.getSeller();
        UserNftCollection nftCollection = listing.getNftCollection();
        CollectibleLocation location = nftCollection.getLocation();

        return NftDto.MarketplaceListingResponse.builder()
                .id(listing.getId())
                .nftCollection(NftDto.UserNftCollectionResponse.builder()
                        .id(nftCollection.getId())
                        .location(NftDto.CollectibleLocationSummary.builder()
                                .id(location.getId())
                                .name(location.getName())
                                .imageUrl(location.getImageUrl())
                                .nftImageUrl(location.getNftImageUrl())
                                .rarity(location.getRarity())
                                .category(location.getCategory())
                                .city(location.getCity())
                                .country(location.getCountry())
                                .build())
                        .tokenId(nftCollection.getTokenId())
                        .mintStatus(nftCollection.getMintStatus())
                        .collectedAt(nftCollection.getCollectedAt())
                        .earnedPoints(nftCollection.getEarnedPoints() != null ? nftCollection.getEarnedPoints().longValue() : 0L)
                        .isVerified(nftCollection.getIsVerified())
                        .build())
                .seller(NftDto.SellerInfo.builder()
                        .id(seller.getId())
                        .nickname(seller.getNickname())
                        .profileImageUrl(seller.getProfileImageUrl())
                        .build())
                .priceInPoints(listing.getPriceInPoints())
                .status(listing.getStatus())
                .listedAt(listing.getListedAt())
                .expiresAt(listing.getExpiresAt())
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
