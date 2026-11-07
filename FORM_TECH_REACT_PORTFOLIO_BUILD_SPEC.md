# FORM/TECH — Portfolio-Grade Full-Stack Apparel Commerce

**Version 3.1 | Updated: 2026-10-29 | Status: Locked implementation plan | Stack: Laravel + Inertia + React + PostgreSQL + Docker | Delivery: GitHub + Docker-capable production host | Shopify: Not required**

> **How to use this plan:** When the owner asks to build or continue FORM/TECH using this file, treat it as the agreed scope and implementation checklist. Reading, reviewing, or editing this file alone does not authorize starting the build. Follow the owner's current request first. Inspect the repository and preserve existing work. Implement every required feature with working behavior, not placeholders. Do not add features, services, dependencies, or infrastructure outside this plan without explicit owner approval. Never claim completion without verification.
>
> **Scope lock:** The owner approved Laravel + Inertia + React + PostgreSQL + Docker in place of the previous Next.js architecture. This version supersedes older stack and deployment instructions. Keep a project-local copy of this file as the canonical plan and update it only for an owner-approved change or verified progress. Record approved changes in section 17.

## 1. Product vision

FORM/TECH is a premium technical-apparel e-commerce demonstration meant to showcase **frontend engineering, full-stack development, database design, authentication, authorization, state management, accessible UX, responsive UI, and production deployment** to recruiters and prospective freelance clients.

- Audience: Customers browsing technical clothing; a demo administrator managing store data.
- Visual identity: Quietly futuristic editorial design. Architectural photography, reflective fabric, slate/white backgrounds, cobalt accents.
- Hero eyebrow: `FUNCTION SHAPES A BRIGHTER TOMORROW`
- Headline: `APPAREL FOR A MORE OPEN WORLD`
- Body: `Technical clothing for wherever next. Performance. Purpose. Perspective.`
- Core category set: Technical Jackets, Tech Pants, Layering Systems, and Accessories.
- **Demo disclaimer:** This is a portfolio project, not a real merchant. Prices and products are sample data. Checkout does **not** accept payments or fulfill purchases.

## 2. Locked technical stack

| Layer | Decision |
| --- | --- |
| Application | One Laravel application; use a stable supported release compatible with the environment and lock dependencies |
| Frontend | React + TypeScript through Inertia; Vite asset build; no separate frontend application |
| UI | Tailwind CSS, CSS variables, minimal accessible UI primitives |
| Backend | Laravel routes, controllers, Form Requests, policies/middleware, and focused services for order transactions |
| Database | PostgreSQL in local Docker and production; no MySQL/MariaDB or SQLite substitute for integration tests |
| ORM and migrations | Eloquent + Laravel migrations, factories, and seeders; no second ORM |
| Authentication | Laravel session authentication using its React starter kit authentication foundation; ADMIN access only |
| Validation | Laravel Form Requests are authoritative; client validation supports UX and does not replace server validation |
| Guest cart | Laravel server session storing variant IDs and quantities; database-backed sessions; no browser-stored authoritative prices |
| Images | Responsive images with dimensions, alt text and appropriate loading; checked-in licensed/generated demo assets and validated image URLs |
| Testing | PHPUnit for backend units/features; Vitest + Testing Library for React; Playwright for browser flows |
| Local runtime | Docker Desktop + WSL2 on Windows; Laravel Sail / Docker Compose for PHP, PostgreSQL and Vite tooling |
| Production runtime | Dedicated production Dockerfile and Compose configuration on a Docker-capable Linux host, with HTTPS, PostgreSQL persistence and Inertia SSR |
| Version control | Git + GitHub, lockfiles and documented README |

**Why:** Laravel owns the backend and React provides the interface. Inertia connects them in one application with shared session authentication. Docker makes the runtime reproducible. XAMPP is not used. Verify installed dependency versions and official APIs before implementation; record exact runtime versions in the README and container definitions.

### Architecture rules

