# Flight Cards V1 — Implementation Spec

**Status:** Design spec. Do not implement until approved.  
**Created:** 2026-05-20  
**Scope:** V1 MVP only. Wingman card is V2 (see §Phasing).  
**Updated:** 2026-05-20 — added Contrail (5th card, multi-submission).

---

## 1. Product Goals

Between-module gamification that:
- Rewards engagement without modifying any module's core mechanics
- Gives students a small strategic decision (when to play) without demanding attention
- Works across every module type — quiz, open-ended, discussion, activity
- Runs in 5–10 seconds between modules and never blocks the teacher
- Uses only Scoring V2 outcomes as activation triggers — no new scoring logic

Non-goals for V1:
- Cards that combine or stack
- Teacher-assigned cards
- Card history visible to students
- Per-card analytics (aggregate data only, not per-student)

---

## 2. Rules

### Deal phase
1. Teacher navigates to the next module (module is now known).
2. Teacher clicks **Deal Flight Cards** in the sidebar.
3. Each connected student receives exactly **3 face-down card offers** on their device.
4. Student taps one card to reveal and hold it. The other two disappear.
5. Phase is complete when all students have chosen, or after a 30-second timeout (unchosen cards disappear).
6. Teacher sees a brief inline confirmation ("Cards dealt to N students") — no blocking overlay.

### Hold rule
- A student can hold **at most 1 card** at any time.
- If a student already holds a card when a new deal happens, they see a **Keep Current / Replace** prompt instead of the 3-card offer.
  - Keep Current: their existing card remains; the 3 new offers disappear.
  - Replace: they choose from the 3 new offers; the old card is discarded.

### Play phase — standard cards (Takeoff, Clear Skies, Afterburner, Full Throttle)

Status path: `held` → `active` → `used` or `expired`

- The card chip appears above the submit button while the student's card is `held` or `active`.
- Student taps to activate: card moves from `held` → `active` (server update via pick/activate endpoint or inlined into score handler — see §6d).
- Student can tap again to deactivate before submitting (`active` → `held`).
- On submission with `card_id`:
  - Condition met → `active` → **`used`**, `card_bonus = card's fixed value`
  - Condition not met → `active` → **`expired`**, `card_bonus = 0`
- _Rule: the card is always terminal after one submission attempt, regardless of whether the condition was met._

### Play phase — Contrail (special case)

Status path: `held` → `active` → `used` (3 activations or module end with > 0) or `expired` (module end with 0)

- Contrail has no per-submission activate/deactivate toggle. The chip is always shown as live once the module starts.
- `card_id` is automatically passed with every submission while Contrail is `held` or `active`.
- On first submission: card transitions `held` → `active` (implicit, no separate student action).
- Each response `genuine` or better: `activations_count++`, `bonus_points_total++`, `card_bonus = 1` on that score row. Card remains `active`.
- After 3rd activation: card moves `active` → **`used`**. Further submissions earn no bonus.
- `invalid` outcome submissions: no change to card state, `card_bonus = 0`.
- At module end (expire call): `active` with `activations_count > 0` → **`used`**; `active` with `activations_count === 0` → **`expired`**.
- _The strategic decision for Contrail is made at the deal phase (did you pick it?), not at submission time._

### Expiry
- A held card expires at the **end of the next module** if not played.
- "End of module" = when the teacher clicks away from that module, or the module's own phase machine emits `finished`.
- Expired cards disappear silently from the student's device on the next session poll.

### V1 invariants
- Cards do not stack. Two identical cards held at once is not possible (max 1 held).
- Duplicate card draws within the same 3-card offer are allowed (same card can appear twice), but the student only holds one.
- No streak bonuses. No teacher-applied multipliers. No scoring modes.

---

## 3. Deck

