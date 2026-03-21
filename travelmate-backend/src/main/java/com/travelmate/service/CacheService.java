package com.travelmate.service;

import com.travelmate.config.CacheConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Objects;

/**
 * Cache Service
 *
 * Provides cache management utilities for manual cache operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CacheService {

    private final CacheManager cacheManager;

    /**
     * Evict a specific entry from a cache
     */
    public void evict(String cacheName, Object key) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.evict(key);
            log.debug("Evicted key '{}' from cache '{}'", key, cacheName);
        }
    }

    /**
     * Evict all entries from a cache
     */
    public void evictAll(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.clear();
            log.debug("Cleared cache '{}'", cacheName);
        }
    }

    /**
     * Evict all caches
     */
    public void evictAllCaches() {
        Collection<String> cacheNames = cacheManager.getCacheNames();
        cacheNames.forEach(this::evictAll);
        log.info("Cleared all caches: {}", cacheNames);
    }

    /**
     * Get a value from cache
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String cacheName, Object key, Class<T> type) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            Cache.ValueWrapper wrapper = cache.get(key);
            if (wrapper != null) {
                return (T) wrapper.get();
            }
        }
        return null;
    }

    /**
     * Put a value in cache
     */
    public void put(String cacheName, Object key, Object value) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.put(key, value);
            log.debug("Put key '{}' in cache '{}'", key, cacheName);
        }
    }

    // Convenience methods for common cache operations

    /**
     * Evict user-related caches for a specific user
     */
    public void evictUserCaches(Long userId) {
        evict(CacheConfig.USERS, userId);
        evict(CacheConfig.USER_PROFILES, userId);
        evict(CacheConfig.FOLLOW_STATS, userId);
        evict(CacheConfig.NOTIFICATIONS, userId);
    }

    /**
     * Evict group-related caches for a specific group
     */
    public void evictGroupCaches(Long groupId) {
        evict(CacheConfig.GROUPS, groupId);
        evict(CacheConfig.GROUP_MEMBERS, groupId);
    }

    /**
     * Evict NFT-related caches for a specific location
     */
    public void evictNftLocationCaches(Long locationId) {
        evict(CacheConfig.NFT_LOCATIONS, locationId);
        evict(CacheConfig.REVIEWS, locationId);
        evict(CacheConfig.REVIEW_STATS, locationId);
    }

    /**
     * Evict user's NFT collection cache
     */
    public void evictNftCollectionCache(Long userId) {
        evict(CacheConfig.NFT_COLLECTIONS, userId);
    }

    /**
     * Get all cache names
     */
    public Collection<String> getCacheNames() {
        return cacheManager.getCacheNames();
    }

    /**
     * Check if a cache contains a key
     */
    public boolean contains(String cacheName, Object key) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            return cache.get(key) != null;
        }
        return false;
    }
}
