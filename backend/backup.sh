#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# CRM — automatyczny backup bazy PostgreSQL
# Uruchamiaj przez cron, np.:
#   0 3 * * * bash /var/www/crm/backend/backup.sh >> /var/log/crm-backup.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────

BACKUP_DIR="/var/backups/crm"
ENV_FILE="$(dirname "$0")/.env"
KEEP_DAYS=7

# ── Wczytaj zmienne DB z .env ─────────────────────────────────────────────────
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | grep -E '^DB_' | sed 's/ //g' | xargs)
else
  echo "[$(date '+%Y-%m-%d %H:%M')] BŁĄD: Brak pliku $ENV_FILE" >&2
  exit 1
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-crmuser}"
DB_NAME="${DB_NAME:-crmdb}"

DATE=$(date '+%Y-%m-%d_%H-%M')
FILENAME="crmdb_${DATE}.sql.gz"

# ── Utwórz katalog backupów ───────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── Wykonaj backup ────────────────────────────────────────────────────────────
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  "$DB_NAME" | gzip > "$BACKUP_DIR/$FILENAME"

if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M')] BŁĄD: pg_dump nie powiódł się!" >&2
  rm -f "$BACKUP_DIR/$FILENAME"
  exit 1
fi

SIZE=$(du -sh "$BACKUP_DIR/$FILENAME" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M')] OK: $FILENAME ($SIZE)"

# ── Usuń stare backupy ────────────────────────────────────────────────────────
DELETED=$(find "$BACKUP_DIR" -name "crmdb_*.sql.gz" -mtime +${KEEP_DAYS} -print -delete | wc -l)
[ "$DELETED" -gt 0 ] && echo "[$(date '+%Y-%m-%d %H:%M')] Usunięto $DELETED starych plików (>${KEEP_DAYS} dni)"

# ── Podsumowanie ──────────────────────────────────────────────────────────────
COUNT=$(find "$BACKUP_DIR" -name "crmdb_*.sql.gz" | wc -l)
echo "[$(date '+%Y-%m-%d %H:%M')] Backupów w $BACKUP_DIR: $COUNT"
