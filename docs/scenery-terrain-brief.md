# Scenery brief: redraw the ground below the plane, one terrain per session

_Written Oct 12 2026. Owner: LessonCaptain. For a separate Claude session (Sonnet is enough). Do ONE terrain per
session, in the order below, and stop for the owner's approval after each._

## What this is
During a lesson the class looks out of a cockpit windscreen at the ground passing below. That ground is one seamless
square picture per terrain, drawn in code, which the flight engine repeats and lays out in perspective. Most terrains
still use a tiny 256px picture made of a few lines and dots, so they look flat and visibly repeat. The desert has been
redone properly and is the example to copy. Your job is to bring one other terrain up to that standard.

You are only drawing a picture. **Do not change the flight engine.**

## Read first (in this order)
1. `src/components/live-room/flight/ground-texture.ts` — read `desertTexture` and `tileNoise` closely (the worked
   example), then `farmTexture` (a second, different approach: drawn shapes rather than per-pixel).
2. `src/components/live-room/flight/cockpit-ground.tsx` — `tileFor`: the old small tiles you are replacing.
3. `src/components/live-room/flight/cockpit-world.tsx` — only the block that chooses the texture (search for
   `desertTexture`). That one line is where a new terrain is switched on. Read nothing else in this file as a to-do.

## The order
1. `ocean` (most flights spend the longest over it)
2. `forest`
3. `ice`
4. `mountains` (the ground between the peaks; the peaks themselves are drawn by the engine, leave them)
5. `farmland` / `hills` — already decent; only a polish pass if the owner asks

## What to build (per terrain)
A function in `ground-texture.ts` with exactly this shape:

```ts
export function oceanTexture(palette: ScenePalette, night: boolean): HTMLCanvasElement
```

- Returns a **1024×1024** canvas (`FARM_TEXTURE_SIZE`). To keep it fast, compute per-pixel work at 512 and scale up,
  as the desert does. Building it must take well under a quarter of a second: it runs once, mid-flight.
- **It must tile seamlessly** on all four edges. Use `tileNoise` (it repeats exactly), whole numbers of waves across
  the tile, and for drawn shapes that cross an edge draw the wrap-around copies (see the dry riverbeds in the desert).
- **Colours come from the palette**, mixed toward a natural colour, never hardcoded alone: `palette.waterTop`,
  `palette.waterBottom`, `palette.terrainTop`, `palette.foliage`. This is how dawn, dusk and night tint the ground.
- **Night:** darken the whole tile at the end, the way the desert does. Lights (boats, a village) may stay brighter.
- Deterministic: use the file's `rng(seed)` with a fixed seed. No `Math.random()`.

Then switch it on in `cockpit-world.tsx` by adding the terrain to the one condition that already lists
`'farmland' | 'hills' | 'desert'`. Nothing else in that file changes.

## What good looks like
The picture is seen from high up, at a shallow angle, moving, through haze. So:

- **Big shapes first.** Features must read from far away: regions hundreds of pixels across, not speckle. Fine detail
  vanishes in the distance and only adds noise up close.
- **Light from one side.** Give every raised thing a lit face and a shadowed face. This is what turned the desert from
  lines into dunes.
- **Variety inside one tile.** At least three different kinds of area, blended softly, so the repeat is hard to spot
  (desert: dune seas, gravel plains, dark rock, pale riverbeds).
- **No straight lines, grids or evenly spaced marks.** They show the repeat instantly.
- **Nothing that reads as an object at the wrong scale.** One texture pixel is about 14 metres. A tree is a dot; a
  wave crest is a short pale streak; a ship is 3–10 pixels.

Starting ideas (use your judgement, look at real aerial photos in your head):
- **Ocean:** deep and shallower blues in broad slow bands; long swell lines that bend and fade (not parallel);
  scattered whitecap flecks denser in some patches than others; a few cloud-shadow patches; perhaps one tiny ship
  with a pale wake. No islands (the engine handles coasts).
- **Forest:** a lumpy canopy lit from one side, in several greens; darker valleys and a winding river with pale
  banks; a few clearings and a lake; ridges implied by light and shade.
- **Ice:** not plain white. Blue-white sheets, grey-blue pressure ridges with shadows, dark open-water leads that
  fork, snow-drift streaks all running one way, a few melt pools.
- **Mountains (ground):** rocky valley floor in greys and dull greens, scree fans, a braided pale river, snow
  patches on one side of rises, dark conifer patches low down.

## How to check your work (required before reporting)
1. Start the preview server named `cockpit-dev` and open `/dev/flight-lab`. Press **Cruising**, then choose your
   terrain in the **Below:** menu. Take a screenshot.
2. Check each of these, with a screenshot of each: **day, dawn, dusk, night** (the time menu), and
   **Activity on screen** switched on.
3. Look for, and fix: a visible repeat or seam; anything that looks like stripes or a grid; a flat single colour in
   the distance; the tile looking too dark or too bright against the haze; night being unreadable or glowing.
4. Animations may not run in a hidden preview pane. If the ground does not move for you, say so in your report
   instead of claiming it looks smooth.
5. Compare against **Below: desert** in the same lab. Yours should look at least as good.

Then run, and fix anything they report:
```bash
npx tsc --noEmit -p .
```
```bash
pnpm next lint --file src/components/live-room/flight/ground-texture.ts --file src/components/live-room/flight/cockpit-world.tsx
```
(One typecheck error about `@mozilla/readability` is already there and is not yours.)

## Rules
- Touch only `ground-texture.ts` and the one condition in `cockpit-world.tsx`. Leave `tileFor` in place (other
  terrains still use it until they are redone).
- Do not change the camera, speeds, haze, clouds, sky, peaks, or how textures are sampled. If you believe the engine
  is the problem, stop and report it instead.
- This folder's `node_modules` is shared with the main checkout: **never run `pnpm install`** here.
- No emoji anywhere. No new dependencies. No image files: the ground is drawn in code.
- Do not commit or push. Report with: the screenshots, what you drew and why, anything you were unsure about, and
  what you could not verify. The owner approves, then it is pushed.