| Key | Name | Rarity | Mechanic | Condition | Max Bonus | Compatibility |
|---|---|---|---|---|---|---|
| `takeoff` | Takeoff | Common | Single-submission | Next outcome is `genuine` or better | +1 pt | Universal |
| `clear-skies` | Clear Skies | Common | Single-submission | Next outcome is `on-task` or better (accuracy = correct) | +1 pt | `tracksAccuracy: true` |
| `afterburner` | Afterburner | Uncommon | Single-submission | Next outcome is `on-task` or better | +2 pt | `tracksAccuracy: true` |
| `contrail` | Contrail | Uncommon | Multi-submission | Each response in the module that is `genuine` or better | +1 pt each, max +3 | Universal |
| `full-throttle` | Full Throttle | Rare | Single-submission | Next outcome is `standout` exactly | +3 pt | `supportsStandout: true` |
| `wingman` | Wingman | Uncommon | Module-close | At least one other student submits in the same module | +1 pt | **V2 only** |

**Outcome ladder for reference:**
`invalid (0) < genuine (1) < on-task (3) < standout (5)`

"Or better" means: if activation threshold is `genuine`, both `on-task` and `standout` also qualify.

### Rarity weights (base pool, before compatibility filtering)

| Card | Weight | Notes |
|---|---|---|
| Takeoff | 35% | |
| Clear Skies | 22% | |
| Afterburner | 18% | |
| Contrail | 15% | |
| Full Throttle | 10% | |
| Wingman | — | V2 only, excluded from V1 pool |

In V1 the pool is: `takeoff`, `clear-skies`, `afterburner`, `contrail`, `full-throttle`.

After filtering incompatible cards, remaining weights are renormalized proportionally. Example: module does not support standout → remove Full Throttle (10%), renormalize the remaining 90% to sum to 100%.

### Compatibility filtering rules

Applied at deal time, based on the **next module's** `scoringProfile`:

| Card | Included when |
|---|---|
| `takeoff` | Always |
| `clear-skies` | `scoringProfile.tracksAccuracy === true` |
| `afterburner` | `scoringProfile.tracksAccuracy === true` |
| `contrail` | Always (universal — activates on `genuine` or better, which any module can produce) |
| `full-throttle` | `scoringProfile.supportsStandout === true` |

**Minimum deal guarantee:** if after filtering only `takeoff` and `contrail` survive, deals are drawn from those two. All-Takeoff deals are valid. Never skip a deal due to filtering.

---

## 4. Compatibility Matrix

Contrail is universal — it appears in every module's pool.

| Module | tracksAccuracy | supportsStandout | Available cards |
|---|---|---|---|
| Vocab Sprint | ✓ | ✗ | Takeoff, Clear Skies, Afterburner, Contrail |
| Synonym Showdown | ✓ | ✗ | Takeoff, Clear Skies, Afterburner, Contrail |
| Flash Quiz | ✓ | ✗ | Takeoff, Clear Skies, Afterburner, Contrail |
| Grammar Boss | ✓ | ✗ | Takeoff, Clear Skies, Afterburner, Contrail |
| Error Hunter | ✓ | ✗ | Takeoff, Clear Skies, Afterburner, Contrail |
| Dialogue Detective | ✓ | ✗ | Takeoff, Clear Skies, Afterburner, Contrail |
| Connections | ✓ | ✗ | Takeoff, Clear Skies, Afterburner, Contrail |
| Sentence Scramble | ✓ | ✗ | Takeoff, Clear Skies, Afterburner, Contrail |
| Word Chain | ✓ | ✗ | Takeoff, Clear Skies, Afterburner, Contrail |
| Story Sprint | ✗ | ✓ | Takeoff, Contrail, Full Throttle |
| Twenty Questions | ✗ | ✗ | Takeoff, Contrail |
| Defend It | ✗ | ✓ | Takeoff, Contrail, Full Throttle |
| Grid Rush | ✗ | ✓ | Takeoff, Contrail, Full Throttle |
| Sector Strike | ✓ | ✗ | Takeoff, Clear Skies, Afterburner, Contrail |
| Quick Pulse | ✗ | ✗ | Takeoff, Contrail |
| Vocab Radar | ✗ | ✗ | Takeoff, Contrail |
| Prediction Round | ✗ | ✗ | Takeoff, Contrail |
| Expert Panel | ✗ | ✓ | Takeoff, Contrail, Full Throttle |
| Scenario Simulator | ✗ | ✓ | Takeoff, Contrail, Full Throttle |
| Hot Take Arena | ✗ | ✓ | Takeoff, Contrail, Full Throttle |
| Other activities (participation-only) | ✗ | ✗ | Takeoff, Contrail |

