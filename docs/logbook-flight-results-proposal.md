# Flight Results in the Logbook: Proposal

> Status: **proposal for discussion.** Oct 5 2026.
> From Flight Presets v2 (`docs/flight-presets-concept-v2.md`): "the before → after goes into the class logbook with the
> city (Lisbon · Past simple · 55% → 86%)". That step was never built.

## The problem
Every v2 flight now ends with a before → after reveal:

| Flight | Before (takeoff) | After (landing) | Reveal |
|---|---|---|---|
| Grammar | Grammar Check-in | Grammar Proof | Wings earned, accuracy before → after |
| Debate | Quick Pulse | Opinion Shift | How the room moved |
| Captain's Flight | Flight Question stance + prediction | The Verdict | The shift + prediction vs reality |
| Travel | Can-do check at boarding | Can-do stamps at landing | Stamps the class earned |
| Speak | Situation check (Try 1) | Better answers (Try 3) | Natural replies, confidence, can-do |

But **none of it is saved.** The reveal lives in the browser's memory for that lesson only:
- the class logbook (`src/lib/class-logbook.ts`) is built only from session topics and scores (flights, points, accuracy);
- a refresh mid-lesson loses the "before" (it's held in the in-memory lesson thread);
- courses can't show their "row of before-and-afters", and there's nothing for a "still flying?" check next lesson.

## The idea
When a flight's reveal shows, save **one small result record** for the session: the flight, the city and topic, and the
class-level before → after numbers. The logbook, the end-of-session summary, the share page and courses all read it.

### What a result holds (class counts only, never names)
```
FlightResult {
  preset: 'speak-60' | 'grammar-60' | 'travel-60' | 'debate-60' | 'all-around-flight-60'
  topic: string                      // "Ordering at a café"
  city?: string                      // the destination ("Lisbon")
  focus?: string                     // grammar target, situation, motion…
  measures: Array<{                  // 1–3 lines, each "label: before → after of N"
    label: string                    // "Natural replies", "Accuracy", "Agree with the motion"
    before: { count: number; of: number } | null
    after:  { count: number; of: number }
  }>
  phrases?: string[]                 // up to 4 of the lesson's phrases
  savedAt: string
}
```
Example line in the logbook: **Lisbon · Speak · Café · natural replies 3 → 7 of 8**.

### Where it's stored: no migration needed
Use the existing **`session_private_state`** table (one row per session and key, JSON payload, server-only writes) with
key **`flight-result`**:
- **No migration.** Migrations here are applied by hand, so avoiding one matters.
- **Writes go through a server route** with a teacher ownership check (the session's class belongs to the teacher), the
  same pattern as the lesson brief and cargo-hold state.
- **One honest caveat:** this table's read policy is public (built for the shared screen). A flight result is only class
  counts and the topic, which already shows on the projected screen, so that's acceptable. Individual answers are
  **never** stored here.
- **Later, if needed:** a dedicated `sessions.flight_result` column (one manual migration) if we want to query results
  across many classes. Not needed for the logbook.

### Write path
1. A shared helper and route: `POST /api/session/flight-result` (upsert, idempotent; saving again just replaces it).
2. Each landing reveal calls it once when the reveal shows: Speak's Better answers, Travel's stamps, Grammar's Proof,
   Debate's Opinion Shift, Captain's Verdict.
3. **Bonus fix:** the takeoff "before" is saved too (a `flight-before` key), so a mid-lesson refresh no longer loses it.
   The landing reads it back if the in-memory copy is gone.

### Read path
- **Class logbook card** (class page): the last 3–4 flights as one-line results under the existing totals.
- **End-of-session summary:** the result as the headline of the deposit card.
- **Logbook share page** (public link the teacher shares): the same lines. Class counts only.
- **Courses:** at session end, copy the result into `course_lessons.lesson_memory` (already written with the phrases), so
  a course page shows its row of before-and-afters lesson by lesson. The "still flying?" check next lesson can then reuse
  one item from the last result (a later step).

## Build order (once agreed)
1. Type + helper + route, and **Speak and Travel** write their results (their reveals already hold the numbers).
2. **Grammar, Debate, Captain's** write theirs (check each reveal's numbers map cleanly onto `measures`).
3. Save the takeoff "before" so refreshes don't lose it.
4. Show results on the class logbook card, the end summary and the share page.
5. Courses: copy into `lesson_memory`; course page row of before-and-afters.

## Questions for you
1. **The share page is public** (anyone with the link). Show flight results there (class counts only), or keep them on the
   teacher's class page only?
2. **Counts or percentages?** The concept said show counts in small classes ("3 of 4"). Counts everywhere, or
   percentages when the class is 10 or more?
3. **Which line leads** when a flight has several measures (Speak has three)? I'd lead with the main one (natural replies,
   accuracy, the shift, stamps) and keep the rest on the detail view.
4. **Courses:** build the course row of before-and-afters in this pass, or after the logbook?
