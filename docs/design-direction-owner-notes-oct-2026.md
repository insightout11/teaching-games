# Design direction: owner decisions and notes (Oct 2026)

_Started Oct 18 2026 from the owner's part-by-part review of the plan (`docs/design-direction-evaluation-oct-2026.md`,
v3) and Astra's review of it. The plan file is left unchanged on purpose; this file records what the owner decided and
what was found in the code along the way. When the review is finished, these notes become plan v4._

---

## 1. The owner's classes (the real examples behind the design)

| Class | What it's like | Class type |
|---|---|---|
| Chinese groups on ClassIn | Can't use LessonCaptain (they're on ClassIn), but they show what many classes want: structured lessons with clear aims, like Captain's Flight | Structured class |
| Sunday ×2, Thursday | Online textbook for most of the lesson; the last 15–20 minutes are a game. One class loves Kahoot; another loves LessonCaptain activities, especially Imposter | Game time |
| Friday 1 | Ages 11–14, about B2. Free conversation, light structure, mostly on devices. Liked Mystery Flight and Conversation Rounds (not everyone). Some students dominate, others are quiet. Loved voting where to fly next | Conversation + games |
| Friday 2 | Advanced teens. Free talk; the goal is material that starts and expands ideas. The owner shows images while they talk; the Talk view's questions work well. About half the class has no second device or doesn't want to use one | Free talk |

LessonCaptain is not built only for these classes; they are the test cases. Both Friday classes love places, cultures and food.

---

## 2. Class types (modes) and the cockpit

**Rule:** the class type decides what's in front of the teacher; it never removes anything. "All tools" always shows the
full catalogue. This is mainly for new teachers, who otherwise face too many choices.

### The four types

