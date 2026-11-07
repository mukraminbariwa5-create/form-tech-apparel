# FORM/TECH deployment and operations

Latest local rehearsal: [2026-11-05 baseline evidence](RELEASE_BASELINE_2026-11-05.md). The rebuilt localhost:8082 preview includes 30 products / 218 variants and the six-item women's capsule; all services and read-only production checks passed. Earlier backup/restore counts below are historical evidence from the original catalog.

Status: local production-image rehearsal only. The owner chose **help with hosting later**. No host, domain, paid service, GitHub destination or public deployment has been approved. Do not publish this project until those choices and the exact release are approved.

## Release inputs

Choose a Docker-capable Linux host, persistent disk capacity, HTTPS domain and a private backup destination. Record the reviewed Git commit and immutable image digests. Keep PostgreSQL private; publish only Caddy's 80/443. The Node SSR process and PHP-FPM are internal services. Do not use Sail or Vite as production servers.

Create `.env.production` securely on the host (mode 600), using `.env.example` as a field reference. Set `APP_ENV=production`, `APP_DEBUG=false`, `APP_DOMAIN=approved.example`, `APP_URL=https://approved.example`, a new private `APP_KEY`, database name/user/password, `SESSION_ENCRYPT=true`, `SESSION_SECURE_COOKIE=true`, `SESSION_SAME_SITE=lax`, `LOG_CHANNEL=stderr`, `LOG_LEVEL=warning`, and the desired session lifetime. Never rotate an existing APP_KEY as a routine deployment action. Keep credentials and backups outside Git. No admin password belongs in an image.

`compose.production.yaml` defaults to `.env.production` for the app's environment. `APP_ENV_FILE` can select another protected file. Supply the same file through Compose's `--env-file` so database/web interpolation also uses it. Do not run `docker compose config` in shared logs: its output can expand secrets.

The checked-in `compose.release-check.yaml` is **only** a localhost HTTP rehearsal: it binds 127.0.0.1:8082 and relaxes Secure cookies because that endpoint has no TLS. Never include that override in a public deployment.

## Approved deployment commands (Linux Bash)

Run from a reviewed checkout after publication approval, with a stable Compose project name:

```bash
docker compose -p form-tech --env-file .env.production -f compose.production.yaml build
docker compose -p form-tech --env-file .env.production -f compose.production.yaml up -d
docker compose -p form-tech --env-file .env.production -f compose.production.yaml exec -T app php artisan migrate --force
docker compose -p form-tech --env-file .env.production -f compose.production.yaml exec -T app php artisan db:seed --force
docker compose -p form-tech --env-file .env.production -f compose.production.yaml exec -T app php artisan config:cache
docker compose -p form-tech --env-file .env.production -f compose.production.yaml exec -T app php artisan route:cache
docker compose -p form-tech --env-file .env.production -f compose.production.yaml exec -T app php artisan view:cache
docker compose -p form-tech --env-file .env.production -f compose.production.yaml ps
```

Take a database backup **before** changing an initialized deployment. Review migrations for compatibility before running them. First-time seed creates the demo catalog transactionally; later runs leave an initialized store untouched. Never use `migrate:fresh`, truncate tables or reset inventory on production. Browser fixture scripts refuse any database except `form_tech_e2e` in the testing environment and are excluded from images.

The app uses a persistent runtime-storage volume, PostgreSQL uses postgres-data, and Caddy uses persistent data/config volumes for TLS. Keep the Compose project name stable so replacements use the same volumes. `down` without volume deletion preserves them. Do not use `down -v`.

Bootstrap staff by securely setting ADMIN_EMAIL/ADMIN_PASSWORD on the host, recreating only the app to load them if necessary, and running `app:bootstrap-admin`. It refuses existing accounts. `app:recover-admin` updates an existing administrator and invalidates database sessions and remembered sign-ins. Remove ADMIN_PASSWORD immediately afterward, recreate the app to remove it from its environment, and rebuild the configuration cache. Never paste credentials into chat, command arguments or public documentation. Do not create a default published admin password.

