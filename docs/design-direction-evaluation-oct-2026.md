# Design direction notes: evaluation and plan (Oct 2026, v2)

_Written Oct 17 2026. Evaluates the owner's "LessonCaptain — Design Direction Notes" against the code and the
roadmap (`docs/roadmap-oct-2026.md`), then turns the ideas worth doing into a build plan. v2 goes deeper: every
recommendation is checked against what the code already does, with data models, the exact places in the code to
change, lesson scripts, metrics, risks, a week-by-week schedule and the decisions the owner needs to make._

---

## 1. Verdict

The central idea, **"the system adapts to the class, not the class to the system"**, is right. It answers the
competitor report: lesson generation is now cheap and everywhere, but no competitor gives each class its own
cockpit. It also fixes LessonCaptain's biggest usability problem: about 45 tools on show to a teacher who needs 6.

The classroom ideas are worth doing, and they cost less than they look, because **about half of the groundwork
already exists** (section 2). The flight ideas are worth doing in a smaller, sharper form, and the data shows exactly
what to fix (section 8). The free teacher quiz is a good, cheap marketing tool. **Student discovery, matching,
scheduling and class formation are a different business** and should wait (section 11).

### Scorecard

| # | Idea (from the notes) | Call | Why |
|---|---|---|---|
| 1 | Cockpit: narrow the tools to each class | **Do: the spine of the plan** | Fixes overload; strengthens "cockpit for live teaching" |
| 2 | The owner's teaching story | **Do** | True, specific, impossible to copy |
| 3 | Deep teacher onboarding | **Extend the 5 taps to 7** | A long quiz at sign-up loses teachers |
| 4–5 | "Design your class" lesson, per class | **Do first** | A good lesson, real research and student ownership in one |
| 6 | Several modes per class | **Do** | Simpler than one big settings page |
| 7–9 | Device spectrum, mixed classes, device choice | **Do** | Real classroom constraint; partly built |
| 10 | Teach students the UX framing | **Test once with adults** | Unknown appeal; costs two minutes |
| 11–12 | Better calm flight | **Do, later** | Keep it; fill the empty middle of the route |
| 13–15 | Curated routes, live conditions | **Do 12 signature routes** | Live conditions are already built |
| 16 | Live aircraft data | **Skip** | Cost and licences for a moving dot; fake traffic does the job |
| 17–18 | Stylised world, own visual identity | **Fold into the art-style work** | Paper-cut / Sticker styles are already chosen |
| 19 | Three.js | **No rewrite** | The problem is pacing, not the renderer |
| 20 | Routes as unlocks | **Fold into class rewards (roadmap #12)** | World Flight already has range and planes |
| 21–22 | Free teacher-style tool | **Do, after class modes exist** | Its result must lead into a real mode |
| 23–27 | Student funnel, matching, scheduling, forming classes | **Park, with clear triggers** | A marketplace: cold start, minors, payments |
| 28–29 | Learn through real lessons | **Do (same as 4)** | — |
| 30 | YouTube team-battle class | **Prototype as a mode later** | Only if students vote for it |
| 31 | Layers of customisation | **Build class + session + device now** | Store no per-student profiles (privacy) |

---

## 2. What already exists (the plan builds on this, not from zero)

| Need from the notes | Already in the code | Gap |
|---|---|---|
| Per-class settings | `classes` table has `default_difficulty`, `student_device_mode`, `junior`, `next_lesson`; edited in `src/components/class/class-defaults-card.tsx` | No modes, no saved tool list |
| One switch that reshapes the class | Junior mode: `JUNIOR_HIDDEN_KEYS` in `src/lib/junior.ts`, applied in **one place**, `src/components/session/session-view.tsx:842-843` | Only hides tools; can't choose them |
| Device level | `student_device_mode: 'devices' \| 'shared-screen'` (migration 051); shown as warnings in Explore and the launch drawer | No "light" level; doesn't filter the room |
| Tools tagged by phone need | Every game/activity has `deviceFree: boolean`, `minStudents`, `idealStudents` | No "light vs full" difference |
| Teacher-scored students without phones | Device-free games score roster students via `onScore(studentId)` | Only in device-free games, not in phone steps |
| Teacher profile | 5-tap onboarding (`src/lib/teacher-profile.ts`): class size, focus, level, age, online/in person | No device or structure question; profile only ranks a home rail |
| Live votes | Talk view votes (2 options, `src/lib/live-room/talk-vote.ts`); Rank It; Quick Pulse | No 3-way "love / OK / no" card vote |
| Quiz variety ("design a better Kahoot") | Flash Quiz modes: Classic, Calm skies, Turbulence (3 lives), Team battle, Wager, Rapid fire, Our class quiz, boss finale | No per-class default mode |
| Living-world flight | Real great-circle route, terrain under the plane, real sun and moon, live weather from Open-Meteo (incl. storms and northern lights), big cities within 150 km, named rivers/mountains/sights, turbulence | Sights bunch up at take-off and landing; nothing is *authored* |
| Route network | 50 World Flight cities, plane range, next destination | No hand-picked routes |
| Analytics | PostHog with about 8 events (`session_started`, `session_completed`, `student_joined_session`, …) | **Nothing records which tool was launched or from where** |

Two concrete gaps found while checking:

1. **Mixed-phone classes lose credit.** In `src/lib/world-flight/progression.ts`, "Everyone Aboard" uses the
   teacher's marks on roster students *only when no phone joined*. If 8 students have phones and 4 don't, the 4 are
   not counted at all. That's the fairness problem from note 8, already in the code.
2. **There is no baseline to measure against.** Before changing the launch flow, add launch events (section 10),
   or "did it get better?" can't be answered.

---

## 3. The idea behind everything

> Every class is different, so every class should be able to shape its own version of LessonCaptain.

What the product does with it:

- **Teacher layer**: who you are (7 taps, prefilled answers, the free quiz).
- **Class layer**: devices, 3–5 modes, the flight view, tools the class loves, tools it voted out.
- **Session layer**: "What kind of class today?", one tap.
- **Student layer**: **class totals only**. Store how the class voted, never a profile of each child. This keeps the
  kids' privacy review simple (roadmap #2) and is all the product needs.

The rule for the teacher: **students choose the style, the teacher keeps the steering wheel.** Student votes prefill;
they never lock anything. Every mode still contains language work, so a class that votes "only games" gets games
that teach.

---

## 4. Workstream A: "Design your class" (the first thing to do)

### Why first
- It is the real-class test the roadmap already needs (Phase 0: "Live Room in a real class" has never happened).
- It produces the data that decides the modes, the device levels and the end-of-class games, before anything is
  built.
- It's a strong lesson: giving opinions, comparing, explaining why, negotiating, pitching. Those are speaking goals
  for B1 and up, and simple versions work for A2.

### Two versions
- **v0 (week 1, no new code):** run it with the existing tools: picture cards on screen (slides or the Show
  view), Talk-view votes, Rank It for the top formats, 5-minute "taste tests" of real activities. The owner learns
  what works in the format before anything is built.
- **v1 (weeks 3–4, built):** a new activity, **Class Design**, that shows the cards, takes a 3-way vote on phones or
  by hand count, runs the remix step and saves the result to the class (section 5).

### Lesson script (60 minutes; a 45-minute cut is marked ✂)

| Time | Step | What happens | Language practised |
|---|---|---|---|
| 0–4 | **Hook** | "Today you're not the students. You're the designers. This is your class's plane, and today you decide how it flies." *(Adults/business only: two minutes on "you are the users designing the product", as a test.)* | — |
| 4–12 | **What makes a class good?** | Pairs, then whole class: one thing that makes a class fun, one that makes it boring. Teacher writes on the board. | *I like it when… / I can't stand… / It would be better if…* |
| 12–27 | **Card showcase** | 8 cards, about 90 seconds each: picture, one line, a 20-second demo or example. Vote love / OK / no. Teacher asks 1–2 students why. | *I'd love… because… / I'm not keen on… / It depends on…* |
| 27–37 ✂ | **Taste test** | Play the top 1–2 cards for 5 minutes each. Students react to doing it, not to a description of it. | (whatever the activity practises) |
| 37–47 | **Remix** | Teams take one card and change one rule ("Quiz battle, but the losing team picks the next video"). 30-second pitch each; class votes. | *What if we… / Instead of…, we could… / The best thing about our idea is…* |
| 47–53 | **Phones and the window** | Two quick votes: "How much should phones be part of this class?" (not at all / sometimes / a lot) and "What should happen outside the window?" (calm / landmarks / storms and surprises). | — |
| 53–60 | **Your class plan** | The screen shows the class's top 3 formats, its end-of-class game, phone level and window choice. Teacher confirms. Saved to the class. | *We decided… / Most of us…* |

**Age versions:**
- **Junior (5–9):** 5 picture cards, thumbs up/down instead of 3 options, no remix step, a "which game at the end?"
  picture vote. 30 minutes.
- **Teens:** add competition: two teams each design their dream class; the class votes on the better plan.
- **Adults/business:** add the UX framing; the remix becomes "write a one-line feature request".
- **1-on-1:** a conversation through the cards; the student ranks them; no votes.

### The card deck (about 20 cards; the teacher picks 8 per class)

Each card maps to something that already exists, so a vote turns straight into a setting.

| Card (student wording) | What it is in the product | Mode it feeds |
|---|---|---|
| Quiz battle, two teams | Flash Quiz, Team battle | Quiz battle |
| Three lives and you're out | Flash Quiz, Turbulence | Quiz battle |
| Bet your points | Flash Quiz, Wager | Quiz battle |
| Capture the map | Sector Strike | Quiz battle |
| Guess the secret city | Mystery Flight | Quiz battle |
| Find the imposter | Imposter | Party games |
| Describe it without saying it | Taboo Sprint | Party games |
| Everyone gives clues | Hot Seat | Party games |
| Fake definitions | Bluff Definition | Party games |
| Act out a scene | Scene Igniter | Roleplay |
| Real-life situations (airport, hotel, job interview) | Scenario Simulator, Travel flight | Roleplay |
| Build a conversation together | Pass the Line | Conversation |
| Just talk, in small rounds | Conversation Rounds | Conversation |
| Big debate, two teams | Tag-team Debate | Debate & ideas |
| Hot takes | Hot Take Arena | Debate & ideas |
| Rank it and argue | Rank It | Debate & ideas |
| Watch a video, then answer | Show view video + phone questions | Video & listening |
| Mystery sound, radio puzzles | Radio Check, Static, Black Box | Video & listening |
| Write a story together | Story Sprint | Reading & stories |
| Grammar boss fight | Grammar Boss | Grammar workout |
| **Concept:** the winning team picks the next YouTube video | Not built (note 30) | Tests demand for a Video battle mode |
| **Concept:** your own idea | Blank card | — |

The two concept cards are the research part: they measure interest in things that don't exist yet.

**"Design a better Kahoot" in practice:** for a quiz-loving class, the showcase uses the Flash Quiz mode cards
(lives, wager, teams, rapid fire, boss finale). The winning mode becomes the class's default Flash Quiz mode, a real
setting the students chose.

### How to pre-pick the 8 cards for a class
- **Loves games:** 5 game cards + 1 roleplay + 1 conversation + the YouTube concept.
- **Loves quizzes:** the Flash Quiz mode cards + Sector Strike + Mystery Flight + 1 conversation.
- **Free conversation:** conversation, debate and roleplay cards + 2 party games + "no games at all" as a real option.
- **Roleplay lovers:** Scene Igniter, scenarios, Pass the Line + 3 others.
- Always include at least two cards the owner expects the class to reject. A "no" is useful data.

### Research protocol (owner, about 10 minutes per class)
After each class, fill a short sheet: the moment energy went up, the moment it dropped, who spoke who usually
doesn't, the vote that surprised you, what they asked for that isn't on any card. After 4–6 classes, put the sheets
together (themes, what repeats, what surprised you). **Decision rule:** a mode becomes a starter mode for new
teachers if at least two different classes put it in their top 3.

---

## 5. Workstream B: class setup and class modes

### What the teacher sees
**Class page → Setup** (replaces the current Settings card; about 60 seconds, prefilled):
1. **Level** (as now).
2. **Phones:** None · Sometimes · Always (section 6).
3. **Junior class** switch (as now). Junior stays a separate switch, not a mode: it changes how the AI writes, not only
   which tools show. *(This corrects v1 of this plan.)*
4. **This class's modes:** choose 1–5 cards from the list below, in order.
5. **Outside the window:** Calm · Eventful (Eventful arrives with Workstream E).
6. If the class ran Design your class: "Your class chose: …" with the top 3 already ticked.

**Home board row → Board:** if the class has 2+ modes, a row of chips appears: *Today: Conversation · Quiz battle ·
Video*. One tap; the last-used mode is the default. With one mode, there's no extra step.

**In the room:** the catalogue drawer opens on the mode's shortlist (6–10 tools, the class's favourites first), with
an **All tools** tab one tap away. Saved lesson plans and courses still launch anything.

