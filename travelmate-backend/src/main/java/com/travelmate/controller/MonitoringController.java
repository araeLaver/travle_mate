package com.travelmate.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 프론트엔드 모니터링 로그 수신 및 시스템 메트릭 제공
 */
@RestController
@RequestMapping("/monitoring")
@RequiredArgsConstructor
@Slf4j
public class MonitoringController {

    private static final org.slf4j.Logger frontendLogger =
        org.slf4j.LoggerFactory.getLogger("com.travelmate.frontend");

    /**
     * 프론트엔드 로그 수신
     */
    @PostMapping("/logs")
    public ResponseEntity<Map<String, Object>> receiveLogs(
            @RequestBody FrontendLogsRequest request,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @RequestHeader(value = "User-Agent", required = false) String userAgent) {

        if (request.logs() == null || request.logs().isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "received", 0
            ));
        }

        for (FrontendLogEntry entry : request.logs()) {
            String logMessage = String.format(
                "[FRONTEND] [%s] [Session: %s] %s | URL: %s | Context: %s",
                entry.level(),
                entry.sessionId() != null ? entry.sessionId() : sessionId,
                entry.message(),
                entry.url(),
                entry.context()
            );

            switch (entry.level().toLowerCase()) {
                case "debug":
                    frontendLogger.debug(logMessage);
                    break;
                case "info":
                    frontendLogger.info(logMessage);
                    break;
                case "warn":
                    frontendLogger.warn(logMessage);
                    break;
                case "error":
                    frontendLogger.error(logMessage);
                    if (entry.stack() != null) {
                        frontendLogger.error("[FRONTEND] Stack trace: {}", entry.stack());
                    }
                    break;
                default:
                    frontendLogger.info(logMessage);
            }
        }

        log.debug("Received {} frontend logs from session {}",
            request.logs().size(), sessionId);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "received", request.logs().size(),
            "timestamp", LocalDateTime.now().toString()
        ));
    }

    /**
     * 시스템 메트릭 조회 (개발/디버그용)
     */
    @GetMapping("/metrics/summary")
    public ResponseEntity<Map<String, Object>> getMetricsSummary() {
        Runtime runtime = Runtime.getRuntime();

        Map<String, Object> metrics = Map.of(
            "timestamp", LocalDateTime.now().toString(),
            "memory", Map.of(
                "total", runtime.totalMemory(),
                "free", runtime.freeMemory(),
                "used", runtime.totalMemory() - runtime.freeMemory(),
                "max", runtime.maxMemory()
            ),
            "processors", runtime.availableProcessors(),
            "jvm", Map.of(
                "version", System.getProperty("java.version"),
                "vendor", System.getProperty("java.vendor")
            ),
            "os", Map.of(
                "name", System.getProperty("os.name"),
                "arch", System.getProperty("os.arch"),
                "version", System.getProperty("os.version")
            )
        );

        return ResponseEntity.ok(metrics);
    }

    /**
     * 프론트엔드 에러 리포트 수신
     */
    @PostMapping("/errors")
    public ResponseEntity<Map<String, Object>> receiveError(
            @RequestBody FrontendErrorReport report,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {

        log.error("[FRONTEND ERROR] Session: {} | Message: {} | URL: {} | Stack: {}",
            report.sessionId() != null ? report.sessionId() : sessionId,
            report.message(),
            report.url(),
            report.stack());

        if (report.componentStack() != null) {
            log.error("[FRONTEND ERROR] Component Stack: {}", report.componentStack());
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "errorId", "ERR-" + System.currentTimeMillis(),
            "timestamp", LocalDateTime.now().toString()
        ));
    }

    /**
     * 프론트엔드 성능 메트릭 수신
     */
    @PostMapping("/performance")
    public ResponseEntity<Map<String, Object>> receivePerformanceMetrics(
            @RequestBody PerformanceMetricsRequest request,
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId) {

        if (request.metrics() != null) {
            for (PerformanceMetric metric : request.metrics()) {
                log.info("[FRONTEND PERF] Session: {} | {}: {} {} | Context: {}",
                    sessionId,
                    metric.name(),
                    metric.value(),
                    metric.unit(),
                    metric.context());
            }
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "received", request.metrics() != null ? request.metrics().size() : 0,
            "timestamp", LocalDateTime.now().toString()
        ));
    }

    // DTOs
    public record FrontendLogsRequest(List<FrontendLogEntry> logs) {}

    public record FrontendLogEntry(
        String level,
        String message,
        String timestamp,
        Map<String, Object> context,
        String stack,
        String url,
        String userAgent,
        String sessionId
    ) {}

    public record FrontendErrorReport(
        String message,
        String stack,
        String componentStack,
        String timestamp,
        String url,
        String userAgent,
        String sessionId,
        Map<String, Object> context
    ) {}

    public record PerformanceMetricsRequest(List<PerformanceMetric> metrics) {}

    public record PerformanceMetric(
        String name,
        double value,
        String unit,
        String timestamp,
        Map<String, Object> context
    ) {}
}
