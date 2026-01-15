package com.travelmate.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Duration;

/**
 * CDN Configuration for TravelMate
 * Configures CloudFront CDN integration for static assets and images
 */
@Configuration
public class CdnConfig implements WebMvcConfigurer {

    @Value("${cdn.enabled:false}")
    private boolean cdnEnabled;

    @Value("${cdn.base-url:}")
    private String cdnBaseUrl;

    @Value("${cdn.image-path:/images}")
    private String imagePath;

    @Value("${cdn.static-path:/static}")
    private String staticPath;

    @Value("${cdn.cache-duration:86400}")
    private long cacheDuration;

    @Value("${aws.cloudfront.distribution-id:}")
    private String distributionId;

    @Value("${aws.cloudfront.key-pair-id:}")
    private String keyPairId;

    @Value("${aws.cloudfront.private-key-path:}")
    private String privateKeyPath;

    @Bean
    public CdnProperties cdnProperties() {
        return new CdnProperties(
                cdnEnabled,
                cdnBaseUrl,
                imagePath,
                staticPath,
                Duration.ofSeconds(cacheDuration),
                distributionId,
                keyPairId,
                privateKeyPath
        );
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        if (cdnEnabled) {
            // Static resources with long cache duration
            registry.addResourceHandler("/static/**")
                    .addResourceLocations("classpath:/static/")
                    .setCachePeriod((int) cacheDuration);

            // Image resources
            registry.addResourceHandler("/images/**")
                    .addResourceLocations("file:./uploads/images/")
                    .setCachePeriod((int) cacheDuration);
        }
    }

    /**
     * CDN Properties holder class
     */
    public record CdnProperties(
            boolean enabled,
            String baseUrl,
            String imagePath,
            String staticPath,
            Duration cacheDuration,
            String distributionId,
            String keyPairId,
            String privateKeyPath
    ) {
        /**
         * Get full CDN URL for an image
         */
        public String getImageUrl(String imageName) {
            if (!enabled || baseUrl.isEmpty()) {
                return "/images/" + imageName;
            }
            return baseUrl + imagePath + "/" + imageName;
        }

        /**
         * Get full CDN URL for a static asset
         */
        public String getStaticUrl(String assetPath) {
            if (!enabled || baseUrl.isEmpty()) {
                return "/static/" + assetPath;
            }
            return baseUrl + staticPath + "/" + assetPath;
        }

        /**
         * Get full CDN URL for any path
         */
        public String getCdnUrl(String path) {
            if (!enabled || baseUrl.isEmpty()) {
                return path;
            }
            return baseUrl + path;
        }
    }
}
