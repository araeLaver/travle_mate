package com.travelmate.config;

import jakarta.servlet.Filter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

/**
 * HTTP 응답 압축 설정
 * application.yml의 server.compression 설정과 함께 동작
 */
@Configuration
public class CompressionConfig {

    /**
     * 응답 압축 관련 설정
     * 실제 압축은 server.compression.enabled=true로 처리
     * 이 빈은 커스텀 압축 필터가 필요할 때 사용
     */
    // @Bean
    // public FilterRegistrationBean<Filter> compressionFilter() {
    //     // 기본 Tomcat 압축 사용 (server.compression.enabled=true)
    //     // 커스텀 필터가 필요한 경우 여기에 구현
    //     return null;
    // }

    /**
     * 압축 제외 경로 설정용 상수
     * 이미 압축된 콘텐츠나 작은 응답은 제외
     */
    public static final String[] COMPRESSION_EXCLUDE_PATHS = {
        "/api/files/download/**",
        "/api/images/**",
        "/actuator/**"
    };

    /**
     * 압축 대상 MIME 타입
     * application.yml의 server.compression.mime-types와 동기화
     */
    public static final String[] COMPRESSION_MIME_TYPES = {
        "text/html",
        "text/xml",
        "text/plain",
        "text/css",
        "text/javascript",
        "application/javascript",
        "application/json",
        "application/xml"
    };
}
