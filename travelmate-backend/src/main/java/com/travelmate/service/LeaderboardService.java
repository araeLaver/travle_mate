package com.travelmate.service;

import com.travelmate.dto.LeaderboardDto;
import com.travelmate.entity.nft.UserNftCollection;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import com.travelmate.repository.nft.UserPointRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Leaderboard Service
 *
 * Provides leaderboard functionality for NFT collectors.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LeaderboardService {

    private final UserNftCollectionRepository userNftCollectionRepository;
    private final UserPointRepository userPointRepository;

    /**
     * Get global leaderboard (all time)
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "leaderboard", key = "'global'")
    public LeaderboardDto.LeaderboardResponse getGlobalLeaderboard(int limit) {
        return buildLeaderboard("ALL_TIME", null, limit);
    }

    /**
     * Get weekly leaderboard
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "leaderboard", key = "'weekly'")
    public LeaderboardDto.LeaderboardResponse getWeeklyLeaderboard(int limit) {
        LocalDateTime weekStart = LocalDateTime.now().minusDays(7);
        return buildLeaderboard("WEEKLY", weekStart, limit);
    }

    /**
     * Get monthly leaderboard
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "leaderboard", key = "'monthly'")
    public LeaderboardDto.LeaderboardResponse getMonthlyLeaderboard(int limit) {
        LocalDateTime monthStart = LocalDateTime.now().minusDays(30);
        return buildLeaderboard("MONTHLY", monthStart, limit);
    }

    /**
     * Get user's rank information
     */
    @Transactional(readOnly = true)
    public LeaderboardDto.UserRankResponse getUserRank(Long userId) {
        // Get NFT count
        int nftCount = (int) userNftCollectionRepository.countByUserId(userId);

        // Get total points
        int totalPoints = userPointRepository.findByUserId(userId)
                .map(up -> up.getTotalPoints().intValue())
                .orElse(0);

        // Calculate ranks (simplified - in production, use proper ranking queries)
        int globalRank = calculateRank(userId, null);
        int weeklyRank = calculateRank(userId, LocalDateTime.now().minusDays(7));
        int monthlyRank = calculateRank(userId, LocalDateTime.now().minusDays(30));

        // Calculate percentile
        long totalUsers = userNftCollectionRepository.countDistinctUsers();
        int percentile = totalUsers > 0 ? (int) ((1 - (globalRank - 1.0) / totalUsers) * 100) : 100;

        return LeaderboardDto.UserRankResponse.builder()
                .userId(userId)
                .globalRank(globalRank)
                .weeklyRank(weeklyRank)
                .monthlyRank(monthlyRank)
                .nftCount(nftCount)
                .totalPoints(totalPoints)
                .percentile(Math.min(100, Math.max(1, percentile)))
                .build();
    }

    /**
     * Build leaderboard based on time range
     */
    private LeaderboardDto.LeaderboardResponse buildLeaderboard(String type, LocalDateTime since, int limit) {
        List<Object[]> results;

        if (since == null) {
            // All time
            results = userNftCollectionRepository.findTopCollectorsByNftCount(limit);
        } else {
            // Time-limited
            results = userNftCollectionRepository.findTopCollectorsByNftCountSince(since, limit);
        }

        AtomicInteger rank = new AtomicInteger(1);
        List<LeaderboardDto.LeaderboardEntry> entries = results.stream()
                .map(row -> {
                    Long userId = ((Number) row[0]).longValue();
                    String nickname = (String) row[1];
                    String profileImageUrl = (String) row[2];
                    long nftCount = ((Number) row[3]).longValue();

                    // Get rarity breakdown
                    Map<String, Integer> rarityBreakdown = getRarityBreakdown(userId, since);

                    // Get total points
                    int totalPoints = userPointRepository.findByUserId(userId)
                            .map(up -> up.getTotalPoints().intValue())
                            .orElse(0);

                    return LeaderboardDto.LeaderboardEntry.builder()
                            .rank(rank.getAndIncrement())
                            .userId(userId)
                            .nickname(nickname)
                            .profileImageUrl(profileImageUrl)
                            .nftCount((int) nftCount)
                            .totalPoints(totalPoints)
                            .legendaryCount(rarityBreakdown.getOrDefault("LEGENDARY", 0))
                            .epicCount(rarityBreakdown.getOrDefault("EPIC", 0))
                            .rareCount(rarityBreakdown.getOrDefault("RARE", 0))
                            .commonCount(rarityBreakdown.getOrDefault("COMMON", 0))
                            .build();
                })
                .collect(Collectors.toList());

        // Count total participants
        int totalParticipants = since == null
                ? (int) userNftCollectionRepository.countDistinctUsers()
                : (int) userNftCollectionRepository.countDistinctUsersSince(since);

        return LeaderboardDto.LeaderboardResponse.builder()
                .type(type)
                .entries(entries)
                .totalParticipants(totalParticipants)
                .build();
    }

    /**
     * Get rarity breakdown for a user
     */
    private Map<String, Integer> getRarityBreakdown(Long userId, LocalDateTime since) {
        List<Object[]> results;

        if (since == null) {
            results = userNftCollectionRepository.getRarityBreakdownByUserId(userId);
        } else {
            results = userNftCollectionRepository.getRarityBreakdownByUserIdSince(userId, since);
        }

        Map<String, Integer> breakdown = new LinkedHashMap<>();
        for (Object[] row : results) {
            String rarity = (String) row[0];
            long count = ((Number) row[1]).longValue();
            breakdown.put(rarity, (int) count);
        }

        return breakdown;
    }

    /**
     * Calculate user's rank
     */
    private int calculateRank(Long userId, LocalDateTime since) {
        if (since == null) {
            Long rank = userNftCollectionRepository.getUserRank(userId);
            return rank != null ? rank.intValue() : 0;
        } else {
            Long rank = userNftCollectionRepository.getUserRankSince(userId, since);
            return rank != null ? rank.intValue() : 0;
        }
    }
}
