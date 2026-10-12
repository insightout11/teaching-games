# Library round 29 brief (for Codex): redo the grammar fits properly

_Written Oct 12 2026. Owner: LessonCaptain. Executor: Codex. Same rules as rounds 18–28. Use your strongest writing
model and write each topic by hand: this round was sent back because round 28's grammar fits were templated._

## Round 28 review
**Debate motions: merged, good.** Every teen topic has a motion and the topic links are in.

**Grammar fits: merged as data but not used in the app, because they don't meet the brief.**
- All 150 topics got `present simple` and `question forms`; 73 topics got nothing else. Those two fit every topic, so
  they tell a teacher nothing.
- The `why` lines are copied across topics ("Describe an animal feature or habit." on 20 topics, "Ask about a play or
  design choice." on 20).
- Some examples don't use their target: Fossils, `past simple`: "A track fossil marks where something walked." is
  present simple.
- "Would you draw sunrise or sunset?" is listed as `question forms`; that's the old discussion angle, not a grammar
  point a class would study.

## Task: rewrite `grammarFits` for all 150 topics
For each topic, ask: **which grammar point would a good teacher choose to teach with this topic, because the topic
makes that point natural and necessary?** Volcanoes → past simple (tell the story of an eruption), comparatives
(compare volcanoes), passive (how lava is formed, teens). My daily routine → present simple. Holidays → past simple
and future (going to). Inventions → passive, past simple. Rules at school → modals aren't in the list, so
conditional ("If you run in the corridor…").

- 2–3 per topic. `target` exactly one of: `present simple`, `present continuous`, `past simple`, `past continuous`,
  `present perfect`, `present perfect continuous`, `past perfect`, `future (will)`, `future (going to)`,
  `future continuous`, `conditional`, `passive voice`, `relative clause`, `reported speech`,
  `comparatives & superlatives`, `question forms`.
- **Kids topics** (A1–A2) choose from: present simple, present continuous, past simple, future (going to),
  future (will), comparatives & superlatives, question forms, conditional (first conditional only, A2 topics).
- **Teen topics** (B1–B2) may use any, and should lean on the richer ones (present perfect, passive, conditionals,
  relative clauses, reported speech) where they truly fit.
- `why`: written for THIS topic, naming what the class will actually say (≤ 12 words). No two topics share a `why`.
- `example`: one sentence about the topic that clearly uses the target form (past simple needs a past verb, passive
  needs be + past participle, comparatives need -er/more/most/than, and so on). At the topic's easiest level.
- `present simple` and `question forms` are allowed only where they are genuinely the best fit (routines, facts,
  interviews, surveys), not as a default.

## Validator changes (fail on any)
- `present simple` on at most 35% of topics; `question forms` on at most 20%.
- At least 10 different targets each used on 8 or more topics.
- No `why` text repeated across topics; no `example` repeated.
- Form checks on examples (simple heuristics are fine): past simple contains a past-tense verb (-ed or a common
  irregular); passive contains a form of *be* + a past participle; comparatives contain *than*, *-er*, *more*, *most*
  or *-est*; present perfect contains *have/has* + participle; conditional contains *if*; going-to future contains
  *going to*; will-future contains *will/'ll*; present continuous contains *am/is/are* + *-ing*; relative clause
  contains *who/which/that/where*; reported speech contains *said/told/asked*.
- Kids topics use only the kids list above.
- Report the distribution of targets by age band, and 10 sample topics (title + fits) in the progress log so the
  review can start there.

## Rules
- Branch `codex/library-round-29` off `origin/main`. Commit by topic category (not one giant commit); don't push or
  merge; report.
- Run the validators, `pnpm test src/lib` and `tsc`.
- Only touch `src/data/topic-briefings.json`, validators in `scripts/`, and `docs/`.
