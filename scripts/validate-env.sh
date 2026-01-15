#!/bin/bash
# =============================================================================
# TravelMate 환경변수 검증 스크립트
# 사용법: ./scripts/validate-env.sh [dev|prod]
# =============================================================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 환경 (기본값: dev)
ENVIRONMENT=${1:-dev}

echo "=========================================="
echo "TravelMate 환경변수 검증"
echo "환경: $ENVIRONMENT"
echo "=========================================="

# 에러 카운터
ERRORS=0
WARNINGS=0

# 함수: 에러 출력
error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ERRORS=$((ERRORS + 1))
}

# 함수: 경고 출력
warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

# 함수: 성공 출력
success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

# 함수: 필수 변수 검증
check_required() {
    local var_name=$1
    local var_value=${!var_name}
    local min_length=${2:-1}

    if [ -z "$var_value" ]; then
        error "$var_name 환경변수가 설정되지 않았습니다."
        return 1
    fi

    if [ ${#var_value} -lt $min_length ]; then
        error "$var_name 길이가 너무 짧습니다. (현재: ${#var_value}자, 최소: $min_length자)"
        return 1
    fi

    success "$var_name 검증 완료 (길이: ${#var_value}자)"
    return 0
}

# 함수: 선택 변수 검증 (경고만)
check_optional() {
    local var_name=$1
    local var_value=${!var_name}

    if [ -z "$var_value" ]; then
        warn "$var_name 환경변수가 설정되지 않았습니다. (선택 사항)"
        return 0
    fi

    success "$var_name 설정됨"
    return 0
}

# 함수: URL 형식 검증
check_url() {
    local var_name=$1
    local var_value=${!var_name}

    if [ -z "$var_value" ]; then
        return 0  # 선택 사항은 건너뜀
    fi

    if [[ ! $var_value =~ ^https?:// ]]; then
        error "$var_name은(는) 유효한 HTTP(S) URL이어야 합니다."
        return 1
    fi

    success "$var_name URL 형식 유효"
    return 0
}

echo ""
echo "=== 필수 보안 환경변수 ==="
echo ""

# JWT_SECRET (최소 32자)
check_required "JWT_SECRET" 32

# 데이터베이스 비밀번호 (최소 8자)
check_required "DB_PASSWORD" 8

# 데이터베이스 사용자 (최소 1자)
check_required "DB_USERNAME" 1

echo ""
echo "=== 프로덕션 전용 환경변수 ==="
echo ""

if [ "$ENVIRONMENT" = "prod" ]; then
    # Redis 비밀번호 (프로덕션에서 필수)
    check_required "REDIS_PASSWORD" 8

    # CORS 설정 (프로덕션에서 필수)
    check_required "CORS_ALLOWED_ORIGINS" 1

    # Sentry DSN (프로덕션 권장)
    check_optional "SENTRY_DSN"
    if [ -n "$SENTRY_DSN" ]; then
        check_url "SENTRY_DSN"
    fi
else
    # 개발 환경에서는 경고만
    check_optional "REDIS_PASSWORD"
fi

echo ""
echo "=== 외부 서비스 API 키 ==="
echo ""

check_optional "OPENAI_API_KEY"
check_optional "TOSS_CLIENT_KEY"
check_optional "TOSS_SECRET_KEY"
check_optional "POLYGON_RPC_URL"

if [ -n "$POLYGON_RPC_URL" ]; then
    check_url "POLYGON_RPC_URL"
fi

echo ""
echo "=== 블록체인 관련 (주의 필요) ==="
echo ""

if [ -n "$WALLET_PRIVATE_KEY" ]; then
    warn "WALLET_PRIVATE_KEY가 환경변수로 설정되었습니다."
    warn "보안을 위해 HashiCorp Vault 또는 파일 기반 시크릿 사용을 권장합니다."
fi

check_optional "NFT_CONTRACT_ADDRESS"

echo ""
echo "=========================================="
echo "검증 결과"
echo "=========================================="

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}에러: $ERRORS개${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}경고: $WARNINGS개${NC}"
fi

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}모든 검증 통과!${NC}"
fi

echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}필수 환경변수가 누락되었습니다. 배포를 진행할 수 없습니다.${NC}"
    exit 1
fi

if [ $WARNINGS -gt 0 ] && [ "$ENVIRONMENT" = "prod" ]; then
    echo -e "${YELLOW}경고가 있습니다. 프로덕션 배포 전 확인이 필요합니다.${NC}"
fi

echo -e "${GREEN}환경변수 검증 완료!${NC}"
exit 0
