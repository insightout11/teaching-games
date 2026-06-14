# Arrival Scene — Wide-Canvas Bleed (ultrawide fix, NOT a redraw) — v2

Owner decision (Jun 2026): the city scenes look right on a normal 16:9 window with
the current `slice` fill (7c4667f). The remaining problem is ONLY ultrawide/very-wide
windows, where width-driven `slice` upscales the buildings. Do NOT redraw skylines
smaller — that would empty out the common 16:9 case. Fix the aspect-ratio robustness
with side bleed.

v2 incorporates the implementing agent's code review (correct on all counts): the
original "no layer changes" claim was false — focal layers key their width off
`VIEWBOX.w`, so the constant must be split and the layers tiered.

## The approach (safe-area technique)

Today: one shared `viewBox="0 0 1600 900"` (16:9) with `preserveAspectRatio="xMidYMax
slice"` (`destination-arrival-scene.tsx`, `VIEWBOX` in `./types.ts`). On a window
wider than 16:9, scale is width-driven → buildings upscale.

Target: canvas ~`0 0 2880 900` (32:9; covers windows to ~3.2:1 — beyond that the
residual slice upscale is negligible). Keep `xMidYMax slice` + bottom anchoring. On
wide windows scale becomes height-anchored (buildings render at exact 16:9 size); at
16:9 the side bleed crops symmetrically → pixel-identical to today.

## Constant split (the part the original plan got wrong)

Focal layers currently derive their internal width from `VIEWBOX.w`
(`skyline-layer.tsx:48` building distribution loop, `terrain-layer` path spans,
`vegetation-layer.tsx:16-17`, `runway-layer.tsx:37-44`, `landmark-layer.tsx:17`
`anchorX * VIEWBOX.w`, `atmosphere-layer`). If `VIEWBOX.w` simply becomes 2880, the
skyline redistributes across 0–2880 and 16:9 shows the middle slice of a DIFFERENT
layout — breaking the pixel-identical guarantee.

So: introduce `CONTENT_W = 1600` alongside the widened `VIEWBOX.w = 2880`
(`BLEED_X = (VIEWBOX.w - CONTENT_W) / 2 = 640`). Mechanical edit across the ~6 focal
layer files: their internal width references switch `VIEWBOX.w → CONTENT_W`. Small
but real layer work — verify each file's usages individually, don't bulk
find-replace blind (atmosphere is NOT focal, see tiers).

## Tiered layering (not one translate wrapper for everything)

1. **Full-canvas (2880): atmosphere/sky.** Sky gradient, sun/moon, stars, clouds
   fill the whole canvas — never translated/confined (a 1600-wide sky box inside a
   2880 canvas would be visibly boxed in the gallery). In live composites it's
   skipped anyway via `transparentSky` (note: that's the prop name — the original
   plan said `skipSky`, wrong).
2. **Full-width ground bands (the bleed):** flat tarmac + grass color bands extend
   across the full 2880. `runway-layer` already over-draws to `VIEWBOX.w + 400` —
   lean on that existing overdraw rather than inventing a parallel mechanism.
3. **Focal content in the central 1600, wrapped in `translate(640,0)`:** skyline
   buildings, landmarks, vegetation, terrain hill/dune SILHOUETTES, runway
   markings' anchor geometry, plane. Trap called out in review: **terrain is
   split** — its flat color bands belong to tier 2 (bleed full-width) while its
   hill/dune silhouette is focal tier 3. Don't make terrain all-or-nothing.
   The plane layer needs no internal edit (uses `LAYOUT.runwayY` + literal cx) —
   translate wrapper only.

## Bleed design decisions (resolved — don't reopen)

On a ~2.7:1 window the bleed is ~20% of width and fully visible. It is real design
work, not "cheap bands":

- **Seams:** ground-band continuations must match the focal runway/grass in Y and in
  palette-derived color exactly (derive from `LAYOUT` + the same palette tokens —
  no hardcoded colors; must track `timeOfDay`/palette).
- **Runway markings: continue them full-width.** Centerline dashes + edge lights run
  across the bleed like the generic `SidewaysRunway` does — a runway that turns into
  bare tarmac at an invisible x=2240 boundary reads as a rendering bug. Markings are
  cheap repeating geometry; extend the pattern, keep the plane's taxi/park positions
  inside the focal zone.
- **Margin skyline: REQUIRED, not optional.** Sparse, low, very-low-contrast distant
  silhouettes in both margins. Flat ground + empty side sky reads as "city floating
  on bare shoulders" — the island look this plan exists to kill. Use the seeded LCG
  (per destinationId) so margins are deterministic per city; keep them well below
  the focal skyline's height and contrast so they read as distance, not content.

## Consumers checklist

- Live flight transition + `WorldFlightArrivalBackdrop` (in-session ground + ended
  screen): verify composites still align (they use `transparentSky` + slice).
- `/dev/arrival-scene` + `/dev/arrival-gallery`: gallery renders many scenes with
  built-in sky — confirm full-canvas sky (tier 1) looks right there.
- **Marketing `WorldFlightSection` (`aspect-[16/7]` container): WILL change
  visibly** — it currently width-drives (buildings zoomed); after this it
  height-anchors (buildings smaller + visible bleed). Fix: change that container to
  `aspect-video` (16:9) so it frames exactly the focal zone, and re-screenshot it.

## Verification

Screenshots at three widths — ~16:9 (must be pixel-identical to the approved current
look), ~21:9, and ~32:9 (buildings must NOT grow vs 16:9) — plus the gallery and the
marketing section. tsc + lint + existing arrival-scene tests.

## Separately (already agreed)

Fix the apostrophes in the owner's uncommitted `destinations.ts` new-city entries
(escape `'` or switch to double quotes), run `npx tsc --noEmit` to confirm the whole
file parses, and leave it uncommitted for the owner to land with the rest.