_Practical note: Contrail is capped at +3 regardless of module length. In Flash Quiz (10 prompts) it earns +3 after the first 3 eligible responses and then goes dormant. In a single-answer discussion, it earns +1 — same as Takeoff. Students learn the distinction over sessions._

_Note: verify `scoringProfile` values against registry before implementing — this table reflects current registry state._

---

## 5. Data Model

### New table: `flight_cards`

```sql
CREATE TABLE flight_cards (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  client_id        text NOT NULL,
  student_id       uuid REFERENCES students(id),
  display_name     text,

  card_key         text NOT NULL,
  -- 'takeoff' | 'clear-skies' | 'afterburner' | 'contrail' | 'full-throttle'

  status           text NOT NULL DEFAULT 'offered',
  -- Deal-phase statuses (non-terminal pending states):
  -- 'offered'  : shown to student, not yet chosen
  -- 'declined' : student chose a different card from this deal
  -- 'replaced' : student held this card but accepted a new deal and swapped it out
  --
  -- Live statuses:
  -- 'held'     : student holds this card; module not yet started (standard) or not yet touched (Contrail)
  -- 'active'   : card is in play — student tapped activate (standard) OR first submission arrived (Contrail)
  --
  -- Terminal statuses:
  -- 'used'     : card produced at least one bonus point and is done
  -- 'expired'  : card produced zero bonus and is done (module ended, wrong condition, or never played)

  deal_index       int NOT NULL,   -- monotonically increasing per session (1, 2, 3…)
  module_key       text NOT NULL,  -- key of the module this card is scoped to

  -- Contrail-specific tracking
  activations_count int NOT NULL DEFAULT 0,
  -- incremented each time Contrail earns +1 on a submission; max 3

  offered_at       timestamptz NOT NULL DEFAULT now(),
  held_at          timestamptz,
  expired_at       timestamptz,

  bonus_points_total int NOT NULL DEFAULT 0,
  -- running total of bonus points awarded by this card across all activations
  -- for standard cards: 0 or the card's fixed bonus value
  -- for Contrail: sum of per-submission +1s earned (0–3)

  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX flight_cards_session_client ON flight_cards(session_id, client_id);
CREATE INDEX flight_cards_session_deal   ON flight_cards(session_id, deal_index);
```

**Note on `score_id`:** Standard cards reference a single score row; this is captured via `scores.card_id` (see below). Contrail references multiple score rows via the same column — no foreign key stored on the card itself.

**RLS:** teacher can read all rows for their sessions. Students read only their own rows via service-role API (no direct student access to `flight_cards`).

### `scores` table — new columns

```sql
ALTER TABLE scores ADD COLUMN card_id    uuid REFERENCES flight_cards(id);
ALTER TABLE scores ADD COLUMN card_bonus int  NOT NULL DEFAULT 0;
```

`card_bonus` is the delta added by the card for **that specific score row**. For standard cards: 0 or the fixed bonus. For Contrail: 0 or 1 (per submission). The `points` column already reflects the final total (base + card_bonus). `card_bonus` is stored separately for auditability and for result card display.

**Source of truth:** `scores.card_bonus` is the authoritative record of value produced. `flight_cards.bonus_points_total` must equal `SUM(scores.card_bonus WHERE card_id = flight_cards.id)`. If they ever diverge, `scores.card_bonus` wins — the card row is cache/state and is repairable; the score rows are the actual scoring ledger and must not be modified after the fact.

---

## 6. API / Event Flow

### 6a. Deal: `POST /api/session/flight-cards/deal`

**Auth:** teacher session (requireAuth)  
**Body:** `{ sessionId, moduleKey }` — teacher has selected the next module

