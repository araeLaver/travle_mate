package com.travelmate.security;

import com.travelmate.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final String activeProfile;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   @Value("${spring.profiles.active:dev}") String activeProfile) {
        this.jwtService = jwtService;
        this.activeProfile = activeProfile;
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        try {
            String jwt = getJwtFromRequest(request);
            // 토큰은 요청당 한 번만 파싱·서명검증한다. userId/email/권한을 각각 뽑겠다고
            // 다시 파싱하면 HS512 검증이 요청당 네 번 돌아 CPU가 좁은 환경에서 응답이 초 단위로 늘어난다.
            Optional<Claims> parsed = StringUtils.hasText(jwt)
                ? jwtService.parseClaims(jwt)
                : Optional.empty();
            if (parsed.isPresent()) {
                Claims claims = parsed.get();
                Long userId = jwtService.getUserId(claims);
                if (userId == null) {
                    log.warn("JWT에서 사용자 ID 추출 실패");
                    SecurityContextHolder.clearContext();
                    // 사용자 ID가 없는 경우 인증을 설정하지 않고 계속 진행
                }
                else {
                    String email = jwtService.getEmail(claims);
                    List<String> authorities = jwtService.getAuthorities(claims);
                    if (authorities == null || authorities.isEmpty()) {
                        authorities = Collections.singletonList("ROLE_USER");
                    }

                    List<SimpleGrantedAuthority> grantedAuthorities = authorities.stream()
                        .map(SimpleGrantedAuthority::new)
                        .toList();

                    UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId.toString(), null, grantedAuthorities);
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    log.debug("JWT 인증 성공: userId={}, email={}, authorities={}", userId, email, authorities);
                }
            }
        } catch (Exception ex) {
            log.error("JWT 인증 처리 중 오류 발생", ex);
            SecurityContextHolder.clearContext();
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        boolean skip = path.equals("/users/register") ||
                       path.equals("/users/login") ||
                       path.startsWith("/location/") ||
                       path.startsWith("/uploads") ||
                       path.startsWith("/ws") ||
                       path.equals("/error") ||
                       "OPTIONS".equals(method);

        // H2 Console은 개발/테스트 환경에서만 허용
        if (path.startsWith("/h2-console") && isDevOrTestProfile()) {
            skip = true;
        }

        log.debug("JWT Filter check - Path: {}, Method: {}, Skip: {}, Profile: {}", path, method, skip, activeProfile);

        return skip;
    }

    private boolean isDevOrTestProfile() {
        return "dev".equals(activeProfile) || "test".equals(activeProfile);
    }
}
