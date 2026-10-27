# LessonCaptain art direction

Written 26 October 2026 by Claude from Matt's direction: **dreamy, soft, very atmospheric**, one look across
everything. Matt edits this; agents read it before any visual work.

**Decided by Matt (26 Oct 2026):** an **illustrated travel poster**, not a photo: simplified shapes, flat-ish colour in
soft layers, strong atmosphere, warm light. **Night is dreamy blue and soft**: deep blue skies, gentle moonlight on
land and sea, warm town lights, stars present but not harsh, never black.

**Nostalgia (Matt, 26 Oct 2026):** the look is a **vintage travel poster** and should ooze nostalgia. The planes are
already picked from that world. Think golden-age air travel posters: bold simple shapes, limited warm palettes, soft
paper grain, sunlit haze, confident lettering. This can reach the UI too in places (boarding passes, stamps, postcards,
destination titles, the landing card, the fly-past), while everyday controls stay clean and readable.

## The feeling

A calm, glowing window seat on a long flight. The world below is real but softened, as if seen through a slightly
misty window in good light. Wonder over spectacle; warmth over realism; quiet over busy. A class should feel they are
travelling together, not playing a video game.

## Principles

1. **Atmosphere first.** Air is visible. Distance fades into the sky colour; far ranges become pale layered
   silhouettes. Haze, mist in valleys, soft sun glow and light through clouds do more work than texture detail.
2. **Soft, not blurry.** Edges are gentle and shapes are simple, but landmarks and the things we talk about stay
   clearly readable. Detail where the eye should go (the landmark, the coast, the city); simplicity elsewhere.
3. **One palette system.** The sky, the terrain, the clouds and the arrival scenes all take their colours from the same
   time-of-day palettes (`composeTimedPalette`). Dawn, day, dusk and night each have one mood everywhere.
4. **Light tells the time.** Warm low light at dawn and dusk, gentle and slightly pastel by day, deep blue with warm
   town lights at night. Shadows are soft and coloured, never black.
5. **Layered, like paper cut-outs.** Depth reads as layers (near, middle, far), matching the arrival scenes'
   illustration style, even when the terrain is real.
6. **Real geography, kind rendering.** Places are where they really are and shaped like themselves; the style is how we
   present them, not a licence to invent geography.
7. **Calm motion.** Slow, smooth movement; nothing jittery or flickering. Reveals (clouds parting, a gentle bank) over
   sudden pops.
8. **Readable on a projector and on Zoom.** Contrast is gentle but never muddy; text and labels stay crisp and legible.
9. **Characters and UI belong to the same world.** Sticker-style avatars and mascots, paper boarding passes, stamps and
   postcards: tactile, warm, friendly. Icons from Lucide, no emoji.

## Where it applies

- **Cockpit view:** the terrain style (to be chosen from the style tests), clouds, sea, coast, towns, trees, sky
  objects.
- **Arrival and departure scenes:** already the reference for palette and layering; keep them, and bring the cockpit
  closer to them.
- **Landmark reveals and photos:** the most atmospheric moments (golden light, clouds parting).
- **Phones and the teacher screen:** soft night-sky backgrounds, paper cards, warm accents (amber), calm motion.
- **Marketing:** product imagery first, the same mood.

## Next: a UI pass (proposal)

Where the vintage poster look could reach the screens, without hurting readability:
- Destination titles and the landing card in a poster-style display face and layout ("Welcome to Tokyo" as a poster).
- Boarding passes, stamps, postcards and souvenirs with paper texture and slightly worn print.
- Flight moments (the fly-past, the very-rare banner, the reveal title) as poster banners.
- Buttons, lists and settings stay clean and modern.

## Decisions (Matt, 27 Oct 2026, from the decision page)

| Topic | Decision | Matt's note |
|---|---|---|
| Terrain style | **Dreamy + arrival together** (arrival palette and layers with dreamy haze and glow) | Prove the landmarks look good in this style too |
| Landmark reveal | **In the cockpit view** (slow down, gentle bank, clouds part, title) | |
| Cockpit to arrival | **Prototype both** (side-window match cut and down through the clouds), then decide | |
| Landing turn | **Every city**; cities without a real landmark get one built from their arrival art | |
| Clouds and landmarks | **Clouds part by default + a Real weather switch** | |
| Instrument panel | **Slim strip along the bottom** | Can there be a teacher-only area without a separate screen? |
| Pricing | **All in Pro for now, add-ons later** | |
| Fact checker | **Basic sources for all, deep check in Pro** | |
| Poster look on screens | **Big moments first** (landing card, boarding pass, stamps, postcards, fly-past) | Also do a pass for colours that don't fit, e.g. neon |
| Arrival mist | **Stronger at dawn and dusk, lighter by day** | |
| Regions first | **Five contrasting regions**: Bali, Mediterranean, Sahara edge, Scandinavia, Japan | |
| Trees and villages | **Poster shapes** | Motion from real wind data? |

## Open questions for Matt

1. Any reference images (films, games, illustrators, travel posters) that capture the feeling? They would help agents.
