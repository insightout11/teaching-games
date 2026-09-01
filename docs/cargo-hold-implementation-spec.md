# Cargo Hold - Implementation Specification

**Status:** Approved product design; implementation not started.
**Written:** 2026-08-31
**Priority:** First of the two proposed activities. Do not delay the current beta launch for it.
**Purpose:** Give an implementation agent enough product, data, security, UI, testing, and acceptance detail to build Cargo Hold without inventing the core mechanic.

---

## 1. Product decision

Cargo Hold is a group-first vocabulary comedy game inspired by the useful mechanics of party-card games: a persistent private hand, constrained choices, anonymous reveals, and social judgment.

It is not intended to support every class size. Honest fit is part of the product:

- Minimum: 3 students.
- Ideal: 4-10 students.
- Practical maximum for v1: 12 students.
- Default length: 5 rounds, approximately 15-18 minutes.
- Student devices are required.

The learning objective is grammatical recognition and meaningful reuse of lesson vocabulary. The social objective is to produce surprising, funny, grammatically coherent sentences.

### The two scores in every round

1. Every student whose selected card fits the prompt grammatically receives 1 point.
2. The valid answer receiving the most class votes receives 2 additional points.

Tied class favorites are co-winners and each receives the 2-point favorite bonus. Do not add an arbitrary speed or teacher tie-breaker.

---

## 2. Fixed design decisions

These are not open to reinterpretation in v1:

- Class Vote is the default and only judging mode in v1.
- Every student submits a card each round.
- Hands persist between rounds.
- Playing a card removes it; the student draws one replacement after the round.
- Students may save a strong card for a later prompt.
- The next prompt family is previewed after each round; the exact prompt is not.
- Each student gets one Repack per game: discard up to two cards and draw replacements before submitting.
- Cards are funny phrases built around a target word or expression, not isolated dictionary words.
- Cards have grammatical families; prompts declare accepted families.
- Some cards in every hand fit the current prompt and some do not.
- Valid-but-absurd answers are eligible and encouraged.
- Submissions are anonymous until the voting result.
- Each sentence is assigned to a student other than its author to read aloud.
- Students cannot vote for their own answer.
- Illustrations are not required. Cards are text-first luggage tags with optional curated emoji.
- No live AI calls occur during a round.
- Hands use the same classroom-trust privacy model as Imposter, Password, Taboo Sprint, Character Cards, and Cabin Mystery: `perStudentData` carries assignments and the student UI renders only the current student's entry.

---

## 3. v1 scope and non-goals

### In scope

- Pre-generated, lesson-grounded prompt and card deck.
- Persistent six-card private hands.
- Five prompts from varied grammatical families.
- Guaranteed recovery when a student has fewer than two valid options.
- One Repack per student per game.
- Automatic grammatical-family compatibility with teacher override.
- Anonymous shuffled reveal.
- Deterministic non-author reading assignment.
- Class voting with self-vote prevention.
- Grammar points and favorite bonus.
- Refresh/rejoin recovery for teacher and student contexts.
- Mock-mode support sufficient for automated tests and local browser acceptance.
- Reduced-motion and keyboard-accessible interactions.
- A polished shared-screen reveal suitable for marketing capture.

### Explicitly out of scope

- Captain's Choice mode.
- Two-card Overpack plays.
- Free-written custom cards.
- Runtime semantic or grammar evaluation by AI.
- Speech recognition or pronunciation scoring.
- Automatic public sharing.
- Student-created illustrations.
- A universal cross-lesson collectible card inventory.
- Paid card packs, monetization, or persistent account-level decks.

---

## 4. Vocabulary and humor model

### 4.1 Card families

```ts
export type CargoCardFamily =
  | 'thing'       // noun or noun phrase
  | 'action'      // gerund or action phrase
  | 'description' // adjective phrase
  | 'reason'      // because-clause or explanatory phrase
  | 'wildcard';   // deliberately flexible and rare
```

Prompts accept one or more families. Wildcards must declare their actual compatible families rather than automatically fitting every prompt.

### 4.2 Card shape

```ts
export interface CargoCard {
  id: string;
  family: CargoCardFamily;
  text: string;
  targetTerm: string;
  targetForm: string;
  meaning: string;
  compatiblePromptTags?: string[];
  emoji?: string;
  source: 'lesson-vocab' | 'lesson-expression' | 'safe-fallback';
}
```

`targetTerm` is the canonical lesson item. `targetForm` is the naturally inflected form used in the phrase. The rendered card emphasizes `targetForm` without falsely claiming that a changed form is identical to the lemma.

Example:

