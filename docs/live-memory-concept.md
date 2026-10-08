# Live memory and continuity (concept)

_Oct 7 2026. Roadmap Phase 1 #4 (Live Room Focus Phase 3). Concept for owner review; nothing built._

## The idea
The room remembers the lesson **while it happens**, and the next lesson starts where this one left off. The
competitor report's point: AI summaries after class are becoming standard; memory that the teacher uses during and
between lessons isn't. In LessonCaptain's words: **Prepare → Teach → Improvise → Capture → Continue.**

## What's kept today
- **During class, in the browser only:** the Focus trail (earlier topics) and the lesson thread (flight answers,
  before → after). Lost when the class ends, except as below.
- **Flight results** (before → after, class counts) in `session_private_state`, shown teacher-only on the class page,
  the end summary and course pages.
- **Course lessons** keep their key phrases and result (`lesson_memory`) for the next course lesson.
- **Reference words** the phones showed (`sessions.reference_vocab`).
Nothing records which topics came up, which words were hard, what was explored, or what to pick up next time.

## What the room should remember (automatically, no teacher typing)
| Captured | From | Example |
|---|---|---|
| Topics, in order | The Focus trail | "Volcanoes → Bali → holidays" |
| Words that came up | Focus vocab, Language Toolkit, Pocket Phrasebook stamps ("I used it!") | 14 words, 6 used by students |
| What was hard | Activity results (class counts only) | "Past tense questions: 2 of 6 right" |
| Material explored | Sources and cargo opened | The volcano article, a map pin |
| Activities and flights | What was launched and finished | Reading flight, Static, a poll |
| Questions left open | Class Questions not answered | "Do volcanoes exist on Mars?" |
| Teacher notes | The existing notes (teacher-typed only) | "Mia struggled with numbers" |

**Never captured:** recordings, transcripts of what people said, anything that judges the teacher (the report's
surveillance warning), names on anything that's shared or public.

## Where it shows up
1. **During class: a "Logbook" drawer in the room** (teacher only): today's trail, words so far, what's been hard.
   One tap brings an earlier topic back ("Back to volcanoes").
2. **At the end: the class logbook entry**, written for the teacher: topics, words, what went well, what was hard,
   open questions. Teacher-only, class counts only.
3. **Next time the class boards: "Last time"** at the gate (one line on the Home departures board, and a card in the
   room): "Last time: volcanoes, 14 words, past tense was tricky." With suggestions, as **proposals the Captain
   approves** (nothing launches by itself):
   - "Warm up with last lesson's words" (a 3-minute word game from the captured words).
   - "Pick up the open question: Do volcanoes exist on Mars?" (sets it as the Focus).
   - "Practise past tense again" (a short activity on what was hard).
   - "Continue the course: lesson 5" (if the class follows one).
4. **Optional recap for students and parents** (later, and only after the privacy work): words learned and topics,
   first names only, as a link that expires (the results page already works this way).

## How it fits what's built
- Saved per session (a small JSON record, like flight results), so there's **no new table** at first; the class page
  reads the latest few.
- The Focus trail, vocab and activity results are already in the room; this saves them as they happen (so a refresh
  or a crash doesn't lose them) and at the end.
- "Last time" suggestions reuse what exists: Focus (set a topic), activity launch with content, course "next lesson".
- One small AI call at the end turns the raw record into a readable logbook entry and 2-3 suggestions; everything else
  is plain data.

## Build steps (after approval)
1. Save the lesson record as it happens (trail, words, results, material, open questions) and at the end.
2. The class logbook entry from it (teacher-only), on the class page and the end summary.
3. "Last time" on boarding (room card + Home departures board line) with approve-to-launch suggestions.
4. The in-room Logbook drawer and "back to an earlier topic".
5. Later: student/parent recap link (after the privacy work and the consent decision).

## Decisions for the owner
1. Is this the right list of what to remember? Anything missing (or anything that feels like too much)?
2. Suggestions at boarding: always shown, or only when the teacher opens "Last time"?
3. Student/parent recaps: wanted at all, and if so, after the privacy decisions?

## Owner decisions (Oct 7 2026: "go with your recommendations")
1. The capture list as written. 2. "Last time" shows as one line at boarding with its suggestions one tap away
(never launching by itself). 3. Student/parent recaps later, only after the privacy decisions.

## Built: step 1 (Oct 7 2026)
- `src/lib/lesson-memory.ts` (record shape, merge rules, caps, sanitizer), `src/hooks/use-lesson-memory.ts` (browser
  copy in localStorage `lc-lesson-memory-<session>`, saved 15 s after a change and when the page closes), wired into
  the room (`flight-deck.tsx`): each Focus topic, the briefing's words, material opened (not typed notes), every
  activity launched and flight plan started.
- Saved through `/api/session/lesson-memory` to the teacher-only table `session_memory`
  (`supabase/migrations/058_session_memory.sql`, **applied Oct 8 2026** with the owner's OK; anon access refused).
- Not yet: "Last time" at boarding (step 3), the in-room drawer (step 4).

## Built: step 2 (Oct 8 2026)
- `lessonEntry()` turns the record into a plain entry (no AI call): talked about (topics in order), words (10 + count),
  did (activities and flights), explored (Sources items). `LessonEntryLines` shows it.
- **End-of-lesson summary**: "What this lesson covered" (teacher view), from this browser's copy first, then the server.
- **Class page**: the Class Logbook card shows what the latest two lessons covered, read server-side after the
  class's RLS ownership check.
