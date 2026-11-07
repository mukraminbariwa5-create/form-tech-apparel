# Men and Women collection edits

Approved 2026-11-05. The original 24 products use shared sizing. The subsequently approved six-product women’s capsule adds distinct designs and capsule-specific illustrative measurements. Men and Women remain separate curated edits, with selected essentials shared between them.

| Collection | Apparel emphasis | Total products |
| --- | --- | --- |
| Men | AeroShell/Ridge/Traverse/Axis outerwear; Vector/Meridian/Summit/Interval trousers and shorts; Grid/Core/Flux/Thermal layers | 18 |
| Women | Six new capsule designs first, followed by Strata/Horizon, Contour/Drift, Transit/Altitude/Core/Grid and shared accessories | 20 |

Eight essentials are shared: Core Technical Tee, Grid Fleece Midlayer, Module Sling Bag, Transit Daypack, Circuit Cap, Fold Beanie, Utility Belt and Field Pouch. The union of both collections is now 30 products. Primary categories and New Arrivals retain existing associations and receive the relevant new capsule pieces. The skirt is in the Women’s Capsule collection, not misclassified as pants.

The two collection pages default to **Collection edit**, which leads with their distinct garments and places shared accessories afterwards. Newest, price and name sorts remain available. Other collections and the unfiltered shop keep their existing default. The descriptions distinguish capsule measurements from shared-product sizing and direct visitors to each product’s guide. See [the women’s capsule notes](WOMENS_CAPSULE.md).

## Source and existing-store update

`database/seeders/data/collection-edits.json` defines the default memberships, descriptions and order. Fresh-store seeding reads it. An existing initialized store is never reseeded to apply this change.

The explicit one-time helper is:

```bash
docker compose exec -u sail laravel.test php scripts/curate-storefront-collections.php --apply
```

Without `--apply`, the script only prints the definitions. Before applying, it saves original collection IDs, descriptions and product associations under ignored `.setup/collection-curation-before-2026-11-05.json`, retaining that original snapshot on subsequent runs.

Only Men/Women memberships of products with known original slugs are changed. Custom/renamed products, unrelated collections, variant stock, prices, images, SKUs and orders are preserved. Only the original default collection descriptions are replaced; staff-written descriptions remain. Running the helper again intentionally reapplies the defined curation to known products, so do not run it as routine startup after staff merchandising changes.

The initial curation changed identical 24-product collections to 18/14. The subsequent six-product capsule increased Women to 20 while Men remains 18. The initial curation helper does not install the new capsule; use its explicit additive helper documented in WOMENS_CAPSULE.md. Video remains deferred.