```ts
{
  id: 'negotiate-pigeon',
  family: 'action',
  text: 'negotiating with a pigeon at Gate 12',
  targetTerm: 'negotiate',
  targetForm: 'negotiating',
  meaning: 'to discuss in order to reach an agreement',
  source: 'lesson-vocab'
}
```

### 4.3 Prompt shape

```ts
export interface CargoPrompt {
  id: string;
  textBefore: string;
  textAfter?: string;
  acceptedFamilies: CargoCardFamily[];
  promptTag: string;
  previewLabel: string;
  explanation: string;
}
```

The sentence is constructed as `textBefore + card.text + textAfter`. Do not ask an AI to judge the completed sentence at runtime.

### 4.4 Humor rules

Generated material should use:

- safe absurdity;
- travel and classroom mishaps;
- exaggerated but non-harmful situations;
- familiar online-teaching moments;
- occasional fictional Lesson Captain world elements;
- surprising collisions between serious vocabulary and silly situations.

Reject:

- sexual content;
- slurs or identity-based humor;
- self-harm, realistic violence, drugs, or criminal instruction;
- humiliation aimed at a real student or teacher;
- bodily-fluid or gross-out material for the initial deck;
- copyrighted characters or celebrity impersonation;
- jokes requiring private personal information.

Use `src/lib/profanity.ts` as one check, not as the complete moderation strategy.

### 4.5 Source priority and fallback

Build the deck from, in order:

1. `reference_vocab` and `reference_expressions` from the current lesson.
2. Vocabulary and expressions already present in generated lesson content.
3. The lesson topic and difficulty.
4. A reviewed, safe fallback vocabulary deck when the lesson contains insufficient material.

Every generated deck must contain at least 24 cards across at least three families. Repeated card definitions across different students are allowed, but no student may hold duplicate card IDs at one time.

The generator should produce 30-36 cards when source material supports it. At least 70% should be lesson-grounded. The safe fallback portion exists to preserve grammatical variety and humor, not to replace the lesson.

Generation happens during normal lesson content generation or pre-generation and is cached with the lesson. If generation fails, return a deterministic reviewed fallback deck and prompts. Never block a live teacher on a generation request.

---

## 5. Generated content contract

Add the content types to `src/activities/types.ts`:

```ts
export interface CargoHoldContent extends ActivityGeneratedContent {
  activityKey: 'cargo-hold';
  deckVersion: 1;
  cards: CargoCard[];
  prompts: CargoPrompt[];
}
```

Validation requirements:

- 24 or more valid cards.
- 5 or more prompts.
- At least three represented families.
- Every prompt accepts at least one represented family.
- Every card has a unique ID.
- Every prompt has a unique ID.
- Text lengths remain usable on a 390x844 student viewport.
- Prompt/card concatenation has normalized spaces and punctuation.
- No unsafe content after normalization.
- At least one safe and one absurd valid card can be dealt for every prompt family.

Add focused generator/validator tests. Do not trust an AI response merely because it parses.

---

## 6. Plugin metadata

Implement as an activity rather than a game because its content should be generated with and grounded in the lesson.

```ts
key: 'cargo-hold'
name: 'Cargo Hold'
description: 'Build the funniest grammatically correct sentence from a persistent private hand of lesson vocabulary.'
category: 'practice'
pppStage: 'practice'
skills: ['Vocabulary', 'Speaking', 'Listening', 'Creativity']
supportsCustomTopic: true
estimatedMinutes: 16
defaultTimerSeconds: 30
flightPlanOnly: false
scoringProfile: {
  displayMode: 'competitive',
  supportsOnTask: true,
  supportsStandout: true,
  tracksAccuracy: true,
  defaultOutcome: 'genuine'
}
minStudents: 3
maxStudents: 12
idealStudents: { min: 4, max: 10 }
deviceFree: false
```

Add it to `src/activities/registry.ts`, content generation, discovery metadata, and any fit/filter systems that derive availability from plugin metadata. Do not bypass `minStudents` handling with an activity-specific dead-end screen if the shared selector can prevent launch.

---

## 7. Authoritative state model