- Laravel is authoritative for prices, inventory, orders, access control, validation and final totals.
- Database and secrets are never accessed from browser code.
- Use Laravel routes/controllers and Inertia consistently. Do not add Next.js, a separate React SPA/API backend, microservices, Prisma, Drizzle or Auth.js.
- Use Laravel transactions with row locking or equivalent atomic conditional stock updates for order placement and cancellation.
- Use secure same-origin sessions and CSRF protection; no JWT/localStorage authentication.
- Disable/remove starter-kit public registration, customer accounts and unneeded profile, verification, password-reset, two-factor, team and invitation screens/endpoints. Provide only required staff login/logout. Bootstrap or recover the admin through documented secure local/server commands.
- Use accessible semantic components; add packages only for a defined requirement. Remove unused starter-kit demo screens.
- Use one PostgreSQL database, one auth system, one styling strategy and one cart strategy. The sessions table is infrastructure, not a customer account feature.
- Baseline image workflow: admin associates validated HTTPS image URLs or approved same-origin demo asset paths. Reject unsafe schemes, credentials in URLs and invalid destinations. Do not fetch arbitrary remote URLs on the server. Binary upload/storage integration is excluded unless separately approved.
- Configure Inertia SSR for public storefront rendering and verify page metadata in returned HTML. Document the Node SSR process in local and production setup; authorization stays in Laravel.
- Never store uploaded image bytes in PostgreSQL. Do not build payment processing or store payment information.
- Do not add Redis, queues, workers, mail providers, search services, analytics, Kubernetes or extra application services without an approved requirement. The required Node SSR process is the only additional rendering service.
## 3. Complete page map

| Route | Purpose |
| --- | --- |
| `/` | Editorial homepage |
| `/shop` | All products with search/filter/sort |
| `/collections/[slug]` | Category-specific products |
| `/products/[slug]` | Detailed product view and variant selection |
| `/cart` | Review and edit cart |
| `/checkout` | Clearly marked simulated checkout |
| `/order-confirmation/[reference]` | Demo order confirmation |
| `/search` | Product search results (can reuse shop grid) |
| `/technology` | Brand philosophy and product-technology story |
| `/about` | About the fictional project |
| `/contact` | Contact form, no real customer-support promises |
| `/size-guide` | Apparel size guidance based on seeded product data |
| `/shipping-returns` | Demo-only illustrative policy, prominently labeled |
| `/login` | Staff/admin sign-in (not required for shopping) |
| `/admin` | Protected overview |
| `/admin/products` | Manage products and variants |
| `/admin/collections` | Manage collections |
| `/admin/orders` | Review demo orders |
| `/admin/content` | Edit homepage merchandising content |
| `/not-found` | Friendly 404 |

Customer registration/accounts are **not required**. Guest shopping is required. Only staff/admin authenticate.

## 4. Locked design system

| Token | Value |
| --- | --- |
| Background | `#F5F6F6` |
| Cards | `#FFFFFF` |
| Foreground | `#111820` |
| Muted | `#68737D` |
| Border | `#DDE2E6` |
| Primary cobalt | `#145DFF` |
| Dark editorial panel | `#1D2832` |

- Headings: modern uppercase sans, deliberate tracking and scale; body: readable sans.
- Product card imagery on neutral backgrounds. Hero/campaign imagery shows technical apparel and bold concrete architecture.
- Max main content width around 1440px, modular 12-column desktop composition, 2-column product grids on narrow mobile where practical.
- 1px borders, restrained corner radius, no glassmorphism or excessive gradients.
- Responsive at 360, 390, 768, 1024, 1440px. Correct keyboard and touch controls.
- Motion: subtle hover/entrance only; honor prefers-reduced-motion. No heavy 3D, autoplay, or distracting scroll animation.
- All brand and sample products are fictional; use appropriately licensed or generated imagery.

### Approved visual reference (2026-10-29)

The owner supplied `docs/design/form-tech-ui-reference.png` as the primary UI appearance reference. Match its composition, spacing, typography hierarchy, imagery and restrained visual language while following the functional requirements in this plan.

- Treat the top grey `05 / FORM/TECH` presentation strip as reference framing, not an extra site header.
- Use a thin black announcement bar with truthful demo copy, a white navigation band with a strong centered FORM/TECH wordmark, and restrained small uppercase navigation.
- Build a wide architectural fashion hero: two adult models in silver/charcoal technical shells against angular concrete, subdued negative space for left-aligned white headline/copy, and a cobalt primary CTA. Place real accessible HTML text/buttons over the image; never bake the UI into a photograph.
- Below the hero, use three closely aligned photographic collection tiles with simple captions. Follow with a wide mountain/concrete editorial story, then four clean featured-product cards on pale grey backgrounds.
- Match the cool silver, slate, black and off-white palette, cobalt accents, generous image areas, thin dividers, restrained radii and tracked uppercase headings. Preserve mobile readability and accessible touch/keyboard behavior rather than shrinking a desktop screenshot.
- The reference is visual direction, not permission to add features: replace `Watch the Film` with the planned `Explore Collections` CTA; omit customer Account and Journal; do not copy free-shipping/returns promises, decorative coordinates, fake badges or unsupported performance claims. Keep the approved brand statement/footer after the visible reference sections.
- Men and Women navigation use seeded collection associations (including appropriate unisex products), not a new gender-filter subsystem. Ensure their destinations contain products.