### The modes (built from today's catalogue, retired tools left out)

| Mode | Tools on its shortlist | Ready lesson | Default scoring |
|---|---|---|---|
| **Conversation** | Quick-fire, Conversation Rounds, Pass the Line, Say it Again, Scene Igniter, Rank It, Wonder Board, Hot Seat, Taboo Sprint | Speak | Participation |
| **Quiz battle** | Flash Quiz, Sector Strike, Mystery Flight, Connections, Vocab Sprint, Synonym Showdown, Grid Rush, Twenty Questions, Fact Detective | — | Competitive |
| **Roleplay** | Scene Igniter, Scenario Simulator, Dialogue Detective, Pass the Line, Say it Again | Travel, Speak | Participation |
| **Debate & ideas** | Tag-team Debate, Hot Take Arena, Decision Council, Rank It, Prediction Round, Wonder Board | Debate | Participation |
| **Video & listening** | Show view videos, Radio Check, Static, Black Box | Listening | Accuracy |
| **Reading & stories** | Read Aloud, Picture Stories, Story Sprint | Reading | Participation |
| **Grammar workout** | Grammar Spotlight, Grammar Boss, Error Hunter, Sentence Scramble, Tense Time Machine, Fix the Captain, Compare It, Answer First | Grammar | Accuracy |
| **Party games** | Imposter, Taboo Sprint, Hot Seat, Bluff Definition, Cargo Hold, Two Truths and a Lie, Twenty Questions | — | Competitive |
| **Relaxed chat** | Quick Pulse, Wonder Board, Prediction Round, Conversation Rounds, Rank It, Talk-view votes | — | No leaderboard |