```ts
export type CargoPhase =
  | 'idle'
  | 'dealing'
  | 'choosing'
  | 'validating'
  | 'reading'
  | 'voting'
  | 'result'
  | 'finished';

export interface CargoPlayerState {
  clientId: string;
  studentId: string | null;
  displayName: string;
  handCardIds: string[];
  repackUsed: boolean;
  grammarPoints: number;
  favoritePoints: number;
}

export interface CargoSubmission {
  submissionId: string;
  activityInstanceId: string;
  roundId: string;
  clientId: string;
  studentId: string | null;
  displayName: string;
  cardId: string;
  composedSentence: string;
  automaticValidity: boolean;
  teacherValidity: boolean;
  readerClientId: string | null;
  voteCount: number;
}

export interface CargoPublicRoundState {
  activityInstanceId: string;
  activityInstanceStartedAt: number;
  activitySequence: number;
  phase: CargoPhase;
  roundIndex: number;
  roundId: string;
  promptId: string;
  nextPromptFamily?: CargoCardFamily;
  submittedCount: number;
  eligibleVoterCount: number;
  anonymizedSubmissions?: Array<{
    submissionId: string;
    sentence: string;
    valid: boolean;
    readerDisplayName?: string;
    voteCount?: number;
  }>;
}
```

Identity uses `clientId` as the live-device key and retains `studentId` for durable scoring attribution. Do not key private state by display name.

---

## 8. Student-specific state and trust model

Reuse the existing `perStudentData` pattern proven by Imposter, Password, Taboo Sprint, Character Cards, Cabin Mystery, Trip Directions, and several games.

- Key hands by `clientId`, not display name, when a stable client ID is available.
- Each student's entry contains only what its renderer needs: hand cards, Repack state, submitted state, and assigned reading sentence.
- The student renderer reads only `perStudentData[clientId]` and never renders another entry.
- Rewriting the input spec after a play, Repack, draw, reader assignment, or reconnect preserves every player's latest state.
- Every student action carries activity-instance and round identity so stale actions cannot mutate the current round.
- Mock mode behaves equivalently.

This provides ordinary classroom-game secrecy, not a security boundary: a technically sophisticated participant could inspect the shared input-spec payload and discover other hands, just as they could inspect existing secret-role activities. Cargo Cards contain no personal or sensitive information, so that accepted trust model is appropriate for v1. Do not add a migration or private-state subsystem solely for anti-cheat protection.

If Lesson Captain later introduces prizes or higher-stakes competition, harden private state across all hidden-role activities as one shared project rather than only Cargo Hold.

---

## 9. Deal and draw rules

### Initial deal

- Six cards per student.
- At least three families represented.
- No duplicate card ID in one hand.
- At least two cards valid for round 1.
- At least one valid card should be the safer semantic choice and one should offer comic potential.

### Round start repair

Because player choices make future guarantees impossible, inspect each hand at the start of every round. If fewer than two cards fit the current prompt:

- perform an automatic free Customs Exchange until two valid choices exist;
- show a neutral message such as `Customs refreshed your hand for this prompt`;
- do not consume the student's Repack;
- do not award or deduct points.

### Draw

After the result phase, remove the played card and draw one replacement. Prefer a family compatible with the previewed next prompt when doing so does not make the choice deterministic.

### Repack

- Available once per game during `choosing` before submission.
- Student selects one or two cards to discard.
- Replacement cards arrive immediately.
- A Repack action is idempotent and persists through refresh.
- Repack may not be used after a card is submitted.

---

## 10. Phase machine and UI

```text
idle -> dealing -> choosing -> validating -> reading -> voting -> result
                               ^                              |
                               |------------ next round ------|
result -> finished after round 5
```

Every phase transition increments `activitySequence` within a stable activity instance. A restart creates a new instance ID and later start time. Follow `ActivityInstanceIdentity` ordering and stale-event rejection already implemented in `src/lib/input-spec.ts`.

### Idle

Shared screen explains in three steps:

1. Keep a private hand across rounds.
2. Choose a phrase that fits grammatically.
3. Read anonymous answers and vote for the funniest valid sentence.

Show 3-12 student requirement and a content preview. Start is disabled below minimum roster size.

### Choosing

Shared screen:

- prompt as a large sentence with a visible blank;
- round count;
- countdown or teacher-controlled `Close Cargo Hold` action;
- submitted count only, never names or hands;
- next-family preview hidden until result.

Student screen:

- six luggage-tag cards;
- target term emphasized;
- short meaning available without leaving the hand;
- Repack button if unused;
- one selected card with confirm step;
- durable `Cargo loaded` confirmation after submit;
- reconnect restores the exact hand, Repack state, selection, and confirmation.

### Validating

Automatic validity is `prompt.acceptedFamilies.includes(card.family)` or an explicit compatibility tag. The teacher sees all anonymous completed sentences with automatic valid/held stamps and can toggle validity before continuing.

Use playful, non-shaming language:

- valid: `Cleared by customs`
- invalid: `Held at customs - the grammar does not fit this prompt`

Invalid answers still appear in the learning reveal but are excluded from voting and receive no grammar point.

### Reading

Create a deterministic derangement of authors to readers:

