package com.travelmate.util;

/**
 * 지리적 계산을 위한 유틸리티 클래스
 * - Haversine 공식을 사용한 거리 계산
 * - 반경 내 포함 여부 확인
 */
public final class GeoUtils {

    private static final int EARTH_RADIUS_KM = 6371;

    private GeoUtils() {
        // 유틸리티 클래스 - 인스턴스화 방지
    }

    /**
     * 두 좌표 간의 거리를 Haversine 공식으로 계산
     *
     * @param lat1 첫 번째 지점의 위도
     * @param lon1 첫 번째 지점의 경도
     * @param lat2 두 번째 지점의 위도
     * @param lon2 두 번째 지점의 경도
     * @return 두 지점 간의 거리 (km)
     */
    public static double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return Double.MAX_VALUE;
        }

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }

    /**
     * 지점이 특정 반경 내에 있는지 확인
     *
     * @param centerLat 중심점 위도
     * @param centerLon 중심점 경도
     * @param targetLat 대상 지점 위도
     * @param targetLon 대상 지점 경도
     * @param radiusKm 반경 (km)
     * @return 반경 내에 있으면 true
     */
    public static boolean isWithinRadius(Double centerLat, Double centerLon,
                                         Double targetLat, Double targetLon,
                                         double radiusKm) {
        return calculateDistance(centerLat, centerLon, targetLat, targetLon) <= radiusKm;
    }

    /**
     * 거리 기반 점수 계산 (가까울수록 높은 점수)
     *
     * @param distance 거리 (km)
     * @param maxDistance 최대 거리 (km) - 이 거리 이상이면 0점
     * @param maxScore 최대 점수
     * @return 거리 기반 점수
     */
    public static double calculateDistanceScore(double distance, double maxDistance, double maxScore) {
        if (distance >= maxDistance) {
            return 0.0;
        }
        return maxScore * (1.0 - distance / maxDistance);
    }

    /**
     * 좌표 유효성 검사
     *
     * @param latitude 위도
     * @param longitude 경도
     * @return 유효하면 true
     */
    public static boolean isValidCoordinate(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return false;
        }
        return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
    }
}
