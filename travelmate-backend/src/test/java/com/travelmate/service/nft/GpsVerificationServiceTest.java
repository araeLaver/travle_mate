package com.travelmate.service.nft;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

@DisplayName("GpsVerificationService 테스트")
class GpsVerificationServiceTest {

    private GpsVerificationService gpsVerificationService;

    // 서울타워 좌표
    private static final double SEOUL_TOWER_LAT = 37.5512;
    private static final double SEOUL_TOWER_LNG = 126.9882;

    @BeforeEach
    void setUp() {
        // 각 테스트마다 격리된 인메모리 위치 이력 저장소로 서비스 생성
        gpsVerificationService = new GpsVerificationService(new InMemoryLocationHistoryStore());
        gpsVerificationService.clearUserHistory(1L);
    }

    @Nested
    @DisplayName("verify 테스트")
    class VerifyTest {

        @Test
        @DisplayName("성공 - 정상 위치 검증")
        void verify_Success() {
            // Given - 서울타워 반경 30m 이내
            GpsVerificationService.GpsVerificationRequest request =
                    new GpsVerificationService.GpsVerificationRequest(
                            1L,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            50, // collectRadius
                            10.0f, // gpsAccuracy
                            false, // isMockLocation
                            "device123"
                    );

            // When
            GpsVerificationService.GpsVerificationResult result = gpsVerificationService.verify(request);

            // Then
            assertThat(result.isValid()).isTrue();
            assertThat(result.getMessage()).contains("성공");
            assertThat(result.getDistance()).isLessThanOrEqualTo(50);
        }

        @Test
        @DisplayName("실패 - Mock Location 감지")
        void verify_MockLocation() {
            // Given
            GpsVerificationService.GpsVerificationRequest request =
                    new GpsVerificationService.GpsVerificationRequest(
                            1L,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            50,
                            10.0f,
                            true, // Mock location
                            "device123"
                    );

            // When
            GpsVerificationService.GpsVerificationResult result = gpsVerificationService.verify(request);

            // Then
            assertThat(result.isValid()).isFalse();
            assertThat(result.getMessage()).contains("위조");
            assertThat(result.getRiskScore()).isEqualTo(100);
        }

        @Test
        @DisplayName("실패 - 거리 초과")
        void verify_DistanceExceeded() {
            // Given - 서울타워에서 약 1km 떨어진 위치
            GpsVerificationService.GpsVerificationRequest request =
                    new GpsVerificationService.GpsVerificationRequest(
                            1L,
                            37.5600, // 약 1km 북쪽
                            SEOUL_TOWER_LNG,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            50, // 50m 반경
                            10.0f,
                            false,
                            "device123"
                    );

            // When
            GpsVerificationService.GpsVerificationResult result = gpsVerificationService.verify(request);

            // Then
            assertThat(result.isValid()).isFalse();
            assertThat(result.getMessage()).contains("접근");
        }

        @Test
        @DisplayName("성공 - 경계값 (정확히 반경 내)")
        void verify_BoundaryDistance() {
            // Given - 약 40m 떨어진 위치 (50m 반경 내)
            GpsVerificationService.GpsVerificationRequest request =
                    new GpsVerificationService.GpsVerificationRequest(
                            1L,
                            37.5515, // 약 35m 북쪽
                            SEOUL_TOWER_LNG,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            50,
                            10.0f,
                            false,
                            "device123"
                    );

            // When
            GpsVerificationService.GpsVerificationResult result = gpsVerificationService.verify(request);

            // Then
            assertThat(result.isValid()).isTrue();
        }

        @Test
        @DisplayName("경고 - GPS 정확도 불량")
        void verify_PoorGpsAccuracy() {
            // Given - GPS 정확도 150m (100m 초과)
            GpsVerificationService.GpsVerificationRequest request =
                    new GpsVerificationService.GpsVerificationRequest(
                            1L,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            50,
                            150.0f, // 불량한 GPS 정확도
                            false,
                            "device123"
                    );

            // When
            GpsVerificationService.GpsVerificationResult result = gpsVerificationService.verify(request);

            // Then
            assertThat(result.isValid()).isTrue(); // 단독으로는 통과
            assertThat(result.getRiskScore()).isGreaterThan(0); // 하지만 리스크 점수 추가
        }