Modes are filtered again by the class's phone level (section 6) and by Junior. A "Phones: None" Quiz battle class
still gets Vocab Sprint, Synonym Showdown, Connections and Sentence Scramble, which all run without phones.

### Data model

One migration (`066_class_profile.sql`):

```sql
alter table public.classes add column class_profile jsonb;          -- null = not set up yet
alter table public.classes drop constraint if exists classes_student_device_mode_check;
alter table public.classes add constraint classes_student_device_mode_check
  check (student_device_mode in ('devices', 'light', 'shared-screen'));
alter table public.sessions add column class_mode text;              -- which mode this lesson used
```

Keep the existing `student_device_mode` column (adding `'light'`) instead of moving it into the JSON. Explore and
the launch drawer already read it, so nothing else breaks.

```ts
// src/lib/class-profile.ts (new)
export type ClassModeId = 'conversation' | 'quiz-battle' | 'roleplay' | 'debate' | 'video-listening'
  | 'reading-stories' | 'grammar' | 'party' | 'relaxed';

export interface ClassProfile {
  version: 1;
  modes: ClassModeId[];             // 1–5, teacher's order
  lastMode: ClassModeId | null;
  flightView: 'calm' | 'eventful';
  loved: string[];                  // tool keys the class voted up: shown first in shortlists
  hidden: string[];                 // tool keys voted out: only under All tools
  defaults?: { flashQuizMode?: string; endGame?: string };
  design?: {                        // last Design your class result: class totals only, no names
    ranAt: string;
    votes: Record<string, { love: number; ok: number; no: number }>;
    phones: 'none' | 'light' | 'full' | null;
    window: 'calm' | 'eventful' | null;
    remixes: string[];              // winning remix ideas, as text, for the owner
  };
}

export const CLASS_MODES: Record<ClassModeId, { name: string; tools: string[]; presets: string[]; scoring: ScoringMode | 'off' }>;
export function shortlistFor(profile: ClassProfile, mode: ClassModeId, deviceMode: DeviceMode, junior: boolean): string[];
```

