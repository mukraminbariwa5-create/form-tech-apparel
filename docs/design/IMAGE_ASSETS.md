# FORM/TECH image assets

Updated: 2026-10-29. Scope is defined by the project build specification, version 3.1.

## Visual reference

- File: `docs/design/form-tech-ui-reference.png`
- Source: screenshot supplied by the owner in chat on 2026-10-29.
- Role: visual direction only; do not publish the screenshot as a site asset or extract its embedded photography.

## Generated hero

- File: `public/images/campaign/form-tech-concrete-hero.png`
- Method: built-in imagegen tool, using the supplied screenshot as a style/composition reference.
- Status: generated source image, visually reviewed in chat; two models at right, silver/charcoal shells, concrete negative space at left. Responsive conversion, overlay contrast, cropping and browser verification remain pending.
- Image is fictional campaign imagery, not evidence of real garment performance or manufacturing.

### Final generation prompt

Use case: photorealistic-natural. Asset type: wide landscape website campaign hero photograph for fictional premium technical-apparel store FORM/TECH. Input image 1 is a visual style/composition reference ONLY; create a new original photograph, not a screenshot or website mockup. Scene: monumental angular raw-concrete brutalist architecture, intersecting walls and cool daylight. Two adult fashion models on the right two-thirds, an Asian woman wearing a light silver technical hooded shell and a man wearing a charcoal-black high-collar technical jacket, wind subtly moving her dark hair. Low-angle editorial fashion photography, realistic faces, premium nylon fabric with visible seams and zipper details. Muted silver/grey/charcoal palette. Leave left third as subdued concrete negative space for white HTML headline overlay. Wide landscape composition, sharp detailed garments, natural skin texture, restrained cinematic light. No lettering, typography, logos, watermarks, UI, buttons, borders, collage, or embedded marketing copy. Match the reference's calm architectural technical-fashion mood.

## Remaining assets

- Three collection images: technical jacket portrait, cargo-pant detail and light layering portrait.
- One editorial landscape showing mountain/concrete architecture and technical apparel.
- Twenty-four distinct primary catalog photos corresponding to the exact seed products in section 9 of the plan.
- Secondary product views only where useful and visually consistent with the actual seeded garment.

Update 2026-10-29: all 24 distinct primary catalog images are generated, saved under `public/images/products/`, and visually reviewed for whole-product framing, matching colors and consistent studio styling. Exact final prompts and paths are recorded in `catalog-generation.json`; method: built-in imagegen. The three collection images and mountain editorial banner are also generated, saved and visually reviewed; see `campaign-generation.json` for exact paths/prompts. Responsive derivatives, final page crops and browser checks are complete locally. Secondary product views have not been generated; do not imply extra gallery angles exist. The gallery supports additional approved images through staff image association, and its keyboard/thumbnail behavior is component-tested with synthetic fixtures.

## Responsive delivery

Original source PNGs are preserved. `scripts/optimize-images.mjs` creates WebP derivatives (320/640/960/1440/1920px where source dimensions permit, plus native width), records actual dimensions in `resources/js/image-manifest.json`, and never enlarges a source. The storefront supplies responsive sizes, intrinsic dimensions, appropriate lazy loading and a high-priority hero. All current derivatives together occupy about 8.16 MB for 65 source images. These are delivery optimizations of the recorded original generated assets, not additional product imagery.

## Approved alternate colors — 2026-10-30

The owner explicitly requested additional colors on all 24 products so the dots work as selectors. Added 24 color edits using the built-in imagegen tool, preserving the original construction, studio framing and original assets. Exact final prompts, source paths and output paths are recorded in `colorway-generation.json`. All edits were visually reviewed, including a corrected uniform Stone Summit Utility Pant. Each image is bound to its actual database color; these are alternate colors, not extra camera angles. Responsive derivatives are generated from all 53 sources.


## Women’s capsule — 2026-11-05

Six new designs have twelve generated catalog photographs: one base and one alternate color per item. Built-in imagegen was used for all six product-mockup bases and six precise color edits. All outputs were visually reviewed for shape, matching construction, color and studio consistency, copied into public/images/products/, and converted to responsive WebP sources. Exact prompts, generated source paths, references and final saved paths are recorded in womens-capsule-generation.json. Existing photographs were preserved. These are fictional garments and alternate colors, not claims about real manufactured products or extra gallery angles.
