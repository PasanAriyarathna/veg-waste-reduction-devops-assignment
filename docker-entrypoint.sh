#!/bin/sh
# docker-entrypoint.sh
# Symlinks /app/veg_waste.db → /app/data/veg_waste.db so the
# SQLite database lives on the persistent Docker volume without
# changing application source code.

set -e

DB_LINK="/app/veg_waste.db"
DB_VOLUME="/app/data/veg_waste.db"

if [ -d "/app/data" ]; then
    rm -f "$DB_LINK"
    ln -s "$DB_VOLUME" "$DB_LINK"
    echo "Database symlinked: $DB_LINK -> $DB_VOLUME"
fi

exec "$@"
