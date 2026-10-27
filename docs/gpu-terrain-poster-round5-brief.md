# GPU terrain round 5: match the target picture (brief for Terra)

Written 27 October 2026 by Claude for Matt (the owner). **Dev gallery only. No class-facing change.** Claude reviews.
Think carefully and plan before coding; this is an art-matching task, so look at the result after every change.

## The target

`C:\Users\insig\Documents\teaching-games\.claude\worktrees\lesson-captain-strategy-f5b782\docs\terrain-target\himalaya-poster-target.jpg`

A hand-drawn target of the Himalaya with Everest, in Matt's chosen look (vintage travel poster, dreamy, the same world
as the arrival scenes). Also live at `/dev/terrain-target` in that worktree (source:
`src/app/dev/terrain-target/page.tsx`, where the exact palette hex values are written). Your render will not be
identical (it is real terrain), but it should read the same way:

- **Three to four clear depth layers**: pale lavender far range, blue-violet mid range, darkest near ridges, with a
  sky-tinted haze band between each.
- **Each mountain is a few big faces**: a warm lit face (rose/peach), a blue-violet shaded face, snow in cream on the
  lit side and lavender in shade. Two or three light steps per face, not smooth gradients, not speckle.
- **Real ranges stay ranges**: many peaks with clear ridgelines, not dunes.
- **Everest is the crispest, largest shape**, in the **same palette and shading** as everything else, with a thin ridge
  line and a small wind plume.
- **Thin dark ridgelines** on the main ridges only. Soft valley mist. Warm sun glow.

## What round 4 got wrong (`docs/terrain-target/round4-draft.png`)

1. **Over-smoothed**: the surrounding Himalaya became smooth cream dunes. Smooth less: keep forms down to about
   **1.5-2 km** so peaks and ridgelines remain; drop only the small 200-500 m texture.
2. **Everest in a different style**: the detailed summit kept the old grey shading, so it looks like an island pasted
   on. Shade the detailed area with **exactly the same palette and banding** as the rest. Detail only adds sharper
   shape, never a different look.
3. **Flat cream snow field everywhere**: snow should follow the light (cream lit, lavender shade) and appear on upper
   slopes and ridges, with rock faces showing between, as in the target.
4. **No layer separation**: add the haze bands and flatten colour per depth step so far ranges become pale
   silhouettes.

## Do this, in order, checking each step against the target at the Everest day view

1. Palette and banding on all terrain (including the detailed summit).
2. Smoothing at 1.5-2 km, summit blend radius about 10-15 km with a gradual falloff.
3. Snow by light side and altitude; rock faces show.
4. Depth layers + haze bands.
5. Ridgelines, plume, valley mist.

Save a screenshot after each step (`step-1.png` ... `step-5.png`) next to the target, so progress is visible.

## Report

Save under `C:\Users\insig\Documents\Codex\_outputs\2026-10-28-gpu-terrain-poster-r5`:
1. The five step images, each side by side with the target.
2. If step 5 reads like the target: Everest dusk and night, Fuji (with reveal) and hills, each next to its arrival
   scene, as a phone package (`phone/` + `index.html`).
3. Frame time at 1600 px for the final poster.
4. Honest verdict per step.

**Stop rule:** if after step 2 it still looks grey or like dunes, stop and report with the images.

## Rules

Same worktree and rules as before (`C:\Users\insig\.codex\worktrees\landmark-route-gallery\teaching-games`, gallery
switch only, keep the earlier styles, no class defaults changed, no installs, no staging/commits/pushes, real routes
only). Do not claim it works in a real class.