## Backup and restore

Use PostgreSQL custom-format dumps, an access-controlled directory outside the app container, restrictive permissions and encrypted off-host storage. Agree a backup frequency/retention and verify the destination before accepting public submissions. The following Bash pattern sends dump bytes directly to a protected file; PowerShell's text redirection must not be used for a binary dump.

```bash
umask 077
: "${BACKUP_DIR:?Set an absolute protected backup directory}"
mkdir -p "$BACKUP_DIR"
docker compose -p form-tech --env-file .env.production -f compose.production.yaml exec -T pgsql sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$BACKUP_DIR/form-tech-$(date -u +%Y%m%dT%H%M%SZ).dump"
```

Verify the dump with `pg_restore --list`. For a restore rehearsal, create a **new, empty database** on an isolated PostgreSQL server, copy the dump into that container, and run:

```bash
pg_restore --no-owner --no-acl --exit-on-error -U RESTORE_ROLE -d NEW_EMPTY_DATABASE /protected/path/form-tech.dump
```

Compare product/variant/order/item/contact counts, order totals and inventory with the source snapshot. Check the restored application with the corresponding APP_KEY and configuration if encrypted sessions need to be read; expire sessions rather than sharing a restored live session store publicly. A backup contains submitted private details: protect it as carefully as the source database. Do not restore over a live database without an explicitly reviewed outage/recovery procedure.

Local rehearsal evidence: a dump from `form_tech_release` was copied outside the app container to ignored `.setup/form-tech-release.dump`, then restored into newly created `form_tech_restorecheck`. Restored counts: **24 products, 79 variants, 1 demo order, 1 order item and 1 fictional contact message**. This verifies tooling locally; the eventual production host and off-host storage must be rehearsed separately.

## Retention procedure

Before publication, agree a retention period with the owner and state it in the privacy copy. No automatic deletion job is added. A server operator can first count and inspect expired records using a chosen cutoff date, take any policy-permitted backup, then execute a reviewed transaction through private PostgreSQL access:

```sql
BEGIN;
UPDATE orders
SET customer_name = 'Expired demo visitor',
    customer_email = 'expired@example.invalid', address = '{}'::jsonb, notes = NULL
WHERE created_at < DATE 'OWNER_APPROVED_CUTOFF';
DELETE FROM contact_messages WHERE created_at < DATE 'OWNER_APPROVED_CUTOFF';
COMMIT;
```

Replace the placeholder with an actual approved date; do not run it as written. This removes expired submitted contact/address details while retaining demo order/item snapshots and stock history. It does not cancel orders or restore stock. Expire old sessions and old backups under the same agreed policy. There is no public delete/reset/reply/export UI.

## Verification and rollback

Verify HTTPS and certificate renewal, correct canonical URL, debug disabled, secure/HttpOnly/SameSite cookies, healthy services, SSR hero/product HTML, image loading, `/sitemap.xml`, blocked guest admin routes, staff login/edit reflected in the storefront, fictional contact persistence and full guest demo checkout. Confirm that no payment or email is sent. Inspect diagnostic codes without exposing submitted data. Test the backup/restore on the selected host and record its protected location/access method.

For a code rollback, select the previous reviewed immutable images/commit and recreate services with the **same** environment and volumes. Rebuild Laravel caches. Confirm schema compatibility first; restoring an older image does not roll back PostgreSQL. If schema/data restoration is needed, follow a separately reviewed maintenance/recovery plan, preserve the current database, and account for submissions since the backup. Never treat a container restart as a database rollback.

Record: approved host/domain, deployed commit/image digests, migration batch, verification results, backup destination/last successful restore, agreed retention cutoff and rollback target. Public HTTPS and real-host recovery are Phase 6 gates, not claims made by the localhost rehearsal.
