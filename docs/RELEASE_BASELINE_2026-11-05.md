# Local release baseline — 2026-11-05

The owner approved final visual review, a local Git baseline and updating the existing isolated production rehearsal. Checks used terminal commands, headless browsers and saved screenshots rather than interactive device navigation.

## Review and production verification

- Reviewed the six-product capsule at desktop and phone widths and the rebuilt production homepage screenshot. Product images, color choices and text hierarchy remain consistent. No blocking clipping or overlap was observed. The mobile catalog retains the existing expanded filter form above the products.
- Rebuilt PHP, SSR and Caddy images for Compose project `form-tech-release`, preserving its database and runtime volumes. All four services are healthy. Local preview: http://localhost:8082.
- Saved a PostgreSQL custom-format dump before updating, outside the containers at ignored `.setup/release-before-baseline-2026-11-05.dump`; `pg_restore --list` validated the archive. This is a local backup, not an off-host recovery guarantee.
- No migrations were pending. Composer production platform requirements and Laravel optimization passed. Debug is disabled.
- Applied the reviewed collection curation and additive capsule helper to the existing rehearsal database. The earlier colorway helper reported zero changes. Verified 30 products, 218 variants, 60 product images; Men 18, Women 20, capsule 6. No reseed or inventory reset was performed.
- Read-only production browser checks passed at 360, 390, 768, 1024 and 1440 pixels for home and seven public routes, SSR metadata, image loading, keyboard navigation, reduced motion and navigation without JavaScript. No browser errors or horizontal overflow were detected.
- All six production capsule pages passed at 390 and 1366 pixels: both color images load and five sizes are available. Sitemap includes the new products; guest admin access redirects to login. These production checks did not submit checkout or contact records.
- New production screenshots: `docs/screenshots/baseline-production-{360,390,768,1024,1440}.jpg`. Capsule screenshots: `docs/screenshots/womens-capsule-{390,1440}.jpg`.
- Final backend suite: **54 tests, 993 assertions passed**. Existing verification includes TypeScript, 19 component tests, browser/SSR builds, 36 Chromium scenarios and 9 capsule scenarios across Chromium, Firefox and WebKit.

## Baseline scope

Source, dependency lockfiles, image assets, provenance, tests and review documentation are included. Environment files, private setup/backup data, dependencies, compiled output and runtime files remain ignored. Credential-shaped strings in the unsafe-URL rejection test are test fixtures. Git author identity is supplied for this commit only because no identity was configured.

This checkpoint is local. A Git remote, host/domain, real-host HTTPS and recovery checks remain future release work. Video remains deferred. Automated checks and screenshot review do not establish full WCAG conformance or substitute for usability testing with people.
