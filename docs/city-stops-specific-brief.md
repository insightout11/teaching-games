# City stops: make every souvenir specific (brief for Terra)

Written 27 October 2026 by Claude for Matt (the owner). **Data only.** Claude reviews and merges.

## Why

`src/data/world-flight/city-stops.json` has 600 souvenirs (50 cities × 4 stops × 3). About **244 are generic
placeholders** made from the city name: "Istanbul sight model", "Istanbul view magnet", "Istanbul train ticket",
"Istanbul route-map card", "Istanbul sun hat", "Istanbul scarf", "Istanbul bracelet". Matt noticed in class testing
that the souvenirs don't feel specific to the market, station or sight. Good examples already in the file:
"Simit bread ring", "Ferry token", "Ceramic tulip tile". Every item should be like those.

## The work

For every item or accessory whose name is just `<City> <generic thing>` (or is otherwise vague), replace it with one
that is **specific to that stop's real `place`** in the same city:

- **restaurant**: a real dish, drink or tableware from that place (e.g. "Koshari bowl", "Cardamom coffee cup").
- **station**: a real transport object from that city's actual system (e.g. "Nol card" for Dubai Metro, "Ferry token"
  for Istanbul, "Oyster card" for London). Only real systems that exist today.
- **sights**: a model, tile or magnet of the **named** sight (e.g. "Galata Tower model", "Blue Mosque tile magnet").
- **market** accessories: keep `type` and `colors`, but give a specific name and `motif` tied to that market's real
  craft (e.g. "Grand Bazaar Iznik-pattern scarf", motif "tulip and carnation tiles"). No national dress or costumes.

Keep each item's `id` stable if you can; if a name changes so much the id is misleading, change the id **and** list
old → new ids in the review doc (Claude will check nothing saved in the database uses them). Update `description` so
it is one true sentence about the new item. Reuse an existing sticker id if one truly fits, else `null` + `artPrompt`.

## Order

1. First the cities reachable from Dubai (Matt's class on Friday 6 November leaves Dubai): mumbai, delhi, cairo,
   addis-ababa, almaty, istanbul, nairobi, moscow, rome, berlin, bangkok, and dubai itself. Commit as step 1.
2. Then the rest (step 2).

## Rules

- Branch `codex/city-stops-specific` from `origin/main`. One local commit per step (`City stops specific N:`). No push,
  no merge. Stage only your own files, never `git add -A`. **Never run `pnpm install` or any install in the repo.**
- Edit only `src/data/world-flight/city-stops.json`, tests in `src/__tests__/lib/`, `docs/city-stops-review.md`.
- Add a test: no item or accessory name matches `^<City name> (sight model|view magnet|train ticket|route-map card|sun hat|scarf|bracelet|cap|badge|bag|umbrella|sunglasses)$`.
- Checks: `npx tsc --noEmit -p .` (missing `@mozilla/readability` is known), `pnpm next lint --file <changed>`,
  `pnpm test`. True facts and real places only.

## Report back

Commits, how many items changed per step, any id changes (old → new), and anything you were unsure about.
