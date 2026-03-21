#!/bin/bash
# TravelMate Docker Utilities
# Usage: ./docker-utils.sh [command]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_NAME="travelmate"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Start development environment
dev_start() {
    log_step "Starting development environment..."
    docker-compose --profile dev up -d
    log_info "Development environment started!"
    log_info "Services:"
    echo "  - Frontend: http://localhost:80"
    echo "  - Backend API: http://localhost:8080"
    echo "  - Adminer (DB): http://localhost:8081"
    echo "  - Redis Commander: http://localhost:8082"
}

# Stop development environment
dev_stop() {
    log_step "Stopping development environment..."
    docker-compose --profile dev down
    log_info "Development environment stopped!"
}

# Start production environment
prod_start() {
    log_step "Starting production environment..."
    docker-compose -f docker-compose.prod.yml up -d
    log_info "Production environment started!"
}

# Stop production environment
prod_stop() {
    log_step "Stopping production environment..."
    docker-compose -f docker-compose.prod.yml down
    log_info "Production environment stopped!"
}

# Build images
build() {
    local env="${1:-dev}"
    log_step "Building Docker images for ${env}..."

    if [ "$env" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml build
    else
        docker-compose build
    fi

    log_info "Build completed!"
}

# View logs
logs() {
    local service="${1:-}"
    if [ -z "$service" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$service"
    fi
}

# Show status
status() {
    log_step "Container status:"
    docker-compose ps
    echo ""
    log_step "Docker resources:"
    docker system df
}

# Clean up
clean() {
    log_warn "This will remove all stopped containers, unused networks, and dangling images."
    read -p "Continue? (y/n): " confirm
    if [ "$confirm" = "y" ]; then
        log_step "Cleaning up Docker resources..."
        docker system prune -f
        log_info "Cleanup completed!"
    fi
}

# Deep clean (removes volumes too)
deep_clean() {
    log_warn "This will remove ALL containers, images, volumes, and networks!"
    log_warn "All data will be lost!"
    read -p "Are you absolutely sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        log_step "Performing deep clean..."
        docker-compose down -v --rmi all
        docker system prune -af --volumes
        log_info "Deep clean completed!"
    fi
}

# Shell into container
shell() {
    local service="${1:-backend}"
    log_step "Opening shell in ${service}..."
    docker-compose exec "$service" /bin/sh
}

# Database CLI
db() {
    log_step "Connecting to PostgreSQL..."
    docker-compose exec postgres psql -U travelmate_user -d travelmate
}

# Redis CLI
redis_cli() {
    log_step "Connecting to Redis..."
    docker-compose exec redis redis-cli
}

# Health check
health() {
    log_step "Checking service health..."
    echo ""

    echo -n "Backend: "
    if curl -s http://localhost:8080/api/health/live > /dev/null 2>&1; then
        echo -e "${GREEN}Healthy${NC}"
    else
        echo -e "${RED}Unhealthy${NC}"
    fi

    echo -n "Frontend: "
    if curl -s http://localhost/health > /dev/null 2>&1; then
        echo -e "${GREEN}Healthy${NC}"
    else
        echo -e "${RED}Unhealthy${NC}"
    fi

    echo -n "PostgreSQL: "
    if docker-compose exec -T postgres pg_isready -U travelmate_user > /dev/null 2>&1; then
        echo -e "${GREEN}Healthy${NC}"
    else
        echo -e "${RED}Unhealthy${NC}"
    fi

    echo -n "Redis: "
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}Healthy${NC}"
    else
        echo -e "${RED}Unhealthy${NC}"
    fi
}

# Main
case "$1" in
    dev)
        dev_start
        ;;
    dev-stop)
        dev_stop
        ;;
    prod)
        prod_start
        ;;
    prod-stop)
        prod_stop
        ;;
    build)
        build "$2"
        ;;
    logs)
        logs "$2"
        ;;
    status)
        status
        ;;
    clean)
        clean
        ;;
    deep-clean)
        deep_clean
        ;;
    shell)
        shell "$2"
        ;;
    db)
        db
        ;;
    redis)
        redis_cli
        ;;
    health)
        health
        ;;
    *)
        echo "TravelMate Docker Utilities"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  dev          Start development environment"
        echo "  dev-stop     Stop development environment"
        echo "  prod         Start production environment"
        echo "  prod-stop    Stop production environment"
        echo "  build [env]  Build Docker images (dev/prod)"
        echo "  logs [svc]   View logs (all or specific service)"
        echo "  status       Show container status"
        echo "  clean        Clean unused Docker resources"
        echo "  deep-clean   Remove all Docker resources (WARNING: data loss)"
        echo "  shell [svc]  Open shell in container (default: backend)"
        echo "  db           Open PostgreSQL CLI"
        echo "  redis        Open Redis CLI"
        echo "  health       Check service health"
        echo ""
        exit 1
        ;;
esac
