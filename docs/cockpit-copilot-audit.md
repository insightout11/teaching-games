# Cockpit Copilot Audit — Captain Suggestions + Spotlight (Jul 2026)

> **Build status (Jul 8)**: all five phases shipped in 66e8bf26; follow-up
> commit added the two remaining §2 items — tag-flip chips before sending a
> spotlight (AI suggestions + manual Needs Review picks) and the Crew Radio
> lane in the cockpit "Now" panel with a Clear action. Open question 2
> resolved as single-item replace (no feed) for v1.

Discussion doc, v2 (updated after owner feedback Jul 7).
Covers the teacher cockpit device (`/sessions/[id]/cockpit`): the Captain
Suggestions panel, the Spotlight ("Captain's Pick") flow, and the new
**student side channel**.

## Decisions from discussion (Jul 7)

- **Pro-gate** the AI copilot layer (auto-generated suggestion packs).
- **Do NOT interrupt the main task.** Cockpit prompts must never replace what's
  on the student device. Instead: a separate section on the student controller
  with a "something new" notification signal; students open it when *they*
  have time.
- **Soft incentives only.** No reward structure that favors wrong-type answers
  or makes AI-generated answers pay off. Recognition over points.
- **Spotlight: definitely upgrade.** Students can choose to appear **named or
  anonymous** when their submission is shown. Spotlighted items carry a **tag**
  (question / answer / idea / …).

Resolved in follow-up (same day):
- **Named by default** — anonymity is an opt-in preference + per-item override.
- **Zero points in v1** — recognition only; no participation tick anywhere.
- **All six tags** ship (Question / Answer / Idea / Example / Hot take / Wordcraft).
- **Side channel always available** — never suppressed during games; the badge
  is quiet enough to coexist with synchronous play.

---

## 1. What exists today (audit)

### The pipeline
- **UI**: `captain-suggestions-panel.tsx` — pull-only. Teacher taps refresh →
  POST `/api/session/captain-suggestions` → 3 cards (spotlight / question / poll),
  each with a one-tap launch.
- **Route**: reads `sessions.topic / custom_topic / difficulty / input_spec`
  plus the last 24 `student_submissions`. That is the ENTIRE context.
- **Prompt** (`captain-suggestions.ts`): "You are helping a busy English teacher
  run a live lesson. Lesson topic: ${topic} …" with tight word caps
  (title ≤5, rationale ≤14, prompt ≤26 words), temp 0.4, flash-lite.
- **Spotlight launch**: approves the submission → upserts
  `session_private_state key='spotlight'` → shared screen's `CaptainPickCard`
  shows a small bottom-center toast that **auto-dismisses after 5 seconds**.
- **Question launch**: pushes a textarea InputSpec (`captain-suggestion-question`,
  approval mode) — **this replaces the current task on every student device**,
  which is exactly the interference the side channel must remove.
- **Poll launch**: creates a `polls` row. Votes tallied live.

### Finding A — "General" is literal and it poisons the prompt
Three `|| 'General'` fallbacks (`captain-suggestions/route.ts:75`, its
`fallbackResponse()`, and `cockpit-view.tsx:179`). Sessions launched outside
the topic-writing path (or before the settings PATCH races through —
`session-view.tsx:1040-1058` documents this race) end up with the AI literally
told `Lesson topic: General`. The model produces general content because
that's what we asked for.

### Finding B — context starvation
The route ignores almost everything the session actually knows:

| Signal | Where it lives | Used today? |
|---|---|---|
| Current module + stage label | `input_spec.gameKey` (cockpit already maps it to a stage label for display!) | prompt gets only `input_spec.prompt` |
| What just happened: outcomes, mistakes, streaks | `scores` (outcome, accuracy_status, response_data, prompt_index) | no |
| Who is quiet / uncovered | `scores` coverage per student vs roster | no |
| Student questions waiting | `class_questions` | no |
| Latest poll + result | `polls` + votes | no |
| Vocab of the lesson / grammar target | generated content, lesson plan | no |
| Source material (video/text the lesson is grounded in) | **client-side only** (Zustand → per-request to generate routes) | impossible today |
| What's next in the flight plan | client-side only | impossible today |

The last two are the structural gap: the cockpit is a *separate device*, so any
lesson context it needs must live server-side. Nothing at launch persists a
lesson brief today.

### Finding C — no downtime awareness
The panel is pull-only and cold. The system already knows when downtime starts
(`input_spec → null`, module end) and does nothing with it. And on the student
side, downtime is invisible: students stare at a waiting screen.

