# GPU terrain: style tests and sharp signature landmarks (brief for Sol)

Written 26 October 2026 by Claude for Matt (the owner). **Dev pages only. No class-facing change.** Claude reviews
afterwards; report honestly.

## Where we are

Your GPU terrain band test was a clear win: 1.2-2.3 ms CPU per frame against 9.7-13.9 ms today, no frames over 33 ms
in the moving pass, and no pasted-on patch because the surroundings share the detail. Matt opened it and found it far
smoother. Two open questions before planning the full move:

1. **Style.** The current GPU look is harsh and busy (strong rock/snow contrast, relief-map feel). Matt wants to choose
   between styles from side-by-side images before deciding.
2. **Landmarks must always look distinct.** Everest is now one sharp peak among many. Signature landmarks need extra
   local detail and emphasis inside the same terrain, so they stand out without looking like inserts.

## Worktree and gallery (unchanged)

`C:\Users\insig\.codex\worktrees\landmark-route-gallery\teaching-games` (detached at `5b22e16382d1`; keep all existing
uncommitted work: the gallery, both Everest rounds, the GPU band). Dev server and gallery as before, with
`&terrain=gpu`. Real routes only. Never install anything; never print the env file.

Routes (all real, from the route-rarity data):
- **Everest:** Delhi to Hong Kong and Hong Kong to Delhi (Suggested view and Approach).
- **Fuji:** Seoul to Tokyo and Tokyo to Shanghai.
- **Matterhorn:** Paris to Rome and Rome to Paris.
- **A non-mountain stretch:** Delhi to Hong Kong at t = 0.5 (the hills), to check each style holds on ordinary land.

## Part A: styles (one switch, same views)

Add `&terrainStyle=` with six looks, all on the same GPU terrain and data, changing only shading and materials:

1. **painted** - closest to today's class look: soft light, gentle contrast, painted land colours, soft snow edges,
   stronger haze with distance. The "it still looks like LessonCaptain" option.
2. **natural** - realistic but calm: moderate contrast, believable rock/snow split by slope, land colours from the
   existing material data, atmospheric haze like a real flight photo.
3. **crisp** - today's GPU test look, kept as the reference (sharp, high contrast).
4. **golden** - natural, but tuned for warm, flattering light (soft shadows, warm snow), as the "photo moment" option.
   Day and dusk must both work.

5. **arrival** - matches the 50 city arrival scenes (`src/components/world-flight/arrival-scene/`, gallery at
   `/dev/arrival-gallery`). Those scenes are layered, flat-colour illustrations driven by `composeTimedPalette` (the
   cockpit already receives the same palette). Take the terrain's colours from that palette: sky-tinted haze, land and
   rock tones from it, light in a few soft bands (stepped, like layered paper) rather than smooth photographic
   shading, distance as separate paler layers. Goal: cutting from the cockpit to an arrival scene feels like the same
   world.
6. **dreamy** - Matt's original intention for LessonCaptain: soft, atmospheric, a little dreamlike. Strong aerial
   perspective (distance fades into the sky colour quickly), soft edges, gentle bloom on bright snow and sunlit
   slopes, pastel light, low contrast in the distance and only modest contrast up close, a hint of mist in valleys.
   Landmarks still readable. Combine with the arrival palette where it helps.

Matt's direction (26 Oct): LessonCaptain should be **dreamy, soft and very atmospheric** overall, with one art
direction across the cockpit, the arrival scenes and the rest. Styles 5 and 6 are the main candidates; 1-4 are for
comparison. Matt has since decided: **illustrated travel poster, not photographic**, and **night is dreamy blue and soft**
(deep blue, gentle moonlight, warm town lights, never black). Add a night row to the style grid for styles 5 and 6. Read `docs/art-direction.md` first.

Same rules everywhere (no Everest-only tuning). Snow stays based on real metres and slope. Keep the existing sun
direction, time-of-day palette and haze curves as the base; styles adjust them.

## Part B: signature landmark detail (inside the same terrain)

For Everest, Fuji and the Matterhorn (catalogue ids `everest`, `fuji`, `matterhorn`):

