package com.travelmate.service.nft;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("RedisLocationHistoryStore 테스트")
class RedisLocationHistoryStoreTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOps;

    private RedisLocationHistoryStore store;

    // 단일 Redis 를 흉내내는 인메모리 백킹 (put 이 저장한 값을 get 이 읽도록)
    private final Map<String, Object> backing = new HashMap<>();

    @BeforeEach
    void setUp() {
        store = new RedisLocationHistoryStore(redisTemplate);
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOps);
        lenient().when(valueOps.get(any())).thenAnswer(inv -> backing.get(inv.getArgument(0)));
        lenient().doAnswer(inv -> {
            backing.put(inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(valueOps).set(any(), any(), any(Duration.class));
    }

    @Test
    @DisplayName("put 후 get 이 동일한 위치 이력을 복원한다")
    void putThenGet_roundTrip() {
        LocalDateTime ts = LocalDateTime.of(2026, 8, 25, 12, 34, 56);
        store.put(1L, new LocationHistoryStore.LocationRecord(37.5512, 126.9882, ts, "device123"));

        Optional<LocationHistoryStore.LocationRecord> loaded = store.get(1L);

        assertThat(loaded).isPresent();
        assertThat(loaded.get().latitude()).isEqualTo(37.5512);
        assertThat(loaded.get().longitude()).isEqualTo(126.9882);
        assertThat(loaded.get().timestamp()).isEqualTo(ts);
        assertThat(loaded.get().deviceId()).isEqualTo("device123");
    }

    @Test
    @DisplayName("deviceId 가 null 이면 null 로 복원된다")
    void putThenGet_nullDeviceId() {
        LocalDateTime ts = LocalDateTime.of(2026, 8, 25, 1, 2, 3);
        store.put(2L, new LocationHistoryStore.LocationRecord(35.0, 129.0, ts, null));

        Optional<LocationHistoryStore.LocationRecord> loaded = store.get(2L);

        assertThat(loaded).isPresent();
        assertThat(loaded.get().deviceId()).isNull();
    }

    @Test
    @DisplayName("이력이 없으면 empty 를 반환한다")
    void get_absent() {
        assertThat(store.get(99L)).isEmpty();
    }

    @Test
    @DisplayName("Redis 접근 실패 시 fail-open (empty) 하고 예외를 전파하지 않는다")
    void get_failOpen() {
        when(valueOps.get(any())).thenThrow(new RuntimeException("redis down"));
        assertThat(store.get(1L)).isEmpty();
    }
}
