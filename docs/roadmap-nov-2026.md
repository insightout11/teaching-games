# LessonCaptain roadmap (late Oct 2026)

_Written 26 Oct 2026. Merges the Oct 6 roadmap (`docs/roadmap-oct-2026.md`) with what the first real class showed
(Live Room pilot 001, Cairo to Dubai, ~12 students). Replaces the old order; the old file stays for history._

## The direction now

The first class showed what LessonCaptain is: **one Live Room flight where students choose, talk and discover**,
with landmarks, the vote, the topic dots and the class photo doing most of the work. So:

1. **The flagship flight comes first.** Everything that makes that one flight better beats new flight types.
2. **Other Flight Plans go to a back catalogue** (Speak, Debate, Listening, Reading, Travel, Captain's, Grammar):
   hidden, not deleted, released one at a time after each gets a class test. Games and activities stay launchable
   from inside the flight (Quick-fire and the quiz were part of the success).
3. **Landmarks are a core pillar.** They get their own track, mostly outsourced (Codex, Gemini).
4. **Every release is taught with before the next is planned.** Class notes from the owner are the main input.
5. **Rewards are earned by talking, not by passing.** Country items, mascot unlocks and rarity all hang off what the
   class actually discussed or saw, decided by the teacher's one click.

## Where the old roadmap stands

| Old item | Status |
|---|---|
| Phase 0 test round, Live Room in a real class | **Done for the flagship flight** (pilot 001). Other flights untested -> back catalogue |
| Pricing (option B: 4 free lessons/month, Pro $9/$79) | Decided. Not live |
| Kids' privacy review | Quick wins done; lawyer before launch still open |
| Home page (departures board) | Built |
| Live memory and continuity | Partly: logbook, "Talked about", album. Recap and next-lesson use still open |
| Pictures and art, Junior mode | Built (stickers, picture tiles, Junior switch); phone Junior UI open |
| Landing page, onboarding, billing live, Departures Board, marketing | Not done; still Phase C below |
| Class rewards and plane system | Partly: souvenirs, postcards, World Flight map, album. Now redesigned around talk (Phase B) |
| World Flight audit, city art, city expansion | Folded into Phase B / D (Tripoli) |
| Flight visuals | Ongoing (terrain live, coast live); landmark track below |

## Phase A: before the next class (Friday 7 Nov 2026)

| # | Item | Notes |
|---|---|---|
| A1 | **Prediction answer at the end** | Not mid-flight (it interrupted a good conversation). Into the end reveals |
| A2 | **Time at the destination** | Hold the arrival screen with "Talk about [city]" prompts; teacher taps Continue before the quiz |
| A3 | **"Our flight" quiz fix** | Questions from memory ("Which landmark did we photograph?"), better distractors, never a place the screen just named |
| A4 | **Scoreboard upgrade** | Podium landing with the winner's avatar (the approved quiz-look idea) |
| A5 | **Votes as a debate** | Live counts per city on the board, students can change their vote, a "why?" line |
| A6 | **Seat choice** | Tap a free seat on the boarding pass; first tap wins; join order as fallback |
| A7 | **Class mascot** | One per flight: build it (quick votes, avatar style, twice the size, sits in the cabin) or use an unlocked one. First unlock: Saturn really visible -> alien |
| A8 | **Country item, one click** | Teacher clicks the country passing below -> it goes in "Talked about" -> the class earns a shared item. Clothing layers later |
| A9 | Maybe: **selfie expressions** | Choose an expression on the phone before the snap |
| A10 | Maybe: **random Quick-fire** | A "random questions" option |

Then: teach, write class notes, fix.

## Landmark track (outsourced, runs alongside)

| # | Item | Who |
|---|---|---|
| L1 | **Everest test: patch vs WebGL vs today** (`docs/everest-landmark-test-brief.md`) | Codex builds, Gemini blind-reviews, owner decides |
| L2 | **Rarity in words** ("common", "rare", "very rare") on photo cards, the album and route cards; counted over routes a class can really fly | Codex (its route gallery) |
| L3 | **Landmark reveal** for every landmark: cloud clears, scenery slows, flyby title, a moment to talk, then the photo | Claude, after L1 |
| L4 | **Copilot moment** ("Speak what you see / Say what you think / Take over the plane"): a student picks when to reveal, which view, when to snap. Views depend on L1 | Claude, after L3 |
| L5 | Other natural landmarks on the L1 pipeline (Fuji, Matterhorn, Kilimanjaro, volcanoes) | Codex, if L1 says go |
| L6 | Album: photos vary by time of day and weather; rarity shown | Claude |
| L8 | **Clouds and landmarks** (owner idea, 26 Oct): default "clouds part" as a landmark comes into view (reliable photo moment, doubles as the cloud reveal); a live label "Weather at Mount Everest now: cloudy, -23 C"; a teacher switch **Real weather mode** (hard mode: clouds match the real weather at the landmark, a clear photo becomes special). Ask a class which they prefer, maybe as a quick vote at take-off | Claude, with L3 |
| L7 | **Wayfinding labels** beyond landmarks: islands and coasts coming up, borders, seas, Saturn/ISS in the sky. One label at a time, only what is about to appear, quiet styling, never in photos; teacher can turn them off | Claude, after the label fix in L1 |

## Phase B: the flight as a place students return to

| # | Item | Notes |
|---|---|---|
| B1 | **Phone city research before the vote** | Map, reachable cities, reasons to go, landmarks on the route (with rarity words), what can be earned. Iterate with the owner |
| B2 | **Student onboarding** | Three skippable screens on the first boarding pass: seat, dots, photos |
| B3 | **Dots for discoveries** | At landing, 3 dots each on the flight's discoveries; the winner is the album cover or a mascot unlock. After the topic board, never at the same time |
| B4 | **Country items v2** | Avatar clothing and cabin items, saved per student; respectful item list (no costumes) |
| B5 | **Mascot collection** | Unlocks from real discoveries; one boards per flight |
| B6 | **Pre-takeoff hello** | "How was your week?" moment in the briefing, plus where next and why |
| B7 | **Tripoli** (first new city, students asked) | Arrival scene, data, routes. Codex data, Claude art, owner review |
| B8 | **Room controls tidy** | Fewer buttons so a second teacher can run the flight |
| B9 | **Back catalogue switch** | Hide untested Flight Plans; release each after a class test |
| B10 | **Between lessons** (not solo play) | Students see their class map, album and souvenirs at home |

## Phase C: bring teachers in (from the old Phase 2, unchanged in order)

| # | Item | Depends on |
|---|---|---|
| C1 | **A second teacher runs the flight** (biggest risk: only the creator has run it) | B8 |
| C2 | Landing page around the flagship flight (landmarks, the vote, the class photo) | A, L3 |
| C3 | Onboarding, first lesson | B8 |
| C4 | Billing live (Stripe, pricing B) | none |
| C5 | Kids' privacy: lawyer review | before marketing |
| C6 | Departures Board | C4, C5 |
| C7 | Marketing material (class footage with permission, the photo moment) | C2 |

## Phase D: depth and polish

- Back-catalogue flights, one at a time after class tests.
- More cities after Tripoli, in the same art style.
- GPU cockpit question: only if L1 shows WebGL clearly helps.
- Live memory: recap and next-lesson suggestions from "Talked about".
- Junior mode on phones.

## Ongoing

- Class notes after every class -> fixes jump the queue.
- Zoom transcripts (if permitted, names removed) to check who spoke.
- Reliability: frame rate in class while sharing on Zoom, AI cost per lesson.
- Codex and Gemini content rounds: always verified by script before merging.
