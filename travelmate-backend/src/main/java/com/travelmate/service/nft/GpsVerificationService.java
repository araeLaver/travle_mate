package com.travelmate.service.nft;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * GPS 위조 방지를 위한 다층 검증 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GpsVerificationService {

    private static final double EARTH_RADIUS_METERS = 6371000;
    private static final float MAX_GPS_ACCURACY = 100.0f; // 100m 이상이면 불안정
    private static final double MAX_HUMAN_SPEED_MPS = 50.0; // 180km/h (고속철도 수준)
    private static final double TELEPORT_THRESHOLD_METERS = 10000; // 10km 이상 순간이동 의심
    private static final int RISK_SCORE_THRESHOLD = 70; // 70점 이상이면 거부

    // 사용자별 마지막 위치 정보 캐시 (실제 운영에서는 Redis 사용 권장)
    private final Map<Long, LocationHistory> userLocationHistory = new ConcurrentHashMap<>();

    /**
     * GPS 검증 수행
     */
    public GpsVerificationResult verify(GpsVerificationRequest request) {
        int riskScore = 0;
        StringBuilder riskDetails = new StringBuilder();

        // 1. Mock Location 감지
        if (Boolean.TRUE.equals(request.isMockLocation())) {
            log.warn("Mock location detected: userId={}", request.getUserId());
            return GpsVerificationResult.failed("위치 위조가 감지되었습니다", 100);
        }

        // 2. GPS 정확도 검사
        if (request.getGpsAccuracy() != null && request.getGpsAccuracy() > MAX_GPS_ACCURACY) {
            riskScore += 30;
            riskDetails.append("GPS 정확도 불량(").append(request.getGpsAccuracy()).append("m); ");
        }

        // 3. 거리 검증
        double distance = calculateDistance(
                request.getUserLatitude(), request.getUserLongitude(),
                request.getTargetLatitude(), request.getTargetLongitude()
        );

        if (distance > request.getCollectRadius()) {
            return GpsVerificationResult.failed(
                    String.format("목표 지점까지 %.0fm 남았습니다. %dm 이내로 접근해주세요",
                            distance, request.getCollectRadius()),
                    0
            );
        }

        // 4. 이동 속도 검사 (순간이동 방지)
        LocationHistory lastLocation = userLocationHistory.get(request.getUserId());
        if (lastLocation != null) {
            double distanceFromLast = calculateDistance(
                    lastLocation.latitude, lastLocation.longitude,
                    request.getUserLatitude(), request.getUserLongitude()
            );

            Duration timeDiff = Duration.between(lastLocation.timestamp, LocalDateTime.now());
            double timeSec = timeDiff.toMillis() / 1000.0;

            if (timeSec > 0) {
                double speedMps = distanceFromLast / timeSec;

                // 순간이동 감지 (10km 이상을 1분 내에)
                if (distanceFromLast > TELEPORT_THRESHOLD_METERS && timeSec < 60) {
                    riskScore += 50;
                    riskDetails.append("순간이동 의심(").append(String.format("%.0fm", distanceFromLast)).append(" in ").append(String.format("%.0fs", timeSec)).append("); ");
                    log.warn("Teleportation suspected: userId={}, distance={}m, time={}s",
                            request.getUserId(), distanceFromLast, timeSec);
                }
                // 비정상 속도 감지
                else if (speedMps > MAX_HUMAN_SPEED_MPS) {
                    riskScore += 25;
                    riskDetails.append("비정상 속도(").append(String.format("%.0f", speedMps * 3.6)).append("km/h); ");
                    log.warn("Abnormal speed detected: userId={}, speed={}km/h",
                            request.getUserId(), speedMps * 3.6);
                }
            }
        }

        // 5. 디바이스 ID 검사 (동일 사용자 다른 디바이스 전환)
        if (lastLocation != null && request.getDeviceId() != null &&
                !request.getDeviceId().equals(lastLocation.deviceId)) {
            riskScore += 15;
            riskDetails.append("디바이스 변경; ");
        }

        // 6. 연속 수집 패턴 검사 (너무 빠른 수집)
        if (lastLocation != null) {
            Duration timeSinceLastCollect = Duration.between(lastLocation.timestamp, LocalDateTime.now());
            if (timeSinceLastCollect.toSeconds() < 30) {
                riskScore += 20;
                riskDetails.append("연속 수집 시도(").append(timeSinceLastCollect.toSeconds()).append("초); ");
            }
        }

        // 위치 히스토리 업데이트
        userLocationHistory.put(request.getUserId(), new LocationHistory(
                request.getUserLatitude(),
                request.getUserLongitude(),
                LocalDateTime.now(),
                request.getDeviceId()
        ));

        // 7. 위험도 점수 평가
        if (riskScore >= RISK_SCORE_THRESHOLD) {
            log.warn("High risk GPS verification: userId={}, score={}, details={}",
                    request.getUserId(), riskScore, riskDetails);
            return GpsVerificationResult.failed(
                    "위치 검증에 실패했습니다. 잠시 후 다시 시도해주세요",
                    riskScore
            );
        }

        log.info("GPS verification passed: userId={}, distance={}m, riskScore={}",
                request.getUserId(), distance, riskScore);

        return GpsVerificationResult.success(distance, riskScore);
    }

    /**
     * 두 지점 간 거리 계산 (Haversine formula)
     */
    public double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_METERS * c;
    }

    /**
     * 사용자 위치 히스토리 초기화 (테스트용)
     */
    public void clearUserHistory(Long userId) {
        userLocationHistory.remove(userId);
    }

    // ===== Inner Classes =====

    public record GpsVerificationRequest(
            Long userId,
            Double userLatitude,
            Double userLongitude,
            Double targetLatitude,
            Double targetLongitude,
            Integer collectRadius,
            Float gpsAccuracy,
            Boolean isMockLocation,
            String deviceId
    ) {
        public Long getUserId() { return userId; }
        public Double getUserLatitude() { return userLatitude; }
        public Double getUserLongitude() { return userLongitude; }
        public Double getTargetLatitude() { return targetLatitude; }
        public Double getTargetLongitude() { return targetLongitude; }
        public Integer getCollectRadius() { return collectRadius; }
        public Float getGpsAccuracy() { return gpsAccuracy; }
        public Boolean isMockLocation() { return isMockLocation; }
        public String getDeviceId() { return deviceId; }
    }

    public record GpsVerificationResult(
            boolean valid,
            String message,
            double distance,
            int riskScore
    ) {
        public static GpsVerificationResult success(double distance, int riskScore) {
            return new GpsVerificationResult(true, "위치 검증 성공", distance, riskScore);
        }

        public static GpsVerificationResult failed(String message, int riskScore) {
            return new GpsVerificationResult(false, message, 0, riskScore);
        }

        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
        public double getDistance() { return distance; }
        public int getRiskScore() { return riskScore; }
    }

    private record LocationHistory(
            double latitude,
            double longitude,
            LocalDateTime timestamp,
            String deviceId
    ) {}
}
