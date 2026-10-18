# LessonCaptain design direction: plan v4 (handoff)

_Written Oct 18 2026 at the end of a cloud Claude session with the owner. **This is the current plan.** It replaces the
earlier versions wherever they disagree._

**Branch:** `claude/adoring-gauss-7a18kq` (docs only; no application code changed; no PR opened).

**The documents, in reading order:**
1. **This file:** the plan, decisions and build order.
2. `docs/design-direction-owner-notes-oct-2026.md`: the detailed record of the owner's part-by-part review (every decision with its context). Read it for detail on any section below.
3. `docs/design-direction-notes-oct-2026.md`: the owner's original idea notes (the source).
4. `docs/design-direction-evaluation-oct-2026.md`: plan v3 (history). Its data model, route analysis and online-setup thinking are still useful background, but v4 wins where they differ.
5. Astra's (Codex's) independent review of v3: written by Codex on the owner's machine (`docs/design-direction-review-report.md` on a local branch `codex/design-direction-review`, committed locally, not pushed). Its findings that matter are summarised in section 6.
6. `docs/design-direction-review-brief.md`: the brief Astra worked from.

---

## 0. Summary for the orchestrator

**What happened:** the owner wrote design direction notes. Claude evaluated them against the code and wrote a plan (v1 to v3). Astra reviewed v3 and found real problems (all confirmed in the code). The owner then went through the plan part by part, using his real classes as test cases, and made the decisions recorded here.

**The direction in one sentence:** LessonCaptain adapts to each class. A teacher picks a **class type** once, and the cockpit opens set up for that kind of class, with every tool still one tap away. Students without devices are full members of the class. The flight becomes a real journey, with things to see on the way and a real arrival.

