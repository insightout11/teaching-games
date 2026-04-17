# LessonCaptain Repo Extraction Report
*Generated from codebase inspection — March 26, 2026*

---

## 1. Activity / Game Inventory

### Games — 11 active, 1 vaulted

| Name | Key | Category | Status | PPP Stage | AI? | Scoring | Timer | Pro? |
|---|---|---|---|---|---|---|---|---|
| Vocab Sprint | `vocab-sprint` | Vocabulary | Implemented | Practice | Y | Vote | 30s | No |
| Synonym Showdown | `synonym-showdown` | Vocabulary | Implemented | Practice | Y | Vote | 30s | No |
| Word Chain | `word-chain` | Vocabulary | Implemented | Practice | Y | Team | 30s | No |
| Grid Rush | `grid-rush` | Vocabulary | Implemented | Practice | Y | Submit | 30s | No |
| Sentence Scramble | `sentence-scramble` | Grammar | Implemented | Practice | Y | Vote | 30s | No |
| Error Hunter | `error-hunter` | Grammar | Implemented | Practice | Y | Submit | 30s | No |
| Dialogue Detective | `dialogue-detective` | Grammar | Implemented | Practice/Production | Y | Submit | 30s | No |
| Connections | `connections` | Logic/Puzzles | Implemented | Practice | Y | Submit | 30s | No |
| Grammar Boss | `grammar-boss` | Grammar | Implemented | Practice | Y | Submit | 30s | **YES** |
| Story Sprint | `story-sprint` | Grammar/Writing | Implemented | Production | Y | Submit | 30s | **YES** |
| Twenty Questions | `twenty-questions` | Logic/Puzzles | Implemented | Production | Y | Discussion | 30s | No |
| ~~Tone Transformer~~ | `tone-transformer` | Grammar | **VAULTED** | Practice | Y | Vote | — | No |

*Vaulted = code preserved in `src/games/tone-transformer/`, not registered. Reason: overlaps Vocab Sprint, requires teacher transcription.*

**Launch path for all games:** Activity picker in SessionView (manual), or auto-sequenced via Flight Plan module slots.

---

### Activities — 21 confirmed active, 1 vaulted

#### Takeoff / Icebreaker / Presentation

| Name | Key | Status | PPP | Launch | AI? | Pro? |
|---|---|---|---|---|---|---|
| Mission Selector | `mission-selector` | Implemented | Presentation | Auto-start as takeoff in flight plans | Y | No |
| Grammar Check-In | `grammar-check-in` | Implemented | Presentation | Takeoff selection (grammar lessons) | Y | No |
| Vocab Radar | `vocab-radar` | Implemented | Presentation | Takeoff selection (vocab lessons) | Y | No |
| Prediction Round | `prediction-round` | Implemented | Presentation | Takeoff selection | Y | No |
| Quick Pulse | `quick-pulse` | Implemented | Presentation | Takeoff or Landing selection | Y | No |
| Character Cards | `character-cards` | Implemented | Presentation | Takeoff selection | Y | **YES** |

#### Core Activities (Production / Practice)

| Name | Key | Status | PPP | Launch | AI? | Pro? |
|---|---|---|---|---|---|---|
| Would You Rather | `would-you-rather` | Implemented | Production | Activity picker, mission-aware | Y | No |
| Two Truths | `two-truths` | Implemented | Practice | Activity picker | Y | No |
| Rank It | `rank-it` | Implemented | Practice | Activity picker | Y | No |
| Fact Detective | `fact-detective` | Implemented | Practice | Activity picker | Y | **YES** |
| Expert Panel | `expert-panel` | Implemented | Production | Activity picker, mission-aware | Y | **YES** |
| Scenario Simulator | `scenario-simulator` | Implemented | Production | Activity picker, mission-aware | Y | **YES** |
| Problem Solvers | `problem-solvers` | Implemented | Production | Activity picker | Y | **YES** |
| Hot Take Arena | `hot-take-arena` | Implemented | Production | Activity picker, mission-aware | Y | **YES** |
| Scene Igniter | `scene-igniter` | Implemented | Production | Activity picker or takeoff | Y | **YES** |