### Image asset plan

Generate original imagery inspired by the reference rather than extracting its small embedded photos. Keep products, materials, lighting and color consistent across catalog and campaign assets. Use no third-party brand logos. Keep an asset provenance/prompt record in `docs/design/IMAGE_ASSETS.md`.

- Initial hero generated and saved: `public/images/campaign/form-tech-concrete-hero.png`. This is a source asset; responsive derivatives and browser crop/contrast checks remain implementation work.
- Remaining build assets: three collection images (technical jacket portrait, cargo-pant detail, light layering portrait), one mountain/concrete editorial banner, and a distinct primary product image for each of the 24 seeded products. Add secondary product views only where useful for a truthful gallery; do not use unrelated filler images.
- Product photos use consistent pale grey studio backgrounds, garment-centered framing and accurate seeded colors. Campaign images use the architectural technical-fashion direction above.
- Generate photographs without text, prices, buttons or watermarks. Optimize responsive output formats/sizes during implementation, retain source provenance, and verify crop behavior on mobile/desktop. Never claim an asset exists until it has been generated or supplied and saved.
- The screenshot is design reference material, not a production image or proof of licensing for its embedded photographs.

## 5. Homepage exact order

1. **Announcement bar:** merchant-editable demo message, no invented free shipping promise.
2. **Header:** logo, Shop, Men, Women, Technology, Search, Cart with count, Admin link visible only to authenticated admins; accessible mobile drawer.
3. **Hero:** split/immersive campaign photography, headline/copy above, `Shop New Arrivals` and `Explore Collections` buttons.
4. **Three collection tiles:** Technical Jackets, Tech Pants, Layering Systems.
5. **Editorial story:** `DESIGNED FOR A MORE OPEN WORLD`, photography, `Explore Our Approach` → /technology.
6. **Featured products:** four featured cards desktop, responsive mobile, `View All` → /shop.
7. **Brand statement:** concise fictional positioning, non-misleading.
8. **Footer:** shop, about, contact, size guide, demo shipping policy, socials only if real URLs configured, explicit portfolio/demo status.

No surprise sections, journal/blog, newsletter popup, countdown timer, reviews, influencers, social feeds, or chatbot.

## 6. Storefront behavior contract

### Listing, filters and cards

- Products load from database, not a hard-coded JSX array.
- Product: id, slug, title, description, collection associations, image URLs/alt text, active status, featured flag, created timestamp.
- Variants: id, SKU unique, selected size/color, unit price integer minor units, inventory, active status.
- Listing filter by collection/category, available sizes/colors (when present), availability and price range; sort newest, price low/high, name A–Z.
- Filtering and sorting use URL query parameters; direct links reproduce the result. Server queries validate all params.
- Search by product title and description. Empty, loading and error states.
- Product cards show genuine current price, image/title links and availability. No fake reviews or urgency.

### Product page

- Product image gallery with thumbnails and keyboard-accessible controls.
- Select actual size/color variant; display its correct price and availability.
- Quantity controls prevent values below 1 and above available stock.
- Add to cart validates product/variant and quantity. Disabled when unavailable; announce errors/success.
- Description and size information below main details.
- No wishlist, product reviews, or personalized recommendations.

### Cart

- Cart persists across refresh in a Laravel server session backed by PostgreSQL; guest checkout does not require an account. Store only variant IDs and quantities; resolve current prices and availability on the server. Session cookie loss/expiry may clear the guest cart; document the session lifetime.
- Cart line identity based on variant id. Add/update/remove item; show thumbnail, title, size/color, unit price, quantity, line total, subtotal.
- Always revalidate price and stock on server before making a demo order; never trust client prices.
- Use the mandatory /cart page. Do not add a cart drawer or popup in this build.
- Empty-cart and out-of-stock error cases must work.

### Simulated checkout and orders

