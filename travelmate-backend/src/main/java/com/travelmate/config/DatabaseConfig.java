package com.travelmate.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;

@Configuration
@EnableJpaAuditing
@EnableTransactionManagement
public class DatabaseConfig {

    @Bean
    @Profile("prod")
    public DataSource productionDataSource(
            @Value("${spring.datasource.url}") String url,
            @Value("${spring.datasource.username}") String username,
            @Value("${spring.datasource.password}") String password,
            @Value("${spring.datasource.hikari.maximum-pool-size:20}") int maxPoolSize,
            @Value("${spring.datasource.hikari.minimum-idle:5}") int minIdle,
            @Value("${spring.datasource.hikari.idle-timeout:300000}") long idleTimeout,
            @Value("${spring.datasource.hikari.connection-timeout:30000}") long connectionTimeout,
            @Value("${spring.datasource.hikari.max-lifetime:1800000}") long maxLifetime,
            @Value("${spring.datasource.hikari.leak-detection-threshold:60000}") long leakDetectionThreshold
    ) {
        HikariDataSource dataSource = new HikariDataSource();
        
        // 기본 연결 정보
        dataSource.setJdbcUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setDriverClassName("org.postgresql.Driver");
        
        // 커넥션 풀 설정
        dataSource.setMaximumPoolSize(maxPoolSize);
        dataSource.setMinimumIdle(minIdle);
        dataSource.setIdleTimeout(idleTimeout);
        dataSource.setConnectionTimeout(connectionTimeout);
        dataSource.setMaxLifetime(maxLifetime);
        dataSource.setLeakDetectionThreshold(leakDetectionThreshold);
        
        // 성능 최적화 설정
        dataSource.setPoolName("TravelMate-HikariCP");
        dataSource.setConnectionTestQuery("SELECT 1");
        dataSource.setValidationTimeout(5000);
        
        // PostgreSQL 특화 설정
        dataSource.addDataSourceProperty("cachePrepStmts", "true");
        dataSource.addDataSourceProperty("prepStmtCacheSize", "250");
        dataSource.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
        dataSource.addDataSourceProperty("useServerPrepStmts", "true");
        dataSource.addDataSourceProperty("useLocalSessionState", "true");
        dataSource.addDataSourceProperty("rewriteBatchedStatements", "true");
        dataSource.addDataSourceProperty("cacheResultSetMetadata", "true");
        dataSource.addDataSourceProperty("cacheServerConfiguration", "true");
        dataSource.addDataSourceProperty("elideSetAutoCommits", "true");
        dataSource.addDataSourceProperty("maintainTimeStats", "false");
        
        // PostgreSQL 연결 파라미터
        dataSource.addDataSourceProperty("ApplicationName", "TravelMate-Backend");
        dataSource.addDataSourceProperty("connectTimeout", "30");
        dataSource.addDataSourceProperty("socketTimeout", "30");
        dataSource.addDataSourceProperty("tcpKeepAlive", "true");
        
        return dataSource;
    }
}