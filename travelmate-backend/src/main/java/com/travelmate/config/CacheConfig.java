package com.travelmate.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Cache Configuration
 *
 * Provides caching support using:
 * - Redis (production with Redis enabled)
 * - Caffeine (in-memory fallback)
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Cache names used throughout the application
     */
    public static final String USERS = "users";
    public static final String USER_PROFILES = "userProfiles";
    public static final String GROUPS = "groups";
    public static final String GROUP_MEMBERS = "groupMembers";
    public static final String NFT_LOCATIONS = "nftLocations";
    public static final String NFT_COLLECTIONS = "nftCollections";
    public static final String REVIEWS = "reviews";
    public static final String REVIEW_STATS = "reviewStats";
    public static final String FOLLOW_STATS = "followStats";
    public static final String NOTIFICATIONS = "notifications";
    public static final String CHAT_ROOMS = "chatRooms";

    /**
     * Redis Cache Manager (when Redis is enabled)
     */
    @Bean
    @Primary
    @ConditionalOnProperty(name = "app.redis.enabled", havingValue = "true")
    public CacheManager redisCacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // Short TTL caches (1-5 minutes)
        cacheConfigurations.put(NOTIFICATIONS, defaultConfig.entryTtl(Duration.ofMinutes(1)));
        cacheConfigurations.put(FOLLOW_STATS, defaultConfig.entryTtl(Duration.ofMinutes(2)));
        cacheConfigurations.put(REVIEW_STATS, defaultConfig.entryTtl(Duration.ofMinutes(5)));

        // Medium TTL caches (10-30 minutes)
        cacheConfigurations.put(USERS, defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigurations.put(USER_PROFILES, defaultConfig.entryTtl(Duration.ofMinutes(15)));
        cacheConfigurations.put(GROUP_MEMBERS, defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigurations.put(CHAT_ROOMS, defaultConfig.entryTtl(Duration.ofMinutes(15)));

        // Long TTL caches (1+ hours)
        cacheConfigurations.put(GROUPS, defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put(NFT_LOCATIONS, defaultConfig.entryTtl(Duration.ofHours(6)));
        cacheConfigurations.put(NFT_COLLECTIONS, defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put(REVIEWS, defaultConfig.entryTtl(Duration.ofMinutes(30)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();
    }

    /**
     * Caffeine Cache Manager (fallback when Redis is disabled)
     */
    @Bean
    @ConditionalOnProperty(name = "app.redis.enabled", havingValue = "false", matchIfMissing = true)
    public CacheManager caffeineCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(10000)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .recordStats());
        cacheManager.setCacheNames(java.util.List.of(
                USERS, USER_PROFILES, GROUPS, GROUP_MEMBERS,
                NFT_LOCATIONS, NFT_COLLECTIONS, REVIEWS, REVIEW_STATS,
                FOLLOW_STATS, NOTIFICATIONS, CHAT_ROOMS
        ));
        return cacheManager;
    }
}