- Dedicated checkout page clearly headed **DEMO CHECKOUT — NO PAYMENT WILL BE CHARGED**.
- Fields: full name, email, shipping address (line 1, city, province/state, postal code, country), optional notes; validate required data.
- Show order summary and clearly labeled fictional shipping/tax estimate, or explicit zero demo charge policy. Do not imply real tax calculation.
- Button: `Place Demo Order`, **never** `Pay Now` or `Purchase`.
- On valid submit, create a persistent demo order and line snapshots on the server; generate a non-guessable public confirmation reference; clear the cart only after the transaction commits. Make repeated checkout submissions idempotent so double clicks/retries cannot create duplicate orders or decrement stock twice.
- Inventory rule (locked): decrement stock transactionally when placing a demo order. Lock/recheck affected variants, reject insufficient/inactive stock, and roll back the entire order on failure. Cancellation restores stock exactly once within a transaction; repeated cancellation has no stock effect. Do not reopen cancelled orders. No admin reset button; repeatable development seeding must not wipe production orders or submitted messages.
- Confirmation shows demo reference and items and repeats that no payment was made.
- No real charge, transaction gateway, shipping label, fulfillment or transactional email.

## 7. Admin requirements

The admin is a real protected interface, not a decorative dashboard.

- One bootstrap administrator created via a secure seed/setup process using credentials supplied locally as environment secrets. No default published password. Hash passwords and use secure server sessions.
- Role: ADMIN only; users without valid admin session cannot read/write private admin routes or APIs. Protect server handlers, not just client menus.
- Dashboard metrics: product count, active products, low-stock variants, total demo orders, aggregate demo order value. Label all values as demos.
- Products: create, edit, activate/deactivate, associate images through the validated URL/demo asset workflow in section 2, and manage variants/inventory. Prevent duplicate slugs/SKUs. Use reversible archive/deactivation for products and collections; no hard-delete UI. Preserve historical order snapshots.
- Collections: create/edit/archive and assign products; prevent invalid references.
- Orders: list, search, view details and mark demo status (new/reviewed/cancelled). Clearly fake fulfillment. Cancellation restores inventory exactly once according to section 6; cancelled is terminal.
- Content: edit hero copy, CTA destinations (restricted to safe internal routes), selected hero/editorial images, featured product identifiers, and brand statement. Validate length/URLs.
- Secure login/logout; no storefront customer registration.
- No user-management matrix, employee invitations, supplier portal, CMS page builder, analytics charts, exports or coupons.

## 8. Explicit buttons and navigation

| Control | Outcome |
| --- | --- |
| Logo | Home |
| Shop / Men / Women | Valid shop/collection route |
| Technology | /technology |
| Search | Search form or /search; Enter submits |
| Cart icon and badge | /cart; badge reflects quantity |
| Mobile menu | Open/close with Escape, proper focus |
| Hero CTA | /collections/new-arrivals (seeded) |
| Explore Collections | Collection tiles anchor or /shop |
| Collection image tile | Its collection route |
| Featured View All | /shop |
| Product image/title | Correct product detail |
| Variant selector | Correct variant price and stock |
| Quantity +/- | Valid quantity bounds |
| Add to Cart | Adds selected variant or displays error |
| Shop filter/sort | URL-persisted result set |
| Cart update/remove | Update cart and totals |
| Proceed to Demo Checkout | /checkout; only if nonempty |
| Place Demo Order | Validate, persist order, show confirmation |
| Admin Sign in / Logout | Secure session create/destroy |
| Admin Save / Archive / Update | Authorized validated database mutation with feedback |
| Contact submit | Server-validated message saved to PostgreSQL; show acknowledgement clearly as demo; no email delivery |

No visible dead buttons, `href="#"` placeholders, fabricated loading indicators, or fake interactions. All interactive elements need hover/focus/disabled/error states.

## 9. Data model minimum

- `AdminUser`: id, email unique, passwordHash, createdAt.
- `Product`: id, slug unique, title, description, active, featured, createdAt, updatedAt.
- `ProductImage`: id, productId, url, alt, position.
- `Variant`: id, productId, sku unique, size, color, priceCents, stock, active.
- `Collection`: id, slug unique, title, description, imageUrl, active.
- `CollectionProduct`: collectionId, productId (composite unique).
- `SiteContent`: key unique, validated content fields, updatedAt.
- `Order`: id, publicReference unique, checkoutIdempotencyKey unique, customer name/email, address snapshot, totals snapshots, status, createdAt, demo flag.
- `OrderItem`: id, orderId, variant id nullable (historical), title/variant/price/quantity snapshot.
- `ContactMessage`: id, sender name/email, message, createdAt (limit data collection and secure admin access).

