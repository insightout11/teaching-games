# Everest round 2: real GPU rendering and blending (brief for Sol)

Written 26 October 2026 by Claude for Matt (the owner). **Dev pages only. No class-facing change.** Claude reviews
afterwards; report honestly.

## Where round 1 left us

Round 1 (your report, 26 Oct) is good groundwork: the 100 m patch (`public/data/everest/heights.i16`, summit 8,740 m,
Lhotse and South Col correct), the local-orientation fix, readable labels kept out of photos and selfies, and the
`?everest=off|patch|webgl&compare=1&profile=1` gallery switches. Matt judged the **suggested day view a real
improvement** and wants to continue, if it blends in.

Two problems decide this round:

1. **W was not a GPU test.** `everest-webgl.ts` takes `prepareEverest` output every frame: projection and face shading
   on the CPU, `bufferData` of all vertices, a full `texImage2D` depth upload, `preserveDrawingBuffer: true`, then
   `drawImage(webgl.canvas)` into the 2D canvas. Measured 33-47 ms per frame against 13 ms off. That measures the CPU
   and the copies, not the GPU.
2. **The patch reads as an insert:** sharper and more etched than the soft terrain around it, snow and rock colours
   that do not match, striped dark faces.

**Drop P (the software renderer)** from the comparison: keep its code if it helps tests, but no more tuning or timing.

## Worktree and gallery (unchanged)

`C:\Users\insig\.codex\worktrees\landmark-route-gallery\teaching-games` (detached at `5b22e16382d1`; keep all
existing uncommitted work, including round 1). Dev server and gallery link as in round 1:
`http://127.0.0.1:3102/dev/landmark-routes?landmark=everest&route=delhi--hong-kong&t=0.2363614&tod=day&minutes=50&clouds=0&date=2026-10-24`
Real routes only. Never install anything; never print the env file.

## The work

1. **GPU-resident mesh.**
   - Upload the Everest mesh once per route (positions in route/world units, per-vertex normals or face data,
     material inputs: real metres, slope, curvature). `STATIC_DRAW`. Re-upload only when the route or patch changes.
   - Projection in the vertex shader from per-frame uniforms only (camera z/height, focal length, horizon, along
     scale, side scale, exaggeration, spread), matching `proj()` / `drawSurface` exactly.
   - Shading in the fragment shader: the same sun direction, Lambert terms, haze/fog and night colours as
     `shadeSurfaceSample`, and the snow rule from round 1.
   - Coarse terrain depth: upload the 336 px `surfaceDepth` as a small float or packed texture per frame (it is small)
     and test against it in the shader. No full-resolution depth upload.
   - No `preserveDrawingBuffer`. Composite the GL canvas into the flight canvas once per frame only if you measure
     it is cheap; otherwise layer it as a separate canvas between surface and overlays, and make photos and selfies
     draw it from the GL canvas at capture time (with `preserveDrawingBuffer` off, render then read in the same task).
   - Context loss: fall back to off cleanly (coarse terrain, no hole) and say so in the canvas dataset.
2. **Blend it in.**
   - Snow and rock colours sampled from the coarse terrain's own palette at the patch edge, so the patch starts from
     the same colours as its neighbours.
   - Detail fades with distance: full facets near, soft and closer to the coarse look in the far half of the patch
     and at its outer 3-4 km. No hard ring.
   - Soften the etched look: less contrast between neighbouring faces, gentler normals on small facets, no
     salt-and-pepper snow (filter the snow mask over neighbouring vertices).
   - Same haze curve as the surroundings at each distance, so it never looks closer or crisper than the hills
     beside it.
3. **Measure.** Hong Kong to Delhi, Suggested view, day, 180 warmed frames each, at exactly 1280 and 1600 px:
   off vs webgl, median and p95, using the existing profile marks. Also one 60-second moving pass with webgl on,
   reporting any frame over 33 ms. Also first-draw time after load.

## Stop rule

- **Go:** webgl adds **3 ms or less** per frame (median, at 1600 px) over off, AND at the Suggested day view it is
  clearly more recognisable than off in both directions AND does not read as pasted on.
- **Stop:** either condition fails. Say "stop" plainly if so.

## Rules

- Edit only the round-1 files (`everest-webgl.ts`, `everest-patch.ts`, `cockpit-world.tsx` behind the dev switch,
  `photo-moment.tsx`, `window-selfie.tsx`, the gallery files, tests). Do not change class defaults, global snow,
  lighting, camera, flight speed, terrain resolution, loaders or other landmarks.
- No installs, paid services, settings changes, staging, commits, pushes, PRs or deployments.
- Checks: the round-1 vitest files plus any new ones; `node node_modules/typescript/bin/tsc --noEmit --incremental false`
  (missing `@mozilla/readability` is known).
- Look at the rendered result in a visible browser window before claiming anything; reload after changes.

## Report back

Save under `C:\Users\insig\Documents\Codex\_outputs\2026-10-26-everest-round2`.

1. Files changed, and what moved from CPU to GPU.
2. Screenshot grid: off / webgl-round1 / webgl-round2 x Suggested view and Approach x both directions x day and dusk.
   Plus a close crop of the patch edge (day) to show the blend, a composed photo and a selfie (no labels).
3. The frame-time table and the moving-pass result.
4. What still looks wrong.
5. Go or stop, by the rule above.

Do not claim it works in a real class. After your report: Claude reviews the diff and screenshots, a separate model
does a blind recognisability check, then Matt checks it on his teaching laptop while sharing on Zoom.
