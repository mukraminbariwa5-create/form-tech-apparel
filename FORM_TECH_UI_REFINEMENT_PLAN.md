# FORM/TECH — UI refinement and interaction plan

**Version 1.0 · Implementation authorized and verified locally on 2026-10-30; see IMPLEMENTATION_STATUS.md for evidence. No public deployment.**

## 1. Purpose and scope

Fix unclear return navigation and abrupt collection scrolling, then make the storefront feel responsive and polished without changing its established visual identity. Use the owner's new complete homepage reference for composition and UI details, while retaining the site's existing generated photographs.

This is the single UI refinement addendum to `FORM_TECH_REACT_PORTFOLIO_BUILD_SPEC.md` (version 3.1), not a replacement project plan or a second application. The base plan still controls architecture, commerce behavior, security and feature exclusions. This addendum defines the requested navigation, motion and visual refinements. A future implementation request authorizes work on these refinements; creating or reading this file alone does not authorize building or deploying them.

Do not add unrelated features or reinterpret “more alive” as permission for a redesign, additional sections or services. Preserve existing work and data. No public deployment or hosting purchase: the owner requested hosting help later.

## 2. References and current implementation

- **Primary refinement reference:** `docs/design/form-tech-complete-ui-reference.png` — an identical project-local copy of the newly supplied `Form_Tech technical apparel homepage.png`.
- **Earlier reference:** `docs/design/form-tech-ui-reference.png`; use the newer complete image when comparing the shared homepage sections.
- **Keep existing imagery:** `public/images/campaign/`, `public/images/collections/`, `public/images/products/` and their responsive derivatives. No new image generation or replacement photography is required for this work.
- **Preserve the recently refined brand:** shared SVG wordmark and locally hosted Barlow Condensed utility lettering; see `docs/design/TYPOGRAPHY.md`.
- **Inspect current progress:** `IMPLEMENTATION_STATUS.md`. The storefront, 24 products, guest cart/checkout and protected admin already work locally. Do not rebuild them.
- **Historical verification:** 40 backend tests, 7 React tests and 4 browser flows previously passed. The most recent header change passed TypeScript, browser/SSR builds and 4 browser flows. These results precede this refinement; rerun appropriate checks after implementation.
- **Runtime:** existing Laravel + Inertia + React + TypeScript + Tailwind + PostgreSQL + Docker/Sail. Preview: `http://localhost:8080/`. Follow README startup commands; inspect running containers before starting anything. Production images need rebuilding after final refinements.

### Owner-reported issues and code observations

| Issue | What is known | Required outcome |
| --- | --- | --- |
| After Shop New Arrivals, returning to the landing page is unclear | The wordmark already links to `/`. The collection listing has no explicit Home breadcrumb/return control. Treat this first as a discoverability problem; reproduce the reported flow before diagnosing a broken route. | A visible, labeled Home link on every listing/collection page, including New Arrivals and all three main collections. |
| Collection tile destinations feel like dead ends | Technical Jackets, Tech Pants and Layering Systems reuse the shop page. | Consistent return/navigation context on all these routes, not a special fix for one collection. |
| Explore Collections jumps abruptly toward lower content | The hero currently uses an Inertia Link to a hash destination, normally `/#collections`. There is no normal smooth-scroll rule; the CSS only specifies instant scrolling for reduced motion. | Smooth, correctly targeted movement to the collection tiles, with an instant accessible alternative for reduced motion. |
| The interface feels static | Most sections are static. Product images already have a small hover zoom and a few basic hover states. | A coherent set of subtle entrance, hover, focus and genuine loading/feedback interactions. Extend existing behavior rather than duplicating it. |
| Reference details still differ | Earlier review identified proportions, typography, photo framing and featured-product order differences. | Refine the existing design using the new reference, retaining the current photographs and approved brand direction. |

## 3. Design guardrails and reference mapping

Keep the cool white/slate/black palette, cobalt `#145DFF`, thin dividers, restrained corners, centered wordmark, architectural hero, three photographic collection tiles, mountain editorial section and four featured cards. Keep the approved brand statement and footer after those shared sections; their absence from the cropped reference does not authorize removal.

Match **ratios and relationships**, not screenshot pixels blindly: header bands, hero height, copy width/line breaks, image crop, button sizes, tile gutters/caption bands, editorial proportions and product-card alignment. Compare at a known desktop viewport, then adapt thoughtfully at 360, 390, 768, 1024 and 1440px. The reference depicts a desktop composition; do not force a desktop navigation or four-card row into a narrow phone viewport.

