# LessonCaptain roadmap (Oct 2026)

_Written Oct 6 2026 (Junior mode and pictures/art added the same day) from the owner's list, ordered by dependency. Owner decisions still apply: propose big redesigns
before building; plan-heavy items (home page, pricing, rewards) get a concept doc and owner review first._

## The ordering logic
1. **Nothing new is trusted until it's been taught with.** Everything built since early October is untested in a real
   class. Testing comes first, and its fixes jump the queue.
2. **Decide what you sell before designing where people buy it.** Pricing decides what's free, what's Pro and what the
   trial is. The home page, landing page, Departures Board and marketing all depend on that answer.
3. **Fix the first screen before inviting anyone.** Home (signed-in teachers) and the landing page (visitors) are what
   every new teacher sees. They need to be right before marketing sends people to them.
4. **Design the system before making the content for it.** The class reward and plane system decides how cities and
   flights are earned and shown. World Flight's audit, the city art and new cities follow from it, so they aren't redone.
5. **Polish last, but before launch.** Flight visuals and transitions, design flight upgrades and city art make it feel
   great. They matter for launch, but they rarely block it.

## Phase 0: test and fix (when the owner is back)
| Item | Notes |
|---|---|
| Test round | The return checklist (claude.ai artifact "Return Test Checklist"): Speak, Travel, Debate, Listening, Reading, logbook results, book upload, picture books, Simplified, scans, phone photos. |
| Fixes from it | Highest priority. |
| Real phones | Student phone redesign (Sep 30) is still untested on real phones (iPhone + Android). |

## Phase 1: decide the business, fix the first screen
| # | Item | Why here | Depends on |
|---|---|---|---|
| 1 | **Pricing plans** | Decides free vs Pro vs trial, credits vs limits, scanned-book pricing, school/team plans. Stripe is built but not live (`docs/billing-setup.md`). | Test round (know what works) |
| 2 | **Kids' privacy and safety review** | Kids and teens worldwide: COPPA (US), GDPR-K / UK Children's Code, parental consent for under-13s, data retention, what's stored about students. Required before marketing and before the Departures Board (minors + paying parents). | None (can run alongside 1) |
| 3 | **Home page rebuild** (signed-in teachers) | Everything launches from the Live Room now. Goal: the fewest clicks from sign-in to a live class. Needs serious planning: concept doc, mockups, owner review. | 1 (what's gated) |
| 4 | **After the lesson** (reports, class logbook, history) | What teachers keep and show (parents, schools) is a big part of why they pay. Builds on the flight results already stored. | 1 (what's Pro) |
| 5 | **Pictures and art** (image layer) | Most activities are words only. One shared picture library used everywhere: a sticker set and illustrations in the house styles ("Sticker" for kids, "Paper-cut" for teens and brand), stock photos where real-world pictures fit, AI illustrations made once and cached (never per lesson), picture answers on phones, pictures on vocab cards and in Read Aloud. Needs a concept doc: sources and licences, cost, how pictures are matched to words. | 0 |
| 6 | **Junior mode** (young kids) | The owner's real audience; the kids' visual side was the biggest product weakness (Sep 2026). One switch per class that changes the whole experience: the "Sticker" art style (owner's pick for kids), picture answers on phones instead of words, bigger tap targets, spoken prompts, shorter rounds, A1 content (Codex round 17), gentler scoring. Needs a concept doc: which flights and activities work for young kids, what changes on the teacher screen vs the phones. | 0, 5 (pictures; test round shows where kids struggle) |

## Phase 2: bring teachers in
| # | Item | Why here | Depends on |
|---|---|---|---|
| 7 | **Landing page** (visitors) | Sells the product the home page now delivers; product imagery first, readability over theme, no email capture on the homepage (owner rules). | 1, 3, 6 (show Junior mode) |
| 8 | **Onboarding, first lesson** | The path from sign-up to a first live class with a phone joining (A3 shipped in July; check it still fits the Live Room). | 3 |
| 9 | **Billing live** | Turn on Stripe with the chosen plans; Pro page; receipts; cancel flow. | 1 |
| 10 | **Departures Board** | Free trial class → paid lessons with the teacher; Founding Crew. Group classes only (minors). Needs payments, safety and moderation design. | 1, 2, 9 |
| 11 | **Marketing material** | Short videos, screenshots, brochure, social posts, the Marketing Agent OS. Made last in this phase so it shows the new home and landing pages, and Junior mode for parents. | 3, 6, 7 |

## Phase 3: make it delightful and give it depth
| # | Item | Why here | Depends on |
|---|---|---|---|
| 12 | **Class rewards and plane upgrades** (all flights, not just World Flight) | A system design: what a class earns, from which flights, how it shows (plane, stamps, cities). Decides how 13-15 work. | 1 (is any of it Pro?) |
| 13 | **World Flight audit and UX** | How it works today, what's confusing, how it fits the Live Room and the new reward system. | 12 |
| 14 | **City art upgrade** (departure and arrival scenes) | One art direction for all cities (owner design bar: whole compositions, hero contrast). Do before adding cities, so new ones are made once. | 12, 13, 5 (art styles) |
| 15 | **City expansion** | New cities in the upgraded style, with trip packs (Travel flight). Codex can do the data; Claude the art. | 14 |
| 16 | **Design flight upgrade** (flight path etc.) | The capstone flight's path and stages. | 12 |
| 17 | **Flight visuals, animations and transitions** | One pass across all flights, after the test round shows which screens feel flat; Junior mode's style included. | 0, 5, 6 |

## Ongoing (alongside every phase)
- **Codex library rounds**: round 17 (A1 kids' texts, early-reader courses) in progress; then content that the
  phases above need (city trip packs for 13, more listening clips, more books).
- **Reliability**: error monitoring, AI costs per lesson, slow-screen checks, Supabase/Vercel limits at launch.

## Things not on the owner's list (suggested)
- **Kids' privacy and safety review** (added as Phase 1 #2): the biggest gap; it affects marketing, sign-up, the
  Departures Board and what student data is kept.
- **Real-phone and real-class testing as a habit**: a short test checklist per release, not only now.
- **Help and support**: a help page or short guides, a way for teachers to report problems (with the exact screen).
- **Teacher feedback loop**: the first outside teachers (Mom test, beta) and how their feedback is collected.
- **Analytics for decisions**: which flights get used and finished, where teachers drop off (PostHog is live).
- **Languages**: teachers worldwide may want the teacher UI in their language (students learn English, but the
  teacher's screen could be localised).
- **Schools and teams**: a school plan, shared courses between teachers, admin view (part of pricing).
- **Accessibility**: readable sizes on projected screens, colour contrast, captions for listening clips.
- **Data export and deletion**: teachers (and parents) asking for their data or for deletion (part of the privacy review).