**Server logic:**
1. Verify teacher owns session.
2. Look up upcoming module's `scoringProfile` from the game/activity registry.
3. Build the compatible card pool, apply weights, normalize.
4. Fetch all `client_id`s active in this session (from recent `scores` or `student_session_prefs`, last 30 min).
5. Insert 3 `flight_cards` rows per client_id with `status='offered'`, same `deal_index` (= max existing + 1).
6. Return `{ dealIndex, studentCount }`.

**Teacher screen** receives `{ dealIndex, studentCount }` and shows inline confirmation banner.

### 6b. Student picks a card: `POST /api/student/flight-cards/pick`

**Auth:** none (public, validated by sessionId + clientId)  
**Body:** `{ sessionId, clientId, cardId }`

**Server logic:**
1. Validate cardId belongs to this clientId + sessionId, status='offered'.
2. Check if client already has a `status='held'` card from a different deal.
   - If yes: return `{ conflict: true, heldCard: { cardKey, cardId } }` — client prompts Keep/Replace.
3. If no conflict (or client sent `replace: true`):
   - Mark chosen card as `status='held'`, `held_at=now()`.
   - Mark all other 'offered' cards for this client in this deal as `status='declined'`.
   - If replacing, mark old held card as `status='replaced'`.
4. Return `{ held: true, card: { id, cardKey } }`.

### 6c. Session payload extension: `GET /api/student/session`

Extend `SessionPayload` with:
```typescript
heldCard: {
  cardId: string;
  cardKey: string;
  moduleKey: string;
  activationsCount: number;   // always 0 for standard cards; 0–2 for Contrail mid-module
} | null;
```

Query: find the single `flight_cards` row for this `client_id` with `status IN ('held', 'active')`.

### 6d. Score submission with card play

Extend `POST /api/session/score` (or the activity/game score paths) to accept:
```typescript
card_id?: string   // optional; for Contrail, passed automatically on every submission while held
```

**Server logic additions (in score handler):**

1. If `card_id` provided:
   a. Fetch the flight_card row; verify `status IN ('held', 'active')`, `session_id` matches, `client_id` matches.
   b. Check `card_key` to determine handling path:

   **Standard cards (takeoff, clear-skies, afterburner, full-throttle):**
   - Card must be `active` to earn bonus. If still `held` at submission time (student sent card_id without tapping activate), treat as if not activated: `card_bonus = 0`, mark `expired`.
   - If `active`:
     - Condition met: `card_bonus = card's fixed value`, mark `status='used'`, set `bonus_points_total`.
     - Condition not met: `card_bonus = 0`, mark `status='expired'`.
   - Card is always terminal after one submission attempt.

   **Contrail:**
   - If `activations_count >= 3`: card already maxed. `card_bonus = 0`. No card update.
   - If `status='held'`: implicit activation — update to `status='active'` first.
   - If outcome is `genuine` or better: `card_bonus = 1`, `activations_count++`, `bonus_points_total++`. If `activations_count` now equals 3: `status='used'`. Otherwise: remains `active`.
   - If outcome is `invalid`: `card_bonus = 0`. No status change.

   c. Store `card_id` and `card_bonus` on the score row.

2. Normal score write proceeds with `points = base_points + card_bonus`.
3. **Safety rule:** card state update must never block or fail the score write. If the card update fails, log it and proceed — a missed bonus is better than a lost score.

### 6e. Card expiry: `POST /api/session/flight-cards/expire`

**Auth:** teacher session  
**Body:** `{ sessionId, dealIndex }`  
**Logic:**
For all `flight_cards` with `session_id`, `deal_index <= dealIndex`, `status IN ('held', 'active')`:
- If `bonus_points_total > 0` (card earned something — covers partial Contrail): `status='used'`, `expired_at=now()`.
- Otherwise: `status='expired'`, `expired_at=now()`.

Called when a module starts, or when a new deal is triggered (expire all prior held cards first).

---

## 7. UI Flow

### 7a. Teacher screen

