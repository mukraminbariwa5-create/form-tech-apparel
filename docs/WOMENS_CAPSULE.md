# Women’s capsule — 2026-11-05

Owner-approved extension: six genuinely new designs, each with two color images and XS/S/M/L/XL variants. This adds 6 products, 12 product photographs and 60 variants without replacing the original 24 products.

| Design | Colors | Sample USD price |
| --- | --- | --- |
| Halo Cropped Shell | Silver / Charcoal | $248 |
| Linea Longline Vest | Stone / Black | $188 |
| Arc Utility Skirt | Charcoal / Olive | $158 |
| Forma Wide-Leg Trouser | Stone / Black | $178 |
| Nexa Contour Top | Black / Cobalt | $88 |
| Veil Wrap Overshirt | White / Slate | $168 |

Catalog totals are now 30 products, 218 variants and 60 product photographs. Women has 20 products; Men remains 18. The new six lead Women’s Collection edit ordering and also appear at `/collections/womens-capsule` and New Arrivals. Their appropriate primary categories are added as well; the skirt is not placed in Tech Pants. The homepage’s four featured products remain unchanged.

## Measurements and images

Capsule tops use illustrative body chest ranges; the skirt/trousers use illustrative body waist ranges. These are separate from shared-product sizing and explicitly identified as sample data rather than a real fit guarantee. Unit conversion and selected-size highlighting use the existing size-guide component.

All twelve original PNGs are saved in `public/images/products/` with names such as `halo-cropped-shell-silver.png` and `halo-cropped-shell-charcoal.png`. Responsive WebP derivatives live under `public/images/responsive/products/`; actual dimensions and sources are in `resources/js/image-manifest.json`.

All imagery was generated using built-in ImageGen, inspected visually and saved non-destructively. Exact final prompts, generated paths, edit references and saved target paths are in [the asset provenance record](design/womens-capsule-generation.json). The alternate images recolor the same garment construction. No logos, actual manufacturer specifications or tested performance claims were added.

## Existing-store application

```bash
docker compose exec -u sail laravel.test php scripts/add-womens-capsule.php
```

This validates every source asset before a transaction. It adds only missing capsule products, with new variants/images and associations created only for newly added products. Existing names, activity, prices, SKUs, stock, images and collection choices are not reset. Renamed capsule items are recognized by their known SKU family or source-image association; conflicting existing slugs cause the transaction to fail rather than overwrite data. Original default Women copy is upgraded; custom staff descriptions are preserved.

Fresh-store seeding includes the capsule. Never reset/reseed an existing store to install it. A repeat of the helper on the working store reported zero products, variants, images, collections or descriptions changed.

No real payment, shipping, account, analytics or external service was introduced. Video and public deployment remain deferred. Current verification evidence is recorded in `IMPLEMENTATION_STATUS.md`.

Cross-browser testing also exposed shared counters in the existing numeric throttle middleware. Search suggestions, recent catalog reads, contact submissions and demo checkout now use distinct counter prefixes with their original limits unchanged (120/120/5/20 requests per minute). A regression check confirms that 25 catalog reads leave checkout/contact available and that checkout still rejects its 21st request.
