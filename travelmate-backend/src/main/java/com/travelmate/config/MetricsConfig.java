package com.travelmate.config;

import io.micrometer.core.aop.TimedAspect;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.binder.MeterBinder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Metrics Configuration for Prometheus/Grafana monitoring
 * Custom business metrics for TravelMate application
 */
@Configuration
@Slf4j
public class MetricsConfig {

    /**
     * Enable @Timed annotation support
     */
    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }

    /**
     * Custom business metrics holder
     */
    @Bean
    public BusinessMetrics businessMetrics(MeterRegistry registry) {
        return new BusinessMetrics(registry);
    }

    /**
     * Business Metrics class containing all custom metrics
     */
    public static class BusinessMetrics implements MeterBinder {

        private final MeterRegistry registry;

        // Counters
        private Counter userRegistrations;
        private Counter userLogins;
        private Counter userLoginFailures;
        private Counter nftCollections;
        private Counter nftMintings;
        private Counter nftMintingFailures;
        private Counter reviewsCreated;
        private Counter followActions;
        private Counter chatMessages;
        private Counter imageUploads;
        private Counter apiErrors;

        // Gauges (current values)
        private final AtomicInteger activeUsers = new AtomicInteger(0);
        private final AtomicInteger activeChatRooms = new AtomicInteger(0);
        private final AtomicLong totalUsers = new AtomicLong(0);
        private final AtomicLong totalNfts = new AtomicLong(0);
        private final AtomicLong totalReviews = new AtomicLong(0);

        // Timers
        private Timer nftMintingTimer;
        private Timer imageProcessingTimer;
        private Timer locationSearchTimer;

        public BusinessMetrics(MeterRegistry registry) {
            this.registry = registry;
            bindTo(registry);
        }

        @Override
        public void bindTo(MeterRegistry registry) {
            // === Counters ===

            // User metrics
            this.userRegistrations = Counter.builder("travelmate.user.registrations")
                    .description("Total number of user registrations")
                    .tag("type", "registration")
                    .register(registry);

            this.userLogins = Counter.builder("travelmate.user.logins")
                    .description("Total number of successful user logins")
                    .tag("type", "login")
                    .tag("status", "success")
                    .register(registry);

            this.userLoginFailures = Counter.builder("travelmate.user.logins")
                    .description("Total number of failed login attempts")
                    .tag("type", "login")
                    .tag("status", "failure")
                    .register(registry);

            // NFT metrics
            this.nftCollections = Counter.builder("travelmate.nft.collections")
                    .description("Total number of NFT collections (location visits)")
                    .register(registry);

            this.nftMintings = Counter.builder("travelmate.nft.mintings")
                    .description("Total number of successful NFT mintings")
                    .tag("status", "success")
                    .register(registry);

            this.nftMintingFailures = Counter.builder("travelmate.nft.mintings")
                    .description("Total number of failed NFT mintings")
                    .tag("status", "failure")
                    .register(registry);

            // Social metrics
            this.reviewsCreated = Counter.builder("travelmate.reviews.created")
                    .description("Total number of reviews created")
                    .register(registry);

            this.followActions = Counter.builder("travelmate.social.follows")
                    .description("Total number of follow actions")
                    .register(registry);

            this.chatMessages = Counter.builder("travelmate.chat.messages")
                    .description("Total number of chat messages sent")
                    .register(registry);

            // System metrics
            this.imageUploads = Counter.builder("travelmate.images.uploads")
                    .description("Total number of image uploads")
                    .register(registry);

            this.apiErrors = Counter.builder("travelmate.api.errors")
                    .description("Total number of API errors")
                    .register(registry);

            // === Gauges ===

            Gauge.builder("travelmate.users.active", activeUsers, AtomicInteger::get)
                    .description("Number of currently active users")
                    .register(registry);

            Gauge.builder("travelmate.chat.rooms.active", activeChatRooms, AtomicInteger::get)
                    .description("Number of active chat rooms")
                    .register(registry);

            Gauge.builder("travelmate.users.total", totalUsers, AtomicLong::get)
                    .description("Total number of registered users")
                    .register(registry);

            Gauge.builder("travelmate.nfts.total", totalNfts, AtomicLong::get)
                    .description("Total number of NFTs in the system")
                    .register(registry);

            Gauge.builder("travelmate.reviews.total", totalReviews, AtomicLong::get)
                    .description("Total number of reviews")
                    .register(registry);

            // === Timers ===

            this.nftMintingTimer = Timer.builder("travelmate.nft.minting.duration")
                    .description("Time taken to mint an NFT")
                    .register(registry);

            this.imageProcessingTimer = Timer.builder("travelmate.image.processing.duration")
                    .description("Time taken to process an image")
                    .register(registry);

            this.locationSearchTimer = Timer.builder("travelmate.location.search.duration")
                    .description("Time taken to search locations")
                    .register(registry);
        }

        // Counter methods
        public void incrementUserRegistrations() {
            userRegistrations.increment();
        }

        public void incrementUserLogins() {
            userLogins.increment();
        }

        public void incrementUserLoginFailures() {
            userLoginFailures.increment();
        }

        public void incrementNftCollections() {
            nftCollections.increment();
        }

        public void incrementNftMintings() {
            nftMintings.increment();
        }

        public void incrementNftMintingFailures() {
            nftMintingFailures.increment();
        }

        public void incrementReviewsCreated() {
            reviewsCreated.increment();
        }

        public void incrementFollowActions() {
            followActions.increment();
        }

        public void incrementChatMessages() {
            chatMessages.increment();
        }

        public void incrementImageUploads() {
            imageUploads.increment();
        }

        public void incrementApiErrors() {
            apiErrors.increment();
        }

        // Gauge methods
        public void setActiveUsers(int count) {
            activeUsers.set(count);
        }

        public void incrementActiveUsers() {
            activeUsers.incrementAndGet();
        }

        public void decrementActiveUsers() {
            activeUsers.decrementAndGet();
        }

        public void setActiveChatRooms(int count) {
            activeChatRooms.set(count);
        }

        public void incrementActiveChatRooms() {
            activeChatRooms.incrementAndGet();
        }

        public void decrementActiveChatRooms() {
            activeChatRooms.decrementAndGet();
        }

        public void setTotalUsers(long count) {
            totalUsers.set(count);
        }

        public void setTotalNfts(long count) {
            totalNfts.set(count);
        }

        public void setTotalReviews(long count) {
            totalReviews.set(count);
        }

        // Timer methods
        public Timer getNftMintingTimer() {
            return nftMintingTimer;
        }

        public Timer getImageProcessingTimer() {
            return imageProcessingTimer;
        }

        public Timer getLocationSearchTimer() {
            return locationSearchTimer;
        }

        // Utility method to record timer
        public void recordNftMintingTime(Runnable task) {
            nftMintingTimer.record(task);
        }

        public void recordImageProcessingTime(Runnable task) {
            imageProcessingTimer.record(task);
        }

        public void recordLocationSearchTime(Runnable task) {
            locationSearchTimer.record(task);
        }
    }
}