Do not add Cart/CartItem tables; the locked cart strategy uses Laravel sessions. Add the Laravel sessions table and an order idempotency key with a unique constraint as required infrastructure. Keep admin identity in one authenticatable model/table; adapting the starter-kit users table is acceptable, but do not create duplicate identity systems. Use DB migrations and meaningful indexes. Seed exactly 24 distinct quality fictional products with sizes/colors and images, realistic non-misleading product copy, categories and featured selection. Prices are demo amounts in one clearly specified currency (use USD by default unless user chooses PHP before seeding). Keep money as integer minor units; format at presentation layer.

### Locked seed catalog: 24 products

This owner-approved expansion increases sample content only; it does not add commerce features. Seed six products in each existing primary category. Additional New Arrivals, Men and Women collections are curated associations using these same products, not duplicated product records. Keep homepage featured products to four.

| Primary category | Fictional products |
| --- | --- |
| Technical Jackets | AeroShell Jacket; Ridge Pullover; Strata Rain Shell; Horizon Windbreaker; Traverse Parka; Axis Softshell |
| Tech Pants | Vector Cargo Pant; Meridian Travel Pant; Contour Tapered Pant; Summit Utility Pant; Drift Lightweight Pant; Interval Tech Short |
| Layering Systems | Transit Vest; Grid Fleece Midlayer; Core Technical Tee; Altitude Half-Zip; Flux Overshirt; Thermal Base Layer |
| Accessories | Module Sling Bag; Transit Daypack; Circuit Cap; Fold Beanie; Utility Belt; Field Pouch |

Give each product meaningful distinct copy, a unique slug, a matching primary image and appropriate size/color variants with unique SKUs, USD minor-unit pricing and plausible stock. Use apparel sizing where appropriate; bags/pouches/belts/headwear use relevant actual sizes or one-size options rather than fabricated XS–XL variants. Include available and unavailable variants to verify stock states. Do not inflate the product count by counting size/color variants as separate products. All amounts and stock are fictional demo data.

## 10. Project structure

```text
app/
  Http/Controllers/Storefront/
  Http/Controllers/Admin/
  Http/Requests/
  Http/Middleware/
  Models/
  Policies/
  Services/                 # Focused cart/order behavior where useful
bootstrap/
config/
database/
  migrations/
  factories/
  seeders/
resources/
  css/
  js/
    pages/storefront/
    pages/admin/
    pages/auth/
    components/
    layouts/
    types/
    app.tsx
    ssr.tsx
routes/
  web.php
public/
  images/
tests/
  Unit/
  Feature/
  e2e/
docker/                     # Production runtime/web configuration
compose.yaml                # Local Sail configuration
compose.production.yaml     # Production services, volumes and health checks
Dockerfile                  # Production multi-stage build
.env.example                # Placeholders only
FORM_TECH_REACT_PORTFOLIO_BUILD_SPEC.md
IMPLEMENTATION_STATUS.md
README.md
```

Follow installed Laravel/Inertia conventions where filenames differ. Do not scaffold duplicate application trees. Keep React tests near their components or under one documented test directory.
## 11. Security, reliability, accessibility

- Validate all incoming server requests; enforce admin authorization on every admin mutation.
- Prevent mass assignment; whitelist fields; rate-limit login and contact submission as practical for hosting.
- Passwords salted and hashed by a maintained algorithm/library; secure cookies; never log secrets or sensitive address data.
- Use parameterized ORM queries; sanitize permitted content/URLs; avoid raw unsafe HTML.
- Never expose database URL, admin credentials or service-role tokens in client bundles or GitHub.
- Ship sample/demo-only data; no actual payment capture; realistic privacy note and data retention practice for visitor-submitted forms.
- Order creation and stock changes must be atomic; handle concurrency and out-of-stock failures.
- Provide accessible labels, heading structure, contrast, visible focus, keyboard mobile menu, useful alt text, reduced-motion support.
- Responsive loading/error/empty states; no silent failures.
- Optimize images, avoid unnecessarily large JS bundles, generate metadata/sitemap, and keep page title/description meaningful.

## 12. Tests and acceptance

**Unit/component:** Money formatting, variant selection, quantity limits, filter query parsing, form validation, cart calculation, accessibility-critical controls.

**Integration:** Product/variant DB CRUD, admin authorization, collection filters, order creation transactions, inventory conflicts, order cancellation policy.

**End-to-end:** Home → collection → product → variant → cart → demo checkout → confirmation; search with zero results; admin login → product edit → storefront reflects update; unauthorized admin route blocked; mobile navigation.

