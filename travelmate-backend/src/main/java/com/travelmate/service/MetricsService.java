package com.travelmate.service;

import com.travelmate.config.MetricsConfig.BusinessMetrics;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.CollectibleLocationRepository;
import com.travelmate.repository.nft.LocationReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Supplier;

/**
 * Service for managing application metrics
 * Provides easy-to-use methods for recording business metrics
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MetricsService {

    private final BusinessMetrics businessMetrics;
    private final UserRepository userRepository;
    private final CollectibleLocationRepository collectionRepository;
    private final LocationReviewRepository reviewRepository;

    private final AtomicBoolean applicationReady = new AtomicBoolean(false);

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        applicationReady.set(true);
        log.info("Application is ready, enabling scheduled metrics updates");
    }

    // ==================== User Metrics ====================

    public void recordUserRegistration() {
        businessMetrics.incrementUserRegistrations();
        log.debug("Recorded user registration metric");
    }

    public void recordUserLogin(boolean success) {
        if (success) {
            businessMetrics.incrementUserLogins();
        } else {
            businessMetrics.incrementUserLoginFailures();
        }
    }

    public void userConnected() {
        businessMetrics.incrementActiveUsers();
    }

    public void userDisconnected() {
        businessMetrics.decrementActiveUsers();
    }

    // ==================== NFT Metrics ====================

    public void recordNftCollection() {
        businessMetrics.incrementNftCollections();
    }

    public void recordNftMinting(boolean success) {
        if (success) {
            businessMetrics.incrementNftMintings();
        } else {
            businessMetrics.incrementNftMintingFailures();
        }
    }

    public <T> T recordNftMintingTime(Supplier<T> task) {
        return businessMetrics.getNftMintingTimer().record(task);
    }

    // ==================== Social Metrics ====================

    public void recordReviewCreated() {
        businessMetrics.incrementReviewsCreated();
    }

    public void recordFollowAction() {
        businessMetrics.incrementFollowActions();
    }

    public void recordChatMessage() {
        businessMetrics.incrementChatMessages();
    }

    public void chatRoomCreated() {
        businessMetrics.incrementActiveChatRooms();
    }

    public void chatRoomClosed() {
        businessMetrics.decrementActiveChatRooms();
    }

    // ==================== System Metrics ====================

    public void recordImageUpload() {
        businessMetrics.incrementImageUploads();
    }

    public <T> T recordImageProcessingTime(Supplier<T> task) {
        return businessMetrics.getImageProcessingTimer().record(task);
    }

    public <T> T recordLocationSearchTime(Supplier<T> task) {
        return businessMetrics.getLocationSearchTimer().record(task);
    }

    public void recordApiError() {
        businessMetrics.incrementApiErrors();
    }

    // ==================== Scheduled Gauge Updates ====================

    /**
     * Update gauge metrics every minute
     * Only runs after ApplicationReadyEvent is fired
     */
    //@Scheduled(fixedRate = 60000, initialDelay = 30000)
    public void updateGaugeMetrics() {
        if (!applicationReady.get()) {
            log.debug("Skipping metrics update - application not ready yet");
            return;
        }

        try {
            // Update total users
            long totalUsers = userRepository.count();
            businessMetrics.setTotalUsers(totalUsers);

            // Update total NFTs (collections)
            long totalNfts = collectionRepository.count();
            businessMetrics.setTotalNfts(totalNfts);

            // Update total reviews
            long totalReviews = reviewRepository.count();
            businessMetrics.setTotalReviews(totalReviews);

            log.debug("Updated gauge metrics: users={}, nfts={}, reviews={}",
                    totalUsers, totalNfts, totalReviews);
        } catch (Exception e) {
            log.error("Failed to update gauge metrics", e);
        }
    }

    // ==================== API Response Metrics ====================

    /**
     * Record API endpoint metrics with tags
     */
    public void recordApiCall(String endpoint, String method, int statusCode, long durationMs) {
        // This will be automatically tracked by Spring Actuator
        // Additional custom tracking can be added here if needed
    }
}