- no student reads their own submission;
- assignments are stable across refresh;
- reading load differs by at most one when class size and submission count differ;
- if a student disconnects, teacher may skip or reassign their reading without changing authorship;
- each assigned reader receives only the sentence(s) they must read, not the author identity.

The teacher advances one anonymous sentence at a time. The assigned reader sees `Your cabin announcement` and taps `Read aloud`/`Done`. Teacher may also advance manually.

### Voting

Only valid anonymous submissions are options. Each student receives one vote. Their own submission is disabled server-side and in the UI. A second vote from the same student replaces or rejects the previous vote consistently; choose one behavior and test it. Recommended: first valid vote is final.

The shared screen shows luggage tags accumulating without revealing authors. Do not reveal live vote totals until voting closes, to reduce bandwagon effects.

### Result

Reveal:

- winning sentence and author;
- co-winners when tied;
- `Captain's Pick` stamp;
- grammar points earned by everyone;
- cumulative grammar/favorite totals;
- next prompt family preview;
- each student's replacement draw happens before the next choosing phase.

Use the existing spotlight visual language where useful, but do not write a fake student quote into the generic spotlight system if it causes stale state outside the activity.

### Finished

Show:

- class favorite winner(s);
- strongest grammar total;
- `Best Line of the Flight` final recap selected from round winners by a last optional class vote, or omit this in the first implementation if it materially increases scope;
- replay creates a new activity instance and new hands.

The optional Best Line vote is the only feature in this section that the implementer may omit from v1 without seeking approval.

---

## 11. Scoring and idempotency

For each submitted student per round:

```ts
grammarPoints = teacherValidity ? 1 : 0;
favoriteBonus = isTopValidVoteCount ? 2 : 0;
roundPoints = grammarPoints + favoriteBonus;
```

Map to Scoring V2:

- invalid but attempted: `genuine`, 0 points or participation handling consistent with current score engine;
- grammatically valid: `on-task`, 1 point;
- class favorite: `standout`, 3 total points.

Write score once per student/round. Repeated reveal, refresh, route retry, or realtime replay must not duplicate the score. Include activity instance, round, card, validity, grammar points, vote count, and favorite bonus in `responseData` if the current scoring API supports it; otherwise extend the narrowest existing type/path.

---

## 12. Student-input implementation

A new card-hand renderer is justified. Do not force persistent hands into the shared `choice` options.

Preferred shape:

```ts
type: 'cargo-hand'
gameKey: 'cargo-hold'
roundId: string
activityInstanceId: string
activityInstanceStartedAt: number
activitySequence: number
prompt: string
```

The input spec carries hands in `perStudentData`, following the existing hidden-role pattern. The student component renders only its own client-keyed entry and reconciles through the normal input-spec realtime and polling paths.

Voting may reuse `choice` with per-student metadata marking the student's own submission as disabled. Otherwise add a focused `cargo-vote` renderer. Self-vote rejection must exist in the activity handler as well as the UI. Do not encode author identity into option text before reveal.

Use the existing student submit/realtime path unless it proves incapable under a focused test. The card renderer may submit typed JSON actions with `allowMultiple: true`:

```ts
type CargoStudentAction =
  | { type: 'repack'; actionId: string; activityInstanceId: string; roundId: string; cardIds: string[] }
  | { type: 'play'; actionId: string; activityInstanceId: string; roundId: string; cardId: string }
  | { type: 'read-complete'; actionId: string; activityInstanceId: string; roundId: string; submissionId: string }
  | { type: 'vote'; actionId: string; activityInstanceId: string; roundId: string; submissionId: string };
```

Parse and validate every action in a pure helper. Deduplicate `actionId` values in activity state, and reject actions whose client, phase, instance, round, card, reader assignment, or vote target does not match current authoritative state. Add a new route only if the existing path cannot meet these requirements without corrupting normal submissions.

---

## 13. Expected files

Exact decomposition may follow repository conventions, but expect work in:

```text
src/activities/cargo-hold/index.ts
src/activities/cargo-hold/activity.tsx
src/activities/cargo-hold/types.ts
src/activities/cargo-hold/deal.ts
src/activities/cargo-hold/reader-assignment.ts
src/activities/cargo-hold/scoring.ts
src/activities/cargo-hold/content-validation.ts
src/components/student/cargo-hand-input.tsx
src/components/student/cargo-vote-input.tsx            if needed
src/activities/types.ts
src/activities/registry.ts
src/lib/input-spec.ts
src/components/student/dynamic-input.tsx
src/app/api/lesson-plan/generate/route.ts               or current generator abstraction
```