#### Landing / Closing

| Name | Key | Status | PPP | Launch | AI? | Pro? |
|---|---|---|---|---|---|---|
| Mic Drop | `mic-drop` | Implemented | Landing | Auto or manual landing selection | Y | No |
| Lightning Round | `lightning-round` | Implemented | Landing | Auto or manual landing | Y | No |
| Opinion Shift | `opinion-shift` | Implemented | Landing | Landing, mission-aware | Y | No |
| Grammar Proof | `grammar-proof` | Implemented | Landing | Landing (grammar lessons) | Y | No |
| Final Word | `final-word` | Implemented | Landing | Landing | Y | No |
| Final Answer | `final-answer` | Implemented | Landing | Auto or manual landing | Y | **YES** |

*Vaulted activity:* **Interview Lab** — code in `src/activities/interview-lab/`, not registered. Reason: teacher transcription required, AI latency.

---

## 2. Test Flight / Lesson Flow Candidates

### How sequences work

| File | Purpose |
|---|---|
| `src/lib/flight-plan-presets.ts` | 7 named fixed presets |
| `src/lib/flight-plan-config.ts` | 34-item metadata registry driving dynamic planning |
| `src/stores/planner-store.ts` | `suggestModules()` greedy algorithm fills slots for custom plans |
| `src/app/(dashboard)/lesson-planner/page.tsx` | Planner UI entry point |
| `src/app/api/lesson-plan/generate/route.ts` | Bulk AI pre-generation for all modules at session start |

**Dynamic vs fixed:** Presets are fixed sequences. Custom plans are built by the planner UI + algorithm and stored in sessionStorage/Zustand before the session starts. Not stored in the database as templates — ephemeral per session.

---

### The 7 Preset Flight Plans

| Preset Key | Duration | Goal | Takeoff | Modules (in order) | Landing | Free? |
|---|---|---|---|---|---|---|
| `grammar-clinic-45` | 45 min | Grammar | Grammar Check-In | Error Hunter → Grammar Boss | Grammar Proof | Free core; Grammar Boss is Pro |
| `speaking-circle-60` | 60 min | Speaking | Character Cards | Quick Pulse → Scenario Simulator → Dialogue Detective | Final Word | **Pro** |
| `debate-ready-60` | 60 min | Discussion | Auto-assigned | Prediction Round → Hot Take Arena → Connections | Opinion Shift | **Pro** |
| `vocab-blitz-45` | 45 min | Vocabulary | Vocab Radar | Synonym Showdown → Vocab Sprint | Final Answer | **Pro** (Final Answer) |
| `game-day-60` | 60 min | Games | *(skipped)* | Vocab Sprint → Connections → Grid Rush → Sentence Scramble → Twenty Questions | *(skipped)* | Free/Mixed |
| `creative-sprint-60` | 60 min | Creativity | Character Cards | Quick Pulse → Story Sprint | Final Word | **Pro** |
| `think-tank-60` | 60 min | Critical Thinking | Auto-assigned | Fact Detective → Connections → Twenty Questions | Opinion Shift | **Pro** (Fact Detective) |

**All 7 appear coded and usable now.** Whether they have been end-to-end tested live is unknown — needs Matt confirmation.

---

## 3. Presets / Templates / Starter Configs

| Item | File | Purpose | Stability |
|---|---|---|---|
| 7 Flight Plan Presets | `src/lib/flight-plan-presets.ts` | Named lesson templates, loadable via PresetCard in planner | Stable — static objects |
| Flight Plan Config (34 items) | `src/lib/flight-plan-config.ts` | Metadata driving slot assignment, pairing rules, goal fit | Stable — static config |
| Session Settings defaults | `src/stores/session-store.ts` | difficulty: Easy, topic: General, timerSeconds: 30, scoringMode: competitive | Stable |
| Spin Wheel segments | `src/stores/session-store.ts` | x1 (40%), x2 (25%), x3 (5%), +5 (15%), Shield (15%) | Stable |
| Topic enum | session-store or constants | 14 fixed topics (General, Action, Business, etc.) | Stable, not exhaustive |
| Tone enum | session-store or constants | 6 tones (Neutral, Casual, Formal, Humorous, Professional, Kid-friendly) | Stable |
| Grammar target groups | `src/lib/grammar.ts` | Grammar-specific targets for grammar-focused lessons | Stable |
| Difficulty descriptions | `src/lib/difficulty.ts` | CEFR-accurate descriptions per level | Stable |

