package com.travelmate.config;

import org.hibernate.cfg.AvailableSettings;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Hibernate 쿼리 최적화 설정
 */
@Configuration
public class QueryOptimizationConfig {

    /**
     * Hibernate 배치 처리 및 N+1 쿼리 최적화 설정
     */
    @Bean
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer() {
        return hibernateProperties -> {
            // 배치 INSERT 크기
            hibernateProperties.put(AvailableSettings.STATEMENT_BATCH_SIZE, 50);

            // INSERT 순서 정렬 (배치 효율성)
            hibernateProperties.put(AvailableSettings.ORDER_INSERTS, true);

            // UPDATE 순서 정렬
            hibernateProperties.put(AvailableSettings.ORDER_UPDATES, true);

            // 배치 버전 업데이트
            hibernateProperties.put(AvailableSettings.BATCH_VERSIONED_DATA, true);

            // 기본 배치 Fetch 크기
            hibernateProperties.put(AvailableSettings.DEFAULT_BATCH_FETCH_SIZE, 25);

            // 서브셀렉트 Fetch 활성화
            hibernateProperties.put(AvailableSettings.USE_SUBSELECT_FETCH, true);

            // 쿼리 플랜 캐시 크기
            hibernateProperties.put(AvailableSettings.QUERY_PLAN_CACHE_MAX_SIZE, 2048);

            // 파라미터 메타데이터 캐시 크기
            hibernateProperties.put(AvailableSettings.QUERY_PLAN_CACHE_PARAMETER_METADATA_MAX_SIZE, 128);

            // JDBC 배치 INSERT 반환 키 생성
            hibernateProperties.put(AvailableSettings.USE_GET_GENERATED_KEYS, true);

            // 커넥션 릴리즈 모드
            hibernateProperties.put(AvailableSettings.CONNECTION_HANDLING, "DELAYED_ACQUISITION_AND_RELEASE_AFTER_TRANSACTION");
        };
    }
}
