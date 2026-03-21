package com.travelmate.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.*;

@DisplayName("GeoUtils 테스트")
class GeoUtilsTest {

    // 서울역 좌표
    private static final double SEOUL_STATION_LAT = 37.5547;
    private static final double SEOUL_STATION_LON = 126.9706;

    // 부산역 좌표
    private static final double BUSAN_STATION_LAT = 35.1150;
    private static final double BUSAN_STATION_LON = 129.0413;

    // 강남역 좌표 (서울역에서 약 9km)
    private static final double GANGNAM_LAT = 37.4981;
    private static final double GANGNAM_LON = 127.0276;

    @Nested
    @DisplayName("calculateDistance 테스트")
    class CalculateDistanceTest {

        @Test
        @DisplayName("서울-부산 거리 계산 (약 325km)")
        void calculateDistance_SeoulToBusan() {
            // When
            double distance = GeoUtils.calculateDistance(
                    SEOUL_STATION_LAT, SEOUL_STATION_LON,
                    BUSAN_STATION_LAT, BUSAN_STATION_LON
            );

            // Then - 서울-부산 직선거리 약 320-330km
            assertThat(distance).isBetween(320.0, 330.0);
        }

        @Test
        @DisplayName("서울역-강남역 거리 계산 (약 9km)")
        void calculateDistance_SeoulStationToGangnam() {
            // When
            double distance = GeoUtils.calculateDistance(
                    SEOUL_STATION_LAT, SEOUL_STATION_LON,
                    GANGNAM_LAT, GANGNAM_LON
            );

            // Then - 약 8-10km
            assertThat(distance).isBetween(8.0, 10.0);
        }

        @Test
        @DisplayName("동일 좌표의 거리는 0")
        void calculateDistance_SameLocation() {
            // When
            double distance = GeoUtils.calculateDistance(
                    SEOUL_STATION_LAT, SEOUL_STATION_LON,
                    SEOUL_STATION_LAT, SEOUL_STATION_LON
            );

            // Then
            assertThat(distance).isEqualTo(0.0);
        }

        @Test
        @DisplayName("null 값이 포함된 경우 MAX_VALUE 반환")
        void calculateDistance_WithNull() {
            // When & Then
            assertThat(GeoUtils.calculateDistance(null, 126.0, 37.0, 127.0))
                    .isEqualTo(Double.MAX_VALUE);
            assertThat(GeoUtils.calculateDistance(37.0, null, 37.0, 127.0))
                    .isEqualTo(Double.MAX_VALUE);
            assertThat(GeoUtils.calculateDistance(37.0, 126.0, null, 127.0))
                    .isEqualTo(Double.MAX_VALUE);
            assertThat(GeoUtils.calculateDistance(37.0, 126.0, 37.0, null))
                    .isEqualTo(Double.MAX_VALUE);
        }
    }

    @Nested
    @DisplayName("isWithinRadius 테스트")
    class IsWithinRadiusTest {

        @Test
        @DisplayName("반경 내 - 서울역에서 강남역(9km), 10km 반경 내")
        void isWithinRadius_WithinRadius() {
            // When
            boolean result = GeoUtils.isWithinRadius(
                    SEOUL_STATION_LAT, SEOUL_STATION_LON,
                    GANGNAM_LAT, GANGNAM_LON,
                    10.0
            );

            // Then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("반경 외 - 서울역에서 강남역(9km), 5km 반경 외")
        void isWithinRadius_OutsideRadius() {
            // When
            boolean result = GeoUtils.isWithinRadius(
                    SEOUL_STATION_LAT, SEOUL_STATION_LON,
                    GANGNAM_LAT, GANGNAM_LON,
                    5.0
            );

            // Then
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("서울-부산은 10km 반경 외")
        void isWithinRadius_SeoulBusan_OutsideRadius() {
            // When
            boolean result = GeoUtils.isWithinRadius(
                    SEOUL_STATION_LAT, SEOUL_STATION_LON,
                    BUSAN_STATION_LAT, BUSAN_STATION_LON,
                    10.0
            );

            // Then
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("null 좌표는 항상 false")
        void isWithinRadius_WithNull() {
            // When & Then
            assertThat(GeoUtils.isWithinRadius(null, 126.0, 37.0, 127.0, 10.0)).isFalse();
        }
    }

    @Nested
    @DisplayName("calculateDistanceScore 테스트")
    class CalculateDistanceScoreTest {

        @ParameterizedTest
        @CsvSource({
                "0.0, 10.0, 100.0, 100.0",    // 거리 0 -> 최대 점수
                "10.0, 10.0, 100.0, 0.0",     // 최대 거리 -> 0점
                "5.0, 10.0, 100.0, 50.0",     // 중간 거리 -> 50점
                "2.5, 10.0, 40.0, 30.0"       // 25% 거리 -> 75%점수 = 30점
        })
        @DisplayName("거리 점수 계산")
        void calculateDistanceScore(double distance, double maxDistance, double maxScore, double expectedScore) {
            // When
            double score = GeoUtils.calculateDistanceScore(distance, maxDistance, maxScore);

            // Then
            assertThat(score).isCloseTo(expectedScore, within(0.1));
        }

        @Test
        @DisplayName("최대 거리 초과 시 0점")
        void calculateDistanceScore_ExceedsMax() {
            // When
            double score = GeoUtils.calculateDistanceScore(15.0, 10.0, 100.0);

            // Then
            assertThat(score).isEqualTo(0.0);
        }
    }

    @Nested
    @DisplayName("isValidCoordinate 테스트")
    class IsValidCoordinateTest {

        @Test
        @DisplayName("유효한 좌표")
        void isValidCoordinate_Valid() {
            assertThat(GeoUtils.isValidCoordinate(37.5665, 126.9780)).isTrue();
            assertThat(GeoUtils.isValidCoordinate(-90.0, -180.0)).isTrue();
            assertThat(GeoUtils.isValidCoordinate(90.0, 180.0)).isTrue();
            assertThat(GeoUtils.isValidCoordinate(0.0, 0.0)).isTrue();
        }

        @Test
        @DisplayName("유효하지 않은 위도 (-90 ~ 90 범위 외)")
        void isValidCoordinate_InvalidLatitude() {
            assertThat(GeoUtils.isValidCoordinate(91.0, 0.0)).isFalse();
            assertThat(GeoUtils.isValidCoordinate(-91.0, 0.0)).isFalse();
        }

        @Test
        @DisplayName("유효하지 않은 경도 (-180 ~ 180 범위 외)")
        void isValidCoordinate_InvalidLongitude() {
            assertThat(GeoUtils.isValidCoordinate(0.0, 181.0)).isFalse();
            assertThat(GeoUtils.isValidCoordinate(0.0, -181.0)).isFalse();
        }

        @Test
        @DisplayName("null 좌표")
        void isValidCoordinate_Null() {
            assertThat(GeoUtils.isValidCoordinate(null, 126.0)).isFalse();
            assertThat(GeoUtils.isValidCoordinate(37.0, null)).isFalse();
            assertThat(GeoUtils.isValidCoordinate(null, null)).isFalse();
        }
    }
}
