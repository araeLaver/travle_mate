package com.travelmate.service.nft;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * GPS 위조 검증을 위한 사용자별 "직전 위치 이력" 저장소.
 *
 * <p>순간이동/비정상 속도/연속 수집 등 시계열 기반 위조 신호는 직전 요청과의 비교로 산출되므로,
 * 이력이 단일 서버 프로세스에만 존재하면 다중 인스턴스 환경에서 로드밸런싱을 이용해 검증을 우회할 수 있다.
 * 따라서 운영 환경에서는 분산 캐시(Redis) 구현을 사용하고, 비활성 환경에서는 인메모리 폴백을 사용한다.
 */
public interface LocationHistoryStore {

    /** 사용자의 직전 위치 이력을 조회한다. 없으면 empty. */
    Optional<LocationRecord> get(Long userId);

    /** 사용자의 직전 위치 이력을 갱신한다. */
    void put(Long userId, LocationRecord record);

    /** 사용자의 위치 이력을 제거한다. */
    void remove(Long userId);

    /** 직전 위치 스냅샷. */
    record LocationRecord(
            double latitude,
            double longitude,
            LocalDateTime timestamp,
            String deviceId
    ) {}
}
