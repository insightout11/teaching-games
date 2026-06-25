# Game Quality Audit (static / code-based)

Generated 2026-06-25. Method: read each game's **core mechanic**, its **AI generation prompt**
(for AI-content games the prompt *is* most of the quality), **content schema**, and **registry
metadata** (skills, energy, teacher-control load, overlap). 

**Caveat:** this judges *design and generation quality*, which is code-visible. It does **not** judge
*feel* — fun, timing, difficulty calibration, real model-output quality, classroom dynamics, or UI
polish. Use the tiers to **prioritise play-testing**, not as a final verdict.

---

## Tier summary

| Game | Category | Tier | One-line |
|------|----------|------|----------|
| flash-quiz | quiz | **Keep (strong)** | Topic-adaptive MCQ, plausible distractors, low teacher burden — the workhorse |
| connections | logic | **Keep (strong)** | NYT-Connections clone; tiered groups, anti-meta guard; high replay |
| vocab-sprint | vocab | **Keep (strong)** | 3-tier (weak-word swap → imprecise phrase → recall the term); genuinely good vocab pedagogy |
| dialogue-detective | logic | **Keep (strong)** | Fill-the-blank dialogue with careful role-consistency rules; strong pragmatics |
| sentence-scramble | grammar | **Keep (strong)** | Reorder words; threads a grammar target; handles multiple valid orderings (rare quality touch) |
| error-hunter | grammar | **Keep** | Proofreading paragraph with N embedded errors; clear skill |
| grid-rush | vocab | **Keep** | Topic-biased Boggle grid; replayable, low burden |
| defend-it | quiz | **Keep (distinctive)** | "Defend the Indefensible" — absurd statements to argue; fun, but teacher judges |
| sector-strike | quiz | **Keep (distinctive)** | Team territory game wrapped around a generated question |
| twenty-questions | logic | **Keep (high burden)** | Deduction via yes/no questions; strong skill, heavy teacher mediation |
| story-sprint | grammar | **Keep (verify)** | Collaborative storytelling; thin starter but quality lives in the /evaluate route (unverified) |
| grammar-boss | grammar | **Fix** | Speaking task + 1 example — generation is thin; teacher judges spoken output |
| synonym-showdown | vocab | **Fix / overlap** | Single-word synonym swap — overlaps vocab-sprint's easy tier |
| word-chain | vocab | **Fix / weakest** | Free word association; thin generation, low pedagogical density, hard to score |
| zone-board | quiz | **Overlap** | Generates one MCQ (≈ flash-quiz) in a team-board wrapper |
| brain-teasers | logic | **Unverified** | Logic puzzles via /next; prompt not in the standard shape — needs a look |
| radar-fix | quiz | **Niche (WF only)** | World-Flight geography check; not a general ESL game |
| world-lens | quiz | **Niche (WF only)** | World-Flight geography game; not a general ESL game |

---

## Overlap / merge candidates (your "get rid of some" shortlist)

1. **synonym-showdown ⊂ vocab-sprint.** Both replace a word with a stronger/alternative one.
   vocab-sprint is the richer version (3 escalating tiers incl. recall-the-term). synonym-showdown
   adds little unless differentiated. → **Cut, or repurpose to REGISTER/nuance** (formal vs casual
   synonyms) which vocab-sprint doesn't cover.

2. **MCQ trio: flash-quiz / zone-board / sector-strike.** All three are driven by a single generated
   MCQ; flash-quiz has by far the **best** prompt (topic-adaptive style, plausible distractors,
   explanations). zone-board's and sector-strike's question prompts are thinner. The games are only
   *distinct* in their **wrapper** (solo quiz vs team territory). → Keep the wrappers if they're
   genuinely different to play, but **share one MCQ generator** (see fixes) so all three inherit the
   strong prompt.

3. **word-chain** is the weakest of the vocabulary set — free association is hard to score and low on
   precision. Either give it a scoreable constraint (below) or cut it.

---

## Per-game notes (the quality signal I read)

**flash-quiz** — Prompt adapts question style to the topic (grammar→correction, vocab→definition),
demands plausible distractors, bans filler answers, requires explanations, batch-generates N. Strong,
versatile, low burden. Polish only.

**connections** — Generates 4 groups × 4 words with difficulty tiers + colors, dedupes words, bans the
topic name as a word. Proven format, high replay. Polish only.