**Trigger location:** sidebar, between the student picker and the approval queue — a small "Deal Flight Cards" button, visible only when a session is active. 

**Interaction:**
1. Teacher selects next module in the module picker.
2. "Deal Flight Cards" button becomes active (knows the module key).
3. Teacher clicks → button shows spinner briefly → inline text: "Cards dealt to N students" fades in below the button, auto-dismisses after 4 seconds.
4. No blocking modal. Teacher can proceed immediately to start the module.

**Expiry trigger:** when the teacher clicks "Start" on the new module (or the equivalent action in GameShell / ActivityShell that transitions the phase to `playing`), the client calls the expire endpoint for the prior deal. Implementation: pass `onModuleStart` callback or detect phase change in the shell.

### 7b. Student device — card offer (deal phase)

Shown above the "Waiting for next activity..." or idle state content:

```
┌─────────────────────────────────────┐
│  Choose a card                      │
│  ┌────────┐ ┌────────┐ ┌────────┐  │
│  │   ?    │ │   ?    │ │   ?    │  │
│  │        │ │        │ │        │  │
│  └────────┘ └────────┘ └────────┘  │
│  Tap to reveal. Pick one to keep.  │
└─────────────────────────────────────┘
```

- Tap a card: it flips to reveal name + short description.
- Second tap (or a "Hold This Card" button): confirms selection.
- Others fade out.
- If student already holds a card: show a 2-option prompt instead of 3 cards.

Card reveal copy (name + 1-line description, no points values shown):
- Takeoff: "Next answer? +1 if you give it a real shot."
- Clear Skies: "Right answer? +1 when accuracy lands."
- Afterburner: "Right answer? +2 when accuracy lands."
- Contrail: "Stay active this module. Each real answer earns +1, up to three."
- Full Throttle: "+3 points. Only if your answer is standout."

_Note: avoid showing the raw point value in the deal UI. Reveal copy describes the condition; the actual bonus appears on the result card if it activates._

### 7c. Student device — hold phase (module is active)

**Standard cards:** chip appears when card is `held` or `active`.

```
held:   ┌─────────────────────────────────────┐
        │  ⚡ Afterburner  [Activate]         │
        └─────────────────────────────────────┘

active: ┌─────────────────────────────────────┐
        │  ⚡ Afterburner  Activated ✓        │  ← glow border
        └─────────────────────────────────────┘
```

- Tapping: `held` → `active` (server updated). Tapping again: `active` → `held`.
- On submit: card is terminal (`used` or `expired`). Chip disappears on next poll.

**Contrail:** chip is always shown as active — no per-submission toggle needed. Displays running activation count.

```
┌─────────────────────────────────────┐
│  ✈ Contrail  ●○○  Active           │
└─────────────────────────────────────┘
```

After each qualifying submission the dots update: `●○○` → `●●○` → `●●●` (maxed). The chip disappears when the card reaches 3 activations or the module ends.