| Reference element | Implementation instruction |
| --- | --- |
| Thin black utility band | Keep truthful editable demo copy at left, compact condensed type and functional Search/Bag utilities at right on desktop. Maintain adequate contrast and touch targets. |
| White navigation band | Preserve left Shop/Men/Women/Technology, centered current geometric wordmark and About. Refine spacing/weight without replacing the accepted logo with ordinary system-font text. |
| Outline search/bag icons | Use small consistent code-native SVGs linked to existing `/search` and `/cart`. At desktop, integrate them into the white header's right-hand group where the reference shows them; existing utility-band text links may remain. Keep counts synchronized. On mobile use Menu, centered mark and Bag; Search stays available in the menu. No crowded duplicate mobile controls. |
| Hero headline and two CTAs | Refine the squared technical heading style, tracking, wrapping and contrast locally to the campaign sections. Keep Shop New Arrivals and Explore Collections; preserve real HTML text and existing photography. |
| Collection tiles | Keep three desktop tiles with consistent image/caption proportions, meaningful Shop links and clear hover/focus affordances. Maintain the existing mobile-friendly layout. |
| Mountain editorial | Match headline hierarchy, readable left copy area, restrained CTA and image framing using the existing image. No new claims or extra content sections. |
| Featured order | Target AeroShell Jacket → Vector Cargo Pant → Ridge Pullover → Transit Vest, using actual CMS product IDs. Inspect current merchandising first and preserve deliberate staff edits; never reset inventory or reseed the store to reorder cards. |
| Color dots under products | Owner correction on 2026-10-30 authorizes a second actual colorway for each of the 24 products, matching photos and size/inventory variants. Keep accessible working dots that update card photo/price and link to the chosen product color; carry that variant through bag and checkout. Preserve existing data. This approved extension supersedes earlier single-color omission and new imagery/schema exclusions only for this purpose. |
| Account / Journal / Watch the Film | Keep these excluded. Use existing guest shopping, About/Technology and Explore Collections. Do not add customer registration, a blog or a dead video button. |
| Shipping/returns promises and coordinates | Retain truthful demo language. Do not copy merchant promises, unsupported performance claims, decorative location coordinates or fake badges. |

Do not add a carousel, cart drawer, newsletter, wishlist, reviews, chatbot, payments, autoplay video, social feed, analytics or unrelated dashboard changes. Do not replace the stack or install an animation framework for these effects.

## 4. Priority A — obvious navigation back home

1. Reproduce these journeys on desktop and mobile: `/` → New Arrivals; `/` → Technical Jackets; `/` → Tech Pants; `/` → Layering Systems. Check the current wordmark, browser Back and direct/deep links separately.
2. Add a compact, semantic breadcrumb above the listing heading: **Home / Shop / Current Collection**. On `/shop` and `/search`, adapt the final label without duplicate links. Home must be a real link to `/`, not `history.back()` or a JavaScript-only control. Clearly distinguish linked ancestors from the current page.
3. Add Home to the existing product breadcrumb and mobile navigation. Keep the logo's working home destination and accessible name. Extend the same breadcrumb treatment to informational pages where it supplies useful context; avoid redundant button clusters.
4. Make Home visible above the fold without requiring the user to open a menu. It must work after direct navigation, refresh and opening a collection in a new tab. A deliberate Home link returns to the landing hero/top; browser Back/Forward should retain sensible prior scroll/filter state.
5. Keep the existing white header available while scrolling with restrained sticky positioning. Preserve its dimensions and normal document flow; avoid shrinking/jumping logos, a new floating toolbar or excessive shadow. The black utility strip may scroll away. Account for sticky-header height in hash targets and skip links.
6. Preserve query filters, pagination and real Shop links. Do not clear the bag, user session or form input just to navigate home. Keep cart → checkout → confirmation working and protected staff routes protected.

**Acceptance:** every named collection has an obvious Home route, the wordmark works, direct links have a way home, and browser history does not trap the user or discard relevant listing state.

## 5. Priority B — smooth Explore Collections behavior

