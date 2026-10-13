# Landing page: brief for two independent proposals

_Written Oct 13 2026. Owner: LessonCaptain. Two proposals are being made from this same brief, one by Claude and
one by Codex ("Astra"). Each is made **without seeing the other**. The owner compares them and picks, or combines._

## The job
Propose a new home page for lessoncaptain.com (`src/app/(marketing)/page.tsx` and `src/components/homepage/*`).
The current page describes the product as it was before the Live Room and before World Flight moved into the
class. It leads with "paste a video, get a lesson" and treats the live classroom as one section among ten.

**The page has one job:** a teacher who has never heard of LessonCaptain understands within one screen what it is,
believes it would make their next lesson better, and starts a free lesson.

## Who it is for
- **English teachers of children and teenagers**, teaching online (Zoom and similar) or in a classroom with a
  projector, anywhere in the world. Many are not native speakers. Many read the page on a phone.
- They already own a pile of tools (Kahoot, Wordwall, slides, YouTube). They are short of preparation time and
  want students talking, not clicking.
- Secondary reader: a school owner or coordinator deciding whether to let teachers use it.

## What the product is now (the facts the page must be true to)
- **One live room.** The teacher opens a class and teaches from one screen that is shared or projected. It looks
  like a flight deck: the class boards, takes off, flies and lands.
- **Anything becomes the lesson.** Type a topic, paste a video link or an article, upload a book, or just start
  talking. The room turns it into speaking activities and games on that exact topic while the class is there.
- **Full flights when you want structure.** About 60 minutes each: Captain's Flight, Speak, Grammar, Debate,
  Travel, Listening, Reading. Each shows the class how much it improved by the end.
- **Students join on phones**, by QR code or link, no accounts and no typing: they tap, vote and buzz. It also
  works with no phones at all.
- **World Flight.** Every lesson that takes off and lands moves the class to a new city on a world map. The class
  earns a passport stamp, flight hours and crew stars, upgrades its plane to fly further, follows themed
  expeditions across cities, and unlocks Design missions. Each of 50 cities has its own lessons.
- **Junior mode** for ages 5 to 9: pictures, a read-aloud voice, no rankings.
- **Courses** that remember where the class stopped, including reading courses from the teacher's own books.
- **Price.** Free: 4 full lessons every month, for good. Pro: $9 a month or $79 a year. Students never pay.
  The sign-up button is called **"Start a Test Flight"**.

## Rules (from the owner's earlier decisions; a proposal that breaks one is not usable)
1. **The product must be the hero.** Show the real thing (the room, the map, the phone) and never a YouTube
   thumbnail as the page's identity. Video is one way in, not what the product is.
2. **Readability beats theme.** No small type for the sake of an aviation look. Nothing in a restyle may be
   harder to read than what it replaces.
3. **No email capture, no "coming soon", no fake or disabled controls, no "beta" language.** Free access is
   permanent and is described that way.
4. **Real-looking data in illustrations.** Use the existing cast (Mei, Diego, Yuki and friends), real city names
   and real activity names. No grids of abstract letters or lorem ipsum.
5. **Commit to a metaphor's real shape or drop it.** A boarding pass has a stub and a perforation; a passport
   stamp looks like a stamp. Half a metaphor is worse than none.
6. **Lucide icons, never emoji.**
7. **No invented proof.** No made-up testimonials, logos, teacher counts or star ratings. If there is no real
   proof yet, the section is built from something true (what happens in a lesson, the owner teaching with it).
8. **Demos are operated, not watched.** If the page includes a demo, the visitor does something in it.
9. **Works on a phone** at 380px wide, and is fast: no autoplaying video above the fold.
10. Decorative art that cannot be done properly is left out. No CSS-rotated SVG dials.

## What each proposal must contain
1. **One-paragraph positioning:** who it is for, what it replaces, why it is different.
2. **A mockup** of the whole page, top to bottom, at desktop width, plus the first two screens at phone width.
   Real headlines and real copy, not placeholders. A single HTML page is ideal.
3. **The first screen in detail:** headline, sub-line, the main button, and exactly what picture or live element
   sits beside them.
4. **The section order with one line of reasoning each:** what question in the visitor's head it answers.
5. **What is cut** from the current page, and why.
6. **Two alternative headlines** you rejected and why.
7. **What you would test first** after launch.

## How the two will be judged
- A stranger gets it in five seconds.
- It is true to the product as it is today.
- It makes the live room and World Flight the reason to try it, not features in a list.
- A teacher on a phone can read it and start.
- It could be built from what exists (real screens, real art), without new illustration work the project cannot do.

## Not in scope
The pricing numbers, the sign-up flow, the SEO pages under `/classroom-games` and `/classroom-activities`, the
blog, and the showcase page. Do not edit code: this round is a proposal only.

## Where to look
- Current page: `src/app/(marketing)/page.tsx`, `src/components/homepage/`.
- The room: `src/components/session/live-room/flight-deck.tsx`. World Flight in the room:
  `live-room/city-lessons-card.tsx`, `live-room/world-flight-record.tsx`.
- Plane art: `public/assets/flight/planes/`. City scenes: `src/components/world-flight/arrival-scene/`.
- Earlier marketing thinking: `docs/marketing-growth-os.md`, `docs/pedagogical-advantages.md`.

**For Codex:** write the proposal to `docs/landing-page-proposal-astra.md` with the mockup as
`docs/landing-page-proposal-astra.html`, on branch `codex/landing-proposal` off `origin/main`. Do not read
`docs/landing-page-proposal-claude*` if it exists. Don't push or merge; report.