### Finding D — no reason for students to engage
A cockpit question is extra work with no feedback loop of any kind — not even
acknowledgment. (Original doc proposed wiring into Scoring V2 points; per
owner: keep it soft — see §2.5.)

### Finding E — Spotlight is a 5-second toast
The highest-status moment the cockpit can create — "the captain picked YOUR
sentence" — renders as a small dismissable card for 5 seconds, no ceremony, no
name treatment, no follow-through, and no student control over how they appear.

### Finding F — fallbacks are generic by design
`buildFallbackCaptainSuggestions` ships "Examples / Problems / Solutions /
Personal opinions". Should become stage-aware once stage is in context.

---

## 2. Direction v2

One sentence: **a quiet side channel on the student device that fills downtime
without touching the main task, fed by a context-aware cockpit, with Spotlight
as the payoff moment.**

### 2.1 Kill "General" (immediate, cheap)
- Never send `Lesson topic: General`. If topic is missing, omit the line and
  instruct: "Infer the topic from the student writing below." Submissions are
  a better topic signal than a placeholder.
- Cockpit header: show class name instead of a fake topic.

### 2.2 Persist a Lesson Brief at launch (the enabler)
Write a compact server-readable brief at launch, e.g.
`session_private_state key='lesson-brief'` (table exists — **no migration**):

```
{ topic, goal, difficulty, tone,
  planSlots: [{ stageLabel, key, status }],   // done / current / next
  vocab: [...12 words],
  grammarTarget?,
  source?: { title, summary ≤ 800 chars } }
```

The launch flow has all of this client-side; it's one POST. Every server
feature (suggestions, class-questions AI-draft, end-of-session, logbook) then
knows what the lesson *is*.

### 2.3 Feed live telemetry into the suggestion prompt
All server-side already, just not queried: current + next stage, last ~20
score rows (outcomes, wrong answers), roster coverage (quiet students —
teacher-eyes-only rationale, never surfaced on the shared screen), open
`class_questions`, latest poll result. Rationales should cite the evidence
("4 wrong answers on past tense", "Ana quiet 15 min") — evidence-citing
rationales are what make the panel feel alive instead of generic.

**Anti-AI-answer bias baked into the prompt**: prefer personal / opinion /
prediction / creative micro-prompts ("which would YOU choose, in one
sentence?") over fact-lookup questions. Personal prompts are worthless to
paste into a chatbot; fact questions are cheat-bait. Short caps (≤ 1–2
sentences) also make copying pointless.

### 2.4 The Side Channel (new — the core structural change)
A second, non-interrupting lane to the student device.

- **Delivery**: a parallel `side_spec` alongside `input_spec` (same
  write-via-API / read-with-no-store pattern). Pushing to the side channel
  never touches the main task; clearing devices doesn't clear it (and vice
  versa).
- **Student UI**: a collapsed section/tab on the controller — always present,
  never modal. When something new lands, a signal (badge dot + subtle pulse,
  Lucide icon, no sound) appears. Student opens it *when they have time*:
  finished early, waiting for teammates, between modules. Opening shows the
  current side prompt (poll, micro-write, "react to the spotlight"), they
  answer, it collapses again.
- **Naming (aviation-true options)**: *Crew Radio* (messages from the
  captain), *Side Mission*, *Crew Lounge*. Leaning **Crew Radio** — "the
  captain is on the radio" justifies the notification signal and the
  optional/ambient nature.
- **Teacher side**: cockpit suggestion cards get a destination: most launch to
  the side channel by default; taking over the main screen becomes the
  explicit, rarer choice. The "Now" panel shows what's on each lane.
- **Fast finishers**: this also quietly solves a different problem — students
  who finish a module early get somewhere productive to go, per student, even
  when the *class* isn't in downtime.

### 2.5 Incentives: soft, recognition-first
Per owner: don't over-incentivize; never reward wrong-type answers; don't make
AI-pasted answers profitable.

- **No accuracy points, no leaderboard stakes** for side-channel responses.
- The reward is **being seen**: your answer can appear on the shared screen
  (approved), get spotlighted, or get quoted in the next prompt. Recognition,
  not currency.
- **Zero points in v1** (decided): no participation tick either. The teacher's
  coverage view can still *count* side-channel responses as activity signal
  without awarding anything to students. Revisit only if engagement proves too
  low in real classrooms.
- Prompt design (§2.3) is the real anti-cheat: personal/opinion/short prompts
  have no AI shortcut worth taking.
- Spotlight remains special but as **status, not score** for now. (If Scoring
  V2 outcomes ever attach, "standout" is the natural fit — deferred.)

