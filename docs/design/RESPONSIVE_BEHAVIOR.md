# Responsive navigation contract

Keep the same destinations available across layouts. The switch is based on the
available CSS viewport width, including an embedded preview pane, rather than a
device name or the physical monitor size.

| Width | White header | Where to find navigation |
| --- | --- | --- |
| Up to 767px | Hamburger, wordmark, Search icon, Bag icon/count | Menu contains Home, Shop, Men, Women, Technology, About, Search and Bag; black utility band contains only the demo notice |
| 768px and wider | Shop / Men / Women / Technology, centered wordmark, About / Search icon / Bag icon with live count | Destinations are visible directly in the header |

Journal remains outside this contract until its page destination is supplied.
The black utility band contains only the centered editable demo notice. Search
and Bag remain available in the sticky white header at all widths.

The 767px CSS boundary in `resources/css/app.css` and the 768px media query in
`store-layout.tsx` must move together if changed. Growing the viewport while the
mobile dialog is open closes it, unlocks background scrolling and focuses the
visible wordmark. Closing on a phone returns focus to Menu. Rotation back must
leave Menu usable. Keep the unrelated editorial breakpoint separate.

## Regression checks

Run from the existing Sail environment:

```bash
# Install browser test runtimes in the development container when absent.
docker compose exec -u root -e PLAYWRIGHT_BROWSERS_PATH=/opt/form-tech-browser laravel.test npx playwright install --with-deps chromium firefox webkit
docker compose exec -u sail laravel.test npm run test:responsive
```

The suite uses guarded disposable `form_tech_e2e` fixtures and does not reset the
working store. It checks Chromium, Firefox and WebKit at 19 widths from 320 to
1920px, including 766/767/768/769px and the 858px embedded-preview case. Assertions
cover visible destinations, actual control overlap, header bounds, horizontal
overflow, dialog keyboard access, focus restoration and rotation. Additional
touch/high-density phone/tablet and landscape contexts visit collections, search,
information, populated bag and checkout, checking navigation and synchronized bag
counts. Firefox uses touch/viewport emulation without unsupported `isMobile` mode.
The Chromium cases also run in the normal `npm run test:e2e` suite. Browser-engine
projects use independent guest sessions; catalog data and stock are not changed.

Screenshots are saved under `docs/screenshots/responsive-header-{engine}-{width}.png`
and `responsive-checkout-{engine}-{device}.jpg`. This is viewport/browser-engine
coverage, not a claim that every physical device or Safari/OS version was tested.
Run the suite after changing header typography, spacing, controls or breakpoints;
also inspect the actual user preview before declaring a reported visibility issue
fixed.

Homepage motion checks verify that scroll reveals run once, reduced-motion users
see static content, and a missing IntersectionObserver never hides content. Keep
the hook progressive: no pending/hidden SSR state or navigation dependency.

## Mobile readability follow-up — 2026-10-30

The compact header uses 14px Menu, 13px Bag and a centered 144–192px wordmark with 44px control heights. Hero calls to action use 13px text and at least 48px height; phones stack them. Collection captions use 15px and Shop 14px on phones. Shop filter inputs/selects use 16px with 48px height, labels and price From/To 14px, and Clear filters 15px. These changes stay within the existing mobile breakpoints.

At 640px and below, editorial copy sits above the original photograph. There is no pale overlay covering the model; the image retains its original lighting. Wider layouts retain the existing overlaid composition. Read-only computed-style and geometry checks cover 320, 390, 540, 640, 767, 768, 858 and 1440px. Reviewed screenshots: `mobile-readability-home-{390,1440}.jpg` and `mobile-readability-shop-390.jpg`.

## Mobile navigation and hero correction — 2026-10-30

This supersedes the earlier note that phones hide the utility links. Phones now keep a 12px demo announcement with Search and live Bag links on the right. The white header uses an accessible Menu button with a 28px SVG hamburger inside a 44px target, centered wordmark, 24px Search icon and bag icon/count. Each icon link has at least a 44px target; the dialog retains keyboard/focus/rotation behavior.

At <=640px, the hero uses a 4:3 right-aligned image frame preserving both models, followed by its dark copy panel and CTAs. Its responsive sizes account for the source width used by the crop (150vw), avoiding the former low-resolution landscape image stretched across a tall phone cover. Desktop composition stays unchanged. Editorial copy has an explicit first grid row above its unwashed image, with heading/body/link verified visible. Read-only checks covered 320/390/540/640/767/768/1440px at 2x density; screenshots `mobile-navigation-hero-{320,390,1440}.jpg`.

## Owner correction: text must overlay imagery — 2026-10-30

The owner rejected the split mobile layout. This supersedes the separate-copy instructions above: mobile hero and editorial must keep their headings, descriptions and CTAs over the original photos. Hero uses a responsive height and bottom gradient; editorial uses left-side contrast support fading before the model. Narrow phones adapt the CTA arrangement to keep the full copy within the photo. Preserve mobile hamburger and visible Search/Bag utilities. Actual cover dimensions determine responsive image sizes to avoid low-resolution images stretched across a tall crop.

## Remove duplicate utility links — 2026-10-30

Owner approved keeping Search/Bag only in the sticky white header at all widths. The black bar now contains only the centered demo notice. This supersedes the earlier addition of utility Search/Bag links. Mobile menu destinations remain available. The existing responsive suite asserts no links in the announcement, while cart tests use the visible header bag.
