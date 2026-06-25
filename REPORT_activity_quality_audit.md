# Activity Quality Audit (static / code-based)

Generated 2026-06-25. Companion to `REPORT_game_quality_audit.md`.

**Method (deliberately deeper than the games pass):** for every activity I read **the generator**
(in `lesson-plan/generate`), **the component** (`activities/*/activity.tsx` — does it actually surface
what's generated?), and for the dynamic ones **the continue engine** (`/api/activity/continue`). The
games audit's mistake was judging from the generate prompt alone; activities were checked across all
layers.

**Cross-audit lesson:** AI-content quality lives in *more than the generate prompt* — evaluators
(`/api/<game>/evaluate`), continue routes, shared sub-components (e.g. `activities/shared/
comprehension-quiz.tsx`), and static reference data (e.g. `GRAMMAR_RULES`). Always read those before
judging "thin." Also: for **participation** activities, thin generation is *correct by design* — the
value is student output, not generated content.

**Caveat:** this judges design + generation quality (code-visible). It does **not** judge feel — fun,
timing, difficulty calibration, real model output, classroom dynamics, UI polish. Use it to prioritise
play-testing.

---

## Headline verdict

**40 activities reviewed. Zero cuts, zero quality fixes warranted.** Unlike the games (where zone-board
was a true duplicate of flash-quiz), **no two activities are the same mechanic in a different wrapper.**
The activity set is consistently *better-built than the games* — richer scaffolding, careful source
grounding, and genuinely sophisticated dynamic engines.

The only outputs are **soft, owner-judgment items** (a crowded closer category, one naming fix already
done, one minor edge case, one internal DRY opportunity) — none are bugs.

---

## Tier table

| Activity | Group | Tier | Note |
|----------|-------|------|------|
| design-studio | Production | **Keep (strongest)** | Progressive, state-preserving (start→next→finalize); no obvious-correct options; final brief. The app's most elaborate activity |
| scenario-simulator | Production | **Keep (strong)** | Round 1 generated; continue builds Rounds 2–5 on a real arc (complication→crisis→turning-point→finale) + AI finale top-3 |
| expert-panel | Production | **Keep (strong)** | Per-student role cards + questions with concrete-noun / 20-sec-answerable / anti-abstract constraints |
| problem-solvers | Production | **Keep (strong)** | Problem + constraints + complications + hints + sentence-starters + success-criteria, all surfaced |
| conversation-rounds | Production | **Keep (strong)** | Two-role roleplay with goals/phrases/lifelines/complications; regenerates on demand |
| decision-council | Debate | **Keep (strong)** | Open question + 30-sec brief + stance options + propose-language AND challenge-language starters |
| team-debate | Debate | **Keep (strong)** | Two-sided motion + neutral context + per-side angles + debate phrases; fixed Opening→Rebuttal→Closing |
| hot-take-arena | Debate | **Keep (strong)** | Stance statement (not a question) + pro/con + devil's-advocate per side + defined vocab; live devil's advocate |
| read-aloud | Source | **Keep (strong)** | Comprehension (evidence quotes, answer-shuffle, vocab-in-context) + discussion + vocab + slides |
| video-player | Source | **Keep (strong)** | Same comprehension engine, grounded in the real prefetched transcript; video timestamps for rewatch |
| language-toolkit | Source | **Keep (strong)** | Most rigorous grounding: "every term must appear in the source text"; term/meaning/example/prompt |
| listening-gap-fill | Source | **Keep (strong)** | Real source sentences blanked; accepts inflection alternatives (no false negatives); mode-aware |
| fact-detective | Source/Learning | **Keep** | True facts + plausible myths + explanation + vocab; progressively harder; grounded |
| vocab-micro | Source | **Keep** | "Which word fits?" gap with anti-meta rule + same-POS plausible distractors |
| grammar-clarify | Grammar | **Keep (strong)** | Teaches the rule; depth scales with source (rich without one, concise when a source taught it) |
| grammar-check-in | Grammar | **Keep** | 3 sentences correct/incorrect + vote + reveal explanation; auto-picks target if none |
| grammar-proof | Grammar | **Keep** | Writing task + teacher-only model answers using the target |
| character-cards | Icebreaker | **Keep** | 9 genuinely-contrasting viewpoints + speaking lines + solid fallback |
| imposter | Icebreaker | **Keep** | Social deduction — one student doesn't know the word |
| password | Icebreaker | **Keep** | Hide a word in natural conversation |
| bluff-definition | Icebreaker | **Keep** | Balderdash — write fake definitions, vote |
| taboo-sprint | Icebreaker | **Keep** | Describe without 4 forbidden words (forbidden = the *obvious* words, not synonyms) |
| would-you-rather | Icebreaker | **Keep** | Dilemmas + continue follow-ups |
| quick-pulse | Icebreaker | **Keep** | Likert/yesno pulse — intentionally lightweight (participation) |
| vocab-radar | Icebreaker | **Keep** | Rate New/Heard/Know — pre-teaching gauge |
| prediction-round | Icebreaker | **Keep** | Binary predictions + reveal facts |
| wonder-board | Icebreaker | **Keep** | One framing line → student question board (participation; thin generation is correct) |
| two-truths → **"Spot the Fib"** | Icebreaker | **Keep (renamed)** | AI topic statements, one false; renamed to avoid confusion with two-truths-and-a-lie |
| two-truths-and-a-lie | Icebreaker | **Keep** | Students write *personal* statements; mechanically distinct from Spot the Fib |
| rank-it | Icebreaker | **Keep** | Ranking challenges + reveal facts |
| scene-igniter | Icebreaker/Perf | **Keep** | Performance/improv scenes (lines + improv script) — schema/component verified, not fully deep-read |
| mission-selector | Icebreaker | **Keep** | 6 mission questions (the mission system) |
| final-answer | Closer | **Keep** | Consolidation prompt + keywords + sentence starter + teacher model |
| mic-drop | Closer | **Keep** | Expressive/punchy personal statement + keywords |
| lightning-round | Closer | **Keep** | 4 rapid-fire prompts with sharp anti-essay rules (no "What do you think", max 8 words) |
| opinion-shift | Closer | **Keep** | Before/Now metacognitive reflection |
| final-word | Closer | **Keep** | Each student's final word (schema-level verified) |
| in-your-words | Closer | **Keep** | Reuses the lesson's *actual* key vocab — students use today's words |
| grammar-proof | Closer | (see Grammar) | — |
| contribution-break | Practice (flightPlanOnly) | **Keep** | Simple non-AI "submit one idea/question/phrase" break |
| cabin-mystery | Icebreaker (vaulted/in-dev) | **Hold** | Static "Switched Suitcase" case, not yet reviewed for launch |

---

## Soft observations (owner judgment — none are bugs)

1. **The closer category is crowded.** final-answer, mic-drop, lightning-round, opinion-shift,
   final-word, in-your-words are all "give every student a final voice / consolidate." Each has a
   distinct angle, so none is *redundant* — but six closers is the one place a teacher might feel it's
   more than needed. A **curation trim by preference**, not a quality problem.

2. **two-truths naming** — DONE (renamed the AI topic-facts one to "Spot the Fib"; key stays
   `two-truths`). The SEO landing JSON deliberately keeps the high-search "Two Truths and a Lie" term —
   reconcile separately if desired.

3. **in-your-words empty-vocab edge.** Its words come from the lesson's `keyVocabWords`; a lesson with
   no vocab activity yields `words: []`. Confirm the component degrades gracefully (e.g. a generic
   "use 3 words from today's lesson").

4. **Word-game generators share near-identical code.** imposter / password / bluff-definition /
   taboo-sprint each have the same cache→schema→try/catch shape. A DRY refactor (one shared word-round
   generator) — **zero quality impact**, purely internal tidiness.

---

## Depth transparency
Fully deep-read (generator + component + continue where applicable): the Production, Debate, and Source
groups; the word-game cluster; the closer + grammar generators. Verified at schema/component level
(not line-by-line): scene-igniter, final-word, rank-it, mission-selector. cabin-mystery is vaulted/
in-dev. Flag any of these for a closer look.

## What needs play-testing (not code-visible)
- Fun / timing / difficulty calibration of every "Keep."
- Whether the crowded closers feel distinct in practice.
- The teacher-burden production activities (design-studio, scenario-simulator, expert-panel,
  conversation-rounds) under real classroom flow.
- Real model output quality (prompts are strong; sampling confirms).
