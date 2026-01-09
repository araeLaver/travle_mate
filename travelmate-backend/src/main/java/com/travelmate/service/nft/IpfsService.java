package com.travelmate.service.nft;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmate.entity.nft.CollectibleLocation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class IpfsService {

    private final ObjectMapper objectMapper;

    @Value("${ipfs.gateway-url:https://ipfs.io/ipfs/}")
    private String ipfsGatewayUrl;

    @Value("${ipfs.api-url:}")
    private String ipfsApiUrl;

    @Value("${ipfs.api-key:}")
    private String ipfsApiKey;

    @Value("${ipfs.enabled:false}")
    private boolean ipfsEnabled;

    /**
     * NFT 메타데이터 생성 및 업로드
     */
    public String uploadNftMetadata(CollectibleLocation location, Long userId, LocalDateTime collectedAt) {
        try {
            Map<String, Object> metadata = createNftMetadata(location, userId, collectedAt);

            if (!ipfsEnabled) {
                // IPFS 비활성화 시 로컬 URI 반환
                String localUri = "local://nft/" + location.getId() + "/" + userId + "/" + System.currentTimeMillis();
                log.info("IPFS 비활성화 - 로컬 URI 사용: {}", localUri);
                return localUri;
            }

            // IPFS에 업로드
            String ipfsHash = uploadToIpfs(metadata);
            return ipfsGatewayUrl + ipfsHash;

        } catch (Exception e) {
            log.error("NFT 메타데이터 업로드 실패", e);
            // 실패 시 폴백 URI 반환
            return "error://metadata-upload-failed/" + location.getId();
        }
    }

    /**
     * ERC721 메타데이터 표준에 맞는 JSON 생성
     */
    private Map<String, Object> createNftMetadata(CollectibleLocation location, Long userId, LocalDateTime collectedAt) {
        Map<String, Object> metadata = new LinkedHashMap<>();

        // 기본 메타데이터 (OpenSea 표준)
        metadata.put("name", location.getName() + " NFT");
        metadata.put("description", createDescription(location));
        metadata.put("image", location.getNftImageUrl() != null ? location.getNftImageUrl() : location.getImageUrl());
        metadata.put("external_url", "https://travelmate.com/nft/" + location.getId());

        // 속성 (Attributes)
        List<Map<String, Object>> attributes = new ArrayList<>();

        // 희귀도
        attributes.add(createAttribute("Rarity", location.getRarity().name(), null));

        // 카테고리
        attributes.add(createAttribute("Category", location.getCategory().name(), null));

        // 국가
        if (location.getCountry() != null) {
            attributes.add(createAttribute("Country", location.getCountry(), null));
        }

        // 도시
        if (location.getCity() != null) {
            attributes.add(createAttribute("City", location.getCity(), null));
        }

        // 지역
        if (location.getRegion() != null) {
            attributes.add(createAttribute("Region", location.getRegion(), null));
        }

        // 포인트 보상
        attributes.add(createAttribute("Point Reward", location.getPointReward(), "number"));

        // 수집 반경
        attributes.add(createAttribute("Collect Radius", location.getCollectRadius() + "m", null));

        // 좌표
        attributes.add(createAttribute("Latitude", location.getLatitude(), "number"));
        attributes.add(createAttribute("Longitude", location.getLongitude(), "number"));

        // 시즌 이벤트 여부
        if (location.getIsSeasonalEvent() != null && location.getIsSeasonalEvent()) {
            attributes.add(createAttribute("Seasonal Event", "Yes", null));
            if (location.getEventEndAt() != null) {
                attributes.add(createAttribute("Event End Date",
                        location.getEventEndAt().format(DateTimeFormatter.ISO_DATE), null));
            }
        }

        // 수집 정보
        attributes.add(createAttribute("Collected By", "User #" + userId, null));
        attributes.add(createAttribute("Collected At",
                collectedAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME), null));

        metadata.put("attributes", attributes);

        // 추가 메타데이터
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("location_id", location.getId());
        properties.put("collector_id", userId);
        properties.put("collection_timestamp", collectedAt.toString());
        properties.put("contract_version", "1.0.0");
        metadata.put("properties", properties);

        return metadata;
    }

    /**
     * 속성 맵 생성 헬퍼
     */
    private Map<String, Object> createAttribute(String traitType, Object value, String displayType) {
        Map<String, Object> attribute = new LinkedHashMap<>();
        attribute.put("trait_type", traitType);
        attribute.put("value", value);
        if (displayType != null) {
            attribute.put("display_type", displayType);
        }
        return attribute;
    }

    /**
     * NFT 설명 생성
     */
    private String createDescription(CollectibleLocation location) {
        StringBuilder sb = new StringBuilder();
        sb.append("TravelMate NFT - ").append(location.getName()).append("\n\n");

        if (location.getDescription() != null) {
            sb.append(location.getDescription()).append("\n\n");
        }

        sb.append("Location: ");
        if (location.getCity() != null) {
            sb.append(location.getCity()).append(", ");
        }
        if (location.getCountry() != null) {
            sb.append(location.getCountry());
        }
        sb.append("\n");

        sb.append("Rarity: ").append(location.getRarity().name()).append("\n");
        sb.append("Category: ").append(location.getCategory().name()).append("\n");
        sb.append("Point Reward: ").append(location.getPointReward()).append(" points\n");

        if (location.getIsSeasonalEvent() != null && location.getIsSeasonalEvent()) {
            sb.append("\nThis is a limited-time seasonal event NFT!");
        }

        return sb.toString();
    }

    /**
     * IPFS에 JSON 업로드
     */
    private String uploadToIpfs(Map<String, Object> metadata) throws Exception {
        if (ipfsApiUrl == null || ipfsApiUrl.isBlank()) {
            throw new IllegalStateException("IPFS API URL이 설정되지 않았습니다.");
        }

        String jsonContent = objectMapper.writeValueAsString(metadata);

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        if (ipfsApiKey != null && !ipfsApiKey.isBlank()) {
            headers.set("Authorization", "Bearer " + ipfsApiKey);
        }

        HttpEntity<String> request = new HttpEntity<>(jsonContent, headers);

        // Pinata 또는 다른 IPFS 핀닝 서비스 사용
        ResponseEntity<Map> response = restTemplate.postForEntity(
                ipfsApiUrl + "/pinning/pinJSONToIPFS",
                request,
                Map.class
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            return (String) response.getBody().get("IpfsHash");
        }

        throw new RuntimeException("IPFS 업로드 실패: " + response.getStatusCode());
    }

    /**
     * IPFS에서 메타데이터 조회
     */
    public Map<String, Object> getMetadata(String ipfsUri) {
        try {
            String url;
            if (ipfsUri.startsWith("ipfs://")) {
                url = ipfsGatewayUrl + ipfsUri.substring(7);
            } else if (ipfsUri.startsWith("local://") || ipfsUri.startsWith("error://")) {
                // 로컬 또는 에러 URI는 빈 맵 반환
                return Collections.emptyMap();
            } else {
                url = ipfsUri;
            }

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("IPFS 메타데이터 조회 실패: {}", ipfsUri, e);
        }
        return Collections.emptyMap();
    }

    /**
     * 이미지 IPFS 업로드 (바이트 배열)
     */
    public String uploadImage(byte[] imageData, String fileName) {
        if (!ipfsEnabled) {
            return "local://image/" + fileName + "/" + System.currentTimeMillis();
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            if (ipfsApiKey != null && !ipfsApiKey.isBlank()) {
                headers.set("Authorization", "Bearer " + ipfsApiKey);
            }

            org.springframework.util.MultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
            body.add("file", new org.springframework.core.io.ByteArrayResource(imageData) {
                @Override
                public String getFilename() {
                    return fileName;
                }
            });

            HttpEntity<org.springframework.util.MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    ipfsApiUrl + "/pinning/pinFileToIPFS",
                    request,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String hash = (String) response.getBody().get("IpfsHash");
                return ipfsGatewayUrl + hash;
            }
        } catch (Exception e) {
            log.error("이미지 IPFS 업로드 실패", e);
        }

        return null;
    }
}