        @Test
        @DisplayName("실패 - 순간이동 감지")
        void verify_TeleportDetected() throws InterruptedException {
            // Given - 첫 번째 위치 등록 (서울)
            GpsVerificationService.GpsVerificationRequest firstRequest =
                    new GpsVerificationService.GpsVerificationRequest(
                            1L,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            50,
                            10.0f,
                            false,
                            "device123"
                    );
            gpsVerificationService.verify(firstRequest);

            // 아주 짧은 대기 후 (1초 이내)
            Thread.sleep(100);

            // 부산으로 순간이동 (약 325km)
            GpsVerificationService.GpsVerificationRequest secondRequest =
                    new GpsVerificationService.GpsVerificationRequest(
                            1L,
                            35.1796, // 부산 좌표
                            129.0756,
                            35.1796,
                            129.0756,
                            50,
                            10.0f,
                            false,
                            "device123"
                    );

            // When
            GpsVerificationService.GpsVerificationResult result = gpsVerificationService.verify(secondRequest);

            // Then - 순간이동으로 인한 높은 리스크 점수
            assertThat(result.isValid()).isFalse();
            assertThat(result.getRiskScore()).isGreaterThanOrEqualTo(50);
        }

        @Test
        @DisplayName("경고 - 디바이스 변경")
        void verify_DeviceChange() {
            // Given - 첫 번째 디바이스로 등록
            GpsVerificationService.GpsVerificationRequest firstRequest =
                    new GpsVerificationService.GpsVerificationRequest(
                            1L,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            50,
                            10.0f,
                            false,
                            "device123"
                    );
            gpsVerificationService.verify(firstRequest);

            // 다른 디바이스로 요청
            GpsVerificationService.GpsVerificationRequest secondRequest =
                    new GpsVerificationService.GpsVerificationRequest(
                            1L,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            50,
                            10.0f,
                            false,
                            "device456" // 다른 디바이스
                    );

            // When
            GpsVerificationService.GpsVerificationResult result = gpsVerificationService.verify(secondRequest);

            // Then
            assertThat(result.isValid()).isTrue(); // 단독으로는 통과
            assertThat(result.getRiskScore()).isGreaterThan(0); // 리스크 점수 추가
        }

        @Test
        @DisplayName("실패 - 복합 위험 요소")
        void verify_MultipleRiskFactors() {
            // Given - 첫 번째 등록
            GpsVerificationService.GpsVerificationRequest firstRequest =
                    new GpsVerificationService.GpsVerificationRequest(
                            1L,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            50,
                            10.0f,
                            false,
                            "device123"
                    );
            gpsVerificationService.verify(firstRequest);

            // 위험 요소: GPS 불량 + 디바이스 변경 + 연속 수집
            GpsVerificationService.GpsVerificationRequest riskyRequest =
                    new GpsVerificationService.GpsVerificationRequest(
                            1L,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            50,
                            150.0f, // GPS 불량
                            false,
                            "device456" // 디바이스 변경
                    );

            // When
            GpsVerificationService.GpsVerificationResult result = gpsVerificationService.verify(riskyRequest);

            // Then - 복합 리스크로 인해 실패 가능
            assertThat(result.getRiskScore()).isGreaterThanOrEqualTo(30);
        }
    }

    @Nested
    @DisplayName("calculateDistance 테스트")
    class CalculateDistanceTest {

        @Test
        @DisplayName("성공 - 같은 위치 거리 0")
        void calculateDistance_SameLocation() {
            // When
            double distance = gpsVerificationService.calculateDistance(
                    SEOUL_TOWER_LAT, SEOUL_TOWER_LNG,
                    SEOUL_TOWER_LAT, SEOUL_TOWER_LNG
            );

            // Then
            assertThat(distance).isEqualTo(0.0);
        }

        @Test
        @DisplayName("성공 - 서울-부산 거리 계산 (약 325km)")
        void calculateDistance_SeoulToBusan() {
            // Given
            double busanLat = 35.1796;
            double busanLng = 129.0756;

            // When
            double distance = gpsVerificationService.calculateDistance(
                    SEOUL_TOWER_LAT, SEOUL_TOWER_LNG,
                    busanLat, busanLng
            );

            // Then - 약 325km
            assertThat(distance).isBetween(320000.0, 330000.0);
        }

        @Test
        @DisplayName("성공 - 짧은 거리 계산 (약 100m)")
        void calculateDistance_ShortDistance() {
            // Given - 약 100m 북쪽
            double nearLat = 37.5521;

            // When
            double distance = gpsVerificationService.calculateDistance(
                    SEOUL_TOWER_LAT, SEOUL_TOWER_LNG,
                    nearLat, SEOUL_TOWER_LNG
            );

            // Then - 약 100m (오차 범위 포함)
            assertThat(distance).isBetween(90.0, 110.0);
        }