**Release criteria:**

- [ ] Every required route loads with real DB-backed data.
- [ ] All tabled controls actually work.
- [ ] Product and variant selection show correct stock and price.
- [ ] Cart persists on refresh and handles invalid inventory.
- [ ] Demo order saves and appears in protected admin.
- [ ] Admin product/collection/content updates change storefront.
- [ ] Non-admins cannot access protected endpoints.
- [ ] Test suite and production build pass.
- [ ] No placeholders/dead links or fake payment claims.
- [ ] Mobile/keyboard/empty/error states checked.
- [ ] GitHub repo has clear README, screenshots, demo disclaimer and setup instructions.
- [ ] Production Docker deployment works over HTTPS with persistent PostgreSQL, secure environment configuration, migrations, safe demo seeding, Inertia SSR and verified browser flows.

## 13. Delivery phases and acceptance gates

Do not begin implementation solely because this document was opened. Once the owner authorizes building, proceed in the following order. At each phase end, report completed requirements, concrete checks/results, defects and the next phase. Fix defects before advancing. Routine in-scope implementation can continue without repeated permission requests; explicit owner stop requests, scope changes and public deployment require a pause.

**Phase 0 — Audit and implementation checklist**

- Inspect repository files, Git status/branch and existing work; do not overwrite changes or initialize a second app over existing code.
- Verify Docker Desktop, WSL2, available ports, runtime compatibility and local resource capacity. Identify Windows/OneDrive bind-mount limitations; prefer a WSL Linux-filesystem checkout for Docker performance if needed, and coordinate any move with the owner.
- Confirm stable compatible Laravel/PHP/Node/PostgreSQL versions, starter-kit compatibility and package lockfiles. Record choices without changing the locked architecture.
- Create IMPLEMENTATION_STATUS.md mapping requirements to phases, evidence and outstanding work. This file records progress; this specification defines scope.
- Confirm repository destination, available assets and currency (USD unless the owner chooses PHP before seeding). Identify the production Docker-capable host and constraints early; do not purchase hosting or publish.
- Gate: feasible local/deployment plan, preserved repository state and concrete checklist. Report missing prerequisites honestly.

**Phase 1 — Foundation**

- Scaffold the single Laravel + Inertia React TypeScript app with Tailwind and design tokens.
- Configure Sail/Compose and PostgreSQL, Eloquent migrations, seeders and database sessions.
- Establish staff-only auth foundation, remove unneeded starter-kit routes and build shell/header/footer/mobile navigation.
- Create the 24 fictional products specified in section 9, variants, collections and merchandising content with permitted assets. Read bootstrap admin credentials only from secure local environment configuration.
- Provide .env.example, setup commands and initial production Docker/SSR configuration so hosting feasibility is checked before feature work.
- Gate: clean setup/migrations/seeding work, services start, asset and SSR builds pass, shell is responsive and starter-kit public registration is inaccessible.

**Phase 2 — Storefront**

- Build the exact homepage order, shop/collection/search routes, URL filters/sort, product gallery and actual variant/stock behavior.
- Implement technology/about/size guide/demo shipping policy and working contact persistence with rate limiting.
- Implement metadata, SSR output and accessible loading/empty/error states as pages are built.
- Gate: database-backed pages and controls work; filter/variant tests pass; keyboard/mobile navigation and public HTML rendering verified.

**Phase 3 — Cart and simulated checkout**

- Implement the session cart, server-derived totals, quantity/update/remove behavior and stock revalidation.
- Implement demo checkout, validated customer/address snapshots, idempotent transactional order creation and non-guessable confirmation references.
- Keep order-confirmation details limited to necessary demo information; do not expose addresses/email through public references.
- Gate: guest flow passes end to end; refresh persistence, stale price/stock, concurrent stock conflicts, rollback, repeated submit and clear-after-success behavior pass relevant tests.

**Phase 4 — Protected admin and content**

- Implement protected dashboard metrics, product/variant/collection archive and editing, image association, demo order review/cancellation, merchandising content and contact-message review.
- Enforce authorization on every admin route/mutation. Do not add contact reply, export or messaging features.
- Gate: login/logout and unauthorized access tests pass; edits appear on storefront; cancellation restores stock once; invalid input and unsafe URLs are rejected.

**Phase 5 — Verification and deployment preparation**

