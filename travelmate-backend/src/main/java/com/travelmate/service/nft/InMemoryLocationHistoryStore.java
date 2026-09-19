package com.travelmate.service.nft;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 위치 이력의 인메모리 폴백 구현.
 *
 * <p>Redis 비활성({@code app.redis.enabled=false} 또는 미설정) 환경 및 단위 테스트에서 사용된다.
 * 단일 프로세스 범위이므로 다중 인스턴스 환경에서는 우회 가능 — 운영에서는 {@link RedisLocationHistoryStore} 권장.
 */
@Service
@ConditionalOnProperty(name = "app.redis.enabled", havingValue = "false", matchIfMissing = true)
public class InMemoryLocationHistoryStore implements LocationHistoryStore {

    private final Map<Long, LocationRecord> store = new ConcurrentHashMap<>();

    @Override
    public Optional<LocationRecord> get(Long userId) {
        return Optional.ofNullable(store.get(userId));
    }

    @Override
    public void put(Long userId, LocationRecord record) {
        store.put(userId, record);
    }

    @Override
    public void remove(Long userId) {
        store.remove(userId);
    }
}
