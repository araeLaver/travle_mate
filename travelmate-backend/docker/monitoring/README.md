# Fryndo Monitoring Stack

Prometheus + Grafana + Alertmanager 모니터링 스택

## 구성 요소

- **Prometheus**: 메트릭 수집 및 저장 (포트: 9090)
- **Grafana**: 시각화 및 대시보드 (포트: 3001)
- **Alertmanager**: 알림 관리 (포트: 9093)
- **Node Exporter**: 서버 메트릭 수집 (포트: 9100)

## 빠른 시작

```bash
# 모니터링 스택 시작
cd docker/monitoring
docker-compose up -d

# 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f
```

## 접속 URL

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin123)
- Alertmanager: http://localhost:9093

## 환경 변수

```bash
# .env 파일 생성
GRAFANA_PASSWORD=your_secure_password
GRAFANA_ROOT_URL=https://grafana.fryndo.app
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
SMTP_USERNAME=alerts@fryndo.app
SMTP_PASSWORD=your_smtp_password
```

## 대시보드

### Fryndo Overview
- 애플리케이션 상태
- HTTP 요청/응답 메트릭
- 비즈니스 메트릭 (사용자, NFT, 리뷰)
- JVM 메트릭
- 데이터베이스 연결 풀

## 알림 규칙

### Critical
- ApplicationDown: 애플리케이션 다운
- HighErrorRate: 에러율 5% 초과
- DatabaseConnectionTimeout: DB 연결 타임아웃

### Warning
- HighResponseTime: 응답 시간 2초 초과
- HighHeapUsage: JVM 힙 85% 초과
- HighLoginFailureRate: 로그인 실패율 30% 초과

## 커스텀 메트릭

```
# 사용자 메트릭
travelmate_user_registrations_total
travelmate_user_logins_total{status="success|failure"}
travelmate_users_active
travelmate_users_total

# NFT 메트릭
travelmate_nft_collections_total
travelmate_nft_mintings_total{status="success|failure"}
travelmate_nfts_total

# 소셜 메트릭
travelmate_reviews_created_total
travelmate_social_follows_total
travelmate_chat_messages_total
travelmate_chat_rooms_active

# 시스템 메트릭
travelmate_images_uploads_total
travelmate_api_errors_total
```

## 운영 환경 배포

```bash
# 운영 환경용 docker-compose.prod.yml 사용
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 문제 해결

### Prometheus가 Spring Boot 앱에 연결 안됨
```bash
# 방화벽 확인
# Windows: host.docker.internal 사용
# Linux: 네트워크 모드를 host로 변경하거나 IP 직접 지정
```

### Grafana 대시보드 로드 안됨
```bash
# 프로비저닝 설정 확인
docker exec -it travelmate-grafana cat /etc/grafana/provisioning/dashboards/dashboards.yml
```
