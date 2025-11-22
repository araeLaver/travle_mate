package com.travelmate.config;

import com.travelmate.security.JwtAuthenticationEntryPoint;
import com.travelmate.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final Environment environment;

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exception -> exception.authenticationEntryPoint(jwtAuthenticationEntryPoint))
            .authorizeHttpRequests(auth -> auth
                // 공개 엔드포인트 (context-path가 /api이므로 실제 path는 /users/register가 됨)
                .requestMatchers("/", "/index.html", "/api", "/api/").permitAll()
                .requestMatchers("/health", "/health/**").permitAll() // Health Check
                .requestMatchers("/management/**").permitAll() // Management endpoints
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll() // Swagger UI
                .requestMatchers("/users/register", "/users/login").permitAll()
                .requestMatchers("/users/check-email", "/users/check-nickname").permitAll() // 중복체크 공개
                .requestMatchers("/users/verify-email", "/users/request-password-reset", "/users/reset-password").permitAll() // 이메일 인증 및 비밀번호 재설정
                .requestMatchers("/auth/login", "/auth/refresh", "/auth/oauth/login").permitAll() // 인증 API
                .requestMatchers("/location/**").permitAll() // 위치 서비스 공개
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/ws/**").permitAll() // WebSocket
                .requestMatchers("/error").permitAll()

                // 인증이 필요한 엔드포인트
                .requestMatchers("/**").authenticated()
                .anyRequest().authenticated()
            )
            .headers(headers -> {
                // 프로덕션 환경에서는 보안 헤더 활성화
                boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");

                if (isProd) {
                    headers
                        .contentSecurityPolicy(csp -> csp
                            .policyDirectives("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:"))
                        .referrerPolicy(referrer -> referrer
                            .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .permissionsPolicy(permissions -> permissions
                            .policy("geolocation=(self), microphone=(), camera=()"));
                    headers.frameOptions(frameOptions -> frameOptions.deny());
                } else {
                    // 개발 환경: H2 Console 허용
                    headers.frameOptions(frameOptions -> frameOptions.disable());
                }
            })
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");

        if (isProd) {
            // 프로덕션: 환경변수에서 허용된 Origin 읽기
            String[] origins = allowedOrigins.split(",");
            configuration.setAllowedOrigins(Arrays.asList(origins));
        } else {
            // 개발/테스트: 로컬호스트 허용
            configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:*",
                "http://127.0.0.1:*"
            ));
        }

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setMaxAge(3600L); // 1시간 프리플라이트 캐싱

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}