### Where it goes in the code
- **Filtering:** `session-view.tsx:842-843` already filters games and activities by `flightPlanOnly` and Junior.
  Add `shortlistFor(...)` there to produce `shortlist` alongside the full list, and pass both to the catalogue
  drawer (`CatalogueDrawer` in `src/components/live-room/ui/cockpit-workspace/cockpit-panels.tsx`) and the flight
  deck's catalogue.
- **Setup screen:** replace `ClassDefaultsCard` with `ClassSetupCard`, same file location, same `updatePreset` pattern.
- **Mode chips:** `BoardRow` in `src/lib/home-board.ts` gains `modes` and `lastMode`; the board row renders the chips;
  `startClassSession(classId)` gains an optional `mode`, saved in `sessions.class_mode`.
- **Default scoring:** a mode's scoring becomes the session's `ScoringMode` unless a lesson plan sets one.

### How the class "learns" over time (no AI, just counting)
- The mode chips reorder by how often each is used.
- A tool launched 3+ times from All tools in one mode gets a prompt: "Add Imposter to this class's Party games?"
- A shortlisted tool unused for 8 lessons drops below the fold.
- Once a term: "Run Design your class again?" (the class changes; so do its preferences).

---

## 6. Workstream C: phones, mixed classes and fair scoring

### Three phone levels
| Level | Meaning | Tools offered |
|---|---|---|
| **None** (`shared-screen`) | One screen; students answer out loud; teacher marks | `deviceFree` tools only, plus phone-free versions (below) |
| **Sometimes** (`light`) | Phones for quick taps: votes, choices, a pin | Device-free + tap-only tools |
| **Always** (`devices`) | Phones throughout: typing, secret cards, private answers | Everything |

To make "Sometimes" work, each tool needs a `deviceUse: 'none' | 'light' | 'full'` tag next to `deviceFree`.
- `none` = `deviceFree: true`.
- `light` = phone input is only a tap (votes, multiple choice, a map pin): Flash Quiz, Mystery Flight, Rank It,
  Quick Pulse, Prediction Round, Picture Quiz, Sector Strike.
- `full` = typing or secret cards: Imposter, Hot Seat, Taboo Sprint, Wonder Board, Story Sprint, Decision Council.

The full list is a short audit of each tool's input spec. A script can propose the tags and the owner checks them
(good Codex task).

### Mixed classes: two ways in, cheapest first
1. **Co-pilots (share a phone).** On the join screen: "+ Add a co-pilot". Two names on one phone; answers and points
   go to both. This covers most mixed classes and needs no new teacher screens. It also makes students talk to each
   other before answering, which is good for language learning.
