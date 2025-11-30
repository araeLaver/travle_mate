package com.travelmate.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;

import java.util.Map;

@RestController
@RequestMapping("/location")
@Slf4j
public class LocationController {

    @Value("${kakao.api.key:}")
    private String kakaoApiKey;

    @GetMapping("/address")
    public ResponseEntity<?> getAddressFromCoords(
            @RequestParam Double lat,
            @RequestParam Double lng) {

        try {
            log.info("좌표를 주소로 변환: lat={}, lng={}", lat, lng);

            String url = String.format(
                "https://dapi.kakao.com/v2/local/geo/coord2address.json?x=%f&y=%f",
                lng, lat
            );

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "KakaoAK " + kakaoApiKey);

            HttpEntity<String> entity = new HttpEntity<>(headers);

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, Map.class
            );

            log.info("카카오맵 API 응답: {}", response.getBody());
            return response;

        } catch (Exception e) {
            log.error("주소 변환 실패", e);
            return ResponseEntity.ok(Map.of(
                "error", true,
                "message", "주소 변환에 실패했습니다.",
                "fallback", String.format("위도 %.4f, 경도 %.4f", lat, lng)
            ));
        }
    }
}