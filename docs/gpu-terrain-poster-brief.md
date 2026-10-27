# GPU terrain round 3: the travel-poster shader and framed landmarks (brief for Terra)

Written 27 October 2026 by Claude for Matt (the owner). **Dev gallery only. No class-facing change.** Claude reviews.

## What round 2 showed (your styles packet, 27 Oct)

Good: the GPU path is fast (3-4 ms CPU per frame vs 21 ms today) and the six styles render. But reviewing the grids:

- **The six styles look almost the same**: realistic grey relief with different tints. None reads as an illustrated
  travel poster, which is Matt's decided direction (`docs/art-direction.md`: vintage travel poster, dreamy, soft,
  atmospheric, dreamy blue nights).
- **The cockpit and the arrival scenes still look like two worlds** (your arrival pairings): the arrivals are bold,
  flat, colourful layered illustrations; every cockpit style is soft realism.
- **Landmark detail on/off barely shows**; Fuji is a small bump at the edge of the frame and the Matterhorn is lost in
  haze. Terrain detail alone does not make a landmark distinct.

Matt chose **dreamy + arrival together** and asked to **prove landmarks look good in that style**.

## The work

### Part A: one new style, `poster` (dreamy + arrival, done in the shading itself)

Change how light and colour are computed, not just their tint. In `poster`:

1. **Banded light**: quantise the diffuse light into 3-4 flat bands with soft (1-2 px) transitions, like screen-printed
   posters. No smooth photographic gradients on slopes.
2. **Limited palette from the arrival scenes**: per time of day, take 5-7 colours from `composeTimedPalette` (terrain,
   rock, snow, shadow, haze, highlight) and map every pixel to them (band x material). Snow is one or two flat tones,
   shadows are coloured (blue/violet), never black or grey.
3. **Layered distance**: split depth into 3-4 layers; each farther layer is flatter, paler and closer to the sky
   colour, like the arrival scenes' layered silhouettes. The farthest ranges become simple silhouettes.
4. **Ridge lines**: a thin, slightly darker (or lighter, sunlit) line along major ridges and silhouette edges, drawn from
   the height/normal discontinuity, not a full outline of everything.
5. **No photographic noise**: remove fine texture speckle; keep shapes simple. Use the existing material/land data only
   to pick the flat colour per area.
6. **Dreamy atmosphere on top**: soft haze, gentle glow on sunlit snow, mist in valleys; night is **dreamy blue and
   soft** with warm town lights, never black.

Keep the other six styles for comparison; `poster` is the candidate.

### Part B: landmarks framed by the reveal camera

Using your bank/turn camera:

- **`&reveal=on`**: as the selected landmark approaches, the plane banks gently (10-20 degrees), turns a few degrees
  toward it and the camera narrows slightly (a gentle zoom, about 1.3-1.6x) so the landmark fills a good part of the
  view (roughly a quarter to a third of the frame width), holds about 6-8 seconds, then eases back. The plane's position
  stays on its real route.
- Signature detail stays on for Everest, Fuji and the Matterhorn, in the `poster` style.
- Choose the hold moment where the landmark is clearest and not hidden by nearer ridges or cloud; if a route hides it
  (Matterhorn on Paris to Rome), pick another real route from `src/data/world/landmark-rarity.json` where it is
  visible, and say which.

## Measure and report

Save under `C:\Users\insig\Documents\Codex\_outputs\2026-10-28-gpu-terrain-poster`.

1. **Phone package** (same format as last time, `phone/` + `phone/index.html`): for Everest day, Everest dusk, Everest
   night, Fuji, Matterhorn and the hills: one image comparing **today's class terrain / round-2 dreamy / poster**
   stacked, and one comparing **poster (no reveal) / poster with reveal framing**. Plus each poster frame **next to the
   destination's arrival scene**.
2. A 6-frame strip of each reveal.
3. Frame times (CPU median/p95 at 1600 px) for poster vs today's terrain, and one 60 s moving pass for each.
4. What still looks wrong, honestly, and whether `poster` reads as the same world as the arrival scenes.

## Rules

Same worktree and rules as round 2 (`C:\Users\insig\.codex\worktrees\landmark-route-gallery\teaching-games`, gallery
only, no class defaults changed, no installs, no staging/commits/pushes, look at the rendered result before claiming
anything, real routes only). Do not claim it works in a real class.
