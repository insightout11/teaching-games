# Library round 19 brief (for Codex): rework the topic briefings

_Written Oct 7 2026. Owner: LessonCaptain. Executor: Codex. Same rules as round 18 (`docs/library-round-18-brief.md`).
**Use your strongest writing model for this round**: it's almost all writing._

## Round 18 review: not merged
The structure, counts, levels and validator are right, and the topic list is good. The **writing is templated**, so the
bank would be worse than the live AI call it's meant to replace. Measured across the 380 briefing levels:
- **310 briefings mostly repeat their own facts** ("Melted rock is called lava above ground." is both a briefing
  sentence and a fact). The teacher reads the same thing twice.
- **354 levels list the topic title as a vocabulary word** ("Volcanoes", "Social Media").
- **Padding words** fill the 7 slots: "place", "shape", "change", "look", "screen", "try"; "evidence" appears 47 times,
  "design" 43, "habitat" 40.
- **300 levels build 3+ expressions from the facts** ("I think" + a fact; "I can see [topic] in pictures"), so the
  stems don't model how a student would actually talk about it.
- **Copied facts across topics** (the same five cat and dog facts appear in five topics).
- Some kids' angles are odd ("Would you rather study lava or ash?").

## Task: rewrite the writing on `codex/library-round-18` (follow-up commits, no history rewrite)
Keep ids, titles, aliases, age bands, categories and the JSON shape. Rewrite every level's content so that:
- **briefing**: 3–4 sentences of new information the facts don't repeat: what it is, why it's interesting, one
  surprising detail. No sentence may appear in `facts`.
- **facts**: 4 distinct, specific, accurate, evergreen facts for **this** topic (numbers and names where they help:
  "A cheetah can run about 100 km an hour"), never shared word for word with another topic.
- **angles**: questions a real child or teen would enjoy answering about this topic. Kids: concrete and playful
  ("Would you rather have a pet dragon or a pet dinosaur? Why?"); teens: real opinions.
- **vocab**: 7 words students actually need to talk about this topic, specific to it (volcano: lava, ash, erupt,
  crater, magma, active, island). **Never** the topic title itself, and none of the generic words above. A word may be
  reused across topics only when it's genuinely central (e.g. "habitat" for at most a few animal topics).
- **expressions**: 6 stems that model student talk about this topic, each example a fresh sentence a student might
  say ("If I could visit a volcano, I'd…", "The scariest thing about volcanoes is…"), not a fact with "I think" added.
- **aliases**: also cover the common names teachers will type: synonyms and regional words (football/soccer),
  famous examples kids name instead of the category (T-rex, shark), singular and plural. Still no alias in two topics.
- Levels must really differ: A1 short and concrete, A2 a bit longer, B1 natural, B2 richer ideas and words, not the
  same sentences trimmed.

## Validator additions (fail, not just warn)
- No briefing sentence equals or is contained in a fact of the same level.
- No vocab word equals the topic title or any alias.
- A blocklist of generic vocab (place, shape, change, look, screen, try, thing, way, use, good, people, part, kind,
  type, area); flag any vocab word used in more than 4 topics.
- No expression example contains a fact (or 80% of one) from the same level.
- No fact or briefing sentence appears in two topics.
- Report the counts above (all must be 0) plus the per-level counts.

## Rules
Same branch, follow-up commits (one per batch is fine), don't push or merge, report the validator's counts. Run
`scripts/validate-library.ts`, `pnpm test src/lib` (`--maxWorkers=1` if needed) and `tsc`. Progress log:
`docs/library-round-18-progress.md` (add a Round 19 section). Only touch `src/data/`, library scripts in `scripts/`,
and `docs/`. Note: main now has `src/data/topic-briefings.json` as an empty list `[]` and the loader
`src/lib/topic-briefings.ts`; your file replaces the empty list at merge (Claude resolves it).