**Do first (small, unblocks the owner's own classes):**
1. Fix the flight timing bug (section 3, finding 1).
2. Seats on the plane for students without devices, with teacher-set avatars, included in the picker, hands-up and votes (section 2.2).
3. Save favourites and recent activities per class (finding 4).
4. "Where next?" topic ideas in Talk (section 2.4).
5. Free Wikimedia picture suggestions in the private window, Serper only on a button, cached (section 2.7).

Then: class types and onboarding (Phase 2), the flight experience (Phase 3), the activity upgrades (Phase 4). See section 4.

**Owner process rules (from the roadmap):** propose big redesigns before building. Plan-heavy items (class types, onboarding, flight visuals) get a short concept doc or mockups and owner review first. Nothing new is trusted until it has been taught with in a real class.

---

## 1. The idea and the positioning

- **No single ideal classroom.** The owner has taught large classes in China, students meeting their first foreign teacher, private schools, business schools, kids, teens, adults, online and in person. LessonCaptain adapts to the class instead of forcing the class to adapt.
- **The cockpit:** many tools, but each class sees what it needs first. The teacher steers; nothing interrupts the teacher's lesson unless the teacher asks.
- **The moat** (agreed by Claude and Astra): running the live lesson well for *every* student present, not a settings menu or AI content (both are commodities, per `docs/competitive-landscape-oct-2026.md`).
- **The owner's story goes on the landing page now** (no build needed).
- **Main audience:** live online classes (`docs/product-direction-lock.md`). In-person classrooms and 1-on-1 are supported as settings.

---

## 2. Decisions by area

### 2.1 Class types (the "modes")
Four class types, chosen once per class, describing how the class usually runs:

| Class type | Card line | Opens on | Flight plans shown first | Scoring | Flight length |
|---|---|---|---|---|---|
| **Structured class** | Each lesson follows a plan with clear aims. | The lesson plan | All, Captain's Flight first; courses fit here | Right answers count | Whole class |
| **Game time** | You teach the lesson your way; LessonCaptain runs the last 15–20 minutes. | The game shelf, class favourites first | None by default | Competitive, podium | The 15–20 min used |
| **Conversation + games** | Talking is the goal; games and activities keep it going. | Talk, picker ready | Speak, Travel, Debate | Light (taking part) | Whole class |
| **Free talk** | Open conversation; LessonCaptain brings ideas, pictures and questions. | Talk, with "Where next?" and pictures | None by default | Off | Whole class |

**The owner's real classes behind the types:**
- Structured: the Chinese ClassIn groups (not on LessonCaptain, but they show the demand for structure).
- Game time: Sunday ×2 and Thursday (textbook first, then a 15–20 minute game; one class loves Kahoot, one loves Imposter).
- Conversation + games: Friday 1 (ages 11–14, about B2).
- Free talk: Friday 2 (advanced teens; about half have no second device).

**Rules:**
- The type decides **what's in front of the teacher; it never removes anything.** "All tools" always shows the full catalogue.
- Tools that need phones stay visible in phone-free classes, **clearly marked**, with the no-phone version offered. "All tools" is a preference escape, never an accessibility trap (Astra).
- **Class types vs flight plans:** a type answers *how does this class usually run?* (chosen once, structure words); a flight plan answers *what is today's lesson?* (chosen each lesson, skill words). Each type recommends plans. Names checked: "Game time" avoids the retired "Game Day"; "Conversation + games" is distinct from the Speak plan.
- **Quick bar (6 slots) per type:** see owner notes §2.
- **The class remembers** its type, favourites, last-used activities, usual lesson length and settings. "Change for today" overrides the type for one lesson. The room corner shows the type; the flight plan shows only when chosen.

**Settings that work with any type:**
- **Junior** (exists).
- **How students answer:** all have a second screen / some / none. Builds on `student_device_mode`.
- **1-on-1:** automatic when the class has one student. Hides group-only tools from the quick bar (Conversation Rounds, Pass the Line, Quick-fire, Hot Seat, Imposter, Taboo, Tag-team Debate, Sector Strike), with no picker, seats or leaderboard. Personal progress instead of ranking; phones default to not needed. Later: "you vs the teacher" versions (Taboo, Hot Seat, Debate, Flash Quiz vs your own best).
- **Where you teach:** online / in a classroom. A classroom defaults to phones not allowed, adds tap-to-count for hands, and needs a projector readability check (high contrast).
- **Students vote on the game** (Game time only; off by default, since the owner usually picks).

**Astra's cautions that apply:**
- Every launch path needs the same "can this class do this?" check, not only the main catalogue. Explore, the Home drawer, the plan picker, saved plans, swaps and bonus votes each launch separately.
- Some type × setting combinations leave very few tools (e.g. Junior + Grammar; 1-on-1 Conversation). Define a fallback when fewer than three suitable tools remain, and include Picture Quiz for Junior.
- No automatic "learning" from usage counts yet: hidden tools get used less, so the counts mislead. The teacher reorders by hand.

### 2.2 Students without devices: seats on the plane (first build)
- Class-list students who don't join appear as **seats on the shared screen**, with their avatar and a small "no device" mark.
- The Spin picker, Next speaker and hands queue include them. The teacher marks their answers and casts their votes (tap the seat, then the choice).
- **The teacher can set avatars** from the class list; students who join can still change theirs.
- **Needs one attendance list per student** (Astra): a student can be present by voice, by device or both, may join late, may reconnect on a second device, and must be counted once. Fix the participation stars with it (finding 3).
- Must exist before classroom teachers test the product.

### 2.3 Online inclusion (from v3, scoped down by Astra)
- Online setups: two devices, one computer with two windows, one phone switching between Zoom and LessonCaptain, and no second screen.
- **No speed points in online classes** (Flash Quiz's existing Calm skies mode is the model); the teacher opens and closes each question.
- **Team captain answers: Flash Quiz Team battle first, only.** Each team game scores differently. Debate and Taboo keep their speaking turns.
- **One-phone audit** before offering a step as "quick taps": the phone must carry the question itself. Known failures: Mystery Flight (clues not on the phone), Rank It's second round (new facts missing), Sector Strike (no board), Story Sprint written branch (story so far missing), Decision Council challenge step (letters without proposal text).
- Student analytics stay off (the privacy review removed PostHog from student pages); measure from the teacher's side only, as class totals.

### 2.4 Free talk tools (Friday 2)
1. **"Where next?" (the owner's biggest need).** An always-visible strip on the teacher panel with 4–6 related topics, each labelled by how it connects (bigger picture, the other side, closer to home, in the news, a surprising link). One tap makes it the topic. It remembers the topics covered and can go back to an earlier thread.
2. **Pictures:** see 2.7.
3. **Topic board.** 4–6 big fact cards on the shared screen. Click one to go deeper (more sentences plus two discussion questions); one tap sends a question to Talk. Pictures: the Wikipedia page's image for named things, then a Wikimedia search, then (later) the roadmap's picture library, otherwise text only. "Deep dive" depth suits advanced teens.
4. **Optional ending button:** 3 phone-optional activities that fit the topic. Never pops up on its own; a good conversation just continues.
5. The Talk question writer says "kids and teens". That's fine for Friday 2; revisit for adult classes.

### 2.5 Conversation + games tools (Friday 1)
- **"Your turn: pick a place".** The picker chooses a student (devices or not). They choose a city, food or topic; the screen shows free pictures and 2–3 easy prompts. The teacher flips pictures while they talk; the student can pass to a friend. This is the owner's own technique for quiet students.
- **A private "who hasn't spoken yet" list** on the teacher panel (some students take long turns).
- **Scene Igniter:**
  - Today it casts at most 4 per scene; a bigger class gets a second scene.
  - Add bigger casts (5–8 characters) and audience jobs (director who calls "Cut!", critics, narrator).
  - Set scenes in the destination city.
- **Team activities:** existing talk-based team games, plus an idea for a destination challenge ("plan a day in Cairo", pitch, vote).

### 2.6 Game time and quizzes
- **The Flash Quiz gameplay redesign is on hold** (owner: too specific for now).
- Flash Quiz has no pictures; Kahoot's pictures are likely part of its appeal. Add pictures via Wikimedia (2.7).
- Parked ideas: podium finish, comeback round, "explain it" after each answer.

### 2.7 Pictures and Wikimedia
- **Free first:** Wikimedia/Wikipedia pictures (no key; the app already calls Wikipedia in `src/lib/sources/wikipedia.ts`).
- **Serper (paid) only on a button press**, with the topic prefilled. **Cache Serper results** (currently not cached; the daily cap in migration 057 was never applied).
- In the **private window** (second monitor), show 6–8 free suggestions for the current topic, one click to show on the big screen, and an optional queue of 3–4 to step through.
- **Wikimedia across the app:** Flash Quiz questions, vocabulary cards, Taboo and Hot Seat cards, topic board, arrival cards, vote cards. Survey every words-only screen. Show picture credits (licences vary).

### 2.8 Flights
1. **Timing fix** (finding 1). The clock starts when the room opens (or a "class ends at" time); a late take-off flies faster and still lands on time. Add "+5 / −5 min" buttons, and persist the setting. **Every flight lasts the class (standardised), whatever the distance.**
2. **Lesson shape:**
   - The where-next vote at the start, while students arrive; take-off when it closes.
   - Calm cruise.
   - **The descent starts automatically 5 minutes before the end** (also a wrap-up cue for the teacher).
   - The last 5 minutes are the arrival.
3. **Descent (about 5 min).** Chime, "Cabin crew, prepare for landing", seatbelt sign, "Descending" on the corner map. The camera slowly lowers (the cruise height is a fixed constant today, `CAM_HEIGHT` in `cockpit-world.tsx`). Clouds at eye level, mountains loom, city lights at night. The skyline and landmark appear on the horizon (arrival scenes already have them), then the existing touchdown.
4. **Arrival:** "Welcome to Cairo" with the local time, live weather and temperature shown big, a picture, three cards (food, sights, local words; the class picks one for 2–3 min), then the stamp and souvenir.
5. **"Look outside" moments:**
   - Window-only things happen by themselves (weather, terrain, sunset, a quiet caption, a distant plane; no sound).
   - Anything with a picture, question or sound waits for the teacher's tap. An icon appears on the corner tracker map ahead of time ("Alps in 3 min").
   - Never during an activity.
6. **Landmarks:**
   - Drawn, bigger than life. Famous mountains in their real shape (Matterhorn, Fuji, Kilimanjaro, Everest, Table Mountain); storybook sights (Stonehenge, the Pyramids, the Great Wall, Niagara).
   - **Side view** within about 300 km on the correct side, with "Look left" turning the view. **No detour**: route, distance and range are unchanged (avoids Astra's journey-system issue).
   - **Camera view** (a zoomed outside camera, like seat-back screens) for small or far landmarks.
   - **Real weather decides:** clear means the window; cloudy means "under the clouds today, switching to the camera".
   - Tap card: picture, 2–3 facts, a question.
   - First 8: Everest, Matterhorn, Fuji, Kilimanjaro, Pyramids of Giza, Stonehenge, Great Wall, Niagara Falls (all already in `src/data/world/named-features.ts`).
7. **Where-next vote:**
   - Every city in range, each with a picture, what it passes on the way, new stamp or visited, souvenirs (and rare ones), and strategy ("Stop 3 of 5 on your expedition", "Gets you closer to Tokyo").
   - No flight time shown.
   - Students' typed reasons revealed after the vote, and the teacher asks them to explain. Optional team pitches.
   - Seat votes for students without devices. Optional term goal (a dream destination).
8. **Live data:**
   - Yes: NASA live natural events (EONET: wildfires, eruptions, storms, icebergs) and country facts at borders (flag, language, currency, hello).
   - Low priority: Space Station position.
   - Wikipedia "what's near here": for tap-info only, not the animation.
   - No recipes.
   - **Open-Meteo's free plan is non-commercial; switch to their paid plan before charging teachers.**
9. **Terrain:**
   - Use real terrain from a free global land-cover map (NASA/ESA), shrunk into a small static file.
   - Add types: rainforest, savanna, tundra, wetlands and deltas, tropical islands and reefs, rice paddies, steppe, canyons, volcanoes, salt flats, cities by day.
   - Use Natural Earth names for mountain ranges and deserts.
   - Today: 7 types (`Terrain` in `cockpit-ground.tsx`), placed by hand-drawn regions (`route-terrain.ts`).

### 2.9 Onboarding (owner: "so important, not to lose the teachers")
1. Sign in with Google.
2. **"Set up your first class"** replaces the 5 teacher questions (`src/lib/teacher-profile.ts`, `OnboardingFlow.tsx`): name, who (age, level, Junior), class type cards, how students answer, where they teach (1-on-1 follows from one student). Later classes reuse the previous answers.
3. **Class list:** optional but encouraged ("so everyone gets a seat and avatar").
4. **Guided test flight per class type**, in the real cockpit with the pretend students (the hidden Demo Class exists, `src/lib/demo-class.ts`). One control and one sentence per step, at most 5 steps, learn by doing. Skippable and replayable. Steps per type are in owner notes §10.
5. **Screen setup tips:**
   - Online: share this tab in Zoom, Zoom layout, private window on a second monitor.
   - Classroom: full screen, high contrast.
   - 1-on-1: share your screen.
6. **First-lesson checklist on Home:** share the join code, try the picker, run one activity, land.
7. **Tips at the moment they're needed** (at most one per lesson, each dismissible, all can be turned off), plus a "?" one-page guide per class type. Later: 30-second videos.
8. **Measure drop-off** (teacher-side events): signed up, class set up, test flight started and finished, first real lesson, second lesson within two weeks.

### 2.10 Classroom (projected)
- **Now:** the setting, the phones-not-allowed default, tap-to-count, the projector check.
- **Later, after 2–3 real classroom teachers try it** (the owner knows some): team devices, co-pilots (sharing a phone, which only works in a room), movement answers, bigger casts, and the **teacher remote** (phone controls the room; from the May 2026 notes, never built).
- Questions to send them: owner notes §2.

### 2.11 Design your class (changed)
- **Dropped:** a special voting tool; a research lesson in every class. Teachers pick the class type themselves.
- **Kept, as small in-lesson choices:** the where-next vote, the optional game vote, choosing the next topic.
- **Not now:** "Play again?" votes after activities (too many steps). Student feedback matters, so find a lighter way later.
- **Low priority:** an optional ready lesson in the library.

### 2.12 Business decisions
- **LessonCaptain charges teachers only, from 2027** (pricing already set up; `docs/pricing-options-oct-2026.md`).
- **Next for the owner: find students for 1–2 new test classes,** paid directly to him outside LessonCaptain. A public "Classes with Matt" board (times in the viewer's zone, level, age, class type, spots, free trial, the class's journey as proof) plus a request form filled in by parents for children, collecting little data. It's an income stream even if LessonCaptain stays small.
- **Later, if demand grows:** other teachers on the board, with the owner taking a cut. Only then build payments and payouts.
- **Ladder:** own board → request form with manual grouping → trusted teachers → automatic matching, scheduling and payments → open marketplace (far off).
- **Beta teachers:** the sign-up with incentives already exists. Invite the first 3–5 once class setup, the guided test flight and seats exist.

### 2.13 Dropped or parked
- **Dropped:** the Class Design voting tool; nine activity-category modes; automatic adaptation from usage; Three.js; live aircraft data; recipe data; detour routes.
- **Parked:** the public teacher-style quiz; the Flash Quiz gameplay redesign; matching beyond manual grouping; scheduling automation; signature routes with unlocks (revisit after moments and landmarks); a light student-feedback method; "you vs the teacher" 1-on-1 versions; classroom team devices, movement answers and the teacher remote.

---

## 3. Findings in the code (bugs and gaps, with locations)

1. **The flight lands late when take-off is late.** The class length is chosen at the gate, but the flight runs `classMinutes − 5` from `takeoffAt` (`src/components/session/live-room/flight-deck.tsx`, around lines 732–738). It also isn't persisted (the local flight record around lines 290–302 omits it). Real case: Cairo, 12 minutes short at the end of class.
2. **The room's picker ignores students without devices.** `seated` is built from `participants` (joined devices) only (around line 1093); `spinRoulette` and `nextSpeaker` use it (around lines 1158–1190). Games pick from the roster; the room doesn't.
3. **Participation stars miscount mixed classes.** `calculateWorldFlightReward` (`src/lib/world-flight/progression.ts`): linked teacher marks count, but roster-only students are left out of both the numerator and denominator once any device joins (can inflate the result to 100%). One student on two devices counts as two. Fix with one attendance identity per student (Astra finding 4 has test cases).
4. **Favourites and recent activities aren't saved,** and the quick-bar defaults are the same for every class (`catalogueState` and `DEFAULT_STAMPS` in `flight-deck.tsx`, around lines 102 and 830–874).
5. **Flash Quiz has no pictures** (`src/games/flash-quiz/game.tsx`). Team battle averages over the whole roster (one captain's 100 points shows as 25 for a team of four).
6. **Serper image and web searches aren't cached;** the daily cap migration 057 is marked "PR ONLY: not applied".
7. **Open-Meteo licence:** the free plan is non-commercial (`src/lib/live-room/live-weather.ts`).
8. **Feature lookup only names a feature when the plane is directly over it** (`featureNear` in `src/lib/live-room/places-below.ts` uses the radius only). The "aurora" weather condition is a latitude, night and clear-sky guess, not an observation.
9. **Single filtering point only covers the main catalogue** (`session-view.tsx` around lines 842–843). Other launch paths: Explore, `DiscoveryDetailDrawer`, `flight-plan-panel.tsx`, saved plans, swaps, bonus votes. Full inventory in Astra's report §3.
10. **Scene Igniter casts 4 per scene** (`src/activities/scene-igniter/activity.tsx`, `groups` around line 62).
11. **The Talk prompt writer assumes "kids and teens"** (`src/app/api/live-room/talk-prompts/route.ts`).
12. **Teacher-profile columns:** migration 064 grants updates to a fixed list of teacher columns, so new onboarding fields need grants. The class settings update in `class-defaults-card.tsx` ignores save errors (Astra finding 7).

---

## 4. Build order

Sizes: S = a day or two, M = about a week, L = several weeks (with Claude and Codex building). Real-class testing is the true limit. Each phase ends with the owner teaching with it.

### Phase 1: foundations for the owner's own classes
| # | Item | Size | Notes |
|---|---|---|---|
| 1.1 | Flight timing fix | S | Finding 1. Clock from room open or "class ends at"; ±5 min buttons; persist; auto-descent cue at T−5 |
| 1.2 | Seats on the plane + teacher-set avatars + attendance identity | M | Findings 2–3. Picker, Next speaker, hands, votes and stars all use it. Tests for the mixed cases |
| 1.3 | Save favourites and recent per class | S | Finding 4 |
| 1.4 | "Where next?" topic ideas | S–M | New Talk strip; uses lesson memory to avoid repeats |
| 1.5 | Free picture suggestions in the private window; Serper on a button; cache | M | Findings 6; Wikimedia |
| 1.6 | Teacher-side launch and funnel events | S | No student analytics |

**Test:** Friday 1 and Friday 2 (seats, picker, Where next?, pictures, timing).

### Phase 2: class types and onboarding (concept doc and mockups first)
| # | Item | Size | Notes |
|---|---|---|---|
| 2.1 | Class types + settings (answering, 1-on-1, classroom, game vote) + per-type cockpit defaults | L | Data model: v3 §5 is a starting point (`class_profile` jsonb), adjusted for types. Handle null profiles, precedence (saved plan > today's type > class > teacher), types for every reader, save errors |
| 2.2 | "Can this class do this?" check on every launch path | M | Finding 9; marked, never hidden; fallback when fewer than 3 tools |
| 2.3 | Onboarding: class setup replaces the 5 questions; guided test flight per type; tips; checklist; "?" guide | L | Uses the Demo Class; grants for new teacher columns (finding 12) |

**Then:** invite the first 3–5 beta teachers; send classroom teachers the questions (owner notes §2).

### Phase 3: the flight experience (concept and visuals first)
| # | Item | Size |
|---|---|---|
| 3.1 | Where-next vote at the start + vote card (pictures, on the way, souvenirs, expedition strategy, reasons reveal, seat votes) | M |
| 3.2 | Descent + arrival | M |
| 3.3 | Moments: rules, tracker icons, Wikipedia "near here" tap cards, country facts, NASA EONET | M–L |
| 3.4 | Landmarks: side view, camera view, weather rule, first 8 drawn | L |
| 3.5 | Terrain: land-cover data, new types, Natural Earth names (Codex data tasks) | L |

### Phase 4: activity upgrades
| # | Item | Size |
|---|---|---|
| 4.1 | "Your turn: pick a place" + "who hasn't spoken yet" | S–M |
| 4.2 | Topic board | M |
| 4.3 | Scene Igniter bigger casts, audience jobs, destination scenes | M |
| 4.4 | Optional ending button; Game time vote setting | S |
| 4.5 | Pictures in Flash Quiz and other words-only screens (Wikimedia survey first) | M |
| 4.6 | Online inclusion: one-phone audit fixes; Flash Quiz captain answers; speed-free online scoring | M–L |

### In parallel (owner-led)
- Find students for 1–2 test classes now; the "Classes with Matt" board and request form after a quick privacy check.
- Real-class testing after every phase (roadmap Phase 0 still applies).
- Before charging teachers: switch to Open-Meteo's paid plan.

---

## 5. Open questions for the owner
1. Class-type names are agreed for now. Confirm after mockups.
2. Which classroom teachers will test, and when (after seats exist)?
3. Ages and levels of the new test classes, and where students will come from.
4. A light way to collect student feedback (later).

## 6. Astra's review: what changed because of it
Claude and Astra agree on the direction. Astra was right on these, and v4 includes them:
- Team captains in one quiz first.
- One-phone step audit as a release gate.
- Speed-free scoring online.
- One attendance identity per student.
- A compatibility check on every launch path.
- No student analytics.
- No automatic adaptation.
- A realistic schedule (inclusion work is the biggest piece).
- Flight claims corrected (direct-over lookup, aurora guess, Andes exist as terrain, detours are journey-system changes).
- The public quiz deferred.

Where Claude pushed back, and the owner agreed:
- Class types remain the destination; the shortlist is the first step, not a replacement.
- Learning checks stay light (a one-minute exit task).
- Student ownership is part of the value, not only research.

## 7. Working with this owner
- Plain English, short sentences, no jargon. The owner is an English teacher building with Claude and Codex.
- He tests everything in real classes and trusts what students do over what they say.
- He keeps control during class: nothing pops up over his lesson.
- Free over paid services; running costs matter.
- Likes the calm, real-world flight (real weather and terrain) and wants more real data and more to see. Doesn't need photorealism; storybook is fine.
