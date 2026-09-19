package com.travelmate.service.nft;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * 위치 이력의 Redis(분산 캐시) 구현 — 운영 환경 기본.
 *
 * <p>모든 애플리케이션 인스턴스가 동일한 이력을 공유하므로, 로드밸런싱을 이용한 시계열 위조 신호(순간이동/속도/연속 수집) 우회를 차단한다.
 * 값은 직렬화 의존을 피하기 위해 구분자로 결합한 문자열로 저장하며, 이력은 TTL 후 자동 만료된다.
 * Redis 접근 실패 시 이력 없음으로 간주(fail-open)하여 검증 자체는 계속 진행한다.
 */
@Service
@ConditionalOnProperty(name = "app.redis.enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class RedisLocationHistoryStore implements LocationHistoryStore {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String KEY_PREFIX = "gps:lasthist:";
    private static final Duration TTL = Duration.ofHours(1);
    private static final String SEP = "|"; // lat/lng/timestamp 에는 등장하지 않음. deviceId 는 마지막 필드로 limit 4 분해.
    private static final Pattern SPLIT = Pattern.compile(Pattern.quote(SEP));

    private String key(Long userId) {
        return KEY_PREFIX + userId;
    }

    @Override
    public Optional<LocationRecord> get(Long userId) {
        try {
            Object raw = redisTemplate.opsForValue().get(key(userId));
            if (raw == null) {
                return Optional.empty();
            }
            // limit 4: deviceId 에 구분자가 포함되어도 마지막 필드로 온전히 유지
            String[] p = SPLIT.split(raw.toString(), 4);
            if (p.length < 4) {
                return Optional.empty();
            }
            String deviceId = p[3].isEmpty() ? null : p[3];
            return Optional.of(new LocationRecord(
                    Double.parseDouble(p[0]),
                    Double.parseDouble(p[1]),
                    LocalDateTime.parse(p[2]),
                    deviceId
            ));
        } catch (Exception e) {
            log.warn("GPS 위치 이력 조회 실패 userId={}: {}", userId, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public void put(Long userId, LocationRecord record) {
        try {
            String value = record.latitude() + SEP + record.longitude() + SEP
                    + record.timestamp() + SEP + (record.deviceId() == null ? "" : record.deviceId());
            redisTemplate.opsForValue().set(key(userId), value, TTL);
        } catch (Exception e) {
            log.warn("GPS 위치 이력 저장 실패 userId={}: {}", userId, e.getMessage());
        }
    }

    @Override
    public void remove(Long userId) {
        try {
            redisTemplate.delete(key(userId));
        } catch (Exception e) {
            log.warn("GPS 위치 이력 삭제 실패 userId={}: {}", userId, e.getMessage());
        }
    }
}