Keep pure deal, compatibility, reader assignment, vote, and scoring logic outside React so it can be exhaustively tested.

---

## 14. Automated tests

At minimum:

### Pure logic

- Initial hands contain six unique cards and three or more families.
- Initial hands contain at least two round-compatible cards.
- Customs Exchange repairs a dead hand without consuming Repack.
- Repack discards one/two cards, replaces them, and is one-use/idempotent.
- Played cards leave the hand and one replacement is drawn.
- Prompt/card composition normalizes punctuation and whitespace.
- Compatibility uses declared metadata only.
- Derangement never assigns an author their own sentence.
- Derangement is deterministic and balanced.
- Self-votes are rejected.
- Invalid submissions cannot receive favorite votes.
- Tied top valid answers become co-winners.
- Score writes are idempotent by activity instance + round + student.

### State and submission integrity

- Student A's normal UI renders only Student A's hand.
- Hand state restores through the existing input-spec polling/realtime path.
- Stale activity-instance and stale-round actions are rejected.
- Duplicate actions do not duplicate play, draw, Repack, vote, or score.
- Repack and selection confirmation remain stable after a spec rebroadcast.

### Component/activity

- Below-minimum roster cannot launch.
- Choosing -> validation -> reading -> voting -> result works through five rounds.
- Refresh/rejoin restores hand and phase.
- Reading reassignment handles a disconnected reader.
- Own answer is not votable.
- Restart creates clean hands and a new activity instance.
- No old confirmation, votes, or reader assignment leaks into a new round.

---

## 15. Browser acceptance

Run a production-like three-context pass:

1. Teacher shared screen.
2. Student A at a genuine 390x844 viewport.
3. Student B at a genuine 390x844 viewport.

Required flow:

- Start with at least three test students.
- Verify different hands and confirm each normal student UI renders only its own hand.
- Save a funny card for a later prompt.
- Use Repack and refresh that student; Repack remains used and the new hand remains.
- Submit valid and invalid cards.
- Confirm automatic validity and teacher override.
- Confirm anonymous non-author reader assignments.
- Disconnect/rejoin a reader and recover or reassign.
- Confirm class vote and self-vote rejection.
- Refresh during voting and result without duplicate votes or points.
- Finish five rounds and restart cleanly.
- Check teacher and both student consoles for errors.
- Check keyboard use, focus visibility, text scaling, no horizontal overflow, and reduced motion.

Mock mode alone is not sufficient for realtime and reconnect acceptance. Use an approved shared development backend before declaring beta-ready.

---

## 16. Marketing capture packet

Capture only staged test identities and safe content:

1. Shared-screen prompt.
2. Student phone with a six-card hand.
3. A student saving a visibly strong funny card.
4. Anonymous sentence-reading sequence.
5. Vote tags arriving.
6. Captain's Pick result.
7. Complete 10-15 second vertical sequence showing prompt -> private choice -> read -> vote -> reveal.

Never expose session links, QR codes, emails, private card payloads, or real student information.

---

## 17. Definition of done

Cargo Hold is complete only when:

- the existing client-keyed `perStudentData` classroom-trust model is used consistently and documented;
- generated and fallback content meet the contract;
- persistent-hand strategy survives refresh/rejoin;
- grammar validity is predictable and teacher-correctable;
- every submitted sentence is read by a non-author or explicitly skipped/reassigned;
- voting is anonymous and self-votes are rejected by both the normal UI and the authoritative activity handler;
- score writes are idempotent;
- full focused tests, TypeScript, full suite, production build, diff check, and three-context browser acceptance pass;
- no unrelated files are changed;
- no migration, Git, deployment, production data, or paid service action occurs without Matt's explicit approval.

---

## 18. Implementation-agent kickoff prompt

> Implement `docs/cargo-hold-implementation-spec.md` in `C:\Users\insig\Documents\teaching-games`. Read the complete spec and inspect current repository patterns before editing. Cargo Hold is a group-first, class-vote vocabulary comedy activity with persistent hands using the same client-keyed `perStudentData` classroom-trust model as existing hidden-role activities. Preserve the fixed product decisions and treat correct student-specific rendering, activity-instance ordering, refresh/rejoin recovery, self-vote prevention, and idempotent scoring as P1 requirements. Use pre-generated/cache-first content and no live AI during rounds. Work only in the explicitly named repository, preserve unrelated changes, and do not stage, commit, push, deploy, apply migrations, change service settings, submit real data, or consume paid services. Implement the narrowest coherent phases, run focused tests first, then TypeScript/full suite/build when dependencies permit, and perform the documented three-context browser pass against an approved non-production backend. Report exact files, tests, evidence, deviations, and remaining risks.