No seed data files or database-level starter data found. All config is code-level.

---

## 4. Live Classroom Loop — Wiring Status

| Component | Implemented? | Key Files | Caveats |
|---|---|---|---|
| **Teacher screen / SessionView** | Yes | `src/components/session/session-view.tsx` | Main runtime — activity picker, module sequencer, leaderboard, approval queue, widgets |
| **Student join** | Yes | `src/app/join/[sessionId]/`, `src/app/api/student/join/route.ts` | Name + avatar → creates student record in Supabase; duplicate name check by name within class only |
| **Student device input** | Yes | `src/app/join/[sessionId]/` (DynamicInput), `src/app/api/student/submit/route.ts`, `src/app/api/student/vote/route.ts` | Input spec broadcast via Supabase realtime channel `session-input-spec-${sessionId}` |
| **Submission flow (text)** | Yes | `/api/student/submit` | Text → approval queue → teacher approves → scored |
| **Submission flow (vote/choice)** | Yes | `/api/student/vote` | Direct score, no approval needed |
| **Scoring** | Yes | `session-store.ts` → Supabase `scores` table | participation / accuracy / competitive modes; streak bonus up to +5 |
| **Leaderboard (live)** | Yes | `src/components/session/leaderboard.tsx` | Real-time via Zustand + Supabase subscription; Top 3 + own entry during session |
| **End-session summary** | Yes | `src/components/session/end-session-summary.tsx` | Full leaderboard, accuracy %, best streak, total turns |
| **Activity switching** | Yes | SessionView state | Manual (picker) or auto (flight plan slot sequencing via `useLessonSession`) |
| **Session persistence** | Yes | Supabase: `sessions`, `students`, `scores`, `student_submissions` | Session marked `ended` on close |
| **Control Room / Reports** | Yes (partial) | `/src/app/(dashboard)/classes/[classId]/sessions/[sessionId]/control-room/` | ClassAccuracyGauge, ParticipationGrid, RoundsBreakdown, SessionNotesEditor |
| **Session notes** | Partial | `src/components/control-room/session-notes-editor.tsx` | Component exists; full DB read/write integration uncertain — needs Matt confirmation |
| **Fallback / degraded state** | Partial | `ModuleErrorBoundary`, mock mode env var | No observed network-drop recovery; mock mode for dev only; no universal retry |
| **Flight plan auto-sequencing** | Yes | `useLessonSession` hook, `planner-store.ts` | `lastAutoStartedSlotRef` prevents duplicate starts |
| **Credit gating** | Yes | `src/app/api/session/create/route.ts`, `src/lib/auth-credits.ts` | Standard users: 1 credit/session; Pro: unlimited; PaywallModal on 402 |
| **Approval queue** | Yes | `src/components/session/approval-queue.tsx` | Teacher approves/rejects text submissions; approved → scored |
| **Class Questions widget** | Yes | `src/components/session/class-questions-widget.tsx` | Student question submission, teacher publish/reject/answer, upvoting, AI draft answer |
| **Spin wheel** | Yes | `src/components/session/` | Score multipliers; x1/x2/x3/+5/Shield segments |
| **Student picker** | Yes | `src/components/session/` | Fair + random modes |
| **PPP filter** | Yes | SessionView | Filter module picker by Presentation/Practice/Production stage |
| **Pacing nudge** | Yes | SessionView | Warns teacher if falling behind flight plan schedule |

---

## 5. Candidate Testing Shortlist

### 5A — Individual Activity Tests

#### Likely icebreakers / openers