- Finish responsive QA at 360, 390, 768, 1024 and 1440px; accessibility, image sizing, metadata, sitemap and performance checks.
- Run backend, React and Playwright suites plus production asset/SSR builds; verify all release criteria in section 12.
- Build and run the production Docker configuration locally. Disable debug mode, use production dependencies, configure health checks and document persistent volumes, secrets and migration commands.
- Complete README with screenshots, demo disclaimer, local startup/shutdown, tests, safe seeding, secure admin bootstrap/recovery and deployment/rollback instructions.
- Gate: reviewable release candidate and concrete deployment runbook; no public deployment until explicit owner approval.

**Phase 6 — Approved deployment and final verification**

- After owner approval, deploy the reviewed release to the selected Linux host with a production PHP application/web server, required Node Inertia SSR process and PostgreSQL. Do not run Sail, Vite dev server or debug tooling as the public production server.
- Configure HTTPS, secure cookies, trusted proxy/host settings, app URL/key and production secrets outside Git. Expose only required web ports; keep PostgreSQL private.
- Build compiled assets/SSR, run reviewed migrations and safe seeding, configure Laravel production caches and verify writable runtime directories. Do not run destructive migration/seed commands on production data.
- Persist PostgreSQL data across container replacement. Document and verify a backup/restore procedure before public form data is accepted; store backups outside the application container and protect access.
- Verify health, rendered storefront HTML, admin protection, image loading, contact submission and the complete demo checkout in production. Inspect logs without exposing submitted personal data or secrets.
- Record deployed commit, deployment URL, verification results, backup location/access method and rollback procedure. Rollback must account for database compatibility; a container restart is not a database rollback.
- Gate: working approved live demo and completed acceptance checklist. Report failures or limitations explicitly.

## 14. Deliberately excluded

Real payments/gateways; real shipping/fulfillment; actual tax compliance; customer registration/profiles/social login; wishlist; reviews/ratings; loyalty; discounts/coupons; recommendation AI; chatbots; subscriptions; marketplace sellers; multi-tenancy; SMS; newsletters; transactional emails; live notifications; vendor analytics; chart dashboards; AR/3D; language/currency switching; complex permission roles; Shopify integration; separate microservices; binary image upload pipelines; reset-demo-data UI; unrequested starter-kit account features; Redis/queues/workers; Kubernetes; extra frameworks or duplicate APIs.

No extra section, dashboard widget, integration or package may be added just to make the project look more complete. When a required feature can use existing framework capabilities, prefer them. Necessary bug fixes, accessibility work and security validation remain in scope.

### Future Shopify compatibility

This is not a Shopify theme and cannot be uploaded as one. A later, separately approved migration could recreate the design as Shopify Liquid/JSON templates or replace the custom commerce backend with Shopify APIs/checkout. Neither path is part of this build.

## 15. Continuation prompt — copy into a future chat

```text
Read FORM_TECH_REACT_PORTFOLIO_BUILD_SPEC.md completely and inspect IMPLEMENTATION_STATUS.md if it exists before changing files.

We are building FORM/TECH, a portfolio apparel commerce demo, with Laravel + Inertia + React + TypeScript + Tailwind + PostgreSQL. Use Docker/Sail locally and a dedicated production Docker deployment. This is the approved version 3.1 architecture; do not revert to Next.js, XAMPP or a Vercel-only application.

First inspect the repository, Git status and existing implementation. Preserve my changes. Report the current phase, verified completed requirements and remaining checklist, then continue the authorized in-scope build from that point. If I am only asking a question or requesting plan edits, do only that.

Stick to this plan from foundation through deployment. Use Eloquent, Laravel session authentication, Form Requests, a server-session guest cart and transactional/idempotent demo orders. Only staff authenticate; no customer registration. Keep all commerce flows explicitly DEMO and never integrate real payments.

Implement every required page and interaction with real database-backed behavior. Add no excluded or unnecessary features, services or libraries. Record evidence in IMPLEMENTATION_STATUS.md; do not treat an unchecked or placeholder feature as complete.

At each phase gate, report checks, defects and next steps. Fix defects before advancing. Continue routine in-scope work without repeated approval questions. Ask before material scope changes or public deployment. Never purchase hosting, expose secrets or overwrite existing work without authorization.
```

## 16. Owner inputs and deployment boundaries

Before Phase 1: repository choice, Docker Desktop/WSL2 availability, any existing branding/assets and preferred demo currency (default USD). Do not block unrelated audit/planning work on missing deployment credentials.

