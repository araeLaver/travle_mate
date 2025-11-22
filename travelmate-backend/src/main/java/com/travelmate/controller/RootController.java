package com.travelmate.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 루트 경로 컨트롤러
 * API 서버 정보 제공
 */
@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, Object> root() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", "TravelMate API Server");
        response.put("version", "1.0.0");
        response.put("status", "running");
        response.put("documentation", "/api/swagger-ui/index.html");
        response.put("health", "/api/management/health");
        return response;
    }

    @GetMapping("/api")
    public Map<String, Object> apiRoot() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", "TravelMate API");
        response.put("version", "1.0.0");
        response.put("documentation", "/api/swagger-ui/index.html");
        response.put("endpoints", Map.of(
            "auth", "/api/auth",
            "users", "/api/users",
            "trips", "/api/trips",
            "posts", "/api/posts",
            "health", "/api/management/health"
        ));
        return response;
    }
}
