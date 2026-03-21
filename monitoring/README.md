# Fryndo Monitoring Stack

Prometheus, Grafana, Alertmanager를 사용한 모니터링 시스템

## 구성 요소

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Prometheus | 9090 | 메트릭 수집 및 저장 |
| Grafana | 3001 | 대시보드 시각화 |
| Alertmanager | 9093 | 알림 관리 |
| Node Exporter | 9100 | 호스트 시스템 메트릭 |
| PostgreSQL Exporter | 9187 | PostgreSQL 메트릭 |
| Redis Exporter | 9121 | Redis 메트릭 |
| cAdvisor | 8083 | 컨테이너 메트릭 |

## 시작하기

### 1. 환경 변수 설정

```bash
# .env 파일 생성
cp ../.env.example .env

# 필요한 환경 변수 설정
GRAFANA_ADMIN_PASSWORD=your_secure_password
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### 2. 네트워크 생성 (최초 1회)

```bash
# Fryndo 메인 스택 먼저 실행
cd ..
docker-compose up -d

# 또는 네트워크만 생성
docker network create 01travle_mate_travelmate-network
```

### 3. 모니터링 스택 실행

```bash
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### 4. 접속

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin / ${GRAFANA_ADMIN_PASSWORD})
- **Alertmanager**: http://localhost:9093

## 대시보드

### Fryndo Overview
애플리케이션 상태, HTTP 요청 메트릭, JVM 메트릭, 데이터베이스 연결 상태

### Fryndo Infrastructure
노드 리소스 사용량, 컨테이너 메트릭, Redis 상태

## 알림 규칙

### Critical (즉시 알림)
- `ApplicationDown`: 백엔드 서비스 다운
- `PostgreSQLDown`: 데이터베이스 다운
- `HighErrorRate`: 에러율 5% 초과
- `HighHeapUsage`: 힙 메모리 90% 초과

### Warning (4시간 간격)
- `HighLatency`: P95 지연시간 2초 초과
- `HighCpuUsage`: CPU 80% 초과
- `HighMemoryUsage`: 메모리 80% 초과
- `LowDiskSpace`: 디스크 공간 20% 미만
- `SlowQueries`: PostgreSQL 슬로우 쿼리 발생
- `HighRedisMemory`: Redis 메모리 80% 초과

## 백엔드 설정

Spring Boot 애플리케이션에서 Actuator 엔드포인트 활성화가 필요합니다.

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
      base-path: /actuator
  metrics:
    export:
      prometheus:
        enabled: true
```

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

## 파일 구조

```
monitoring/
├── docker-compose.monitoring.yml
├── prometheus/
│   ├── prometheus.yml        # Prometheus 설정
│   └── alerts.yml           # 알림 규칙
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── datasources.yml
│   │   └── dashboards/
│   │       └── dashboards.yml
│   └── dashboards/
│       ├── travelmate-overview.json
│       └── infrastructure.json
└── alertmanager/
    └── alertmanager.yml     # Alertmanager 설정
```

## 유용한 PromQL 쿼리

### 요청 처리량 (RPS)
```promql
sum(rate(http_server_requests_seconds_count{job="travelmate-backend"}[1m]))
```

### 에러율
```promql
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
/ sum(rate(http_server_requests_seconds_count[5m])) * 100
```

### P95 응답 시간
```promql
histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket[5m])) by (le)) * 1000
```

### 힙 메모리 사용률
```promql
jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} * 100
```

### 액티브 DB 커넥션
```promql
hikaricp_connections_active
```

## 문제 해결

### Prometheus 타겟이 보이지 않음
```bash
# 타겟 상태 확인
curl http://localhost:9090/api/v1/targets

# 백엔드 메트릭 직접 확인
curl http://localhost:8080/api/actuator/prometheus
```

### Grafana 대시보드 로드 안됨
```bash
# Grafana 로그 확인
docker logs travelmate-grafana

# 프로비저닝 디렉토리 권한 확인
ls -la monitoring/grafana/
```

### 알림이 발송되지 않음
```bash
# Alertmanager 상태 확인
curl http://localhost:9093/api/v2/status

# 활성 알림 확인
curl http://localhost:9093/api/v2/alerts
```

## 데이터 정리

```bash
# 모니터링 스택 중지
docker-compose -f docker-compose.monitoring.yml down

# 볼륨 포함 삭제
docker-compose -f docker-compose.monitoring.yml down -v
```