- Keep the destination at the **start of the three collection tiles**, not Featured Products or the footer. Use an actual `#collections` target and sufficient scroll margin for the sticky header.
- For a same-page destination, prefer a native anchor and progressive CSS smooth scrolling over a full Inertia page visit. Normalize the current `/#collections` CMS destination appropriately; do not silently disable other valid CMS links.
- Scope smooth behavior to intentional in-page navigation. Do not animate every route restoration, browser Back action or checkout navigation.
- Retain the useful URL hash and browser history. Avoid repeated clicks creating unnecessary history entries or triggering two competing scroll effects. The link should still function with JavaScript disabled.
- Preserve image dimensions so loading photographs does not move the target after arrival. If focus is moved, place it on a properly labeled section/heading with `preventScroll` so it does not trigger a second jump. Do not trap keyboard focus or steal focus on normal scrolling.
- Honor `prefers-reduced-motion: reduce`: instant scrolling and no reveal movement. Essential navigation must not depend on an animation completing.

**Acceptance:** clicking Explore Collections produces a perceptible, controlled scroll to visible collection tiles in normal motion mode, an immediate correct landing in reduced-motion mode, and no unexpected page reload, bottom-of-page jump or focus loss.

## 6. Priority C — restrained motion and feedback

Use shared CSS variables/tokens and a small reusable helper only where required. Prefer opacity and transform; avoid expensive layout animation. Keep the site quiet and editorial.

| Interaction | Target behavior |
| --- | --- |
| Buttons, links and utility icons | 140–220ms color/underline/arrow movement; arrow displacement around 2–4px. Include equally clear focus-visible, active and disabled states. |
| Collection/product cards | Subtle image scale around 1.02–1.035 over 220–320ms, restrained overlay/contrast change and caption-link feedback. No bounce, large card lift or shifting grid layout. Keyboard focus must expose the same affordance. |
| Hero copy/CTAs | One brief fade and at most 8–16px entrance motion, around 350–500ms. Keep the hero photo and primary content immediately usable; do not delay the largest visible image or hide it behind an intro. |
| Below-fold tiles/editorial/featured rows | Optional one-time reveal on viewport entry, 350–500ms with 40–70ms sibling staggering and a short total sequence. Do not reanimate every time the user scrolls back. |
| Mobile menu | Gentle drawer/backdrop transition around 180–240ms. Preserve native dialog focus containment, Escape, close controls, background scroll handling and focus return. |
| Filters, bag and checkout | Use existing genuine request/processing state: disable duplicate actions, maintain context and announce success/errors. Any progress indication must reflect a real request, never a fake timer. Do not animate prices or stock in ways that obscure changes. |

No endless hero zoom, parallax, scroll hijacking, pinned storytelling, cursor effects, sound, flashing, autoplay or long full-screen page transitions. No motion dependency/service is needed. Do not globally fade the app on route changes.

For any IntersectionObserver helper: render SSR content visible by default; enhance only after JavaScript is available, disconnect observers on cleanup and reveal immediately when unsupported. Reduced-motion mode removes transforms/staggering and smooth scroll. Content, SEO markup and ordinary navigation remain available without animation/JavaScript enhancement. Motion must never block otherwise-working commerce controls; a separate no-JavaScript checkout implementation is not part of this refinement. Avoid hydration differences and layout shift.

## 7. Implementation sequence and likely files

Work in small stages, capture before/after at matched widths and avoid touching unrelated backend services.

| Stage | Work | Likely files |
| --- | --- | --- |
| 0 — Baseline | Inspect Git/worktree, current code, running Docker services and latest screenshots. Reproduce reported navigation/scroll issues. Record a short checklist. | `IMPLEMENTATION_STATUS.md`, `README.md`, existing screenshots/tests |
| 1 — Navigation | Shared Home breadcrumbs, mobile Home link, deliberate return-to-top behavior, sticky-header/anchor offsets. | `resources/js/layouts/store-layout.tsx`, `resources/js/pages/storefront/shop.tsx`, `product.tsx`, relevant information pages, a small shared breadcrumb component, `resources/css/app.css` |
| 2 — Anchor and feedback | Correct Explore Collections link semantics; normal/reduced-motion scrolling; consistent hover/focus/menu/request feedback. | `resources/js/pages/storefront/home.tsx`, store layout, existing button/card CSS |
| 3 — Visual alignment | Match new reference's proportions/heading styles, outline icons, tile/caption spacing and featured order; add only genuine color indicators. | `home.tsx`, `components/product-card.tsx`, `components/wordmark.tsx` only if a verified defect requires it, CSS and existing fonts |
| 4 — Minimal data wiring | Extend the existing card DTO/types only if actual color indicators require it. Reorder existing homepage product IDs safely. Do not add a parallel hardcoded catalog or new schema merely for styling. | `app/Http/Controllers/Storefront/StorefrontController.php`, `resources/js/types/store.ts`, existing content workflow |
| 5 — Verify and document | Component/browser regressions, five widths, reduced motion, SSR, optimized assets and final production-image rebuild/rehearsal. Save screenshots and results. | `tests/React/`, `tests/Browser/`, relevant PHP tests, README/status |

