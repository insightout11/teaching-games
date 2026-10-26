# WebGL terrain band test (brief for Sol)

Written 26 October 2026 by Claude for Matt (the owner). **Dev pages only. No class-facing change.** Claude reviews
afterwards; report honestly.

## Why

Two Everest rounds showed the real problem: a single 100 m patch in a 1 km world either looks pasted on (round 1) or,
once blended, looks like the rest (round 2). The fix Matt wants tested: **detail everywhere near the plane**, so
Everest is sharp because the whole Himalaya near it is sharp. Round 2 showed the GPU can draw a 58k-triangle shaded
mesh for about 2-3 ms; today's CPU surface (`drawSurface`, 336 px wide) costs 13-19 ms per frame. A GPU terrain might
be both sharper and cheaper. This test answers whether it is.

Three questions, nothing else:
1. Is Everest recognisable **without** looking pasted on, because everything around it is equally detailed?
2. Frame time compared with today's terrain (the same machine, the same view, the same run).
3. How long the extra elevation data takes to load.

## Worktree and gallery

`C:\Users\insig\.codex\worktrees\landmark-route-gallery\teaching-games` (detached at `5b22e16382d1`). Keep all existing
uncommitted work, including the Everest rounds (they are the reference, not the base). Dev server and gallery as before:
`http://127.0.0.1:3102/dev/landmark-routes?landmark=everest&route=delhi--hong-kong&t=0.2363614&tod=day&minutes=50&clouds=0&date=2026-10-24`
Real routes only. Never install anything; never print the env file.

## Scope: a terrain band, not a full renderer

- **New mode** `?terrain=gpu` in the gallery only. Off by default everywhere.
- **What it draws:** the ground surface of the route band around the plane (same band the current surface covers:
  about 160 km either side, 40 km behind, 200 km ahead), as one GPU heightfield.
- **Detail by distance (LOD):** about 200-250 m near the plane (first ~40 km), stepping down to the current 1 km
  further out. Use whatever scheme you judge best (nested grids, chunked LOD, geomorphing); say why. No visible popping
  or cracks between levels.
- **Elevation data:** Terrarium tiles at a higher zoom for the near band (z11-z12 near, the current z9 far), loaded
  progressively along the route: sharp near the plane first, with the coarse surface shown until a chunk is ready.
  Reuse the existing tile cache and loader pattern; no new external service.
- **Look:** match today's terrain materials as closely as practical: land kinds and snow from the existing material and
  snowline data, the same sun direction, Lambert shading, haze/fog curves and time-of-day palette. Snow by real metres
  and real slope at the new resolution (steep faces stay dark rock). Do not tune for Everest only: the same rules
  everywhere.
- **Camera:** the existing flight camera, route spread, exaggeration and clearance, through uniforms. The view must
  line up with today's surface at the same `t`, so switching `terrain=gpu` on and off shows the same mountains.
- **Not in scope:** coast/sea, towns, clouds, events, landmark art, labels, photos. Keep drawing them as today on top
  (they may clip imperfectly; note where). The Everest patch code is not used in this mode.

## Measure

Hong Kong to Delhi and Delhi to Hong Kong, Suggested view, day, plus dusk:

1. **Frame time, same run, same machine:** today's surface vs `terrain=gpu`, 180 warmed frames each at exactly 1280 and
   1600 px, median and p95, using the existing profile marks. Report what the CPU still does per frame in GPU mode.
2. **Moving pass, both modes:** 60 s at 1600 px for **each** mode (today's and GPU), frames over 33 ms and the worst
   frame, so the two can be compared.
3. **Loading:** time and bytes for the near-band tiles for the whole Delhi to Hong Kong route; time until the band
   around the plane is sharp after take-off and after a seek.
4. **Memory:** GPU buffer and texture sizes.

## Rules

- Edit only: new files under `src/lib/live-room/` for the GPU terrain, `cockpit-world.tsx` behind the gallery switch,
  the gallery files, tests in `src/__tests__/lib/`. Do not change class defaults, the current surface code paths,
  loaders used by classes, or other routes' behaviour.
- No installs (plain WebGL, or three.js only if already in `package.json`), paid services, settings changes, staging,
  commits, pushes, PRs or deployments.
- Checks: your new tests plus the round-1/2 suites; `node node_modules/typescript/bin/tsc --noEmit --incremental false`
  (missing `@mozilla/readability` is known).
- Look at the rendered result in a visible browser window before claiming anything; reload after changes.

## Report back

Save under `C:\Users\insig\Documents\Codex\_outputs\2026-10-26-webgl-terrain-band`.

1. Files changed; the LOD and data approach and why.
2. Screenshot grid: today / round-1 patch / GPU band x Suggested and Approach x both directions x day and dusk. Plus one
   close crop of Everest's surroundings (no patch edge should exist) and one wide view of a non-Everest stretch (plains
   or hills) to show the GPU look holds elsewhere.
3. The frame-time table, both moving passes, loading and memory numbers.
4. What still looks wrong.
5. One paragraph answering the three questions plainly, and whether a full move to GPU terrain looks worth planning.

Do not claim it works in a real class. After your report: Claude reviews the diff and screenshots, a separate model
does a blind recognisability check, then Matt checks it on his teaching laptop while sharing on Zoom.
