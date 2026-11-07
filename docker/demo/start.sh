#!/bin/sh
# Starts the FORM/TECH demo: a fresh PostgreSQL database with the fictional catalogue,
# a public demo staff account, then Apache.
set -e
cd /var/www/html

export PORT="${PORT:-10000}"
echo "Listen ${PORT}" > /etc/apache2/ports.conf
export APP_URL="${APP_URL:-${RENDER_EXTERNAL_URL:-http://localhost:${PORT}}}"
if [ -z "${APP_KEY}" ]; then
    APP_KEY="$(php artisan key:generate --show --no-interaction)"
    export APP_KEY
fi
# The database only listens inside this container, so a random password per start is enough.
export DB_PASSWORD="${DB_PASSWORD:-$(head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')}"

PGBIN="$(ls -d /usr/lib/postgresql/*/bin | head -1)"
PGDATA=/tmp/pgdata
rm -rf "$PGDATA" && mkdir -p "$PGDATA" && chown postgres "$PGDATA"
su postgres -s /bin/sh -c "$PGBIN/initdb -D $PGDATA --encoding=UTF8 --locale=C.UTF-8 --auth-local=peer --auth-host=scram-sha-256 >/dev/null"
su postgres -s /bin/sh -c "$PGBIN/pg_ctl -D $PGDATA -o '-c listen_addresses=127.0.0.1 -c shared_buffers=32MB -c max_connections=20' -l /tmp/postgres.log -w start"
su postgres -s /bin/sh -c "psql -q -c \"CREATE USER ${DB_USERNAME} PASSWORD '${DB_PASSWORD}'\" && psql -q -c \"CREATE DATABASE ${DB_DATABASE} OWNER ${DB_USERNAME} ENCODING 'UTF8' TEMPLATE template0\""

php artisan migrate --force --no-interaction
php artisan db:seed --force --no-interaction
if [ -n "${ADMIN_EMAIL}" ] && [ -n "${ADMIN_PASSWORD}" ]; then
    php artisan app:bootstrap-admin --no-interaction || true
fi
php artisan config:cache --no-interaction
php artisan route:cache --no-interaction
php artisan view:cache --no-interaction
chown -R www-data:www-data storage bootstrap/cache

exec apache2-foreground
