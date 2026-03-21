#!/bin/bash
# TravelMate Database Backup Script
# Usage: ./backup.sh [backup|restore] [filename]

set -e

BACKUP_DIR="/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEFAULT_FILENAME="travelmate_backup_${TIMESTAMP}.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

backup() {
    local filename="${1:-$DEFAULT_FILENAME}"
    local filepath="${BACKUP_DIR}/${filename}"

    log_info "Starting database backup..."
    log_info "Backup file: ${filepath}"

    pg_dump -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" \
        --format=custom \
        --compress=9 \
        --verbose \
        --file="${filepath}"

    if [ $? -eq 0 ]; then
        log_info "Backup completed successfully!"
        log_info "File size: $(du -h "${filepath}" | cut -f1)"

        # Keep only last 7 daily backups
        log_info "Cleaning up old backups..."
        ls -t ${BACKUP_DIR}/travelmate_backup_*.sql 2>/dev/null | tail -n +8 | xargs -r rm -f

        log_info "Backup process completed."
    else
        log_error "Backup failed!"
        exit 1
    fi
}

restore() {
    local filename="$1"

    if [ -z "$filename" ]; then
        log_error "Please specify a backup file to restore"
        log_info "Available backups:"
        ls -la ${BACKUP_DIR}/travelmate_backup_*.sql 2>/dev/null || echo "No backups found"
        exit 1
    fi

    local filepath="${BACKUP_DIR}/${filename}"

    if [ ! -f "$filepath" ]; then
        log_error "Backup file not found: ${filepath}"
        exit 1
    fi

    log_warn "This will overwrite the current database!"
    read -p "Are you sure you want to continue? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        log_info "Restore cancelled."
        exit 0
    fi

    log_info "Starting database restore..."
    log_info "Restore file: ${filepath}"

    # Drop and recreate database
    psql -h "$PGHOST" -U "$PGUSER" -d postgres -c "DROP DATABASE IF EXISTS ${PGDATABASE};"
    psql -h "$PGHOST" -U "$PGUSER" -d postgres -c "CREATE DATABASE ${PGDATABASE};"

    # Restore from backup
    pg_restore -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" \
        --verbose \
        --clean \
        --if-exists \
        "${filepath}"

    if [ $? -eq 0 ]; then
        log_info "Restore completed successfully!"
    else
        log_error "Restore failed!"
        exit 1
    fi
}

list() {
    log_info "Available backups:"
    ls -lah ${BACKUP_DIR}/travelmate_backup_*.sql 2>/dev/null || echo "No backups found"
}

# Main
case "$1" in
    backup)
        backup "$2"
        ;;
    restore)
        restore "$2"
        ;;
    list)
        list
        ;;
    *)
        echo "Usage: $0 {backup|restore|list} [filename]"
        echo ""
        echo "Commands:"
        echo "  backup [filename]   Create a database backup"
        echo "  restore <filename>  Restore from a backup file"
        echo "  list                List available backups"
        exit 1
        ;;
esac