| Class type | Card line for teachers | Opens on | Flight plans shown first | Scoring | Flight length |
|---|---|---|---|---|---|
| **Structured class** | Each lesson follows a plan with clear aims. | The lesson plan (Captain's Flight or the prepared lesson) | All, Captain's Flight first; courses fit here | Right answers count | Whole class |
| **Game time** | You teach the lesson your way; LessonCaptain runs the last 15–20 minutes. | The game shelf, class favourites first | None by default | Competitive, with a podium | The 15–20 minutes it's used |
| **Conversation + games** | Talking is the goal; games and activities keep it going. | Talk, picker ready | Speak, Travel, Debate | Light: taking part counts | Whole class |
| **Free talk** | Open conversation; LessonCaptain brings ideas, pictures and questions. | Talk, with "Where next?" and pictures | None by default | Off (no leaderboard) | Whole class |

**Bottom bar (6 quick-launch slots) per type:**
- Structured: the plan's stages, Flash Quiz, Grammar Spotlight, Read Aloud, Radio Check.
- Game time: class favourites, e.g. Flash Quiz, Imposter, Mystery Flight, Taboo, Hot Seat, Sector Strike.
- Conversation + games: Scene Igniter, Conversation Rounds, Mystery Flight, Pass the Line, Taboo (teams), Tag-team Debate.
- Free talk: Spin picker, topic board, pictures, "Your turn: pick a place", "Where next?", optional ending.

**Class types vs flight plans (names checked):**
- A class type answers *how does this class usually run?* It's chosen once, at class setup, and uses structure words.
- A flight plan answers *what is today's lesson about?* It's chosen each lesson, and uses skill and subject words.
- Each type recommends certain flight plans first.
- Name clashes checked: "Game time" avoids the retired "Game Day" preset; "Conversation + games" is distinct from the Speak plan (Speak is one lesson you can run inside it).

**Switches and memory:**
- Separate switches: Junior, how students answer (phones), 1-on-1, where you teach (online or classroom). Game time also gets an optional "students vote on the game" switch, off by default; the owner usually picks the game.
- The class remembers its type, favourites, last-used activities, usual lesson length and the vote setting.
- "Change for today" switches the type for one lesson without changing the class.
- In the room, the corner shows the class type ("Conversation + games · change for today"). The flight plan appears only when chosen ("Today: Travel to Cairo").
- Tools that need phones stay visible in phone-free classes, clearly marked, with the no-phone version offered. They're never hidden, so "All tools" never leads into an activity half the class can't do.

**Setting up a class (new teachers):**
1. Who (age and level; young children turn on Junior).
2. "What kind of class is it?" Four cards with a picture, a line and an example.
3. "Do students have a second screen?" All · some · none.

The room opens set up, with "Set up for a conversation class · Change".

**Found in the code:**
- Favourites and recent activities aren't saved; they reset every lesson.
- The default quick bar is the same five activities for every class (Flash Quiz, Hot Take Arena, Vocab Sprint, Fact Detective, Conversation Rounds).

Fix both with the class types.

### 1-on-1: a setting, not a type
- Switched on automatically when a class has one student, and works with any type.
- Leaves group-only activities out of the quick bar: Conversation Rounds, Pass the Line, Quick-fire, Hot Seat, Imposter, Taboo, Tag-team Debate and Sector Strike. They stay in All tools, marked.
- No picker, seats or leaderboard. Personal progress instead of ranking ("better than last time", words learned).
- Phones default to not needed.
- The class logbook and progress report become a personal record tutors can show parents. That's one child's data, so the privacy rules apply.
- **Later:** "you vs the teacher" versions, one activity at a time: Taboo (teacher guesses), Hot Seat (teacher guesses), Debate (student vs teacher), Flash Quiz (beat your own best). Scene Igniter already lets one student read all the parts.
- Why it matters: independent 1-on-1 tutors are a big share of online teachers, and competitors mostly sell them management tools.

### Classroom (projected): a setting, not a type
**Now (small):**
- "Where do you teach this class? Online · In a classroom".
- Default: phones not allowed.
- Tap-to-count for hands up.
- Check the screens on a projector (bigger text, a high-contrast option for bright rooms).

**Later, after watching 2–3 real classroom teachers:**
- Team devices (one tablet per table).
- Co-pilots (two students share one phone, which only works in a room).
- Movement answers (corners, stand up or sit down, A/B/C/D cards, Imposter with heads down).
- Bigger casts for small-group activities.
- The **teacher remote** (from the May 2026 notes, never built): a phone that controls the room while the teacher walks around.

**Before classroom teachers test it:** build seats for students without devices first. Otherwise the room's picker has nobody to pick in a no-phone classroom.

**Questions to send classroom teachers:**

*Before:*
1. How many students, what ages and what English level?
2. Are phones allowed? School tablets or Chromebooks, one per student or one per table?
3. Screen size, room brightness, speakers?
4. Do you teach from the laptop at the front or walk around?
5. How do you usually get answers from the whole class (hands, mini whiteboards, cards)?
6. Do students already sit in groups or teams?

*After:*

7. What did students react to most, good or bad?
8. What was hard to read or see from the back?
9. What did you have to go back to the laptop for that you wish you didn't?
10. Would you use it again, and for which part of a lesson?

Suggested first tries: a no-phone game (Vocab Sprint or Synonym Showdown), then the flight with the Talk view and picker once seats exist.

---

## 3. Students without devices: seats on the plane (first build)
- Students on the class list who don't join appear as **seats on the shared screen**, with their avatar and a small "no device" mark.
- The Spin picker and Next speaker include them. The teacher marks their answers and casts their votes (tap the seat, then the choice).
- **The teacher can set avatars** for students from the class list. Students who join on a phone can still change theirs.
- **Found in the code:** the room's Spin picker and hands-up queue include only students who joined on a device. The games themselves can pick from the class list.
- This is the first build for Friday 2, the Free talk type and classroom tests.

---

## 4. Free talk tools (Friday 2)
Mostly teacher tools. Unstructured: if the conversation is good, nothing interrupts it.

1. **"Where next?" (biggest need).** An always-visible strip on the teacher panel with 4–6 related topics, each labelled by how it connects: bigger picture, the other side, closer to home, in the news, a surprising link. One tap makes it the topic, which brings its own facts, pictures and questions. It remembers the topics already covered and can go back to an earlier thread.
2. **Pictures, at no extra cost unless asked:**
   - Automatic suggestions come from **Wikimedia** (free, no key; the app already uses Wikipedia).
   - **Google Images (Serper) only on a button press**, with the topic already typed in.
   - **Save search results** so repeat topics cost nothing.
   - Found in the code: Serper results aren't cached. The daily search limit (migration 057) was written but never applied.
   - Wikimedia is strong for places, nature, history, science and famous people; weak for everyday scenes, trends and recent things.
3. **Topic board.** 4–6 big fact cards on the shared screen. Click one to go deeper (more sentences plus two discussion questions); one tap sends a question to the Talk view. **Picture sources, in order:**
   1. The Wikipedia page's main picture for named things.
   2. A Wikimedia search for general topics.
   3. The picture library on the roadmap (#5), later.
   4. Otherwise text only, with the teacher adding a picture from the private window.

   Advanced teens suit the "Deep dive" depth.
4. **Optional ending.** One button offers 3 activities everyone can do with or without a phone, chosen to fit the day's topic. It never pops up on its own.
5. **Question writer:** the Talk prompts are written "for kids and teens". That fits Friday 2 (advanced teens); it only matters for adult classes later.

---

## 5. Conversation + games tools (Friday 1)
- Picker for everyone: the same seats build.
- **"Your turn: pick a place".** The picker chooses a student (including those without devices). They choose a city, food or topic, and the screen shows free pictures and 2–3 easy prompts. The teacher flips pictures while they talk; the student can pass to a friend. This is the owner's own technique for quiet students.
- **A private "who hasn't spoken yet" list** on the teacher panel, to balance students who take long turns.
- **Scene Igniter:**
  - Today it casts at most 4 students per scene; a bigger class gets a second, separate scene.
  - Add bigger casts (5–8 characters, everyone in one scene).
  - Add **jobs for the audience** (director who calls "Cut!" and changes one thing, critics, narrator).
  - Set scenes in the destination city (a market in Cairo).
- **Team activities:** existing talk-based team games (Tag-team Debate, Taboo in teams, Hot Seat, Decision Council). New idea: a destination team challenge ("plan a day in Cairo", pitch, class votes).

---

## 6. Game time classes and quizzes
- **The Flash Quiz redesign is on hold** (too specific for now).
- **Found in the code:** Flash Quiz has no pictures at all. Kahoot shows one with nearly every question, which is probably part of its appeal. Pictures should come from Wikimedia (see section 8).
- Parked quiz gameplay ideas for later: a picture with every question, a podium finish (top three revealed one at a time, with sound), comeback chances (double-points final round), "explain it" after each answer (a random student says why it's right).

---

## 7. Flights
**Agreed, in build order:**
1. **Timing fix.**
   - Bug: the class length is chosen at the gate, but the flight clock starts at take-off, so a late take-off lands after class ends (Cairo, 12 minutes short). The class length is also forgotten if the page reloads.
   - Fix: the clock starts when the room opens (or "class ends at" time); a late take-off flies faster to land on time. Add "+5 / −5 min" buttons, and remember the setting.
2. **Lesson shape.** The where-next vote happens at the start, while students arrive; take-off when the vote closes. Calm cruise with moments. The descent starts automatically 5 minutes before the end. The last 5 minutes are the arrival.
3. **The descent (about 5 minutes).** A chime, "Cabin crew, prepare for landing", the seatbelt sign and "Descending" on the corner map. The camera slowly comes down: the ground gets closer, clouds pass at eye level, mountains loom, city lights grow at night. The skyline and landmark appear on the horizon, then the existing touchdown. The cruising height is one fixed number in the engine today, so easing it down is a contained change. The teacher can still land early or late.
4. **The arrival.** "Welcome to Cairo", with the local time, live weather and temperature shown big, a picture, then three cards (food, sights, local words); the class picks one for 2–3 minutes. Then the stamp and souvenir.
5. **"Look outside" moments.**
   - Window-only things happen by themselves: weather, terrain, sunset, a quiet caption, a distant plane. No sound.
   - Anything with a picture card, question or sound waits for the teacher's tap. An icon appears on the corner tracker map ahead of time ("Alps in 3 min") to build anticipation.
   - Never during an activity.
6. **Landmarks.**
   - Special drawn landmarks, bigger than life. Famous mountains in their real shape: Matterhorn, Fuji, Kilimanjaro, Everest's snow plume, Table Mountain's cloud. Storybook drawings of sights: Stonehenge, the Pyramids, the Great Wall, Niagara's mist.
   - **Side view:** within about 300 km, the landmark appears on the horizon on the correct side; "Look left" turns the view. No detour, so route, distance and range are unchanged.
   - **Camera view:** a zoomed outside camera, like real seat-back screens, for small or distant landmarks.
   - **Weather decides:** clear means visible in the window; cloudy means "under the clouds today, switching to the camera".
   - Each landmark has a tap card (picture, 2–3 facts, a question).
   - First batch: Everest, Matterhorn, Fuji, Kilimanjaro, the Pyramids of Giza, Stonehenge, the Great Wall, Niagara Falls. All are already in the app's place list.
7. **The where-next vote.**
   - Every city in range, each with a picture, what it passes on the way (landmarks and countries), new stamp or been here, souvenirs (including rare ones), and strategy ("Stop 3 of 5 on your expedition", "Gets you closer to Tokyo").
   - **No flight time: every flight lasts the class.**
   - Students' typed reasons appear after the vote and the teacher asks them to explain (persuasive language). Optional 30-second team pitches.
   - Students without devices vote through their seat.
   - Optional class goal (a dream destination for the term).
8. **Live data.**
   - Yes: NASA live natural events (wildfires, eruptions, storms, icebergs) and country facts when crossing borders (flag, language, currency, hello).
   - Low priority: Space Station position.
   - Wikipedia's "what's near here": for tap-info only, not the animation.
   - No recipes.
   - Also considered: the earthquake feed, public holidays and exchange rates.
   - **Note:** the live weather comes from Open-Meteo, whose free plan is for non-commercial use. It needs their low-cost paid plan once LessonCaptain charges.
9. **More terrain.**
   - Real terrain from a free global land-cover map (NASA/ESA), shrunk into a small file in the app (no live calls).
   - New types: rainforest, savanna, tundra, wetlands and deltas, tropical islands and reefs, rice paddies, steppe, canyons, volcanoes, salt flats, big cities by day.
   - Natural Earth (already used for borders) also names mountain ranges and deserts (Andes, Sahara).
   - Today there are 7 types, placed by hand-drawn regions.

---

## 8. Wikimedia across the app
Wikimedia could be the free picture source everywhere: Flash Quiz questions, vocabulary word cards, Taboo and Hot Seat cards, the topic board, arrival cards and the vote card. It fits the roadmap's picture item (#5). **To do:** go through every words-only screen and mark where a picture would help. Picture credits must be shown (licences vary per image).

---

## 9. Design your class: changed
- **Dropped:** a special Class Design voting tool; running a design lesson in every class as research. Teachers pick their class type at setup, from what they already know.
- **Kept, as small choices inside lessons:** the where-next vote, the optional game vote for Game time classes, choosing the next topic from "Where next?".
- **Not now:** a "Play again?" thumbs vote after each activity (too many steps). But student feedback matters, so find a lighter way later.
- **Low priority:** "Design your class" as an optional ready-made lesson in the library (good for B1+, start of term, new classes).

---

## 10. Teacher sign-up and onboarding (owner: "so important, not to lose the teachers")

**Today:** Google sign-in, then a skippable 5-question box about the *teacher* (class size, focus, level, age,
online or in person) that mainly ranks Home's recommendations. There's also a hidden Demo Class with pretend students
for test flights. Problem: everything now works per *class*, and one teacher can have very different classes.

**New flow:**
1. Sign in with Google.
2. **"Set up your first class"** replaces the 5 teacher questions: a class name, who it's for (age, level, Junior), the class type cards, how students answer, and where they teach. 1-on-1 follows from one student or a quick question. Later classes take the same questions, with the previous class's answers filled in.
3. **Class list:** optional but encouraged ("Add names now so everyone gets a seat and avatar; paste a list, or add later").
4. **The room opens set up for that class**, starting a **guided test flight** with pretend students: offered first, skippable, and replayable from help.
5. **A short first-lesson checklist on Home**, gone once done: share the join code, try the picker, run one activity, land the plane.

**Guided test flight per class type** (in the real cockpit; one control and one sentence per step; waits until the teacher tries it; at most 5 steps):
- Free talk: set a topic, see "Where next?", show a picture from the private window, spin the picker (one pretend student has no device), "Go deeper" in Talk, land.
- Game time: set the lesson to 20 minutes, launch a game from the shelf, see what phones show, scores and podium, land.
- Conversation + games: where-next vote, spin the picker, "Your turn: pick a place", cast a Scene Igniter scene, land.
- Structured class: choose a flight plan, move through its stages, next stage, land.

**Screen setup tips by setting:**
- Online: share this tab in Zoom, turn on Zoom layout, open the private window on a second monitor.
- Classroom: full screen on the projector, high contrast for bright rooms.
- 1-on-1: share your screen; the student answers out loud.

**Tips at the right moment:** a small tip the first time a teacher meets something new (e.g. the first student without a device: "Tap their seat to mark an answer"). At most one per lesson, each can be dismissed, and all can be turned off.

**Help in the cockpit:** a "?" opens a one-page guide for the class's type. Later, a 30-second video per type (overlaps with the marketing videos, roadmap #11).

**Measure where teachers drop off** (teacher-side only):
- signed up
- class set up
- test flight started and finished
- first real lesson
- second lesson within two weeks

Later: one helpful email for teachers who set up a class but never taught.

---

## 11. Still to discuss
1. The free teacher quiz: agreed for later; the owner's teaching story goes on the landing page now.
2. The bigger ideas: matching teachers and students, scheduling.
3. Later: the Flash Quiz gameplay redesign; a light way to collect student feedback.
