# Smooth coastlines in the flight view (brief for Codex)

Written 22 October 2026 by Claude. Real coastlines are switched OFF in classes (`REAL_COAST = false` in
`src/components/live-room/flight/ground-texture.ts`) because they look wrong. Your job: make them look right on the
preview page. Do not switch them on in classes; the owner decides that after seeing your screenshots.

## How the flight view works (read first)

- `src/components/live-room/flight/cockpit-world.tsx` draws the ground on a canvas, row by row, from the horizon down.
  Each row is a depth `z`; `paintRow(layer, y, z, F, camZ, alpha, withMacro, patch, xr)` fills a row (or a span `xr`
  of it) with a terrain texture. Projection: a world point `(x, z)` appears at screen
  `x = w/2 + x * F / (z - camZ)`, `y = horizonY + camH * F / (z - camZ)`.
- The coastline for a whole flight comes from `src/lib/live-room/coast-strip.ts` (`coastStrip()`): land outlines in
  route coordinates (km along the route, km to the side), plus a grid `ground` saying what the land is (farmland,
  desert, mountains...), read with `groundAt()`.
- In `cockpit-world.tsx` the effect `useEffect(... [coastStrip ...])` turns the strip into world units
  (`buildCoast`, `coastWorld.current`: edges filed in depth buckets, land rings, beach lines with `real` flags). The
  row loop (search `const cz = cw?.route`) finds where each row crosses the land outlines and paints sea, then land
  spans. `routeUnits()` / `routeNowU` / `spreadRef` give the plane's place on the route in world units.
- Preview page: `/dev/coast-strip` (`src/components/live-room/flight/coast-strip-gallery.tsx`). It has routes
  (Manila to Hanoi, Tokyo to Seoul, Athens to Rome, Cairo to Rome), a slider for the place on the route, a Fly button
  and `?tod=dusk`. It turns `REAL_COAST` on for itself only.

## What is wrong (from the owner's screenshots in class)

1. **Stair-stepped, shimmering edges.** Land is filled row by row, so the coast edge is made of steps that crawl and
   shimmer as the land moves.
2. **Patchy land colour.** Each land span takes its texture from the nearest `ground` grid cell (30 km x 70 km), so
   colour changes in visible blocks.
3. **Hard golden stripes on the horizon** for distant land at sunset (partly fixed with a fade, `farLand`).

## The work

1. **Smooth coast edges.**
   - Draw land as real shapes, not spans: for each land ring in view, project its points (clip to the near plane and
     the view) into one canvas path, and fill it with the land texture over the sea.
   - The edge must be a clean, still curve as it moves.
   - Keep the sea texture underneath as now.
   - Keep it fast: only rings in view; reuse the depth buckets or a simple view-box test.
   - It must hold 50+ fps on an ordinary laptop at 1280x800 on the preview page.
2. **Smooth land colour.**
   - Blend between land kinds instead of switching in blocks. For example, paint the dominant kind per ring, and soften
     transitions with the existing patchy soft-edge approach (`softEdges`, `paintRow` patch) over a wide band.
   - No visible rectangles.
3. **Beaches and shallows** on the new smooth edge: a thin sand line and a soft lighter shallow band in the sea, only
   where land meets sea, never floating in open water. Distant coast fades into the haze; there are no hard stripes at
   the horizon.
4. **Nothing else changes.**
   - Not the scenery speed.
   - Not the one-clock camera (`routeBase`/`routeNowU`/`spreadRef`).
   - Not landmarks, mountains, clouds or the room.
   - `REAL_COAST` stays `false`.
   - Mountains and hills must still stand only on land (`landAt` checks), and town lights only on land.

## Rules

- Branch `codex/coast-smooth` from `origin/main`. Make one local commit per numbered item, with the message starting
  `Coast smooth N:`. No push, no merge. Stage only the files you changed, never `git add -A`.
- Edit only:
  - `src/components/live-room/flight/cockpit-world.tsx`;
  - `src/lib/live-room/coast-strip.ts`;
  - `src/components/live-room/flight/coast-strip-gallery.tsx`;
  - tests in `src/__tests__/lib/`.
- Before each commit, run all three checks:
  - `npx tsc --noEmit -p .` (the only allowed error is `src/lib/sources/extractor.ts` missing `@mozilla/readability`);
  - `pnpm next lint --file <each changed file>`;
  - `pnpm test` (the only allowed failing file is `src/__tests__/sources/source-extractor.test.ts`).
- **Never** run `pnpm install`.
- Check your work on `/dev/coast-strip` in a real browser (the dev server on port 3100), with the window visible:
  canvases do not draw in hidden windows.

## Report back

- The commits and files changed.
- Screenshots from `/dev/coast-strip` at day and dusk:
  - Cairo to Rome at 0.15, 0.30 and 0.90 of the route;
  - Manila to Hanoi at 0.02 and 0.90;
  - Athens to Rome at 0.5.
- The fps you measured while flying (Fly, 1 min).
- Anything you could not do, and anything still visibly wrong.

Do not claim it works in a real class.
