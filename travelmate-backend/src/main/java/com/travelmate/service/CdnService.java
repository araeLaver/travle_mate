package com.travelmate.service;

import com.travelmate.config.CdnConfig.CdnProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cloudfront.CloudFrontClient;
import software.amazon.awssdk.services.cloudfront.model.*;

import java.security.PrivateKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * CDN Service for TravelMate
 * Handles CloudFront URL signing and cache invalidation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CdnService {

    private final CdnProperties cdnProperties;
    private final CloudFrontClient cloudFrontClient;

    /**
     * Get CDN URL for an image
     */
    public String getImageUrl(String imagePath) {
        return cdnProperties.getImageUrl(imagePath);
    }

    /**
     * Get CDN URL for a static asset
     */
    public String getStaticUrl(String assetPath) {
        return cdnProperties.getStaticUrl(assetPath);
    }

    /**
     * Generate signed URL for private content (valid for 1 hour)
     */
    public String getSignedUrl(String resourcePath) {
        return getSignedUrl(resourcePath, 60);
    }

    /**
     * Generate signed URL for private content with custom expiry
     */
    public String getSignedUrl(String resourcePath, int expiryMinutes) {
        if (!cdnProperties.enabled()) {
            return resourcePath;
        }

        try {
            String url = cdnProperties.getCdnUrl(resourcePath);
            Instant expirationDate = Instant.now().plus(expiryMinutes, ChronoUnit.MINUTES);

            // For signed URLs, we would normally use CloudFront signing utilities
            // This is a simplified version - in production, implement proper signing
            return url + "?expires=" + expirationDate.getEpochSecond();
        } catch (Exception e) {
            log.error("Failed to generate signed URL for: {}", resourcePath, e);
            return resourcePath;
        }
    }

    /**
     * Invalidate cache for specific paths
     */
    public void invalidateCache(List<String> paths) {
        if (!cdnProperties.enabled() || cdnProperties.distributionId().isEmpty()) {
            log.debug("CDN not enabled, skipping cache invalidation");
            return;
        }

        try {
            InvalidationBatch batch = InvalidationBatch.builder()
                    .paths(Paths.builder()
                            .items(paths)
                            .quantity(paths.size())
                            .build())
                    .callerReference(UUID.randomUUID().toString())
                    .build();

            CreateInvalidationRequest request = CreateInvalidationRequest.builder()
                    .distributionId(cdnProperties.distributionId())
                    .invalidationBatch(batch)
                    .build();

            CreateInvalidationResponse response = cloudFrontClient.createInvalidation(request);
            log.info("Cache invalidation created: {}", response.invalidation().id());
        } catch (Exception e) {
            log.error("Failed to invalidate CDN cache for paths: {}", paths, e);
        }
    }

    /**
     * Invalidate cache for a single path
     */
    public void invalidateCache(String path) {
        invalidateCache(List.of(path));
    }

    /**
     * Invalidate all image cache
     */
    public void invalidateAllImages() {
        invalidateCache(List.of("/images/*"));
    }

    /**
     * Invalidate all static cache
     */
    public void invalidateAllStatic() {
        invalidateCache(List.of("/static/*"));
    }

    /**
     * Invalidate entire cache (use with caution)
     */
    public void invalidateAll() {
        invalidateCache(List.of("/*"));
    }

    /**
     * Get cache invalidation status
     */
    public String getInvalidationStatus(String invalidationId) {
        if (!cdnProperties.enabled() || cdnProperties.distributionId().isEmpty()) {
            return "CDN not enabled";
        }

        try {
            GetInvalidationRequest request = GetInvalidationRequest.builder()
                    .distributionId(cdnProperties.distributionId())
                    .id(invalidationId)
                    .build();

            GetInvalidationResponse response = cloudFrontClient.getInvalidation(request);
            return response.invalidation().status();
        } catch (Exception e) {
            log.error("Failed to get invalidation status: {}", invalidationId, e);
            return "UNKNOWN";
        }
    }

    /**
     * Check if CDN is enabled
     */
    public boolean isCdnEnabled() {
        return cdnProperties.enabled();
    }

    /**
     * Get CDN base URL
     */
    public String getCdnBaseUrl() {
        return cdnProperties.baseUrl();
    }

    /**
     * Convert local URL to CDN URL
     */
    public String convertToCdnUrl(String localUrl) {
        if (!cdnProperties.enabled() || localUrl == null || localUrl.isEmpty()) {
            return localUrl;
        }

        // Handle image URLs
        if (localUrl.startsWith("/images/")) {
            String imagePath = localUrl.substring("/images/".length());
            return getImageUrl(imagePath);
        }

        // Handle static URLs
        if (localUrl.startsWith("/static/")) {
            String staticPath = localUrl.substring("/static/".length());
            return getStaticUrl(staticPath);
        }

        return localUrl;
    }

    /**
     * Batch convert local URLs to CDN URLs
     */
    public List<String> convertToCdnUrls(List<String> localUrls) {
        return localUrls.stream()
                .map(this::convertToCdnUrl)
                .toList();
    }
}
