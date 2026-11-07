# Storefront usability pass — 2026-11-05

The owner approved this finite ten-item pass after the earlier typography, motion, search-suggestion and filter-chip improvements. This completes the remaining improvements proposed in that conversation; it is not a claim that every possible website feature is necessary or implemented.

| Item | Delivered behavior |
| --- | --- |
| 1. Product summaries | Actual description, color count, sizes for the selected color, current selection, measurement reference and real collection links. No invented material or performance claims. |
| 2. On-page size guidance | Native modal dialog with the exact product guide, selected-size highlight, logical size ordering, centimetre/inch conversion where the data explicitly supplies centimetres, measuring instructions and Escape/focus restoration. One-size/custom data is preserved. |
| 3. Size-guide directory | Search by product name, empty-state recovery, expandable measurement tables, unit conversion and links back to real product pages. |
| 4. Related items | Four active, in-stock catalog products, prioritizing shared primary collections and excluding the current product. No artificial intelligence or external recommendation service. |
| 5. Recently viewed | Up to eight slugs stored in this tab's session storage; up to four public catalog cards resolved with current server data. Current product and archived products are excluded. Clear-history and retry controls provided. No cached client prices are used for checkout. |
| 6. Return to results | Product links remember the current catalog URL and scroll position. Back to your results restores filters/sort and scroll; only same-origin catalog destinations are accepted. Browser Back continues to work. |
| 7. Empty states | Empty search can clear filters within its current collection or explore other collections. Empty bag offers direct collection routes. |
| 8. Forms and typography | Consistent readable storefront field/label sizes, stronger editable boundaries, clearer secondary text and improved contact-error focus/associations. |
| 9. Accessibility | Targeted keyboard/modal/focus/reduced-motion checks, narrow reflow, doubled text and an effective 200% desktop layout test. Text-over-image overlays receive stronger contrast support; meaningful field boundaries use a verified contrasting color. |
| 10. Loading and images | Responsive sized images retained, asynchronous decoding added, below-fold cards lazy-loaded, server-rendered related content and bounded/cancellable recent-history requests. Read-only local timing and broken-image checks recorded. |

## Verification evidence

- TypeScript and browser/SSR builds pass; local SSR renderer restarted after the final build.
- Backend: 48 tests, 785 assertions passed in the separate `form_tech_testing` database.
- Components: 19 tests passed, including range conversion, logical size ordering and rejection of unsafe stored return destinations.
- Full existing browser run: 29 cases passed initially; two color-flow selectors were ambiguous after related cards added more color controls. Scoped them to the product purchase area; both phone and desktop purchase flows passed on rerun. Existing navigation, simulated checkout, staff, search, motion and responsive behavior were retained.
- Final cross-browser guidance: all 15 executions passed across Chromium/Firefox/WebKit, including the effective 200% desktop layout scenario. Final responsive regression suite: all 24 executions passed across those same three engines. Full details are recorded in `IMPLEMENTATION_STATUS.md`.
- Read-only working-store SSR/image/navigation checks passed at 360/390/768/1024/1440px with no browser errors, including no-JavaScript homepage navigation and reduced motion.
- Screenshots: `polish-size-guide-{320,390,683,1366,1920}.png` and `polish-live-{360,390,768,1024,1440}.jpg` under `docs/screenshots/`.

## Local performance observations

See `LOCAL_PERFORMANCE_2026-11-05.json` and the repeatable read-only script `tests/Browser/performance-smoke.mjs`.

Fresh Chromium contexts at 1366×768 against the local Docker app returned HTTP 200 for Home, Shop and AeroShell. Observed TTFB was 255–273ms, LCP 360–404ms and sampled layout shift 0. No broken images or third-party requests were recorded. Initial resource transfers were approximately 0.56–0.76MB per sampled page.

These are single, unthrottled local development samples, not production measurements, a Lighthouse score, field Core Web Vitals or a service-level guarantee. Browser cache, CPU, network conditions, host configuration and catalog changes affect results.

## Limits and preserved boundaries

Native Edge zoom could not be inspected because its window was minimized and the available UI controls could not restore it. Automated checks instead cover a 683-CSS-pixel viewport at 2× device scale (the layout equivalent of a 1366-pixel desktop at 200%) and separate 200% text enlargement. This is not a claim of a completed manual Edge zoom or screen-reader audit, nor full WCAG certification.

No catalog records, stock, prices, orders or credentials were reset. No packages, accounts, payments, shipping integrations, analytics or external services were added. The local development preview is updated; isolated production rehearsal images and public deployment remain outside this pass.