For both types: if the module is incompatible (shouldn't happen post-filtering), the chip does not appear and the card expires silently at module end.

### 7d. Student device — result

**Standard card activated (bonus earned):**
```
Afterburner  +2
─────────────
Total        5 pts
```

**Standard card played but not activated:**
```
Afterburner  ✗  (condition not met)
─────────────
Total        3 pts
```

**Contrail mid-module (partial activation):**
```
Contrail ✈   +1
─────────────
Total        4 pts
```
The `+1` shows on each individual result card as the bonuses accumulate. The Contrail chip updates to show progress.

**Contrail maxed (3/3):**
Final result card shows `+1` as usual; chip updates to `●●●` and disappears.

_Rule: only show a card line on the result card if `card_bonus > 0`. Never show `+0` lines._

---

## 8. Implementation Phases

### Phase 1a — DB + server card state (foundation)

**Guardrail:** Phase 1a must not touch `/api/session/score` or any scoring route beyond adding two nullable/defaulted columns to the `scores` table. No bonus logic is wired yet. Existing score writes must be completely unaffected.

1. DB migration:
   - `flight_cards` table (full schema as above).
   - `scores.card_id uuid NULL` — nullable foreign key, no behavior change.
   - `scores.card_bonus int NOT NULL DEFAULT 0` — always 0 until Phase 1c.
2. Deal endpoint (`POST /api/session/flight-cards/deal`).
3. Pick endpoint (`POST /api/student/flight-cards/pick`) — handles `held`/`declined`/`replaced` transitions.
4. Activate/deactivate endpoint (or inline into score handler in 1c): `held` ↔ `active` for standard cards.
5. Expire endpoint (`POST /api/session/flight-cards/expire`) — `held`/`active` → `used`/`expired`.
6. Extend `GET /api/student/session` with `heldCard`.

**Phase 1a acceptance criteria:**
- [ ] Migration applies cleanly; existing tables and score writes unchanged
- [ ] `POST /api/session/flight-cards/deal` creates 3 offered rows per active client_id
- [ ] `POST /api/student/flight-cards/pick` transitions chosen card to `held`; others to `declined`
- [ ] Pick with existing `held` card: returns `conflict: true` with current held card details
- [ ] Pick with `replace: true`: old card → `replaced`, new card → `held`
- [ ] `GET /api/student/session` returns `heldCard` after pick; null before
- [ ] After simulated refresh: `heldCard` still present (DB-backed, not session memory)
- [ ] `POST /api/session/flight-cards/expire`: `held`/`active` with `bonus_points_total > 0` → `used`; otherwise → `expired`
- [ ] No existing score write behavior changes — `card_bonus` always 0, `card_id` always null from existing paths
- [ ] `pnpm build` passes

### Phase 1b — Student held-card UI
7. Student device: card offer UI (3 cards → pick one).
8. Student device: standard card chip with `held`/`active` toggle states.
9. Student device: result card — `cardBonus` line.

### Phase 1c — Apply card bonus in score route (standard cards only)
10. Extend score endpoints to accept `card_id`; implement standard card path (takeoff, clear-skies, afterburner, full-throttle).
11. Verify `scores.card_bonus` and `flight_cards.bonus_points_total` stay in sync.

### Phase 1d — Teacher deal button
12. Teacher sidebar: "Deal Flight Cards" button + inline confirmation banner.
13. Expiry trigger: fire expire API when module phase transitions to `playing`.

### Phase 1e — Contrail (last, after basic lifecycle is proven)
14. Add `contrail` to deal pool and compatibility filtering.
15. Contrail card reveal copy in offer UI.
16. Contrail chip: always-active, no toggle, live activation counter (●○○ → ●●○ → ●●●).
17. Contrail path in score handler: `held` → `active` implicit, per-submission +1, `activations_count` tracking.
18. Extend session payload `heldCard` with `activationsCount`.
19. Verify expiry handler correctly resolves partial Contrail to `used` vs `expired`.

Wingman card is **excluded** from V1 (see Phase 2 below).

### Phase 2 — Wingman + polish
- Wingman activation: at module close, scan all scores for this session+module, check if any other client_id submitted. If yes, apply +1 retroactively (write a `scores` adjustment row or update the original score row).
- Card history in Control Room session view.
- Animation: card flip, glow pulse.
- Teacher screen: show per-student held card status (small indicator on student list).

### Phase 3 — Possible extensions (out of scope, not designed yet)
- Rare foil variants with visual flair only.
- Seasonal decks.
- Class-level card event (teacher plays a card that affects everyone).

---

## 9. Risks and Tradeoffs

| Risk | Mitigation |
|---|---|
| Student refreshes during card offer phase | `heldCard` and offer state are in DB; session poll restores state on reconnect. Offered-but-unchosen cards remain available until module starts. |
| Teacher starts module before all students pick | Cards expire cleanly at module-start expire call. Unchosen students lose the deal silently. Acceptable — deal is bonus, not required. |
| Module does not exist in registry at deal time | Server returns `{ error: 'Unknown module' }`. Teacher sees an error toast. Deal does not proceed. |
| Compatibility filter leaves only Takeoff for most modules | Expected and acceptable in V1. Takeoff is the universal fallback and is a valid offer. |
| Score endpoint receives invalid card_id | Server validation: if card not found, not held, or not for this client → ignore card_id, write score without bonus. Never error the score write due to a bad card. |
| Simultaneous mode: multiple submissions per student (standard cards) | First submission with the card_id wins. Card is consumed/activated immediately; subsequent submissions in the same window earn no bonus. |
| Contrail in simultaneous mode | Each submission increments activations_count normally. Standard limit of 3 applies. No special handling needed. |
| Contrail in single-answer activity | Earns at most +1 (one genuine submission possible). Behaves like Takeoff in that case. Students discover this over time. |
| Wingman activation timing ambiguity (Phase 2) | Deferred to Phase 2 design. V1 ships without Wingman. |
| Points inflation from cards affecting leaderboard fairness | Cards are small (max +3), rare, and available to all students equally. Net effect is a small noise floor. Acceptable in V1. Review after ship if delta shows up in data. |
| Teacher forgets to deal | Cards are optional. No module is blocked waiting for a deal. Teacher can skip entirely. |

---

## 10. Acceptance Checklist

### Functional
- [ ] Teacher can click "Deal Flight Cards" between modules without blocking the session
- [ ] Each connected student receives exactly 3 card offers (or a Keep/Replace prompt if holding one)
- [ ] Incompatible cards never appear in a student's offer (e.g., Full Throttle when module is Twenty Questions)
- [ ] Student can tap to reveal, then confirm pick; other 2 offers disappear
- [ ] Held card appears in student's session payload (`heldCard` field)
- [ ] Card chip appears on student device during the correct next module
- [ ] Student can activate/deactivate card before submitting
- [ ] Standard card: tapping chip transitions `held` → `active`; tapping again reverts `active` → `held`
- [ ] Standard card condition met: `active` → `used`, correct `card_bonus` applied to score
- [ ] Standard card condition not met: `active` → `expired`, `card_bonus = 0`
- [ ] Standard card submitted while still `held` (no tap): `expired`, `card_bonus = 0`
- [ ] Takeoff: condition = outcome genuine/on-task/standout (+1); invalid → expired
- [ ] Clear Skies: condition = `accuracy_status = 'correct'` (+1); otherwise → expired
- [ ] Afterburner: condition = `accuracy_status = 'correct'` (+2); otherwise → expired
- [ ] Full Throttle: condition = outcome `standout` exactly (+3); genuine/on-task → expired
- [ ] Contrail: first submission with card_id transitions `held` → `active` (implicit, no tap)
- [ ] Contrail: genuine-or-better → `card_bonus = 1`, `activations_count++`, card remains `active`
- [ ] Contrail: `invalid` outcome → `card_bonus = 0`, card remains `active`
- [ ] Contrail: after 3rd activation → `active` → `used`; no further bonuses
- [ ] Contrail: module ends with `activations_count > 0` → `used`
- [ ] Contrail: module ends with `activations_count === 0` → `expired`
- [ ] Contrail chip shows live activation count (●○○ → ●●○ → ●●●); no per-submission toggle
- [ ] Session payload returns `heldCard` for both `held` and `active` status
- [ ] `heldCard.activationsCount` reflects current `activations_count` from DB
- [ ] `used` / `expired` cards disappear from student device on next session poll
- [ ] Student refresh mid-module: Contrail chip re-appears with correct `activationsCount` from DB
- [ ] Replacing a held/active card: old card → `replaced`, new card → `held`
- [ ] `scores.card_bonus` and `scores.card_id` populated correctly for all card types
- [ ] Result card shows card bonus line only when `card_bonus > 0`
- [ ] Score writes succeed even if `card_id` is invalid, missing, or card not in a live status

### Build / regression
- [ ] `pnpm build` passes with new columns and API routes
- [ ] Existing score write paths unchanged when no card_id provided
- [ ] Student session payload unchanged for sessions with no active deal
- [ ] Control Room / end-session summary unaffected (card_bonus is part of points already)