### 2.6 Spotlight as a ceremony (with consent and tags)
Rebuild `CaptainPickCard` into a real shared-screen moment:

1. **Reveal** (~3s): full-width takeover in the flight design language —
   amber sweep, "CAPTAIN'S PICK" stamp landing (same physics as the passport
   stamps), the quoted text center-stage with the key phrase highlighted (AI
   supplies phrase + reason label: "Best use of 'nevertheless'", "Bravest
   claim").
2. **Attribution respects the student's choice**: named ("Maria") or
   anonymous ("A crew member"). See consent model below.
3. **Dock, don't vanish**: after the reveal it docks to a corner chip
   (✦ + name-or-anon + tag) that stays until the teacher dismisses it or the
   next pick replaces it. The 5-second auto-vanish is the single biggest waste
   of the feature today.
4. **Chained follow-up via the side channel** (non-interrupting): one tap in
   the cockpit sends "React: agree/disagree with the picked idea" or
   "Upgrade it: rewrite using one of today's words" to the side channel —
   a 3–5 minute downtime arc about a classmate's idea, zero prep, main task
   untouched.

**Name/anonymous consent — options:**
- (a) **At submission time**: a small toggle on side-channel submissions
  ("show my name if shared" / "share anonymously"). Zero latency at spotlight
  time; the choice is made calmly, in advance.
- (b) **Per-student preference**: set once in the controller, applies to all
  submissions; overridable per submission.
- (c) Live consent ping when picked — rejected: delays the beat, puts the
  student on the spot, and a non-answer stalls the teacher.
- Decided: **(b) with (a) as the override** — per-student default preference
  plus per-item toggle. **Named by default; anonymity is opt-in.** Anonymous
  picks render as "A crew member".

**Tags** — what kind of contribution is this? Drives the card label, color,
and which follow-up makes sense:

| Tag | Card reads | Natural follow-up |
|---|---|---|
| Question | "Crew Question" | class answers it (side channel) |
| Answer | "Crew Answer" | agree/disagree react |
| Idea | "Bright Idea" | build on it / upgrade it |
| Example | "Great Example" | who can top it? |
| Hot take | "Hot Take" | class votes agree/disagree |
| Wordcraft | "Wordcraft" (great language use) | steal the phrase in your own sentence |

Tag source: the AI proposes one when suggesting a spotlight; the teacher can
flip it in the cockpit before sending (one tap, chips). For manual spotlights
from the Needs Review list, default by origin (class_questions → Question,
poll/write → Answer/Idea) with the same one-tap override.

### 2.7 Downtime-native + Pro gating
- **Pro**: when `input_spec` goes null or a module ends, pre-generate one
  suggestion pack in the background so the cockpit is warm — cards already
  there when the teacher looks. Throttled: once per standby entry, reuse until
  lesson state changes.
- **Free**: manual "Suggest" tap stays (current behavior, but with the Phase-1
  context upgrades — free users still stop seeing generic output).
- Spotlight ceremony + side channel are product surface, not AI spend —
  **not Pro-gated**.

---

## 3. Suggested sequencing

| Phase | Contents | Depends on |
|---|---|---|
| 1. De-genericize | Kill 'General'; stage/scores/class-questions/poll telemetry in the prompt; anti-AI-answer prompt bias; stage-aware fallbacks; evidence-citing rationales | nothing (all data server-side today) |
| 2. Spotlight ceremony | Reveal + stamp + docked chip; tags; name/anonymous preference + per-item toggle | nothing (private_state exists) |
| 3. Side channel | `side_spec` lane + Crew Radio section on the controller + cockpit destination choice; spotlight follow-ups route here | design of student controller section |
| 4. Lesson brief | Persist brief at launch; suggestions read it (vocab recycle, bridge-to-next, source-grounded prompts) | launch-flow touch |
| 5. Pro downtime packs | Standby pre-generation, cockpit standby panel | phases 1–4 |

Phases 1+2 are self-contained and deliver most of the felt improvement;
phase 3 is the structural piece that makes the whole thing classroom-safe to
use *during* activities, not just between them.

---

## 4. Open questions

Resolved (Jul 7): named by default · zero points in v1 · all six tags ·
side channel always available.

Still open (minor, can be settled during build):
1. **Side-channel naming + placement**: Crew Radio? Where on the student
   controller — bottom tab, collapsible banner above the task, or corner
   badge that expands?
2. **Side-channel content lifetime**: does one prompt replace the previous, or
   is there a short scrollable feed of the last 2–3 prompts for late openers?
