#!/usr/bin/env bash
# ===========================================================================
#  AFI-DOCS — Sauvegarde automatique (base de donnees + fichiers uploades)
#  Conserve les 14 dernieres sauvegardes dans /var/backups/afidocs.
#  Planifier chaque nuit a 2h via cron (voir DEPLOIEMENT_VPS.md) :
#    0 2 * * * /var/www/afidocs/deploiement/sauvegarde.sh >> /var/log/afi-backup.log 2>&1
# ===========================================================================
set -euo pipefail

# --- A adapter ---
DB_NAME="afi_plateforme"
DB_USER="afi_user"
DB_PASS="<MOT_DE_PASSE_FORT_BDD>"
FILES_DIR="/var/www/afidocs/backend/storage/app/public"
DEST="/var/backups/afidocs"
# -----------------

STAMP=$(date +%Y-%m-%d_%H%M)
mkdir -p "$DEST"

echo "[$(date)] Sauvegarde de la base..."
mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip > "$DEST/db_$STAMP.sql.gz"

echo "[$(date)] Sauvegarde des fichiers..."
tar -czf "$DEST/fichiers_$STAMP.tar.gz" -C "$FILES_DIR" .

# Ne garder que les 14 dernieres de chaque type.
ls -1t "$DEST"/db_*.sql.gz       | tail -n +15 | xargs -r rm --
ls -1t "$DEST"/fichiers_*.tar.gz | tail -n +15 | xargs -r rm --

echo "[$(date)] Sauvegarde terminee -> $DEST"