2. **Seats without phones.** At boarding the teacher taps roster names: "Here, no phone". They get a seat on the plane
   (seat labels carry on from the phones), an avatar, a team. On phone steps, their tiles appear in the teacher's
   panel with one-tap marks (*right · tried · not yet*). On votes, the teacher taps their choice or types a hand count.

### Fairness rules (write them into the scoring code, not just the docs)
- Points for **taking part** and **being right**, never for being fastest to tap, whenever a class has phoneless
  students. Speed bonuses (Rapid fire, Mystery Flight's early bonus) count for team totals only in mixed classes.
- A teacher mark is worth the same as a phone answer of the same outcome (the shared 0/1/3/5 outcome scale).
- **Fix the progression gap:** "Everyone Aboard" = students who took part ÷ (phones + seats without phones), counting
  teacher marks. Change in `calculateWorldFlightReward` (`src/lib/world-flight/progression.ts`), with tests for: all
  phones, no phones, 8 phones + 4 without.
- What phone users get that others don't: private answers and richer input. Not more points.

### Phone-free versions of the most-used phone steps
Pick the five from the new launch data (section 10). Likely candidates, with the playground version of each:
- **Talk votes and Would You Rather:** hands up; the teacher types the two counts.
- **Flash Quiz:** teams hold up A/B/C/D (fingers or paper); the teacher taps each team's answer.
- **Mystery Flight:** each team tells the teacher where to pin; pins go on the shared map.
- **Imposter:** heads down. The word shows on the big screen for 5 seconds while the imposter keeps their eyes
  closed. That's how the game is played without phones, and students already know it.
- **Rank It:** teams order printed or on-screen cards; the teacher drags the team order.

---

## 7. Workstream D: teacher onboarding v2 (7 taps)

Keep it short. Add two questions to the five in `src/lib/teacher-profile.ts`:
- **"How much do your students use phones in class?"** None · Sometimes · Always → prefills the first class's phone level.
- **"What does a great lesson feel like?"** Lively and competitive · Talkative and relaxed · Structured and clear ·
  Creative and playful → picks 3 starter modes for the first class.

Starter modes from the answers (example rules):
- Lively → Quiz battle, Party games, Conversation.
- Talkative → Conversation, Relaxed chat, Debate & ideas.
- Structured → Grammar workout, Quiz battle, Reading & stories.
- Creative → Roleplay, Reading & stories, Party games.
- Focus "exam" or "grammar" adds Grammar workout; "business" adds Roleplay and Debate; "kids" turns on Junior.

The same answers feed the free quiz (Workstream F), so there is one teacher-style model with two front doors.

---

## 8. Workstream E: a flight that feels alive

### What the data says
I ran about 45 routes between the 50 World Flight cities against the app's own geography (`named-features.ts`:
rivers, lakes, mountains, straits, islands, sights; "near" = within the feature's radius + 150 km of the route).
On most routes, the named sights sit at take-off or landing, and the middle 60% of the flight passes **zero or
one** named thing. Examples:

| Route | What the plane passes (0 = departure, 1 = arrival) | Verdict |
|---|---|---|
| Paris → Rome | Seine 0.00, Lake Geneva 0.38, **Mont Blanc 0.43, Matterhorn 0.46**, Corsica 0.81, Tiber 1.00 | Excellent already |
| London → Cairo | Channel 0.01, Rhine 0.20, **Dolomites 0.29**, **Crete 0.77**, Nile and Pyramids 1.00 | Excellent |
| London → Dubai | Danube 0.27, **Cappadocia 0.56**, Tigris and Euphrates 0.75, Palm Islands 1.00 | Very good |
| Mumbai → Beijing | Ganges 0.26, **Mount Everest 0.37**, Yellow River 0.75, Great Wall 1.00 | The Himalaya route the notes asked for |
| Nairobi → Cape Town | Kilimanjaro 0.04, **Zambezi 0.42**, Table Mountain 1.00 | Good; empty 0.45–0.95 |
| Vancouver → Los Angeles | **Mount Rainier 0.17, Mount St. Helens 0.20**, Death Valley 0.86 | Good |
| Hong Kong → Tokyo | Taiwan 0.23, **Mount Fuji 0.97** | Thin middle |
| Toronto → New York | **Niagara Falls 0.10**, Lake Ontario 0.18 | Short and good |
| Lima → Santiago | Aconcagua 0.97 only | Empty: the Andes aren't in the data |
| Mexico City → Los Angeles, Bogotá → Lima, Madrid → Lisbon | nothing | Empty |

So the students' "nothing happens" is a real, measurable thing: **density of moments**, not graphics. The engine
also only shows its full view in the Boarding and Talk views (`calm` dims it during activities), so moments have to
land when the window is visible.

### Calm mode (improve, keep as the default)
- **Fill the gaps:** add the missing big features to `named-features.ts`: mountain ranges (Andes, Rockies, Alps,
  Himalayas, Atlas), deserts (Sahara, Gobi, Atacama), and more sights. Points along a range, like rivers today.
  This alone improves every route. (Codex data task.)
- **Scenic choice:** when the plane is within 300 km of something better than what's below, the "below" line points
  to it ("On the left: the Alps"). The data already supports "off to the side" (`sideOf`, `offText`).

### Signature routes (Eventful mode)
Twelve hand-picked routes, each with 4–6 **authored moments** spread across the flight. A route can bend through
waypoints to reach a sight. Bends of up to 300 km stay invisible; bigger ones are announced as "Today the Captain
takes the scenic route over the Alps."

Starting list (checked against the data above; moments marked * need new feature data):
1. **Paris → Rome:** Seine, Lake Geneva, Mont Blanc, Matterhorn, Corsica, Tiber.
2. **London → Cairo:** Channel, Rhine, Dolomites, Crete, Nile, Pyramids.
3. **London → Dubai:** Danube, Bosphorus (small bend), Cappadocia, Tigris and Euphrates, Palm Islands.
4. **Mumbai → Beijing:** Ganges, Everest, Tibetan Plateau*, Yellow River, Great Wall.
5. **Nairobi → Cape Town:** Kilimanjaro, Zambezi / Victoria Falls*, Kalahari*, Table Mountain.
6. **Vancouver → Los Angeles:** Rainier, St. Helens, Crater Lake*, Golden Gate* (bend), Death Valley.
7. **Hong Kong → Tokyo:** Taiwan, Okinawa*, Mount Fuji.
8. **Toronto → New York:** Niagara Falls, Lake Ontario, Hudson Valley*. (Short: a good first route.)
9. **Lima → Santiago:** Nazca Lines*, Andes*, Atacama*, Aconcagua.
10. **Reykjavik → London:** Iceland, Giant's Causeway, Ireland, Stonehenge, Thames.
11. **Cairo → Nairobi:** Nile, Pyramids, Sahara*, Ethiopian Highlands*, Mount Kenya.
12. **Sydney → Auckland:** Sydney Harbour*, Tasman Sea storms (live weather), North Island.

### What a moment is

```ts
// src/data/world-flight/signature-routes.ts (new)
interface RouteMoment {
  at: number;                    // 0–1 along the route
  kind: 'landmark' | 'range' | 'coast' | 'city-night' | 'weather' | 'traffic';
  title: string;                 // "Mont Blanc, on the right"
  line: string;                  // one sentence for the class, at A2 level
  prompt?: string;               // optional talk question: "Would you climb it? Why or why not?"
  side?: 'left' | 'right' | 'below';
}
interface SignatureRoute { id: string; from: string; to: string; waypoints?: LatLng[]; moments: RouteMoment[] }
```

Flight progress already runs from 0 to 1 over the lesson (`routeT` in `flight-deck.tsx`), so moment `at: 0.43` fires
at the same point in any lesson length.

**When a moment fires:**
- In Boarding or Talk view (window visible): a small banner, a sound, the "below" instrument lights up. In
  Eventful mode the talk prompt appears as a one-tap Talk-view vote.
- During an activity: the moment waits as a "Look outside" chip on the teacher's panel. **It never interrupts.** The
  teacher decides when to look. This keeps the original calm intent.

**Live events on top** (the data is already there): a real storm on the route → "Turbulence ahead" (the cabin shake
already exists); northern lights at night above 60° latitude (already detected); sunrise or sunset during class;
city lights at night. **Fake traffic:** "Another plane passes on the left, flying to Tokyo" now and then. Free, no
licences, same effect as live aircraft data.

**Routes as rewards:** signature routes unlock through the class reward system (roadmap #12). For example, a class
unlocks the Alps route after 5 flights, and the class map shows the route lines it has flown. Choosing a route
becomes a class decision ("Vote: the Alps or the Pyramids?").

**Visual identity:** use the house styles already chosen (Paper-cut for teens and the brand, Sticker for kids) for
landmark cards and moment banners, so the world matches the activities. The 3D view stays as it is. Revisit Three.js
only if authored moments hit a limit the current engine can't pass.

---

## 9. Workstream F: free "What kind of teacher are you?" quiz, and the story

### The quiz (public page `/teaching-style`, no sign-up)
10 situation questions, 4 answers each. Every answer moves 5 sliders:
**calm ↔ lively · planned ↔ improvised · together ↔ competitive · no tech ↔ full tech · language ↔ the world**.

Example questions:
- "Your class goes quiet. You…" (start a game · ask a personal question · move to the next exercise · show a video)
- "The perfect last 10 minutes are…" (a team battle · a relaxed chat · a quick review · a story or roleplay)
- "A student says something off-topic and interesting. You…" (follow it · note it for later · bring them back · turn it into a debate)
- "Phones in your class are…" (banned · a tool now and then · central · it depends)

**Six results** (each ties to modes, so the result leads straight into the product):
| Result | In one line | Starter modes |
|---|---|---|
| The Game Captain | Energy, teams, a scoreboard | Quiz battle, Party games |
| The Conversation Pilot | Maximum talk time, light structure | Conversation, Relaxed chat |
| The Navigator | Clear steps, accuracy, visible progress | Grammar workout, Quiz battle |
| The Storyteller | Roles, imagination, scenes | Roleplay, Reading & stories |
| The Debate Coach | Opinions, reasons, arguments | Debate & ideas, Conversation |
| The Explorer | Videos, the real world, curiosity | Video & listening, Travel |

**Result page:** the style name and picture, your 5 sliders, strengths, a watch-out ("Game Captains sometimes leave
quiet students behind: try co-pilots"), 3 class formats that suit you, and a button: **"Try a [mode] class free"**,
which opens sign-up with that mode set up. A share card (image) for teacher groups and social posts.
No email gate. That fits the owner's no-email-capture rule; an optional "email me my result" is the most it gets.

### The story (landing page and the quiz result)
Use the owner's own experience as the positioning: large classrooms in China, students meeting their first foreign
teacher, private schools, business schools, kids, teens, adults, online and in person. Conclusion: **there is no
best classroom, so LessonCaptain adapts to yours.** One short paragraph and a photo, not a biography.

---

## 10. Measuring it (add this in week 0)

New PostHog events (`trackEvent` in `src/lib/analytics/posthog.ts`):

| Event | Properties | Answers |
|---|---|---|
| `activity_launched` | `key`, `class_id`, `mode`, `source: 'shortlist' \| 'all-tools' \| 'plan' \| 'suggestion'`, `device_mode` | What gets used; do shortlists work? |
| `catalogue_opened` | `tab` | How often teachers go looking |
| `class_mode_chosen` | `mode`, `modes_count` | Which modes are real |
| `class_setup_saved` | `device_mode`, `modes`, `prefilled_from` | Setup completion |
| `design_lesson_completed` | `cards`, `top3`, `phones`, `window` | Research totals |
| `phoneless_seat_added` / `copilot_added` | `class_id` | How common mixed classes are |
| `route_moment_shown` / `route_moment_opened` | `route`, `moment`, `view` | Do moments get attention? |
| `teaching_quiz_started` / `_completed` / `_shared` / `_cta_clicked` | `result` | The funnel |

Derived measures and targets (set real targets after 2 weeks of baseline):
- **Time to first activity** (session start → first `activity_launched`): target, half the baseline.
- **Share of launches from a shortlist:** at least 70% after 4 weeks with modes.
- **Lessons finished in phone-free and mixed classes:** up, compared with before.
- **Everyone Aboard rate in mixed classes:** the same as in all-phone classes.
- **Quiz:** at least 60% finish; at least 15% click the trial button.
- **Owner rating of Design your class as a lesson:** at least 4/5 in at least 4 classes.

---

## 11. What waits, and when to revisit it

| Parked idea | Why it waits | Revisit when |
|---|---|---|
| Student discovery funnel | Collects data on minors with no product reason yet | The kids' privacy review is done and the Departures Board has demand |
| Teacher–student matching | Needs many teachers and students in one place (cold start) | 200+ active teachers or 50+ Departures Board bookings |
| Scheduling and class formation | A product of its own (time zones, payments, no-shows) | Matching is live and booking is the bottleneck |
| YouTube team-battle class | Unknown demand | The concept card wins a top-3 spot in 2+ classes |
| Live aircraft | Cost and licences; fake traffic does the job | Never, unless a free, licensable source appears |
| Three.js | Wrong problem | Authored moments fail on the current engine |

The Departures Board (roadmap #10) is the narrow, safe first step toward matching. It runs with the owner's own
classes, group classes only.

---

## 12. Schedule (about 14 weeks, owner gates marked ◆)

| Week | Build (Claude/Codex) | Owner |
|---|---|---|
| 0 | Launch analytics (section 10). Card deck as slides. Observation sheet. | Pick 8 cards per class |
| 1–2 | Concept doc for class setup and phones, with mockups. `deviceUse` audit (Codex). Progression fix and tests. | Run **v0 Design your class** in every class; fill sheets. ◆ Review concept doc |
| 3–4 | Migration 066. `class-profile.ts`. Setup card. Mode filter at `session-view.tsx:842`. Mode chips on Home. **Class Design** activity v1. | ◆ Approve modes using Phase A results |
| 5–6 | Co-pilots on the join screen. Seats without phones. Fairness rules in scoring. 3 phone-free versions. 7-tap onboarding. | Test one mixed class and one phone-free class |
| 7–8 | Fixes from testing. "Learns over time" prompts. | Run **v1** in all classes; invite 3 outside teachers (beta) |
| 9–10 | Teaching-style quiz page, results, share card. Landing story section. | ◆ Approve result names and copy |
| 11–12 | Missing features in `named-features.ts` (Codex). Scenic "off to the side" line. Moment engine and "Look outside" chip. First 4 signature routes. | Try routes in class; does anyone look? |
| 13–14 | Remaining 8 routes. Fake traffic. Route unlocks (with class rewards, roadmap #12). | ◆ Go/no-go on Eventful as a Pro feature |

**How this fits the roadmap:** weeks 0–2 are Phase 0 testing. Weeks 3–8 come before the Home page rebuild
(roadmap #3), because Home should open on *your classes and their modes*. Weeks 9–10 join the landing page (#7). Weeks 11–14
join Phase 3 (#12–17). Pricing (#1): modes, phone levels and phone-free play are free, because they are what makes the
product usable. Eventful flights and unlocked routes are a possible Pro extra.

**Who does what:**
- **Codex** (data at volume): the `deviceUse` tags, new named features, signature route moments in A2 English,
  card text.
- **Claude** (logic and screens): the migration, profile, filters, activity, scoring fixes, quiz, moment engine.
- **Owner:** classes, reviews, card picks, final copy.

---

## 13. Risks and how to handle them

| Risk | What to do about it |
|---|---|
| Students vote for fun, not learning ("only games") | Students choose the style; every mode still teaches; the teacher sets the mix |
| Shortlists hide good tools | All tools is always one tap away; prompts suggest tools from outside the mode |
| Design your class works once, then gets stale | Run it once a term at most; the second time is "redesign", shorter |
| The owner's classes aren't the market | Add 3 outside teachers in weeks 7–8; compare their choices |
| Setup feels like homework | Prefilled from onboarding and votes; done in under 60 seconds; can be skipped |
| Eventful flights distract | Moments never interrupt an activity; Calm is the default; one switch per class |
| Privacy (minors) | Store class totals only; no per-student preferences; the remix text is anonymous |
| Scope creep toward a marketplace | Section 11's triggers decide, not enthusiasm |
| Mixed-class scoring feels unfair | Fairness rules in code, with tests; speed bonuses count for teams only |

---

## 14. Decisions for the owner (with recommendations)

1. **Run v0 Design your class before building anything?** Yes. One week, no code, real answers.
2. **Mode list:** start with the 9 above, or cut to 6 (drop Reading & stories, Relaxed chat, Grammar workout until
   asked for)? *Recommend all 9; teachers pick 3–5 anyway.*
3. **Junior as a mode or a switch?** *Switch* (it changes the AI's language, not only the tools).
4. **Co-pilots first, seats without phones second?** *Yes.* Co-pilots are cheaper and good for talk.
5. **Speed bonuses in mixed classes:** off, or team-only? *Team-only.*
6. **Signature routes:** the 12 above, or a different first 4? *Start with Paris→Rome, London→Cairo, Mumbai→Beijing,
   Toronto→New York.*
7. **Bend limit for scenic routes:** 300 km silent, larger announced? *Yes.*
8. **Eventful flights: free or Pro?** *Decide in week 14 with usage data.*
9. **Quiz result names:** the six above, or aviation names (Captain, Navigator, Flight Engineer…)? *Test both with
   5 teachers.*
10. **UX framing for students:** test with one adult class only? *Yes.*

## Appendix: open questions from the notes, answered

| Question | Answer |
|---|---|
| Questionnaire or interactive? | Teachers: 7 taps (and an optional quiz). Students: an interactive lesson only. |
| One configuration or several modes? | 3–5 modes per class; today's mode in one tap. |
| How do preferences change over time? | Usage reorders modes; prompts add tools; a redesign lesson each term. |
| Teacher override? | Always. Votes prefill; they never lock. |
| Scoring in mixed classes? | Taking part plus being right; teacher marks equal phone answers; speed counts for teams only. |
| What do phone users get extra? | Private answers and richer input, not more points. |
| How does calm mode choose scenery? | Nearest notable feature within 300 km, shown as "on the left/right". |
| Literal route or approximate? | Great circle by default; signature routes bend through waypoints (≤300 km silently). |
| How many routes first? | 4, then 12. |
| Which cities first? | See section 8. |
| Realistic or stylised? | The current 3D view stays; landmark cards and banners use the house styles. |
| Which live data? | Weather, sun, moon, local time (already built). Not aircraft. |
| Three.js? | No. |
| Route unlocks? | Yes, through class rewards. |
| Matching and scheduling? | Not now; triggers in section 11. |
| What does the free tool produce? | A style, 5 sliders, 3 formats and a "try this mode" button. |
| Where does monetisation start? | Unchanged (pricing option B). Possibly Eventful flights. |
| Now or later? | Now: A–D. Next: F. Then: E. Parked: section 11. |