        @Test
        @DisplayName("성공 - 경도 방향 거리")
        void calculateDistance_LongitudeOnly() {
            // Given - 동쪽으로 이동
            double eastLng = 126.9900;

            // When
            double distance = gpsVerificationService.calculateDistance(
                    SEOUL_TOWER_LAT, SEOUL_TOWER_LNG,
                    SEOUL_TOWER_LAT, eastLng
            );

            // Then
            assertThat(distance).isGreaterThan(0);
            assertThat(distance).isLessThan(200); // 약 150m
        }

        @Test
        @DisplayName("성공 - 대각선 방향 거리")
        void calculateDistance_Diagonal() {
            // Given - 북동쪽으로 이동
            double neLat = 37.5520;
            double neLng = 126.9890;

            // When
            double distance = gpsVerificationService.calculateDistance(
                    SEOUL_TOWER_LAT, SEOUL_TOWER_LNG,
                    neLat, neLng
            );

            // Then - 피타고라스 정리에 따라 약 110m 정도
            assertThat(distance).isGreaterThan(80);
            assertThat(distance).isLessThan(150);
        }
    }

    @Nested
    @DisplayName("clearUserHistory 테스트")
    class ClearUserHistoryTest {

        @Test
        @DisplayName("성공 - 히스토리 초기화 후 연속 수집 가능")
        void clearUserHistory_Success() throws InterruptedException {
            // Given - 첫 번째 수집
            GpsVerificationService.GpsVerificationRequest firstRequest =
                    new GpsVerificationService.GpsVerificationRequest(
                            1L,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            50,
                            10.0f,
                            false,
                            "device123"
                    );
            gpsVerificationService.verify(firstRequest);

            // 히스토리 초기화
            gpsVerificationService.clearUserHistory(1L);

            // 즉시 다시 수집 시도
            GpsVerificationService.GpsVerificationRequest secondRequest =
                    new GpsVerificationService.GpsVerificationRequest(
                            1L,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            50,
                            10.0f,
                            false,
                            "device123"
                    );

            // When
            GpsVerificationService.GpsVerificationResult result = gpsVerificationService.verify(secondRequest);

            // Then - 히스토리 초기화로 연속 수집 패널티 없음
            assertThat(result.isValid()).isTrue();
            assertThat(result.getRiskScore()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("경계값 테스트")
    class EdgeCaseTest {

        @Test
        @DisplayName("성공 - null GPS 정확도")
        void verify_NullGpsAccuracy() {
            // Given
            GpsVerificationService.GpsVerificationRequest request =
                    new GpsVerificationService.GpsVerificationRequest(
                            1L,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            50,
                            null, // null GPS accuracy
                            false,
                            "device123"
                    );

            // When
            GpsVerificationService.GpsVerificationResult result = gpsVerificationService.verify(request);

            // Then
            assertThat(result.isValid()).isTrue();
        }

        @Test
        @DisplayName("성공 - null isMockLocation")
        void verify_NullMockLocation() {
            // Given
            GpsVerificationService.GpsVerificationRequest request =
                    new GpsVerificationService.GpsVerificationRequest(
                            1L,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            50,
                            10.0f,
                            null, // null isMockLocation
                            "device123"
                    );

            // When
            GpsVerificationService.GpsVerificationResult result = gpsVerificationService.verify(request);

            // Then
            assertThat(result.isValid()).isTrue();
        }

        @Test
        @DisplayName("성공 - null deviceId")
        void verify_NullDeviceId() {
            // Given
            GpsVerificationService.GpsVerificationRequest request =
                    new GpsVerificationService.GpsVerificationRequest(
                            1L,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            50,
                            10.0f,
                            false,
                            null // null deviceId
                    );

            // When
            GpsVerificationService.GpsVerificationResult result = gpsVerificationService.verify(request);

            // Then
            assertThat(result.isValid()).isTrue();
        }

        @Test
        @DisplayName("성공 - 큰 수집 반경")
        void verify_LargeCollectRadius() {
            // Given - 1km 반경
            GpsVerificationService.GpsVerificationRequest request =
                    new GpsVerificationService.GpsVerificationRequest(
                            1L,
                            37.5600, // 약 1km 떨어진 위치
                            SEOUL_TOWER_LNG,
                            SEOUL_TOWER_LAT,
                            SEOUL_TOWER_LNG,
                            1500, // 1.5km 반경
                            10.0f,
                            false,
                            "device123"
                    );

            // When
            GpsVerificationService.GpsVerificationResult result = gpsVerificationService.verify(request);

            // Then
            assertThat(result.isValid()).isTrue();
        }
    }
}