| Activity | Why testable | Uncertainty |
|---|---|---|
| Quick Pulse | Simple 3-question vote flow, no Pro gate, low teacher load | — |
| Vocab Radar | Familiarity poll, good for any vocab topic, visual distribution | — |
| Prediction Round | Binary vote + reveal, generates engagement, clear resolution | — |
| Would You Rather | Simple binary vote, discussion-friendly, mission-aware | — |
| Two Truths | Low tech lift, students vote, familiar format | — |

#### Likely core speaking / learning activities

| Activity | Why testable | Uncertainty |
|---|---|---|
| Connections (game) | Groups of 4 words, team voting, self-contained rounds | AI grouping quality unknown until tested |
| Dialogue Detective (game) | Student text submission → teacher approval → scoring | Requires teacher attention to approval queue |
| Rank It | Student ranking → discussion, no Pro gate | Discussion facilitation depends on teacher |
| Scenario Simulator | Rich speaking scenarios, discussion-driven | **Pro tier** |
| Hot Take Arena | Debate format, high engagement predicted | **Pro tier** |
| Expert Panel | Role assignment, structured speaking | **Pro tier** |
| Fact Detective | Fact/misconception pairs, voting | **Pro tier** |

#### Likely end games / closers

| Activity | Why testable | Uncertainty |
|---|---|---|
| Mic Drop | Reflection prompt, student text submission, low friction | Scoring is participation-only |
| Opinion Shift | Mission-aware reflection, good for discussion closer | Quality depends on mission context |
| Lightning Round | Rapid-fire questions, familiar game-show format | — |
| Grammar Proof | Grammar editing task, structured output | Grammar-specific — not universal |

---

### 5B — Friday Test Flight Candidates

These are repo-supported sequences. Whether they've been run live is unknown — needs Matt confirmation.

**Option 1: Grammar Clinic (45 min) — `grammar-clinic-45`**
- Takeoff: Grammar Check-In → Error Hunter → Grammar Boss → Landing: Grammar Proof
- Why: Grammar Boss is Pro but Error Hunter is free; two-module core keeps it manageable
- Uncertain: Grammar Boss approval queue under real classroom conditions; Grammar Proof output quality
- Matt must confirm: Has Grammar Clinic been run end-to-end? Is approval queue manageable for 1 teacher?

**Option 2: Game Day (60 min) — `game-day-60`**
- No takeoff/landing; pure game sequence: Vocab Sprint → Connections → Grid Rush → Sentence Scramble → Twenty Questions
- Why: All free (no Pro gate for core games); familiar game-show energy; 5 short rounds
- Uncertain: Grid Rush is newer — scoring and student UX unclear from code alone; pacing may be tight
- Matt must confirm: Is Grid Rush stable? Has 5-game sequence run live without module-switch issues?

**Option 3: Vocab Blitz (45 min) — `vocab-blitz-45`**
- Takeoff: Vocab Radar → Synonym Showdown → Vocab Sprint → Landing: Final Answer (Pro)
- Why: Tight vocab focus, 2 modules, natural escalation from recognition to production
- Uncertain: Final Answer is Pro — if testing on Free, needs substitution (Mic Drop or Opinion Shift)
- Matt must confirm: Can Final Answer be swapped to Mic Drop for Free-tier test? Has Vocab Blitz run before?

**Option 4: Debate Ready (60 min) — `debate-ready-60`**
- Takeoff: Auto-assigned → Prediction Round → Hot Take Arena → Connections → Landing: Opinion Shift
- Why: Clear discussion arc; Prediction Round is free and high-engagement opener
- Uncertain: Hot Take Arena is Pro; all 3 core modules require strong facilitation
- Matt must confirm: Pro tier confirmed for test classroom? Has this sequence run live?

---

## 6. Weak Points / Uncertainty Map

