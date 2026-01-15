# TravelMate Logging Stack (ELK)

Elasticsearch, Logstash, Kibana, Filebeat를 사용한 중앙집중식 로깅 시스템

## 구성 요소

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Elasticsearch | 9200, 9300 | 로그 저장 및 검색 엔진 |
| Logstash | 5044, 5000, 9600 | 로그 수집 및 변환 |
| Kibana | 5601 | 로그 시각화 및 분석 |
| Filebeat | - | 로그 파일 수집 에이전트 |

## 시작하기

### 1. 사전 요구사항

```bash
# Docker 메모리 설정 (Elasticsearch 요구사항)
# Linux: vm.max_map_count 증가
sudo sysctl -w vm.max_map_count=262144

# 영구 설정
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

### 2. 네트워크 생성 (최초 1회)

```bash
# TravelMate 메인 스택 먼저 실행
cd ..
docker-compose up -d

# 또는 네트워크만 생성
docker network create 01travle_mate_travelmate-network
```

### 3. 로깅 스택 실행

```bash
cd logging
docker-compose -f docker-compose.logging.yml up -d
```

### 4. Elasticsearch 초기 설정

```bash
chmod +x scripts/setup-elasticsearch.sh
./scripts/setup-elasticsearch.sh
```

### 5. 접속

- **Elasticsearch**: http://localhost:9200
- **Kibana**: http://localhost:5601
- **Logstash Monitoring**: http://localhost:9600

## 백엔드 설정

### 의존성 추가 (pom.xml)

```xml
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
    <version>7.4</version>
</dependency>
```

### 환경 변수 (application.yml)

```yaml
logstash:
  host: ${LOGSTASH_HOST:localhost}
  port: ${LOGSTASH_PORT:5000}
```

### 로그 포맷

운영 환경에서는 JSON 형식으로 로그가 출력됩니다:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "logger_name": "com.travelmate.service.UserService",
  "thread_name": "http-nio-8080-exec-1",
  "message": "User logged in successfully",
  "service": "travelmate-backend",
  "environment": "prod",
  "mdc": {
    "requestId": "abc123",
    "userId": "42"
  }
}
```

## 파일 구조

```
logging/
├── docker-compose.logging.yml
├── elasticsearch/
│   ├── index-template.json   # 인덱스 매핑 템플릿
│   └── ilm-policy.json       # 인덱스 생명주기 관리
├── logstash/
│   ├── config/
│   │   └── logstash.yml      # Logstash 설정
│   └── pipeline/
│       └── travelmate.conf   # 파이프라인 설정
├── filebeat/
│   └── filebeat.yml          # Filebeat 설정
├── scripts/
│   └── setup-elasticsearch.sh
└── README.md
```

## 로그 검색 (Kibana)

### 인덱스 패턴 생성

1. Kibana > Stack Management > Data Views
2. Create data view
3. Name: `travelmate-logs`
4. Index pattern: `travelmate-logs-*`
5. Timestamp field: `@timestamp`

### 유용한 검색 쿼리

```kql
# 에러 로그
level: ERROR

# 특정 서비스 에러
service: "travelmate-backend" AND level: ERROR

# 특정 API 요청
request_path: "/api/users/*" AND status_code >= 400

# 특정 사용자 활동
user_id: 42

# 느린 요청 (500ms 이상)
response_time_ms > 500

# 인증 관련 로그
tags: "security"

# SQL 쿼리 로그
tags: "sql"

# 특정 예외 타입
exception_class: "NullPointerException"
```

## Index Lifecycle Management (ILM)

로그 인덱스는 다음 정책에 따라 관리됩니다:

| Phase | 조건 | 작업 |
|-------|------|------|
| Hot | 기본 | 신규 데이터 저장, 롤오버 |
| Warm | 2일 후 | Shrink, Force merge |
| Cold | 7일 후 | Freeze (읽기 전용) |
| Delete | 30일 후 | 삭제 |

## 모니터링

### Elasticsearch 클러스터 상태

```bash
# 클러스터 상태
curl http://localhost:9200/_cluster/health?pretty

# 노드 정보
curl http://localhost:9200/_nodes/stats?pretty

# 인덱스 목록
curl http://localhost:9200/_cat/indices/travelmate-*?v
```

### Logstash 상태

```bash
curl http://localhost:9600/_node/stats?pretty
```

## 문제 해결

### Elasticsearch 시작 안됨

```bash
# 메모리 설정 확인
docker logs travelmate-elasticsearch

# vm.max_map_count 설정
sudo sysctl -w vm.max_map_count=262144
```

### 로그가 수집되지 않음

```bash
# Filebeat 로그 확인
docker logs travelmate-filebeat

# Logstash 로그 확인
docker logs travelmate-logstash

# 네트워크 연결 확인
docker exec travelmate-filebeat ping logstash
```

### Kibana에서 데이터 안보임

1. 인덱스가 생성되었는지 확인:
   ```bash
   curl http://localhost:9200/_cat/indices?v
   ```

2. Data View가 올바르게 설정되었는지 확인

3. 시간 범위 설정 확인 (Last 24 hours 등)

## 데이터 정리

```bash
# 로깅 스택 중지
docker-compose -f docker-compose.logging.yml down

# 볼륨 포함 삭제 (모든 로그 데이터 삭제)
docker-compose -f docker-compose.logging.yml down -v
```

## 프로덕션 권장사항

1. **Elasticsearch 클러스터**: 최소 3노드 클러스터 구성
2. **보안**: X-Pack Security 활성화
3. **백업**: Snapshot/Restore 설정
4. **리소스**: Elasticsearch에 충분한 힙 메모리 할당 (50% 규칙)
5. **모니터링**: Elasticsearch Exporter로 Prometheus 연동
