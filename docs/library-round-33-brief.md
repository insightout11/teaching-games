# Library round 33 brief (for Codex): what each World Flight city lesson teaches a designer

_Written Oct 12 2026. Owner: LessonCaptain. Executor: Codex. Same rules as rounds 18–32. Do this after round 32.
Use your strongest writing model, and read each lesson's own text before writing about it._

## Why this round
When a class finishes three city lessons on one theme, a **design mission** unlocks: the class designs something
(a better journey, a resilient city) using what it found in those three cities. The mission screens show a card per
city with "what we found there", tag each design option with the city it draws on, and the AI that writes the
options is told each city's key idea.

None of that works today, because **none of the 300 city lessons records what it found**. Every lesson's `evidence`
is empty, so the city cards show only a title and the AI is told "Key idea: Not recorded" three times. This round
fills that in. It is the single biggest improvement available to design missions.

## What exists
- `src/data/world-flight/destinations.ts` exports `WORLD_DESTINATIONS`: 50 cities, 6 lessons ("focus options") each
  = 300 lessons. Each focus has `id`, `kind` (video / reading), `title`, `summary`, `skills`, and `sourceMaterial`
  (for readings, the full text is in `sourceMaterial`; for videos, a summary and often a prefetched transcript).
- `src/lib/world-flight/types.ts`: `DestinationEvidence { investigationTags, keyIdea, tradeoff, designUse }`.
- `src/lib/world-flight/investigations.ts`: the five investigations and, for each, three requirements with
  `matchTags`. A lesson counts toward a requirement when one of its tags matches.

**Do not edit `destinations.ts`.** It is a large hand-built file. Write the evidence to a new file; I will attach it.

## Task: `src/data/world-flight/focus-evidence.json`
One entry per lesson, keyed `"<destination.id>/<focus.id>"` exactly as `WORLD_DESTINATIONS` exports them:
```json
{
  "tokyo/metro-economics-video": {
    "keyIdea": "Tokyo's railways earn money from shops and buildings around their stations, not only from tickets.",
    "tradeoff": "Areas far from a station get less investment and worse service.",
    "designUse": "Pay for transport with what is built around the stops.",
    "investigationTags": ["transport", "economics", "urban planning"]
  }
}
```
- `keyIdea`: the one thing this lesson shows about how the city works. One sentence, 10–22 words, B1 English at
  most (A2 where the lesson is Easy). A fact or mechanism from the lesson, not a summary of the lesson
  ("The video explains…" is rejected).
- `tradeoff`: the cost, limit or loser of that idea. One sentence, 8–18 words. Every real city solution has one;
  find it in the lesson. If the lesson truly presents none, write the most direct limit the lesson implies and add
  `"tradeoffInferred": true`.
- `designUse`: how a class could reuse the idea in its own design, as an instruction starting with a verb.
  6–14 words, general enough to apply outside that city ("Give every main route a backup for flood days").
- `investigationTags`: 2–4 tags from the `matchTags` lists in `investigations.ts`, chosen because the lesson really
  is about them. These decide which mission a lesson counts toward, so do not add a tag to make a lesson "fit".

## Accuracy rules (this is the part that matters)
- **Only what the lesson's own material says.** Read `sourceMaterial` (and the transcript where one exists in
  `source_extractions`; if you cannot read transcripts, work from the summary and say so in the log). No outside
  facts, no numbers that are not in the material, no claims the lesson does not make.
- Where the material is too thin to support a real key idea (some short video summaries), do not invent one:
  write the most the material supports and add `"thin": true`. I would rather have 20 honest thin entries than
  20 confident inventions.
- Keep each city's six entries different: six lessons about one city must not share a key idea.
- Neutral and respectful about every city and culture. No ranking cities, no "backward / advanced".

## Validator: `scripts/validate-focus-evidence.ts` (fail on any)
- Exactly one entry for every `<destination.id>/<focus.id>` in `WORLD_DESTINATIONS`, no unknown keys.
- Word counts as above; `designUse` starts with a verb (reject entries starting The / A / An / This / It / They).
- `keyIdea` does not start with "This video", "The video", "This reading", "The article", "Students".
- Every tag is in some investigation's `matchTags`; 2–4 tags per entry.
- No two entries share a `keyIdea` or a `designUse`; no two `designUse` values more than 70% the same.
- **Coverage check:** for each of the 15 requirements (5 investigations × 3), report how many different cities
  have at least one matching lesson. Fail if any requirement has fewer than 8 cities. Compare with the counts
  before your tags were applied (today's tags come only from `skills`) and report both.
- Report: counts of `thin` and `tradeoffInferred`, and paste 10 full entries (two each from five different cities,
  one video and one reading per city) in the progress log.

## Rules
- Branch `codex/library-round-33` off `origin/main`. Commit city by city (or five cities at a time); don't push or
  merge; report.
- Write each entry after reading that lesson. No templates: "Use what this city learned about X" on every
  `designUse` will be sent back, as round 28 was.
- Run the validators, `pnpm test src/lib src/data` and `tsc`.
- Only touch `src/data/world-flight/focus-evidence.json`, the new validator in `scripts/`, and `docs/`.