| Issue | Evidence | File | Severity | Matt confirm? |
|---|---|---|---|---|
| AI generation latency at session start | Lesson plan generate API fetches ALL content for all modules upfront; InterviewLab was vaulted partly for latency | `src/app/api/lesson-plan/generate/route.ts` | **High** | Yes — has session start felt slow in real use? |
| No network-drop recovery on Supabase realtime | Subscriptions re-establish on mount but no reconnect retry observed; if channel drops mid-session, UI goes stale | `session-view.tsx`, realtime subscriptions | **High** | Yes — has realtime stale state occurred in testing? |
| Lesson plan generation partial failure | No transaction/rollback — if one module's AI call fails, others succeed but session starts in broken state | `/api/lesson-plan/generate/route.ts` | **High** | Yes — what happens when one module's generation fails? |
| Remote student name collision | Duplicate name check is by name-within-class only; two devices with same name get separate records → duplicate leaderboard entries | `src/app/api/student/join/route.ts` | Medium | Yes — confirmed in real classroom? |
| Approval queue load under classroom conditions | Grammar Boss + Story Sprint + Dialogue Detective require teacher to approve text submissions while also running the session | `approval-queue.tsx`, multiple game files | Medium | Yes — is this manageable for 1 teacher? |
| Session notes integration completeness | `session-notes-editor.tsx` exists but full DB read/write path unclear from code inspection | `src/components/control-room/session-notes-editor.tsx` | Medium | Yes |
| Standard user credit exhaustion mid-session | Credits checked at session creation; if teacher starts with 1 credit and runs Pro module AI generation, unclear what degrades | `auth-credits.ts`, session create route | Medium | Yes |
| Vaulted items still in codebase | Tone Transformer and Interview Lab have full implementations but are unregistered; accidental re-enablement risk | `src/games/tone-transformer/`, `src/activities/interview-lab/` | Low | No |
| SEO landing pages connection to live flow | `/classroom-games/[slug]` and `/classroom-activities/[slug]` routes exist but appear unconnected to session/planner flow | `src/app/classroom-games/`, `src/app/classroom-activities/` | Low | Yes — are these live marketing pages or in-progress? |
| Planner store v1 hydration note | Comment about "old cached data (was persisted in v1, causes hydration crash)" — resolution unclear | `src/stores/planner-store.ts` | Low | Yes — resolved? |
| Grid Rush stability | Newer game; AI sentence validation adds an extra generation step; fewer live sessions observed | `src/games/grid-rush/` | Low–Medium | Yes — considered stable? |
| `sessionStarter` unused-var lint suppression | `eslint-disable-next-line @typescript-eslint/no-unused-vars` on `studentCount` param | `session-starter.tsx` | Low | No |

---

## 7. Direct Questions for Matt

These are things the repo cannot answer — must be confirmed manually before scheduling live tests.

### On stability

1. Has any preset Flight Plan been run end-to-end in a real classroom? Which ones?
2. Has the approval queue (Grammar Boss, Story Sprint, Dialogue Detective) been used live with 1 teacher managing it?
3. Has Grid Rush been run live, or is it still in internal testing?
4. Has realtime staleness (stale leaderboard / students not seeing activity change) been observed in real sessions?
5. Is session-start AI latency noticeable in real use — does the lesson plan generation step feel slow?

### On tier / access for testing

6. Will April test classrooms be on Pro or Free tier? (Several presets require Pro: Speaking Circle, Debate Ready, Creative Sprint, Think Tank)
7. For Vocab Blitz — can Final Answer (Pro) be swapped to Mic Drop for a Free-tier run, or is a Pro account confirmed?

### On specific features

8. Is session notes (SessionNotesEditor) fully functional — can teachers write and retrieve notes per session?
9. Has the class questions widget been used live? Is it enabled by default or requires teacher opt-in?
10. What is the current status of the SEO landing pages (`/classroom-games/` etc.) — live marketing or still in development?
11. Was the planner-store v1 hydration crash issue resolved, or is it still a live risk if a teacher has old cached session data?

### On content quality

12. Which activities have had real-classroom feedback on AI content quality? (Connections groupings, Dialogue Detective scenarios, Scenario Simulator prompts — are these landing well?)
13. For Debate Ready / Hot Take Arena: what age group / proficiency level has it been tested with so far?

### On mission flow

14. Is the Mission Selector → mission-aware activity flow (Opinion Shift, Final Answer regeneration) stable enough for April tests, or should early tests skip mission context?
