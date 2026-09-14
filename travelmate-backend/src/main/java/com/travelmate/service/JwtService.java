package com.travelmate.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class JwtService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private Long jwtExpiration;

    /** 시크릿은 불변이므로 요청마다 키를 새로 유도하지 않고 한 번만 만들어 재사용한다. */
    private volatile SecretKey signingKey;

    private SecretKey getSigningKey() {
        SecretKey key = signingKey;
        if (key == null) {
            synchronized (this) {
                key = signingKey;
                if (key == null) {
                    key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                    signingKey = key;
                }
            }
        }
        return key;
    }

    public String generateToken(Long userId, String email) {
        return generateToken(userId, email, "USER");
    }

    public String generateToken(Long userId, String email, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
            .subject(userId.toString())
            .claim("email", email)
            .claim("role", role)
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(getSigningKey())
            .compact();
    }

    /**
     * 토큰을 한 번만 파싱·검증해 claims를 돌려준다.
     * 호출자가 userId/email/role을 각각 뽑겠다고 같은 토큰을 여러 번 파싱하지 않도록 하기 위한 진입점이다.
     */
    public Optional<Claims> parseClaims(String token) {
        try {
            return Optional.of(Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload());
        } catch (SecurityException ex) {
            log.error("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            log.error("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty");
        }
        return Optional.empty();
    }

    public Long getUserId(Claims claims) {
        return Long.parseLong(claims.getSubject());
    }

    public String getEmail(Claims claims) {
        return claims.get("email", String.class);
    }

    public String getRole(Claims claims) {
        String role = claims.get("role", String.class);
        return role != null ? role : "USER";
    }

    public List<String> getAuthorities(Claims claims) {
        return List.of("ROLE_" + getRole(claims));
    }

    /** 토큰 하나로 claims를 직접 파싱한다. 실패 시 JJWT 예외를 그대로 던진다. */
    private Claims parseClaimsOrThrow(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public Long getUserIdFromToken(String token) {
        return getUserId(parseClaimsOrThrow(token));
    }

    public String getEmailFromToken(String token) {
        return getEmail(parseClaimsOrThrow(token));
    }

    public String getRoleFromToken(String token) {
        return getRole(parseClaimsOrThrow(token));
    }

    public List<String> getAuthoritiesFromToken(String token) {
        return getAuthorities(parseClaimsOrThrow(token));
    }

    public boolean validateToken(String authToken) {
        return parseClaims(authToken).isPresent();
    }
}
