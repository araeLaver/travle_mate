package com.travelmate.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * 메서드 실행 시간 및 성능 로깅을 위한 AOP
 */
@Aspect
@Component
@Slf4j(topic = "com.travelmate.performance")
public class PerformanceLoggingAspect {

    /**
     * Service 레이어의 모든 public 메서드에 대해 성능 로깅
     */
    @Around("execution(* com.travelmate.service..*(..))")
    public Object logServicePerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        return logExecutionTime(joinPoint, "SERVICE");
    }

    /**
     * Controller 레이어의 모든 public 메서드에 대해 성능 로깅
     */
    @Around("execution(* com.travelmate.controller..*(..))")
    public Object logControllerPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        return logExecutionTime(joinPoint, "CONTROLLER");
    }

    /**
     * Repository 레이어의 커스텀 메서드에 대해 성능 로깅
     */
    @Around("execution(* com.travelmate.repository..*(..)) && " +
            "!execution(* org.springframework.data.repository.Repository+.*(..))")
    public Object logRepositoryPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        return logExecutionTime(joinPoint, "REPOSITORY");
    }

    private Object logExecutionTime(ProceedingJoinPoint joinPoint, String layer) throws Throwable {
        long startTime = System.currentTimeMillis();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String fullMethodName = className + "." + methodName;

        // MDC에 메서드 정보 추가
        MDC.put("method", fullMethodName);
        MDC.put("layer", layer);

        try {
            log.debug("[{}] {} 실행 시작 - 파라미터: {}", 
                layer, fullMethodName, Arrays.toString(joinPoint.getArgs()));

            Object result = joinPoint.proceed();

            long endTime = System.currentTimeMillis();
            long executionTime = endTime - startTime;

            // 성능 임계값 기준으로 로그 레벨 결정
            if (executionTime > 5000) {
                log.error("[{}] {} 실행 완료 - 실행시간: {}ms (매우 느림)", 
                    layer, fullMethodName, executionTime);
            } else if (executionTime > 1000) {
                log.warn("[{}] {} 실행 완료 - 실행시간: {}ms (느림)", 
                    layer, fullMethodName, executionTime);
            } else if (executionTime > 500) {
                log.info("[{}] {} 실행 완료 - 실행시간: {}ms", 
                    layer, fullMethodName, executionTime);
            } else {
                log.debug("[{}] {} 실행 완료 - 실행시간: {}ms", 
                    layer, fullMethodName, executionTime);
            }

            // 메서드별 성능 통계를 위한 메트릭 수집 (추후 모니터링 시스템 연동)
            recordMetric(layer, fullMethodName, executionTime);

            return result;

        } catch (Exception e) {
            long endTime = System.currentTimeMillis();
            long executionTime = endTime - startTime;

            log.error("[{}] {} 실행 실패 - 실행시간: {}ms, 예외: {}", 
                layer, fullMethodName, executionTime, e.getMessage(), e);
            throw e;
        } finally {
            // MDC 정리
            MDC.remove("method");
            MDC.remove("layer");
        }
    }

    /**
     * 메트릭 수집 (향후 Prometheus, Micrometer 등과 연동)
     */
    private void recordMetric(String layer, String methodName, long executionTime) {
        // 현재는 로그로만 기록하지만, 추후 메트릭 시스템과 연동 예정
        log.trace("METRIC: layer={}, method={}, executionTime={}ms", 
            layer, methodName, executionTime);
    }
}