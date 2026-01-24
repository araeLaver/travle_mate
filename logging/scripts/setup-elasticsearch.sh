#!/bin/bash

# Elasticsearch 초기 설정 스크립트
# 사용법: ./setup-elasticsearch.sh

ES_HOST="${ES_HOST:-localhost}"
ES_PORT="${ES_PORT:-9200}"
ES_URL="http://${ES_HOST}:${ES_PORT}"

echo "=========================================="
echo "Fryndo Elasticsearch Setup"
echo "=========================================="
echo "Elasticsearch URL: ${ES_URL}"
echo ""

# Elasticsearch 연결 대기
echo "1. Waiting for Elasticsearch..."
until curl -s "${ES_URL}/_cluster/health" > /dev/null 2>&1; do
    echo "   Elasticsearch is not ready yet. Retrying in 5 seconds..."
    sleep 5
done
echo "   Elasticsearch is ready!"
echo ""

# 클러스터 상태 확인
echo "2. Checking cluster health..."
curl -s "${ES_URL}/_cluster/health?pretty"
echo ""

# ILM 정책 생성
echo "3. Creating ILM policy..."
curl -X PUT "${ES_URL}/_ilm/policy/travelmate-logs-policy" \
    -H "Content-Type: application/json" \
    -d @../elasticsearch/ilm-policy.json
echo ""
echo ""

# 인덱스 템플릿 생성
echo "4. Creating index template..."
curl -X PUT "${ES_URL}/_index_template/travelmate-logs-template" \
    -H "Content-Type: application/json" \
    -d @../elasticsearch/index-template.json
echo ""
echo ""

# 초기 인덱스 생성 (rollover alias 설정)
echo "5. Creating initial index with rollover alias..."
curl -X PUT "${ES_URL}/travelmate-logs-000001" \
    -H "Content-Type: application/json" \
    -d '{
        "aliases": {
            "travelmate-logs": {
                "is_write_index": true
            }
        }
    }'
echo ""
echo ""

# 설정 확인
echo "6. Verifying setup..."
echo ""
echo "ILM Policy:"
curl -s "${ES_URL}/_ilm/policy/travelmate-logs-policy?pretty"
echo ""
echo "Index Template:"
curl -s "${ES_URL}/_index_template/travelmate-logs-template?pretty" | head -20
echo ""
echo "Indices:"
curl -s "${ES_URL}/_cat/indices/travelmate-*?v"
echo ""

echo "=========================================="
echo "Setup complete!"
echo "=========================================="
