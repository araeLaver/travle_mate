package com.travelmate.service.nft;

import com.travelmate.entity.User;
import com.travelmate.entity.nft.*;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.AuctionBidRepository;
import com.travelmate.repository.nft.NftAuctionRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuctionService {

    private final NftAuctionRepository auctionRepository;
    private final AuctionBidRepository bidRepository;
    private final UserNftCollectionRepository nftCollectionRepository;
    private final UserRepository userRepository;

    public NftAuction createAuction(Long sellerId, Long nftCollectionId,
                                     Long startingPrice, Long buyNowPrice,
                                     int durationHours) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        UserNftCollection nft = nftCollectionRepository.findById(nftCollectionId)
                .orElseThrow(() -> new IllegalArgumentException("NFT를 찾을 수 없습니다."));

        if (!nft.getUser().getId().equals(sellerId)) {
            throw new IllegalStateException("본인 소유의 NFT만 경매에 등록할 수 있습니다.");
        }

        if (auctionRepository.existsByNftCollectionIdAndStatus(nftCollectionId, NftAuction.AuctionStatus.ACTIVE)) {
            throw new IllegalStateException("이미 경매 중인 NFT입니다.");
        }

        NftAuction auction = NftAuction.builder()
                .seller(seller)
                .nftCollection(nft)
                .startingPrice(startingPrice)
                .currentPrice(startingPrice)
                .buyNowPrice(buyNowPrice)
                .startAt(LocalDateTime.now())
                .endAt(LocalDateTime.now().plusHours(durationHours))
                .build();

        NftAuction saved = auctionRepository.save(auction);
        log.info("경매 생성: auctionId={}, nftId={}, startPrice={}", saved.getId(), nftCollectionId, startingPrice);
        return saved;
    }

    public AuctionBid placeBid(Long auctionId, Long bidderId, Long bidAmount) {
        NftAuction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("경매를 찾을 수 없습니다."));

        if (!auction.isActive()) {
            throw new IllegalStateException("종료된 경매입니다.");
        }

        if (auction.getSeller().getId().equals(bidderId)) {
            throw new IllegalStateException("본인 경매에는 입찰할 수 없습니다.");
        }

        if (bidAmount <= auction.getCurrentPrice()) {
            throw new IllegalArgumentException(
                    String.format("입찰가는 현재가(%d)보다 높아야 합니다.", auction.getCurrentPrice()));
        }

        if (bidAmount < auction.getCurrentPrice() + auction.getMinBidIncrement()) {
            throw new IllegalArgumentException(
                    String.format("최소 입찰 단위는 %d 포인트입니다.", auction.getMinBidIncrement()));
        }

        User bidder = userRepository.findById(bidderId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 이전 최고 입찰 비활성화
        bidRepository.findTopByAuctionIdOrderByBidAmountDesc(auctionId)
                .ifPresent(prev -> {
                    prev.setIsWinning(false);
                    bidRepository.save(prev);
                });

        AuctionBid bid = AuctionBid.builder()
                .auction(auction)
                .bidder(bidder)
                .bidAmount(bidAmount)
                .isWinning(true)
                .build();

        AuctionBid savedBid = bidRepository.save(bid);

        auction.setCurrentPrice(bidAmount);
        auction.setHighestBidder(bidder);
        auction.setBidCount(auction.getBidCount() + 1);
        auctionRepository.save(auction);

        log.info("입찰: auctionId={}, bidderId={}, amount={}", auctionId, bidderId, bidAmount);

        // 즉시 구매가 도달 시 자동 낙찰
        if (auction.getBuyNowPrice() != null && bidAmount >= auction.getBuyNowPrice()) {
            settleAuction(auctionId);
        }

        return savedBid;
    }

    public NftAuction buyNow(Long auctionId, Long buyerId) {
        NftAuction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("경매를 찾을 수 없습니다."));

        if (!auction.isActive()) {
            throw new IllegalStateException("종료된 경매입니다.");
        }

        if (auction.getBuyNowPrice() == null) {
            throw new IllegalStateException("즉시 구매가가 설정되지 않은 경매입니다.");
        }

        if (auction.getSeller().getId().equals(buyerId)) {
            throw new IllegalStateException("본인 경매는 즉시 구매할 수 없습니다.");
        }

        // 즉시 구매가로 입찰
        placeBid(auctionId, buyerId, auction.getBuyNowPrice());
        return auctionRepository.findById(auctionId).orElseThrow();
    }

    public void settleAuction(Long auctionId) {
        NftAuction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("경매를 찾을 수 없습니다."));

        if (auction.getHighestBidder() == null) {
            auction.setStatus(NftAuction.AuctionStatus.NO_BIDS);
            auctionRepository.save(auction);
            log.info("경매 유찰: auctionId={}", auctionId);
            return;
        }

        // NFT 소유권 이전
        UserNftCollection nft = auction.getNftCollection();
        nft.setUser(auction.getHighestBidder());
        nftCollectionRepository.save(nft);

        auction.setStatus(NftAuction.AuctionStatus.SOLD);
        auction.setSettledAt(LocalDateTime.now());
        auctionRepository.save(auction);

        log.info("경매 낙찰: auctionId={}, winnerId={}, price={}",
                auctionId, auction.getHighestBidder().getId(), auction.getCurrentPrice());
    }

    public void cancelAuction(Long auctionId, Long sellerId) {
        NftAuction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("경매를 찾을 수 없습니다."));

        if (!auction.getSeller().getId().equals(sellerId)) {
            throw new IllegalStateException("본인 경매만 취소할 수 있습니다.");
        }

        if (auction.getBidCount() > 0) {
            throw new IllegalStateException("입찰이 있는 경매는 취소할 수 없습니다.");
        }

        auction.setStatus(NftAuction.AuctionStatus.CANCELLED);
        auctionRepository.save(auction);
        log.info("경매 취소: auctionId={}", auctionId);
    }

    public void settleExpiredAuctions() {
        List<NftAuction> expired = auctionRepository.findExpiredAuctions(LocalDateTime.now());
        for (NftAuction auction : expired) {
            settleAuction(auction.getId());
        }
        if (!expired.isEmpty()) {
            log.info("만료 경매 {}건 정산 완료", expired.size());
        }
    }

    @Transactional(readOnly = true)
    public Page<NftAuction> getActiveAuctions(Pageable pageable) {
        return auctionRepository.findByStatusOrderByEndAtAsc(NftAuction.AuctionStatus.ACTIVE, pageable);
    }

    @Transactional(readOnly = true)
    public NftAuction getAuction(Long auctionId) {
        return auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("경매를 찾을 수 없습니다."));
    }

    @Transactional(readOnly = true)
    public List<AuctionBid> getAuctionBids(Long auctionId) {
        return bidRepository.findByAuctionIdOrderByBidAmountDesc(auctionId);
    }

    @Transactional(readOnly = true)
    public List<NftAuction> getMyAuctions(Long userId) {
        return auctionRepository.findBySellerId(userId);
    }

    @Transactional(readOnly = true)
    public List<NftAuction> getMyBids(Long userId) {
        return auctionRepository.findActiveByBidderId(userId);
    }
}
