package com.travelmate.controller;

import com.travelmate.dto.NftDto;
import com.travelmate.entity.nft.PointTransactionType;
import com.travelmate.service.nft.PointService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
@CrossOrigin(origins = {"${app.cors.allowed-origins:http://localhost:3000}"})
public class PointController {

    private final PointService pointService;

    /**
     * 내 포인트 잔액 조회
     */
    @GetMapping("/balance")
    public ResponseEntity<NftDto.PointBalanceResponse> getBalance(
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        NftDto.PointBalanceResponse balance = pointService.getBalance(userIdLong);
        return ResponseEntity.ok(balance);
    }

    /**
     * 포인트 거래 내역 조회
     */
    @GetMapping("/transactions")
    public ResponseEntity<Page<NftDto.PointTransactionResponse>> getTransactions(
            @AuthenticationPrincipal String userId,
            @RequestParam(required = false) PointTransactionType type,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long userIdLong = Long.parseLong(userId);

        Page<NftDto.PointTransactionResponse> transactions;
        if (type != null) {
            transactions = pointService.getTransactionsByType(userIdLong, type, pageable);
        } else {
            transactions = pointService.getTransactions(userIdLong, pageable);
        }

        return ResponseEntity.ok(transactions);
    }

    /**
     * 포인트 전송
     */
    @PostMapping("/transfer")
    public ResponseEntity<Void> transferPoints(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody NftDto.PointTransferRequest request) {
        Long userIdLong = Long.parseLong(userId);
        pointService.transferPoints(userIdLong, request.getReceiverId(), request.getAmount(), request.getMessage());
        return ResponseEntity.ok().build();
    }

    /**
     * 전체 랭킹 조회
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<List<NftDto.LeaderboardEntry>> getLeaderboard(
            @RequestParam(defaultValue = "50") int limit) {
        List<NftDto.LeaderboardEntry> leaderboard = pointService.getLeaderboard(Math.min(limit, 100));
        return ResponseEntity.ok(leaderboard);
    }

    /**
     * 시즌 랭킹 조회
     */
    @GetMapping("/leaderboard/season")
    public ResponseEntity<List<NftDto.LeaderboardEntry>> getSeasonLeaderboard(
            @RequestParam(defaultValue = "50") int limit) {
        List<NftDto.LeaderboardEntry> leaderboard = pointService.getSeasonLeaderboard(Math.min(limit, 100));
        return ResponseEntity.ok(leaderboard);
    }

    /**
     * 내 랭킹 조회
     */
    @GetMapping("/rank")
    public ResponseEntity<Integer> getMyRank(@AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        int rank = pointService.getUserRank(userIdLong);
        return ResponseEntity.ok(rank);
    }

    /**
     * 포인트 통계 조회
     */
    @GetMapping("/stats")
    public ResponseEntity<NftDto.PointBalanceResponse> getPointStats(
            @AuthenticationPrincipal String userId) {
        Long userIdLong = Long.parseLong(userId);
        NftDto.PointBalanceResponse stats = pointService.getPointStats(userIdLong);
        return ResponseEntity.ok(stats);
    }
}