- **Finer local data:** within about 12 km of each summit, higher-resolution elevation (Terrarium z12 or finer where
  available; reuse your round-1 bake approach if useful) feeding the same GPU terrain as an extra detail level. It must
  blend into the 250 m band with no ring, crack or style change.
- **Emphasis, restrained:** a small summit lift and sharpening that keeps the real shape (no cones), a clean snow cap
  and crest rim, slightly lower haze on the landmark so it reads clearly against its neighbours. Real coordinates and
  photo identity unchanged.
- **Switch:** `&landmarkDetail=on|off` so the effect can be compared directly.
- A small data budget: report the bytes per landmark.

## Part C: bank and turn (camera test)

Add roll (bank) and heading (turn) to the GPU terrain camera, gallery only:

- `&bank=reveal`: approaching the selected landmark, the plane banks gently (about 10-20 degrees) and turns a few
  degrees toward it so it slides toward the centre of the view, holds, then levels out and turns back onto the route.
  The plane's position stays on its real route; only the view's roll and heading change.
- `&bank=landing`: the final approach as a turn onto the runway: a slow banked turn that sweeps the destination's
  surroundings across the view (for Cairo this is where the pyramids would be seen), then levels for touchdown.
- Smooth and calm (ease in and out over several seconds), per `docs/art-direction.md`. Existing overlays (clouds,
  labels, towns) may not follow the turn yet; note what breaks.
- Report a short screen recording or a strip of 6 frames for each, plus frame times while banking.

## Measure

- Frame time (CPU median and p95, 180 warmed frames) at 1600 px for each style with landmark detail on, plus today's
  CPU surface as the baseline, in the same run.
- One 60 s moving pass past Everest with the chosen-for-review style (your pick) and landmark detail on.
- Load time for the landmark detail data.

## Rules

- Edit only the GPU terrain files, `cockpit-world.tsx` behind the gallery switches, the gallery files and tests. Do not
  change class defaults, the class CPU surface path or class loaders.
- No installs, paid services, settings changes, staging, commits, pushes, PRs or deployments.
- Checks: your tests plus the earlier suites; `node node_modules/typescript/bin/tsc --noEmit --incremental false`
  (missing `@mozilla/readability` is known).
- Look at the rendered result in a visible browser window before claiming anything.

## Report back

Save under `C:\Users\insig\Documents\Codex\_outputs\2026-10-27-gpu-terrain-styles`.

1. Files changed.
2. **Style grid:** 6 styles x (Everest Suggested day, Everest Suggested dusk, Fuji, Matterhorn, the hills stretch), with
   landmark detail on. One clearly labelled column per style, so Matt can pick. Add one row pairing each style with
   the arrival scene of the route's destination (Hong Kong, Tokyo, Rome) side by side, to show whether they feel like
   one world.
3. **Landmark grid:** Everest, Fuji, Matterhorn x landmark detail off / on, in a **dreamy + arrival** style (arrival palette and paper layers with dreamy haze; Matt's choice, 27 Oct: prove landmarks look good in it), Suggested view and
   Approach, day.
4. Unlabelled copies of the Everest, Fuji and Matterhorn "detail on" images for the blind check.
5. Frame times, moving pass, data sizes and load times.
6. What still looks wrong, and your honest view of which style works best and why.
7. **A phone-friendly comparison package for Matt** (he reviews on his phone):
   - One folder `phone/` with **one image per scene**, portrait-friendly: the six styles stacked vertically
     (one per row, full width, about 1080 px wide), each row labelled in large text (style name, 40 px or bigger).
     Scenes: Everest day, Everest dusk, Everest night, Fuji, Matterhorn, the hills, and the arrival pairing.
   - Also one **single-scene swipe set**: `phone/everest-day-1-painted.jpg`, `-2-natural.jpg` and so on, so the same
     view can be flipped through image by image.
   - A `phone/index.html` that works offline on a phone: one scene per screen, swipe or tap left/right to change style,
     the style name always visible, big tap targets, no tiny thumbnails.
   - JPEG at good quality, each image under 1 MB.

Do not claim it works in a real class. After your report: Claude reviews, a separate model does a blind
recognisability check, then Matt picks a style.
