package com.travelmate.config;

// import com.travelmate.security.RateLimitingFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class SchedulingConfig {

    // private final RateLimitingFilter rateLimitingFilter;

    // Temporarily disabled rate limiting cleanup
    // @Scheduled(fixedRate = 300000) // 5분마다 실행
    // public void cleanupRateLimitCache() {
    //     log.debug("Cleaning up expired rate limit entries");
    //     rateLimitingFilter.cleanupExpiredEntries();
    // }
}