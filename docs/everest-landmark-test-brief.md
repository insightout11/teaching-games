# Everest test: detail patch vs WebGL, plus clean labels (brief for Sol)

Written 26 October 2026 by Claude for Matt (the owner). **Dev pages only. No class-facing change.** Claude reviews your
work afterwards; report honestly, including what looks wrong.

## Why

Landmarks are core to LessonCaptain: in the first real class, the pyramids flyby and class selfie were a highlight.
Natural landmarks are the weak spot. On today's terrain (a 1 km grid from ~300 m Terrarium data, drawn into a 336 px
wide image) Everest reads as a soft snowy lump.

A previous pilot only reshaped the 1 km grid (summit formula in `sharpenTerrainSummits`). The owner could not see any
difference. **Do not iterate on height formulas.** The 1 km grid cannot hold anything smaller than about 2 km.

An offline experiment with **100 m real elevation, faceted, at display resolution** showed the real dark faces, Lhotse
and Nuptse with no hand-drawing. This test brings that into the live flight in two ways and compares them:

- **P (patch):** a small software renderer drawing a local 100 m mesh into the existing flight canvas, after
  `drawSurface`, depth-tested against today's terrain.
- **W (WebGL):** the same mesh drawn by the GPU on a layer over the canvas, same camera, sun and haze.

Both use the same baked data, so the comparison is fair.

## Worktree and gallery

Work in this exact worktree (detached HEAD at `5b22e16382d1`, with uncommitted gallery files and an earlier Everest
pilot in `terrain-landmarks.ts` and its test):

`C:\Users\insig\.codex\worktrees\landmark-route-gallery\teaching-games`

- Do not use `C:\Users\insig\Documents\teaching-games` or any other checkout. Do not switch branches or reset.
- Keep the gallery files. **Revert the earlier Everest pilot's summit formula** to what `5b22e163` has (the patch
  replaces it); keep its bearing fix idea for item 1 below.
- Dev server (if stopped), from the worktree:
  `node --env-file=C:/Users/insig/Documents/teaching-games/.env.local node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3102`
  Never print the env file. **Never install anything.**
- Gallery: `http://127.0.0.1:3102/dev/landmark-routes?landmark=everest&route=delhi--hong-kong&t=0.2363614&tod=day&minutes=50&clouds=0&date=2026-10-24`
  Wait for "Current route terrain ready" and 0 failed tiles. Use its Approach / Suggested view / Last in range
  controls and Copy view link. **Real game routes only**: never `/dev/coast-strip` routes or Kathmandu to Lhasa.
- Pyramids control: a Cairo route from the same gallery (`landmark=pyramids`), unchanged.

## Read first (only what is needed)

- `src/lib/live-room/terrain-surface.ts` (`loadSurfaceGrid`, `drawSurface`, `sampleHeight`, `surfacePoint`,
  `safeExaggeration`, `HEIGHT_UNITS`), `terrain-shading.ts` (`shadeSurfaceSample`), `terrain-landmarks.ts`.
- `src/components/live-room/flight/cockpit-world.tsx`: terrain size (`terrainWidth`), the surface upload and
  `drawImage`, `clipSurface` / `visibleOnSurface`, summit labels, photo chance.
- `src/components/live-room/flight/photo-moment.tsx` and `window-selfie.tsx` (how photos and selfies are composed).
- `src/components/live-room/flight/landmark-route-gallery.tsx`.

## The work (one step at a time; stop and report if a step fails)

1. **Local orientation fix.** Anything oriented geographically near a landmark must use the local direction of the
   route grid at that point (from `surfacePoint`), not the departure bearing (`bearingDeg(from, to)`). Add a test on
   Delhi to Hong Kong and Hong Kong to Delhi that fails with the departure bearing.
2. **Bake the patch.** About 24 x 24 km around Everest (catalogue `everest`, 27.9881, 86.925) at about 100 m, from
   Terrarium z12, saved as a small data file (Int16; a few hundred KB at most). Check: summit at least 8,700 m within
   150 m of the catalogue point; South Col and Lhotse saddle present.
3. **Shared mesh.** A ridge-preserving mesh in route coordinates with 2-3 distance levels. Snow from real metres above
   the snowline and real slope: steep faces stay dark rock, gullies hold snow, crests get a white rim, **the summit is
   clearly snowy**. Edge heights blend to `sampleHeight` over ~2 km: no cracks, no pedestal. One module for P and W.
4. **P renderer.** Draw into the flight canvas after the surface, depth-tested against `surfaceDepth`, same sun, fog
   and haze as `shadeSurfaceSample`. Punch the footprint out of the coarse surface.
5. **W renderer.** The same mesh on a WebGL layer over the canvas (plain WebGL unless three.js is already in
   `package.json`), same projection, light, haze and footprint hole. Photos and selfies must include it.
6. **Labels: readable live, absent from photos and selfies.**
   - Live: readable on bright sky, white snow and dark night terrain: bigger text, strong contrast, a restrained
     backing or outline, placed beside the summit (with a small leader line), never on top of it.
   - Photos and selfies: **no labels**, by a capture option or separate layer, not by toggling the live screen.
   - Photo-chance detection unchanged.
7. **Switch and compare.** In the gallery only: `?everest=off|patch|webgl`, and a side-by-side mode rendering all three
   at the same `t`, time of day and size. Show frame time for each (the existing `?profile=1` marks).

## Rules

- Do not change class defaults (`REAL_TERRAIN`, `REAL_COAST`, anything in the room). Everything new is behind the
  gallery switch, except the label fix, which may apply everywhere.
- Do not change global snow, lighting, camera, flight speed, terrain resolution, loaders or other landmarks.
- No installs, paid services, settings changes, staging, commits, pushes, PRs or deployments.
- Checks: `node node_modules/vitest/vitest.mjs run src/__tests__/lib/terrain-landmarks.test.ts src/__tests__/lib/terrain-surface.test.ts`
  plus your new tests; `node node_modules/typescript/bin/tsc --noEmit --incremental false` (the missing
  `@mozilla/readability` error is known: report it separately).
- Look at the rendered result in a visible browser window before claiming anything. Reload after changes so cached
  terrain does not hide the result.

## Report back

Save everything under `C:\Users\insig\Documents\Codex\_outputs\2026-10-26-everest-patch-vs-webgl`.

1. Files changed.
2. Screenshot grid: off / patch / webgl x Suggested view and Approach x Delhi to Hong Kong and Hong Kong to Delhi x day
   and dusk. Plus the pyramids control. Plus one composed photo and one selfie per renderer, showing no labels.
3. Frame time per renderer (median and 95th percentile) at 1280 and 1600 px wide with Everest on screen.
4. Patch data size and load time; WebGL start-up time.
5. What still looks wrong (seams, snow, stretching, flicker).
6. One paragraph: P, W, or stop. **Say "stop" if neither is clearly more recognisable than off**, in both directions.

Do not claim it works in a real class.

## After Sol (for Claude)

Claude reviews the diff, reruns the tests and checks the screenshots. Then a model with image input (not the builder)
gets the grid shuffled and unlabelled next to real Everest photos and says which is most recognisable and which looks
pasted on. Matt decides P, W or stop after a frame-rate check on his teaching laptop while sharing on Zoom.
