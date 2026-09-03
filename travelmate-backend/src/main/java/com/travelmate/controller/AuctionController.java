package com.travelmate.controller;

import com.travelmate.security.AuthenticatedUserId;
import com.travelmate.entity.nft.AuctionBid;
import com.travelmate.entity.nft.NftAuction;
import com.travelmate.service.nft.AuctionService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/nft/auctions")
@RequiredArgsConstructor
public class AuctionController {

    private final AuctionService auctionService;

    @GetMapping
    public ResponseEntity<Page<NftAuction>> getActiveAuctions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auctionService.getActiveAuctions(PageRequest.of(page, size)));
    }

    @GetMapping("/{auctionId}")
    public ResponseEntity<NftAuction> getAuction(@PathVariable Long auctionId) {
        return ResponseEntity.ok(auctionService.getAuction(auctionId));
    }

    @GetMapping("/{auctionId}/bids")
    public ResponseEntity<List<AuctionBid>> getAuctionBids(@PathVariable Long auctionId) {
        return ResponseEntity.ok(auctionService.getAuctionBids(auctionId));
    }

    @PostMapping
    public ResponseEntity<?> createAuction(@RequestBody CreateAuctionRequest request, Authentication auth) {
        Long userId = AuthenticatedUserId.parse(auth);
        NftAuction auction = auctionService.createAuction(
                userId,
                request.getNftCollectionId(),
                request.getStartingPrice(),
                request.getBuyNowPrice(),
                request.getDurationHours() != null ? request.getDurationHours() : 24
        );
        return ResponseEntity.ok(Map.of(
                "auctionId", auction.getId(),
                "endAt", auction.getEndAt().toString()
        ));
    }

    @PostMapping("/{auctionId}/bid")
    public ResponseEntity<?> placeBid(@PathVariable Long auctionId,
                                       @RequestBody BidRequest request,
                                       Authentication auth) {
        Long userId = AuthenticatedUserId.parse(auth);
        AuctionBid bid = auctionService.placeBid(auctionId, userId, request.getAmount());
        return ResponseEntity.ok(Map.of(
                "bidId", bid.getId(),
                "amount", bid.getBidAmount(),
                "isWinning", bid.getIsWinning()
        ));
    }

    @PostMapping("/{auctionId}/buy-now")
    public ResponseEntity<?> buyNow(@PathVariable Long auctionId, Authentication auth) {
        Long userId = AuthenticatedUserId.parse(auth);
        NftAuction auction = auctionService.buyNow(auctionId, userId);
        return ResponseEntity.ok(Map.of(
                "message", "즉시 구매 완료",
                "price", auction.getCurrentPrice()
        ));
    }

    @DeleteMapping("/{auctionId}")
    public ResponseEntity<?> cancelAuction(@PathVariable Long auctionId, Authentication auth) {
        Long userId = AuthenticatedUserId.parse(auth);
        auctionService.cancelAuction(auctionId, userId);
        return ResponseEntity.ok(Map.of("message", "경매가 취소되었습니다."));
    }

    @GetMapping("/my-auctions")
    public ResponseEntity<?> getMyAuctions(Authentication auth) {
        Long userId = AuthenticatedUserId.parse(auth);
        return ResponseEntity.ok(auctionService.getMyAuctions(userId));
    }

    @GetMapping("/my-bids")
    public ResponseEntity<?> getMyBids(Authentication auth) {
        Long userId = AuthenticatedUserId.parse(auth);
        return ResponseEntity.ok(auctionService.getMyBids(userId));
    }

    @Data
    public static class CreateAuctionRequest {
        private Long nftCollectionId;
        private Long startingPrice;
        private Long buyNowPrice;
        private Integer durationHours;
    }

    @Data
    public static class BidRequest {
        private Long amount;
    }
}
