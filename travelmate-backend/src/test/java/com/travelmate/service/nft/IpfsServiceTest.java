package com.travelmate.service.nft;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmate.entity.nft.CollectibleLocation;
import com.travelmate.entity.nft.LocationCategory;
import com.travelmate.entity.nft.Rarity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("IpfsService 테스트")
class IpfsServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private IpfsService ipfsService;
    private ObjectMapper objectMapper;

    private CollectibleLocation testLocation;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();

        // RestTemplateBuilder mock 설정
        RestTemplateBuilder restTemplateBuilder = mock(RestTemplateBuilder.class);
        when(restTemplateBuilder.connectTimeout(any(Duration.class))).thenReturn(restTemplateBuilder);
        when(restTemplateBuilder.readTimeout(any(Duration.class))).thenReturn(restTemplateBuilder);
        when(restTemplateBuilder.build()).thenReturn(restTemplate);

        ipfsService = new IpfsService(objectMapper, restTemplateBuilder);

        ReflectionTestUtils.setField(ipfsService, "ipfsGatewayUrl", "https://ipfs.io/ipfs/");
        ReflectionTestUtils.setField(ipfsService, "ipfsApiUrl", "https://api.pinata.cloud");
        ReflectionTestUtils.setField(ipfsService, "ipfsApiKey", "test_api_key");
        ReflectionTestUtils.setField(ipfsService, "ipfsEnabled", false);

        // 테스트용 CollectibleLocation 생성
        testLocation = new CollectibleLocation();
        testLocation.setId(1L);
        testLocation.setName("Seoul Tower");
        testLocation.setDescription("A famous tower in Seoul");
        testLocation.setRarity(Rarity.RARE);
        testLocation.setCategory(LocationCategory.LANDMARK);
        testLocation.setCountry("South Korea");
        testLocation.setCity("Seoul");
        testLocation.setRegion("Yongsan");
        testLocation.setLatitude(37.5512);
        testLocation.setLongitude(126.9882);
        testLocation.setPointReward(100);
        testLocation.setCollectRadius(50.0);
        testLocation.setImageUrl("https://example.com/image.jpg");
        testLocation.setNftImageUrl("https://example.com/nft.jpg");
        testLocation.setIsSeasonalEvent(false);
    }

    @Nested
    @DisplayName("uploadNftMetadata 테스트")
    class UploadNftMetadataTest {

        @Test
        @DisplayName("성공 - IPFS 비활성화시 로컬 URI 반환")
        void uploadNftMetadata_IpfsDisabled() {
            // Given
            ReflectionTestUtils.setField(ipfsService, "ipfsEnabled", false);

            // When
            String result = ipfsService.uploadNftMetadata(testLocation, 1L, LocalDateTime.now());

            // Then
            assertThat(result).startsWith("local://nft/");
            assertThat(result).contains("/1/"); // location id
            assertThat(result).contains("/1/"); // user id
        }

        @Test
        @DisplayName("성공 - IPFS 활성화시 업로드")
        void uploadNftMetadata_IpfsEnabled() {
            // Given
            ReflectionTestUtils.setField(ipfsService, "ipfsEnabled", true);

            Map<String, Object> responseBody = Map.of("IpfsHash", "QmTestHash123456789");
            ResponseEntity<Map> response = new ResponseEntity<>(responseBody, HttpStatus.OK);

            when(restTemplate.postForEntity(
                    eq("https://api.pinata.cloud/pinning/pinJSONToIPFS"),
                    any(HttpEntity.class),
                    eq(Map.class)
            )).thenReturn(response);

            // When
            String result = ipfsService.uploadNftMetadata(testLocation, 1L, LocalDateTime.now());

            // Then
            assertThat(result).isEqualTo("https://ipfs.io/ipfs/QmTestHash123456789");
        }

        @Test
        @DisplayName("실패 - IPFS 업로드 실패시 에러 URI 반환")
        void uploadNftMetadata_UploadFailed() {
            // Given
            ReflectionTestUtils.setField(ipfsService, "ipfsEnabled", true);

            when(restTemplate.postForEntity(
                    anyString(),
                    any(HttpEntity.class),
                    eq(Map.class)
            )).thenThrow(new RuntimeException("Connection failed"));

            // When
            String result = ipfsService.uploadNftMetadata(testLocation, 1L, LocalDateTime.now());

            // Then
            assertThat(result).startsWith("error://");
            assertThat(result).contains("metadata-upload-failed");
        }

        @Test
        @DisplayName("성공 - 시즌 이벤트 NFT 메타데이터")
        void uploadNftMetadata_SeasonalEvent() {
            // Given
            testLocation.setIsSeasonalEvent(true);
            testLocation.setEventEndAt(LocalDateTime.now().plusDays(30));

            ReflectionTestUtils.setField(ipfsService, "ipfsEnabled", false);

            // When
            String result = ipfsService.uploadNftMetadata(testLocation, 1L, LocalDateTime.now());

            // Then
            assertThat(result).startsWith("local://nft/");
        }

        @Test
        @DisplayName("성공 - null 필드 처리")
        void uploadNftMetadata_NullFields() {
            // Given
            testLocation.setDescription(null);
            testLocation.setRegion(null);
            testLocation.setNftImageUrl(null);

            ReflectionTestUtils.setField(ipfsService, "ipfsEnabled", false);

            // When
            String result = ipfsService.uploadNftMetadata(testLocation, 1L, LocalDateTime.now());

            // Then
            assertThat(result).startsWith("local://nft/");
        }
    }

    @Nested
    @DisplayName("getMetadata 테스트")
    class GetMetadataTest {

        @Test
        @DisplayName("성공 - IPFS URI에서 메타데이터 조회")
        void getMetadata_IpfsUri() {
            // Given
            String ipfsUri = "ipfs://QmTestHash123456789";
            Map<String, Object> metadataResponse = Map.of(
                    "name", "Seoul Tower NFT",
                    "description", "A famous tower in Seoul"
            );

            ResponseEntity<Map> response = new ResponseEntity<>(metadataResponse, HttpStatus.OK);
            when(restTemplate.getForEntity(
                    eq("https://ipfs.io/ipfs/QmTestHash123456789"),
                    eq(Map.class)
            )).thenReturn(response);

            // When
            Map<String, Object> result = ipfsService.getMetadata(ipfsUri);

            // Then
            assertThat(result).isNotEmpty();
            assertThat(result.get("name")).isEqualTo("Seoul Tower NFT");
        }

        @Test
        @DisplayName("성공 - 전체 URL에서 메타데이터 조회")
        void getMetadata_FullUrl() {
            // Given
            String fullUrl = "https://ipfs.io/ipfs/QmTestHash123456789";
            Map<String, Object> metadataResponse = Map.of("name", "Test NFT");

            ResponseEntity<Map> response = new ResponseEntity<>(metadataResponse, HttpStatus.OK);
            when(restTemplate.getForEntity(eq(fullUrl), eq(Map.class))).thenReturn(response);

            // When
            Map<String, Object> result = ipfsService.getMetadata(fullUrl);

            // Then
            assertThat(result).isNotEmpty();
        }

        @Test
        @DisplayName("성공 - 로컬 URI는 빈 맵 반환")
        void getMetadata_LocalUri() {
            // Given
            String localUri = "local://nft/1/1/123456789";

            // When
            Map<String, Object> result = ipfsService.getMetadata(localUri);

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("성공 - 에러 URI는 빈 맵 반환")
        void getMetadata_ErrorUri() {
            // Given
            String errorUri = "error://metadata-upload-failed/1";

            // When
            Map<String, Object> result = ipfsService.getMetadata(errorUri);

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("실패 - API 호출 실패시 빈 맵 반환")
        void getMetadata_ApiFailed() {
            // Given
            String ipfsUri = "ipfs://QmTestHash123456789";

            when(restTemplate.getForEntity(anyString(), eq(Map.class)))
                    .thenThrow(new RuntimeException("Connection failed"));

            // When
            Map<String, Object> result = ipfsService.getMetadata(ipfsUri);

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("실패 - null 응답시 빈 맵 반환")
        void getMetadata_NullResponse() {
            // Given
            String ipfsUri = "ipfs://QmTestHash123456789";

            ResponseEntity<Map> response = new ResponseEntity<>(null, HttpStatus.OK);
            when(restTemplate.getForEntity(anyString(), eq(Map.class))).thenReturn(response);

            // When
            Map<String, Object> result = ipfsService.getMetadata(ipfsUri);

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("uploadImage 테스트")
    class UploadImageTest {

        @Test
        @DisplayName("성공 - IPFS 비활성화시 로컬 URI 반환")
        void uploadImage_IpfsDisabled() {
            // Given
            ReflectionTestUtils.setField(ipfsService, "ipfsEnabled", false);
            byte[] imageData = "test image data".getBytes();

            // When
            String result = ipfsService.uploadImage(imageData, "test.jpg");

            // Then
            assertThat(result).startsWith("local://image/");
            assertThat(result).contains("test.jpg");
        }

        @Test
        @DisplayName("성공 - IPFS 활성화시 이미지 업로드")
        void uploadImage_IpfsEnabled() {
            // Given
            ReflectionTestUtils.setField(ipfsService, "ipfsEnabled", true);
            byte[] imageData = "test image data".getBytes();

            Map<String, Object> responseBody = Map.of("IpfsHash", "QmImageHash123456789");
            ResponseEntity<Map> response = new ResponseEntity<>(responseBody, HttpStatus.OK);

            when(restTemplate.postForEntity(
                    eq("https://api.pinata.cloud/pinning/pinFileToIPFS"),
                    any(HttpEntity.class),
                    eq(Map.class)
            )).thenReturn(response);

            // When
            String result = ipfsService.uploadImage(imageData, "test.jpg");

            // Then
            assertThat(result).isEqualTo("https://ipfs.io/ipfs/QmImageHash123456789");
        }

        @Test
        @DisplayName("실패 - 업로드 실패시 null 반환")
        void uploadImage_UploadFailed() {
            // Given
            ReflectionTestUtils.setField(ipfsService, "ipfsEnabled", true);
            byte[] imageData = "test image data".getBytes();

            when(restTemplate.postForEntity(
                    anyString(),
                    any(HttpEntity.class),
                    eq(Map.class)
            )).thenThrow(new RuntimeException("Upload failed"));

            // When
            String result = ipfsService.uploadImage(imageData, "test.jpg");

            // Then
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("실패 - API 응답 실패시 null 반환")
        void uploadImage_ApiResponseFailed() {
            // Given
            ReflectionTestUtils.setField(ipfsService, "ipfsEnabled", true);
            byte[] imageData = "test image data".getBytes();

            ResponseEntity<Map> response = new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
            when(restTemplate.postForEntity(
                    anyString(),
                    any(HttpEntity.class),
                    eq(Map.class)
            )).thenReturn(response);

            // When
            String result = ipfsService.uploadImage(imageData, "test.jpg");

            // Then
            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("메타데이터 생성 테스트")
    class MetadataCreationTest {

        @Test
        @DisplayName("성공 - 모든 희귀도 처리")
        void createMetadata_AllRarities() {
            // Given
            ReflectionTestUtils.setField(ipfsService, "ipfsEnabled", false);

            for (Rarity rarity : Rarity.values()) {
                testLocation.setRarity(rarity);

                // When
                String result = ipfsService.uploadNftMetadata(testLocation, 1L, LocalDateTime.now());

                // Then
                assertThat(result).startsWith("local://nft/");
            }
        }

        @Test
        @DisplayName("성공 - 모든 카테고리 처리")
        void createMetadata_AllCategories() {
            // Given
            ReflectionTestUtils.setField(ipfsService, "ipfsEnabled", false);

            for (LocationCategory category : LocationCategory.values()) {
                testLocation.setCategory(category);

                // When
                String result = ipfsService.uploadNftMetadata(testLocation, 1L, LocalDateTime.now());

                // Then
                assertThat(result).startsWith("local://nft/");
            }
        }

        @Test
        @DisplayName("성공 - 시즌 이벤트 종료일 없음")
        void createMetadata_SeasonalEventNoEndDate() {
            // Given
            testLocation.setIsSeasonalEvent(true);
            testLocation.setEventEndAt(null);

            ReflectionTestUtils.setField(ipfsService, "ipfsEnabled", false);

            // When
            String result = ipfsService.uploadNftMetadata(testLocation, 1L, LocalDateTime.now());

            // Then
            assertThat(result).startsWith("local://nft/");
        }
    }

    @Nested
    @DisplayName("API 키 설정 테스트")
    class ApiKeyConfigTest {

        @Test
        @DisplayName("성공 - API 키가 없을 때 업로드 (IPFS 비활성화)")
        void uploadWithoutApiKey_IpfsDisabled() {
            // Given
            ReflectionTestUtils.setField(ipfsService, "ipfsApiKey", "");
            ReflectionTestUtils.setField(ipfsService, "ipfsEnabled", false);

            // When
            String result = ipfsService.uploadNftMetadata(testLocation, 1L, LocalDateTime.now());

            // Then
            assertThat(result).startsWith("local://nft/");
        }

        @Test
        @DisplayName("성공 - API 키가 null일 때 업로드 (IPFS 비활성화)")
        void uploadWithNullApiKey_IpfsDisabled() {
            // Given
            ReflectionTestUtils.setField(ipfsService, "ipfsApiKey", null);
            ReflectionTestUtils.setField(ipfsService, "ipfsEnabled", false);

            // When
            String result = ipfsService.uploadNftMetadata(testLocation, 1L, LocalDateTime.now());

            // Then
            assertThat(result).startsWith("local://nft/");
        }

        @Test
        @DisplayName("실패 - IPFS 활성화되었지만 API URL 없음")
        void uploadWithoutApiUrl() {
            // Given
            ReflectionTestUtils.setField(ipfsService, "ipfsEnabled", true);
            ReflectionTestUtils.setField(ipfsService, "ipfsApiUrl", "");

            // When
            String result = ipfsService.uploadNftMetadata(testLocation, 1L, LocalDateTime.now());

            // Then
            assertThat(result).startsWith("error://");
        }
    }
}