Use existing Inertia/Laravel navigation conventions and verify installed APIs before relying on new options. Reuse the established CSS strategy and local font licenses. No broad global heading changes that inadvertently restyle login, admin or checkout forms.

## 8. Verification and completion checklist

Do not mark this refinement complete solely because it compiles or because a previous test run passed.

- [ ] New Arrivals and all three main collection journeys return visibly to Home through the breadcrumb and logo, on desktop/mobile and after direct load/refresh.
- [ ] Home returns to the hero/top; Back/Forward preserve appropriate collection filters and scroll context.
- [ ] Explore Collections smoothly reaches the correct tiles; reduced-motion and no-JavaScript behavior remain functional.
- [ ] Sticky header does not cover anchor headings, focus rings, validation errors or the mobile dialog at any required width.
- [ ] Search, About, Men/Women, product links, color indicators and live bag count retain truthful, functioning behavior.
- [ ] Hover, keyboard focus, touch/active and disabled states are coherent. Mobile menu opens/closes by keyboard and restores focus.
- [ ] Reveals never hide SSR content, introduce a blank first screen, delay the hero image or leave content invisible after JS failure/navigation.
- [ ] New reference compared against screenshots at matched desktop scale; real mobile screenshots checked at 360/390px. No page overflow at 360/390/768/1024/1440px.
- [ ] Existing photographs, original source assets, current brand identity and approved page order are preserved. Every visible color indicator represents an actual variant; no invented imagery, color inventory or performance claims.
- [ ] TypeScript and browser/SSR builds pass. React/Testing Library and Playwright cover new Home links, anchor landing/history, reduced motion, keyboard menu and relevant card states; do not assert fragile exact animation timings.
- [ ] Existing checkout and staff-edit browser flows pass. Run PostgreSQL backend checks when DTO/content changes affect them; use only the isolated test databases and preserve the working store.
- [ ] Check the browser for font/image/request errors and hydration issues. Verify public SSR HTML, canonical metadata and image loading after the final build/renderer restart.
- [ ] Rebuild/rehearse the final production images locally; no publication. Save latest screenshots and exact check results in `IMPLEMENTATION_STATUS.md`; leave unverified items explicit.
- [ ] Keep the copied UI reference as design documentation, not a website photo. Exclude it from production build context alongside the earlier reference when preparing final images.

## 9. Data, deployment and work boundaries

Do not run `migrate:fresh`, reset the working database, overwrite `.env`/APP_KEY, reseed inventory, discard local changes or recreate the application. The existing repo may have untracked work: inspect and preserve it rather than assuming it is disposable. Browser fixtures may reset only their guarded disposable test database.

Keep Laravel authoritative for prices, stock and order transactions. Preserve guest shopping, admin-only authentication, no-payment checkout and private confirmation details. Staff credentials are configured securely outside chat; no default/public password. Do not purchase hosting, create/publish a GitHub repository, change deployment providers or publish the app during this UI task.

Work ends at a verified local refinement with current screenshots and a concise report of changes, tests and remaining limitations. Any materially new feature still needs owner approval; routine fixes within this document do not require repeated permission questions.

## 10. New-chat continuation prompt

Copy this into a new chat attached to the existing project:

```text
Continue FORM/TECH in C:\Users\mukra\OneDrive\Documents\PROJECTS\form-tech-apparel.

Read FORM_TECH_UI_REFINEMENT_PLAN.md, IMPLEMENTATION_STATUS.md and the existing project specification before changing files. Inspect the current repo and preserve all existing work. Implement the UI refinement plan in its priority order; do not rebuild the app or add unrelated features.

Fix visible Home/return navigation from New Arrivals and all collections first, then smooth accessible Explore Collections scrolling, then subtle motion/feedback and the detailed reference alignment. Use docs/design/form-tech-complete-ui-reference.png for UI composition while preserving our existing generated images and recently refined wordmark/header. Keep the established design, truthful demo wording, commerce behavior and reduced-motion accessibility.

Use the existing Laravel/Inertia/React/TypeScript/Tailwind/PostgreSQL/Docker stack. Verify the actual browser journeys at the five planned widths, run appropriate tests and SSR/build checks, and update IMPLEMENTATION_STATUS.md with real evidence. Hosting selection is deferred; do not publish or purchase anything. Continue routine in-scope work without repeated approval questions.
```