**vocab-sprint** — 3 tiers in one generation: easy (swap a generic weak word), medium (replace an
imprecise phrase, e.g. "puts out"→"emits"), hard (describe a concept, recall the precise term, e.g.
"carbon footprint"). This escalation is real vocab pedagogy. Strongest vocab game.

**dialogue-detective** — Fill the blank middle line of a 3-line dialogue, with explicit role-consistency
guardrails and a worked "trap to avoid." The careful prompt shows in output quality. Strong.

**sentence-scramble** — 10 grammar-target-threaded sentences, plus a `sentenceAlternatives` map so
multiple valid word orders aren't marked wrong. That false-negative guard is a quality signal most
games lack.

**error-hunter** — Paragraph with exactly N single-word errors + positions + corrections, optional
grammar focus. Clean proofreading drill.

**grid-rush** — 3×3 grid biased toward the topic's real vocabulary (not generic high-freq letters) +
topic words + bonus letter. Thoughtful; replayable.

**defend-it** — Absurd, provocative statements to argue for/against. Distinctive and fun; teacher
judges the arguing. Good fallback content too.

**sector-strike / zone-board** — Both generate a question and wrap it in team play. Generation is thin
(one question). Value is the wrapper. See overlap + fixes.

**twenty-questions** — AI picks a secret; class deduces via yes/no questions. Strong questioning skill,
but heavy teacher mediation.

**story-sprint** — Starter is intentionally thin (one opening sentence); the quality must live in
`/api/story-sprint/evaluate` + `/analyze` (judging student continuations). **Verify those prompts** —
if they're strong, this is a good production game; if thin, that's the lever.

**grammar-boss** — Generates only a 1–2 sentence speaking task + one example. Student speaks; teacher
judges. The thin generation + speaking-judgment is the weakness.

**word-chain** — Generates a single starting word + a vague hint. The rest is free association, which
is hard to score and low-precision. Weakest generation in the set.

**brain-teasers** — Uses `/api/brain-teasers/next` (different shape); prompt not captured here. Needs a
dedicated read before judging.

**radar-fix / world-lens** — World-Flight-only geography games. Fine for that mode; not general ESL
content, so judge them as part of World Flight, not the core game set.

---

## ★ Areas for improvement — high-leverage, low-effort fixes

Ranked by leverage ÷ effort. Each is a small prompt/code change with outsized quality return.

1. **One shared MCQ generator for flash-quiz / zone-board / sector-strike.** Point all three at
   flash-quiz's prompt (the strongest). zone-board especially jumps in quality for ~zero effort, and
   future prompt improvements help three games at once. *(Code: extract one generator; ~1 file.)*

2. **grammar-boss: add scaffolding to the generation.** Generate (a) 2–3 graded example sentences,
   (b) a "common mistake to avoid," and (c) 2 sentence starters. Gives students support and the
   teacher a model answer to judge against — turns a thin prompt into a strong speaking task.
   *(Prompt-only change.)*

3. **word-chain: add a scoreable constraint per round.** Give each round a category/theme ("ocean
   things", "words that follow 'fire'") so associations become checkable instead of free-for-all.
   Converts the weakest game into a scoreable category game. *(Prompt + light validation.)*

4. **Batch the single-item generators.** synonym-showdown (1 word), grammar-boss (1 task),
   sector-strike/zone-board (1 question) generate one item per call → more latency/cost and less
   variety. Generate a batch of 5 and serve from it. Cheaper, faster, more varied. *(Small change per
   route; the strong games already do this — copy the pattern.)*

5. **synonym-showdown: differentiate or cut.** If keeping, retarget it to **register/nuance** (formal
   vs casual, connotation) — a gap vocab-sprint doesn't fill. Otherwise cut and reclaim the slot.

6. **Verify + standardise source-grounding strength.** Every prompt injects `sourceContext`, but the
   grounding instruction varies in force ("base on" vs "MUST be set in"). Standardise on the strongest
   wording so source-based lessons are uniformly well-grounded. *(Mechanical prompt edit across routes.)*

7. **Verify story-sprint's /evaluate and brain-teasers' /next prompts.** Two unread quality-critical
   prompts. Quick to check; could move story-sprint up and clarify brain-teasers' tier.

---

## What still needs play-testing (can't be judged from code)
- Fun / engagement, timing, and difficulty calibration of every "Keep" game.
- Whether the team-board wrappers (sector-strike vs zone-board) actually *feel* different.
- Real model-output quality (the prompts are good; sampling confirms it).
- The teacher-burden games (grammar-boss, twenty-questions, defend-it, story-sprint, sector-strike)
  under real classroom flow.
