# Pedagogy Fit & Lesson Templates Report

**LessonCaptain — Internal Design Document**
Generated: 2026-02-27

---

## Table of Contents

1. [Best-Fit Pedagogical Framework Recommendation](#1-best-fit-pedagogical-framework-recommendation)
2. [Lesson Plan Templates](#2-lesson-plan-templates)
3. [Lesson Flow Diagrams](#3-lesson-flow-diagrams)
4. [Goal → Template Mapping](#4-goal--template-mapping)
5. [Gaps & Smallest Additions](#5-gaps--smallest-additions)
6. [Implementation Path](#6-implementation-path)

---

## Codebase Inventory (Reference)

### Active Games (10)

| Key | Category | Skills | Max Pts | Default Timer |
|-----|----------|--------|---------|---------------|
| vocab-sprint | vocabulary | Vocabulary, Precision, Context | 10 | 30s |
| synonym-showdown | vocabulary | Vocabulary, Speed, Word Knowledge | 10 | 30s |
| word-chain | vocabulary | Vocabulary, Association, Creativity | 10 | 20s |
| sentence-scramble | grammar-writing | Grammar, Sentence Structure | 10 | 30s |
| grammar-boss | grammar-writing | Grammar, Speaking, Fluency | 10 | 45s |
| error-hunter | grammar-writing | Grammar, Proofreading, Attention | 10 | 60s |
| story-sprint | grammar-writing | Creative Writing, Grammar, Storytelling | 10 | 60s |
| dialogue-detective | logic-puzzles | Speaking, Pragmatics, Context | 10 | 45s |
| connections | logic-puzzles | Critical Thinking, Vocabulary, Patterns | 45 | 120s |
| twenty-questions | logic-puzzles | Critical Thinking, Questioning, Deduction | 15 | 30s |

### Active Activities (8)

| Key | Category | Est. Time | Skills |
|-----|----------|-----------|--------|
| would-you-rather | icebreaker | 10 min | Speaking, Critical Thinking, Debate |
| two-truths | icebreaker | 10 min | Speaking, Critical Thinking, Listening |
| rank-it | icebreaker | 12 min | Speaking, Critical Thinking, Collaboration |
| fact-detective | learning | 12 min | Vocabulary, Critical Thinking, Listening |
| expert-panel | learning | 15 min | Speaking, Vocabulary, Role-play |
| scenario-simulator | practice | 20 min | Speaking, Collaboration, Role-play |
| hot-take-arena | debate | 15 min | Speaking, Debate, Persuasion |
| problem-solvers | practice | 20 min | Speaking, Collaboration, Creativity |

### Session Metadata Available Today

- `difficulty`: Beginner–Expert (A1→C2)
- `topic`: preset enum + `customTopic` (free text)
- `tone`: Neutral / Casual / Formal / Humorous / Professional / Kid-friendly
- `timerSeconds`: 20 / 30 / 60
- Data captured per round: points, `is_correct`, streak, `responseData` (AI quality score, position, leaderboard rank)
- No cross-session persistence today (sessionStorage), but Supabase infrastructure is available for future lesson run summaries

---

## §1 Best-Fit Pedagogical Framework Recommendation

### Recommendation: PPP as Default, Retrieval Practice as Secondary Toggle

**Presentation–Practice–Production (PPP)** is the best-fit default framework for LessonCaptain. The existing slot structure already maps to PPP phases with no structural changes required — only relabelling.

#### Critical Phase Assignment (Corrected)

The key insight that makes this mapping work cleanly:

- **Activities = Production** — scenario-simulator, problem-solvers, hot-take-arena, and rank-it demand open-ended communicative output. Students choose their own language, improvise, justify, and negotiate meaning. This is Production by definition.
- **Games = Practice** — vocab-sprint, grammar-boss, sentence-scramble, error-hunter, and all retrieval games are form-focused, scaffolded, and provide immediate corrective feedback. They sit in the Practice phase, not Free Production. The competitive pressure and AI scoring add accountability without requiring unprompted output.
- **Icebreaker activities = Warm-up** (pre-PPP) — would-you-rather, two-truths serve as affective warm-up and schema activation, not a PPP phase proper.

#### 8 Justification Points for PPP

1. **Structural alignment**: The existing 5-slot sequence (Icebreaker → Learning → Practice/Debate → Game 1 → Game 2) already follows the PPP arc. No slot reordering needed — only label updates in the planner UI.
2. **Teacher mental model**: PPP is the most widely taught framework in CELTA/DELTA and adult ESL teacher training globally. Teachers recognise it immediately, reducing onboarding friction.
3. **Activities cover Production**: The 4 practice/debate/learning activities provide genuine communicative production — a gap that game-only platforms cannot fill.
4. **Games cover controlled and free Practice**: With difficulty and timer controls, games can be tuned from heavily scaffolded (Beginner, 60s) to fast and pressured (Expert, 20s), covering both controlled and freer practice sub-phases.
5. **Topic coherence**: LessonCaptain's `topic` parameter ensures all slots — icebreaker, game, activity — share the same lexical field, creating the repetition-across-contexts that PPP depends on.
6. **Feedback loops**: Every game provides immediate AI-scored feedback (is_correct, points), which is the corrective feedback mechanism PPP assumes in the Practice phase.
7. **Session data maps cleanly**: `is_correct` and `points` in Practice (games) and qualitative AI scoring in Production (activities) give teachers distinct feedback types for distinct phases — exactly what PPP expects.
8. **Lowest barrier to adoption**: PPP requires no new features to ship as a default. The lesson planner can show PPP phase names against existing slots today.

#### Secondary Mode: Retrieval Practice (Review Mode Toggle)

All 10 games are amenable to retrieval practice. When a teacher selects "Review Mode" in the lesson planner, the template restructures slots to run 3–4 retrieval game rounds with spaced topic variation, replacing the Activities-heavy default. No infrastructure changes needed; this is a template configuration, not a new game type.

#### Framework Notes: What Was Evaluated and Why It's Secondary or Future

**Task-Based Language Teaching (TBLT)**: scenario-simulator, problem-solvers, and hot-take-arena are authentic communicative tasks that would qualify. The missing piece is a **report phase** — a post-task moment where students reflect, present, or submit a written artifact from the task. Without an Exit Ticket or equivalent, the TBLT cycle is incomplete. Treat TBLT as "the next evolution" once Exit Ticket ships. See §5.

**Mastery Learning**: Cross-session criterion gates are impossible today (no session history in storage). However, an **in-session micro-mastery loop** is achievable now: if `is_correct` rate falls below a threshold after Slot 4, the lesson planner can suggest repeating a retrieval game before the session closes. Frame this as an in-session feedback signal, not full mastery gating.

**Direct Instruction / Gradual Release of Responsibility (GRR)**: The PPP Presentation phase already covers what DI/GRR would provide. Adding a separate DI framework would fragment the teacher's mental model without adding capability. Recommended: rebrand "Presentation" in PPP tooltips to acknowledge explicit instruction, rather than creating a parallel framework.

---

## §2 Lesson Plan Templates

### Template A: PPP 5-Slot (Standard, 60 min)

Recommended for most classes. Suitable for 50–65 minute sessions with 6–25 students.

| Slot | PPP Phase | Teacher Goal | Student Does | Data Captured | Best-Fit Content (ranked) |
|------|-----------|--------------|--------------|---------------|---------------------------|
| 1 | Warm-up | Activate schema; lower affective filter | Responds to low-stakes prompts; shares opinion or fact | — (no scoring) | would-you-rather, two-truths, rank-it |
| 2 | Presentation | Introduce or surface target language in context | Observes, listens, reads AI-generated examples | — (teacher-led) | fact-detective, expert-panel |
| 3 | Controlled Practice | Drill target form with corrective feedback | Answers AI-scored prompts under time pressure | is_correct, points, streak | vocab-sprint, sentence-scramble, grammar-boss, error-hunter |
| 4 | Free Practice | Extend language with less scaffolding | Competes in longer, more inferential game | is_correct, points, position | connections, dialogue-detective, twenty-questions, story-sprint |
| 5 | Production | Use language freely and communicatively | Speaks, debates, collaborates in open activity | AI quality score, participation flag | scenario-simulator, hot-take-arena, problem-solvers |

**Session config recommendation**: difficulty matches target learner level; topic consistent across all slots; tone adjusted to register goal (formal for exam prep, casual for confidence building).

---

### Template B: PPP 4-Slot (Compact, 45 min)

For shorter sessions or when Production needs more time. Merges Controlled and Free Practice.

| Slot | PPP Phase | Teacher Goal | Student Does | Data Captured | Best-Fit Content (ranked) |
|------|-----------|--------------|--------------|---------------|---------------------------|
| 1 | Warm-up | Activate topic knowledge quickly | Responds to 1 fast icebreaker | — | would-you-rather, two-truths |
| 2 | Presentation + Controlled Practice | Surface and drill target language together | Plays one shorter, scaffolded game | is_correct, points | vocab-sprint, grammar-boss, sentence-scramble |
| 3 | Free Practice | Push toward autonomous use | Plays one inferential or creative game | is_correct, points, position | connections, twenty-questions, dialogue-detective |
| 4 | Production | Open communicative output | Runs one activity that requires unprompted speech | AI quality score | scenario-simulator, hot-take-arena, problem-solvers |

**Pacing note**: Activities have wide time variance (10–20 min). PPP 4-slot is the safer choice for 45-minute classes — slot 4 can be cut to 10 minutes with would-you-rather or hot-take-arena if time runs short.

---

### Template C: Retrieval Practice 5-Slot (Review Mode, 60 min)

For exam review, vocabulary consolidation, or returning to a previous topic. All slots are game-based; no extended production activity.

| Slot | Retrieval Phase | Teacher Goal | Student Does | Data Captured | Best-Fit Content (ranked) |
|------|-----------------|--------------|--------------|---------------|---------------------------|
| 1 | Warm Retrieval | Surface prior knowledge; low pressure | Fast, familiar game to orient | is_correct, points | vocab-sprint, word-chain |
| 2 | Spaced Recall 1 | Retrieve target vocab from prior lesson | Varied-difficulty game on same topic | is_correct, streak | synonym-showdown, sentence-scramble |
| 3 | Spaced Recall 2 | Retrieve grammar / contextual use | Game with higher inference demand | is_correct, points | grammar-boss, error-hunter, dialogue-detective |
| 4 | Interleaved Challenge | Mix vocab + grammar + logic | Broad-category game requiring category switching | is_correct, position | connections, twenty-questions |
| 5 | Transfer Test | Apply retrieved knowledge in new context | Timed creative or production game | AI quality score | story-sprint, word-chain (new topic variant) |

**Review Mode config**: Use same `topic` across slots 1–4, then shift to a related or extension topic in slot 5 to test transfer.

---

### Template D: Retrieval Practice 4-Slot (Compact Review, 45 min)

| Slot | Retrieval Phase | Teacher Goal | Student Does | Data Captured | Best-Fit Content (ranked) |
|------|-----------------|--------------|--------------|---------------|---------------------------|
| 1 | Warm Retrieval | Quick schema activation for the review topic | Fast retrieval game | is_correct, points | vocab-sprint, synonym-showdown |
| 2 | Core Recall | Retrieve primary target items at depth | Longer game with streaks | is_correct, streak | grammar-boss, sentence-scramble, error-hunter |
| 3 | Inference + Category | Connect retrieved items to broader patterns | Categorisation or deduction game | is_correct, position | connections, dialogue-detective |
| 4 | Transfer | Use retrieved knowledge creatively | Open-ended game or light activity | AI quality score | story-sprint, twenty-questions |

---

## §3 Lesson Flow Diagrams

### PPP Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PPP LESSON ARC (60 min)                      │
└─────────────────────────────────────────────────────────────────┘

  WARM-UP              PRESENTATION         CONTROLLED           FREE                PRODUCTION
  (Slot 1)             (Slot 2)             PRACTICE             PRACTICE            (Slot 5)
  ~10 min              ~12 min              (Slot 3)             (Slot 4)            ~15 min
                                            ~10 min              ~10 min

  ┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐        ┌──────────┐
  │Icebreaker│ ──────► │ Learning │ ──────► │  Game    │ ──────► │  Game    │ ─────► │ Activity │
  │ Activity │         │ Activity │         │(Scaff'd) │         │(Inferent)│        │(Open)    │
  │          │         │          │         │          │         │          │        │          │
  │Low stakes│         │Context + │         │Drills +  │         │Less      │        │Unscripted│
  │Opinion   │         │Examples  │         │Feedback  │         │Support   │        │Output    │
  └──────────┘         └──────────┘         └──────────┘         └──────────┘        └──────────┘

  Affective            Schema               is_correct           is_correct           AI quality
  filter down          built                points               position             score
  Schema activated     Language seen        streak               streak
```

### Retrieval Practice Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              RETRIEVAL PRACTICE LESSON ARC (60 min)             │
└─────────────────────────────────────────────────────────────────┘

  WARM                 SPACED               SPACED               INTERLEAVED          TRANSFER
  RETRIEVAL            RECALL 1             RECALL 2             CHALLENGE            TEST
  (Slot 1)             (Slot 2)             (Slot 3)             (Slot 4)             (Slot 5)
  ~8 min               ~12 min              ~12 min              ~15 min              ~10 min

  ┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐        ┌──────────┐
  │  Fast    │ ──────► │ Vocab    │ ──────► │ Grammar  │ ──────► │ Mixed    │ ─────► │ Creative │
  │  Game    │         │ Game     │         │ Game     │         │ Category │        │ Transfer │
  │          │         │          │         │          │         │ Game     │        │ Game     │
  │Familiar  │         │Same topic│         │Same topic│         │Broader   │        │New topic │
  │Low press.│         │+spacing  │         │+spacing  │         │Switching │        │variant   │
  └──────────┘         └──────────┘         └──────────┘         └──────────┘        └──────────┘

  Prior                Retrieval            Retrieval            Interleaving         Transfer
  knowledge            cue 1                cue 2                effect               test
  surfaced             ↓ is_correct         ↓ is_correct         ↓ position           ↓ quality
```

### In-Session Micro-Mastery Loop

```
                         After Slot 4
                              │
                              ▼
                    ┌─────────────────┐
                    │  is_correct     │
                    │  rate < 60%?    │
                    └────────┬────────┘
                             │
               ┌─────────────┴─────────────┐
               │ YES                       │ NO
               ▼                           ▼
    ┌────────────────────┐      ┌────────────────────┐
    │  Suggest:          │      │  Proceed to         │
    │  Repeat retrieval  │      │  Production slot   │
    │  game (same topic) │      │  (or close session)│
    │  before closing    │      │                    │
    └────────────────────┘      └────────────────────┘
```

---

## §4 Goal → Template Mapping

Eight teacher goals mapped to the recommended template and primary slots.

| # | Teacher Goal | Default Template | Primary Slots | Top Content Picks |
|---|-------------|-----------------|---------------|-------------------|
| 1 | **Vocabulary range** — build breadth across a topic | PPP 5-slot (A) | Slots 2, 3 | vocab-sprint, synonym-showdown, word-chain, connections |
| 2 | **Grammar accuracy** — reduce systematic errors | PPP 5-slot (A) | Slots 3, 4 | grammar-boss, sentence-scramble, error-hunter, dialogue-detective |
| 3 | **Speaking fluency** — increase rate and confidence | PPP 4-slot (B) | Slots 2, 4 | grammar-boss (speaking mode), story-sprint, scenario-simulator |
| 4 | **Debate & persuasion** — structured argumentation | PPP 4-slot (B) | Slots 3, 4 | hot-take-arena, would-you-rather, rank-it, problem-solvers |
| 5 | **Listening & inference** — extract meaning from context | PPP 5-slot (A) | Slots 2, 4 | fact-detective, dialogue-detective, expert-panel, connections |
| 6 | **Exam review** — fast retrieval under time pressure | Retrieval 5-slot (C) | All slots | vocab-sprint, grammar-boss, error-hunter, connections, sentence-scramble |
| 7 | **Confidence / low-anxiety speaking** — reduce apprehension | PPP 4-slot (B) | Slots 1, 4 | would-you-rather, two-truths, word-chain, story-sprint |
| 8 | **Critical thinking + justification** — reason and explain | PPP 5-slot (A) | Slots 4, 5 | twenty-questions, connections, hot-take-arena, scenario-simulator |

**Reading the table**: The "primary slots" are where this goal gets the most direct instruction and practice. Other slots still contribute; these are where content selection matters most for the stated goal.

---

## §5 Gaps & Smallest Additions

### Gap 1: No Production Artifact

Students never submit a lesson-closing extended output. Every game produces a score; every activity produces spoken interaction. But there is no moment where students write, record, or submit something that captures what they can do independently at the end of the lesson.

**Impact**: The PPP arc technically closes when Production ends, but without an artifact, teachers have no formative evidence of Production quality beyond the AI quality score logged during the activity. TBLT is unimplementable (no report phase). Exam-prep lessons have no closing performance task.

### Gap 2: No Exit Ticket / Formative Close

Related but distinct: there is no structured "what did you learn / what can you do now?" moment. The lesson ends when the last game or activity ends. This means:

- No formative assessment data for the teacher
- No metacognitive moment for the student
- No data for future spaced repetition
- PPP Production is activity-quality scored but not lesson-goal-aligned

### Smallest Addition: Exit Ticket Activity

One new activity bridges both gaps. Specification:

**Name**: Exit Ticket
**Category**: practice (or new category: `reflection`)
**Estimated time**: 5–8 min
**Slot position**: Always last (Slot 5 in 5-slot, Slot 4 in 4-slot compact)

**How it works**:
1. AI generates 1–2 short prompts from the session's `topic` and `skill_focus` metadata (e.g., "Use three words from today's topic in one sentence about your daily life" or "Explain why [topic argument from hot-take-arena] in your own words")
2. Students submit 1–2 sentences via the existing student text input flow (reuse `inputType: 'textarea'`)
3. AI gives quick per-submission feedback (correctness, vocabulary use, one suggestion)
4. Teacher gets a compact dashboard view: all submissions + AI feedback in one panel
5. Stored in Supabase (not sessionStorage) — reuse Class Questions infrastructure (`student_submissions` table, `gameKey: 'exit-ticket'`)

**Why this is the smallest addition**:
- Student input flow: already built (`POST /api/student/submit`, textarea input)
- AI feedback: pattern already exists in grammar-boss and story-sprint quality scoring
- Teacher dashboard: Class Questions widget pattern is reusable
- Storage: `student_submissions` table already has the right shape; no migration needed beyond a `gameKey: 'exit-ticket'` convention

**What this unlocks**:
- PPP: Production phase now has a closing artifact, not just activity participation
- TBLT: The Exit Ticket IS the report phase — TBLT becomes implementable
- Mastery: Exit Ticket submissions give cross-session evidence if stored with `session_id`
- Spaced repetition: Exit Ticket content can seed next session's Warm Retrieval slot

### Stretch Addition (if any)

Nothing else is needed at this stage. One activity suffices. The architectural work (phase_tag metadata, skill_focus filters, goal-based recommender) described in §6 enables smarter templating but does not require new UI-facing features beyond metadata updates.

---

## §6 Implementation Path

### Immediate (No Code Changes Required)

These changes are configuration or copy changes only:

1. **Relabel slot headers** in the lesson planner UI to PPP phase names:
   - Slot 1: "Warm-up"
   - Slot 2: "Presentation"
   - Slot 3: "Controlled Practice"
   - Slot 4: "Free Practice / Game"
   - Slot 5: "Production / Optional Game"

2. **PPP template = existing default slot order** — no reordering needed. The existing hardcoded slot structure already matches PPP. Confirm this is the displayed default in the planner.

3. **Add "Review Mode" toggle** — when selected, planner swaps slot labels to Retrieval Practice phase names and filters content list to games only. No new games needed.

### Soon (Metadata Additions)

Add the following fields to the game and activity registries (and eventually to the DB if content becomes dynamic):

```typescript
// Proposed metadata additions to GameConfig / ActivityConfig

phase_tag: 'warm-up' | 'presentation' | 'controlled-practice' | 'free-practice' | 'production' | 'retrieval'
// Indicates which PPP/Retrieval phase this content is best suited for

skill_focus: ('vocabulary' | 'grammar' | 'speaking' | 'listening' | 'writing' | 'pragmatics')[]
// Primary skills targeted (array, can have 2–3)

energy_level: 'low' | 'medium' | 'high'
// Helps with pacing: don't follow two 'high' energy slots back-to-back

device_required: boolean
// false for activities that work with a single teacher screen; true for games requiring student devices

time_to_run_minutes: number
// Already exists as estimatedMinutes on activities; add to games (vocab-sprint=5, connections=10, etc.)
```

These metadata fields enable:
- Automatic slot-filling recommendations ("best fit for this phase")
- Goal-based filtering (§4 Goal → Template Mapping becomes dynamic)
- Pacing warnings ("two high-energy slots in a row")

### Future (Cross-Session Features)

1. **Lesson run summary → Supabase**: Store per-session aggregates (topic, difficulty, games played, mean is_correct, activity quality scores) in a `lesson_runs` table. Supabase infrastructure is already in place; this is a schema addition + write call at session end.

2. **Spaced repetition using cross-session history**: Once lesson run summaries exist, the planner can surface "you taught [topic] 2 weeks ago — run a Retrieval template today." No ML needed; recency + is_correct rate is sufficient signal.

3. **Goal-based recommender**: Once `phase_tag` and `skill_focus` metadata are in place and lesson goals are captured (teacher selects from the 8 goals in §4), the planner can auto-fill slots with ranked content matches. This is a filter + sort operation over the registry, not a recommendation engine.

### Risk Register

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Mixed-level class: games don't adapt mid-round | Medium | `difficulty` filter at session config helps; add per-slot difficulty override in planner |
| Limited devices: some games require student phones | Low–Medium | `device_required` metadata lets planner warn teacher; activities work device-free |
| Pacing overrun: activities have 10–20 min variance | Medium | PPP 4-slot (Template B) is the safer default for 45-min classes; Exit Ticket at 5–8 min is predictable |
| PPP misunderstood: teachers treat Games as Production | Low | Tooltip / onboarding copy must be explicit: "Games = Practice (form-focused); Activities = Production (communicative)" |
| Exit Ticket adoption: feels like homework | Low | Framing matters: "1–2 sentences, instant feedback, anonymous option"; keep it under 5 min |

---

## Summary

| Decision | Recommendation |
|----------|----------------|
| Default pedagogical framework | PPP |
| Secondary mode | Retrieval Practice (Review Mode toggle) |
| Activities phase assignment | Production (open communicative output) |
| Games phase assignment | Practice (form-focused, scaffolded, corrective feedback) |
| TBLT status | Future-ready; blocked on Exit Ticket report phase |
| Mastery Learning status | In-session micro-mastery feasible now; cross-session requires lesson run summaries |
| Smallest feature addition | Exit Ticket activity (reuses existing student input + Class Questions infrastructure) |
| Immediate UI change | Relabel slots to PPP phase names in lesson planner |
| Next metadata additions | phase_tag, skill_focus, energy_level, device_required, time_to_run_minutes |
