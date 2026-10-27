# GPU terrain round 4: make it look like the arrival scenes (brief for Terra)

Written 27 October 2026 by Claude for Matt (the owner). **Dev gallery only. No class-facing change.** Claude reviews.

## Where round 3 left us

Your poster draft (`docs/terrain-target/round3-poster-draft.png` in the repo worktree below) has slightly flatter slopes
but still reads as **dense grey realistic relief**. Matt's direction (`docs/art-direction.md`): an **illustrated vintage
travel poster**, dreamy and soft, the **same world as the arrival scenes**.

**The target is the art we already have.** Open these and match their feel:
`C:\Users\insig\Documents\teaching-games\.claude\worktrees\lesson-captain-strategy-f5b782\docs\terrain-target\`
- `arrival-tokyo-dawn.jpg`, `arrival-paris-full.jpg`, `arrival-tokyo-night.jpg`: the arrival scenes. Note: **few,
  large, simple shapes**; flat colours; distance as paler flat layers; warm light; coloured (never grey) shadows;
  soft haze bands; night in deep soft blue.

## Why shading alone failed, and what to change

The heightfield has thousands of small ridges. Shading them in bands still looks busy and grey. A poster needs
**simpler shapes first**, then flat colour.

1. **Simplify the land (the key step).** In `poster` style, render a **smoothed heightfield**: a strong low-pass
   (keep forms larger than roughly 5-8 km; remove small ridges and gullies), so a range reads as a few big masses and
   clear ridgelines. Keep real geography (positions and big shapes stay true).
   **Signature landmarks stay sharp**: within ~10 km of Everest, Fuji and the Matterhorn, blend back to the detailed
   heightfield, so the landmark is the crispest shape in view and stands out by contrast.
2. **Colour by palette, not by texture.** Per time of day, a fixed palette from `composeTimedPalette`: lit face, mid,
   shade, deep shade, snow light, snow shade, haze. Lit faces warm; shade blue-violet; snow cream and lavender. No
   grey, no photo texture. 3-4 light bands with soft edges.
3. **Layered depth.** Distance in 3-4 flat steps, each farther layer flatter and closer to the sky colour, like the
   arrival scenes' background hills. The farthest ranges are simple silhouettes.
4. **Ridge lines, sparingly.** A thin line on the big ridgelines and the landmark's silhouette only.
5. **Atmosphere.** Soft haze bands and valley mist; gentle glow on sunlit snow; night soft and blue with warm town
   lights.
6. **Landmark reveal.** Keep your `reveal=on` framing (bank, turn, ~1.5x zoom, 6-8 s hold). Fix the detached label
   during the turn, or hide the label while banking and show it again when level.

## Report (phone package first)

Save under `C:\Users\insig\Documents\Codex\_outputs\2026-10-28-gpu-terrain-poster-r4`.

1. **Phone package** (`phone/` + `phone/index.html`), each image one scene, stacked: **arrival scene (reference) /
   today's class terrain / poster round 4**, for Everest day, Everest dusk, Everest night, Fuji (with reveal), the
   Matterhorn (with reveal, on a real route where it is visible: pick from `src/data/world/landmark-rarity.json`) and
   ordinary hills.
2. A 6-frame strip of one reveal (Everest).
3. Frame times at 1600 px (poster vs today's terrain) and one complete 60 s moving pass for poster.
4. Honest verdict: does poster now read as the **same world as the arrival scenes**? What still doesn't?

**Stop rule:** if the smoothed, palette-mapped version still looks grey and busy at the Everest day view, stop after
that view and report, rather than finishing every scene.

## Rules

Same worktree and rules as before (`C:\Users\insig\.codex\worktrees\landmark-route-gallery\teaching-games`, gallery
switch only, keep the earlier styles, no class defaults changed, no installs, no staging/commits/pushes, look at the
rendered result before claiming anything, real routes only). Do not claim it works in a real class.