Before release: selected Docker-capable Linux host/account, intended URL/domain, secure configuration access, image permissions, retention policy for visitor-submitted demo data and explicit approval to publish. No hosting provider, paid plan or domain purchase is implicitly approved. GitHub stores source; production runs on the chosen Laravel/Docker-capable host. Vercel is no longer a required deployment target.

Never request passwords, API keys, database credentials or app keys in chat. Use official secure configuration mechanisms or the owner's local/server environment. Commit placeholders only. Document how to remove expired demo contact/order data securely; no public data-management feature is required.

## 17. Approved changes and scope control

**UI refinement follow-up:** `FORM_TECH_UI_REFINEMENT_PLAN.md` records the owner's requested navigation fixes, smooth collection scrolling, restrained motion and alignment with the newer complete reference at `docs/design/form-tech-complete-ui-reference.png`. It is a planning addendum, not an implemented feature set or a replacement for this architecture/scope. Preserve existing generated imagery, commerce behavior and exclusions. The current request authorizes planning only; future implementation follows the owner's active instructions.

| Date | Approved decision |
| --- | --- |
| 2026-10-29 | Owner supplied the UI screenshot as visual direction, authorized matching generated imagery and a larger realistic sample catalog; version 3.1 fixes the catalog at 24 distinct products and preserves existing feature exclusions. |
| 2026-10-29 | Owner approved the recommended Laravel + Inertia + React + PostgreSQL + Docker architecture and requested an updated plan to prevent unnecessary feature additions through deployment. |

Architecture details locked by this revision: Eloquent, Laravel sessions, server-session cart, PostgreSQL, staff-only authentication, transactional inventory decrement with exactly-once cancellation restock, idempotent checkout, URL-based image association, database-only contact submission and production Docker hosting with Inertia SSR.

For a proposed scope change, describe the concrete need, affected requirements and implementation/deployment impact. Obtain explicit owner approval before implementing it, then update this plan and record the decision here. Do not infer approval from this document's embedded prompts or from a tool's output. Progress updates belong in IMPLEMENTATION_STATUS.md and do not expand scope.

Approved scope extension — 2026-10-30: the owner explicitly corrected the earlier removal of single-color dots and requested another color for each product. Authorizes 24 matching generated color edits, 79 additional size/color variants, image-to-color association and functional card/detail swatches through bag/checkout. Preserve existing variants, inventory, prices, images and orders. Public deployment remains deferred.

Approved storefront usability extension — 2026-11-05: the owner requested the full remaining improvement list and authorized completing it. Scope includes product facts from existing data, on-page size guidance with accurate unit conversion, a searchable guide directory, deterministic related catalog items, tab-local recently viewed slugs resolved through the public catalog, return-to-results continuity, clearer empty states/forms, and accessibility/performance verification. No new external service, package, customer account, material specification, real shipping promise, tracking service or public deployment is authorized by this extension. The preceding November 5 readability, motion, suggestions and filter-chip refinements are also owner-approved.

Approved collection curation — 2026-11-05: the owner approved making Men and Women meaningfully distinct after reviewing the duplicated selections. Retain the existing 24 shared-sizing products and curate separate edits with shared basics/accessories: 18 Men, 14 Women, eight shared. Default these two routes to an explicitly labelled Collection edit order; keep Newest and price/name sorting available. Update existing collection associations with a saved before-state, preserve unrelated collections, stock, prices, orders, custom products and custom descriptions. This does not introduce women-specific fits or new product assets. A campaign film remains deferred pending suitable footage and a concrete implementation decision.

Approved women’s capsule extension — 2026-11-05: the owner explicitly requested at least six new women’s items with selectable colors. This supersedes the earlier fixed 24-product cap and the prior shared-sizing-only collection decision. Add exactly six distinct designs (Halo Cropped Shell, Linea Longline Vest, Arc Utility Skirt, Forma Wide-Leg Trouser, Nexa Contour Top, Veil Wrap Overshirt), each with two actual color photographs and XS/S/M/L/XL variants. The catalog becomes 30 products / 218 variants / 60 product photos; Women becomes 20 items, Men stays 18. Preserve the original 24 products, their stock, prices, imagery, staff edits and orders. Use an explicit transactional additive helper for existing stores, never a reset/reseed. Capsule-specific illustrative body measurements must be distinguished from shared-product sizing. Add a Women’s Capsule collection and lead Women’s default edit with the six new designs; keep the original homepage featured selection. Generate and save new images with provenance and responsive derivatives. Video and public deployment remain deferred.
