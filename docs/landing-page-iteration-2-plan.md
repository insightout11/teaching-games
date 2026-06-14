# Landing Page — Iteration 2

Follow-up to `docs/landing-page-100x-plan.md` (shipped in d9b5204, reviewed and
verified). This round, in priority order: a hero REDESIGN (owner rejected the shipped
hero — see Task 0, do it first), Tokyo as the World Flight showpiece, real product
screenshots captured by YOU (the executing agent) where feasible, and the review
follow-ups from the iteration-1 audit.

**Global rules:** `pnpm test`, `npx tsc --noEmit`, `pnpm next lint --file <each changed
file>` before done. Minimal diffs. Lucide icons, never emoji. No PPP jargon
("Presentation/Practice/Production") in any rendered string. Teacher-screen rule: any
depiction or screenshot of the teacher view must never show an answer key — it is
projected to the class. When the owner says "push", commit straight to main.

---

## Verified facts (checked Jun 2026)

1. Tokyo's canonical arrival scene is defined at `src/data/world-flight/destinations.ts:306-315`:
   `id: 'tokyo'`, lat 35.6762 / lng 139.6503, scene
   `{ terrain: 'urban', vegetation: 'broadleaf', skyline: 'highrise', landmarkSilhouette: 'fuji', palette: 'night' }`.
   Use THIS scene object (import the destination entry or copy verbatim) — do not
   invent scene props. A dev preview gallery exists at `/dev/arrival-scene` (dev-only).
2. `WorldFlightSection.tsx` currently ends the example journey in Paris
   (`destinationId="paris"`, eiffel/golden/dusk) with a "Now arriving · Paris" badge,
   and computes the km stat via haversine over the JOURNEY array.
3. `src/app/(public)/video-lesson/opengraph-image.tsx:3` declares
   `runtime = 'nodejs'` — this breaks `next build` locally on Windows
   (@vercel/og + fileURLToPath on a `C:\` path). The homepage OG image uses
   `runtime = 'edge'` and builds fine.
4. A stray empty file named `city` sits in the repo root (untracked shell artifact).
5. Playwright/Puppeteer are NOT in package.json. The dev server runs with `pnpm dev`.
6. Mock mode exists: `NEXT_PUBLIC_MOCK_MODE=true` makes layouts treat `MOCK_USER`
   (`src/lib/mock/data.ts`) as signed in. Its coverage beyond layout auth is
   UNVERIFIED — investigate before relying on it for session screenshots.
7. A demo session with simulated students exists (the `/home` launcher has "Test
   flight with demo crew" — demo class, 5 AI personas). Whether it can run without
   real credentials is UNVERIFIED.
8. `/video-lesson` pre-loads a sample preview on visit and renders cached previews
   from `?v=<videoId>` — free, no rate cost. Good screenshot subject.
9. `LessonCaptainFlightPlan` (`src/components/ui/flight-plan.tsx`) is presentational
   (no store/auth imports — verify its import list before mounting, then trust it):
   props `steps: FlightPlanStep[]`, `width`, `height`, `mode: 'runtime'`,
   `activeIndex`, optional `onNodeClick`. `FlightSessionView`
   (`src/components/session/flight-session-view.tsx:50-71`) maps
   `flightConfig.stages` → `FlightPlanStep[]` (first stage → 'Takeoff'/terminal,
   `landing` kind → 'Landing'/terminal, `micro-event` → 'Check'/checkpoint, else
   'Stage'/module). The Captain's Flight `flightConfig` comes from
   `FLIGHT_PLAN_PRESETS` id `all-around-flight-60`.

## Task 0 — Hero redesign (TOP PRIORITY — owner rejected the shipped hero)

Owner's verdict on the current hero, verbatim intent: the video-paste demo is "a cool
feature, maybe the best feature — but that's not all it is, and that's what it feels
like. AND visually, it should be waaaay better." Diagnosis (agreed in review):

- The paste input is the hero's only action and three YouTube thumbnails are its only
  imagery — the largest visuals on the page are OTHER channels' branding. The page
  structurally reads "video-to-lesson generator" regardless of the headline.
- The route strip (the actual product depiction) sits below the fold.
- Centered single-column stack, four competing CTAs in view (amber Build, blue Test
  Flight, outline Browse, nav Test Flight), a floating disconnected moon, muddy cloud
  blobs, dead space both sides. No focal composition.

Rebuild `HeroSection.tsx` around two principles:

**A. Positioning: a live lesson you run, with MANY ways to start one.**

Replace the dominant paste-input block with a compact "start from anything" widget —
a segmented control / tab row such as:
`▸ YouTube video · Article or text · Just a topic · Ready-made flight`

- **YouTube video** (default tab): the paste input + the 3 cached examples as SMALL
  thumbnails inside the tab (visually subordinate — never again the biggest imagery
  on the page). Behavior unchanged: `/video-lesson?v=` / `?url=`.
- **Article or text**: one line — "Paste any article, PDF, or your own text in the
  planner" → CTA to `/login`. Do not build a public article pipeline.
- **Just a topic**: 4–5 real topic chips (pull from the standard topics list, don't
  invent) → `/login`.
- **Ready-made flight**: one line about Captain's Flight → `/showcase`.

The widget must make the breadth FELT structurally (four entry points visible as
tabs) while keeping the video magic one click away as the default. Keep
"Free · no sign-up · 60 seconds" only inside the video tab.

**B. Visual: put the product above the fold, compose asymmetrically.**

- Desktop: two-column / asymmetric hero, OR left-aligned copy with the product
  panel full-width beneath — whichever composition lets the flight plan breathe.
  Left/top: badge, headline, one-sentence subline about the live loop (move "a
  lesson builds itself" INTO the video tab copy), primary CTA, the start-widget.
- **The product visual is `LessonCaptainFlightPlan`** (`src/components/ui/flight-plan.tsx`,
  `mode="runtime"`) — the rich in-lesson flight path with stage cards, curved route,
  plane marker, and micro-event checkpoints (owner picked it by screenshot from the
  live session view). It is purely presentational (props only, no store/auth) and the
  pre-iteration-1 hero already mounted it on this page — but with FAKE 5-step PPP
  data, which is why it was removed. Feed it the REAL Captain's Flight stages using
  the exact stage→step mapping at
  `src/components/session/flight-session-view.tsx:50-71` (extract that mapping into a
  small shared helper or replicate it — micro-events map to kind 'checkpoint').
  Replace `MarketingRouteStrip` usage in the hero with this; switch `/showcase` to it
  too if it fits that layout, otherwise the strip may remain there.
  - Width note: the session view sizes it as
    `max(1120, 260 + mainStages*150 + microEvents*56)` ≈ 1422px for the 9-stage
    route. In the hero, drive width from a measured container (the old hero's
    ResizeObserver pattern) and verify the 9 stages stay legible at ~1100px; if
    cramped, slight horizontal overflow with scroll-snap on mobile beats shrinking
    cards to illegibility.
  - Give it a worthy backdrop: in the live session it sits on an aurora sky — the
    hero's horizon-glow treatment (below) should do the same job. The flight plan
    must be visible without scrolling at 1440×900.
- CTA discipline above the fold: ONE primary button (blue "Start a Test Flight");
  "Browse games and activities" demotes to a text link; amber appears only on the
  widget's action button.
- Background: make the sky intentional behind the hero — a horizon-glow gradient
  anchoring the product panel; integrate or remove the floating moon; clouds either
  legible or gone. Hero-local treatment is fine; don't restyle the global
  SkyBackground for every page.
- Mobile (390px): stacked; widget collapses to the video tab with the other entry
  points as small links beneath; route strip simplified or below the widget.

**Bar and verification:** this is the company's front door — no generic centered
SaaS stack. Iterate WITH screenshots: capture the hero at 1440×900 and 390×844 after
each major pass, compare against the rejected version (owner's screenshot shows the
centered stack + giant thumbnails), and include final screenshots in your summary.
If a frontend-design skill is available to you, use it for this task.

## Task 1 — Tokyo as the World Flight showpiece

In `src/components/homepage/WorldFlightSection.tsx`:

- Reorder the example journey to END in Tokyo (e.g. Paris → Dubai → Singapore →
  Tokyo — keep real coordinates; the km stat recomputes automatically).
- Render `DestinationArrivalScene` with `destinationId="tokyo"` and the canonical
  Tokyo scene from verified fact #1 (night palette, Fuji silhouette, highrise
  skyline). Pick the `timeOfDay`/`phase`/`progress` combination that frames the
  scene best — preview via `/dev/arrival-scene` in dev and judge with a screenshot,
  don't guess blind. Keep `useReducedMotion` handling.
- Update the badge to "Now arriving · Tokyo" and re-check the overlay/badge contrast
  against the night palette (the current border/label colors were tuned for dusk).
- Add a small caption marking the journey as an example (e.g. "an example class
  route" near the stat row) — keeps the stats honest.

## Task 2 — Real product screenshots (self-serve as far as possible)

Goal: replace guesswork illustrations with real captures where a real capture is
strictly better. Work in this order and STOP at the first infeasible step rather
than faking anything:

1. **Tooling:** use your available browser/screenshot tooling; if none, a throwaway
   `npx playwright@latest screenshot` (or a 10-line script with chromium) against
   `pnpm dev` is fine. Do not add playwright to package.json — this is a one-off
   capture, not a test dependency. Capture at 2x device scale, 1440×900 viewport
   (plus 390×844 for any mobile shot you intend to use).
2. **Logged-out captures (no blockers):**
   - `/video-lesson` with the sample preview rendered (hero asset candidate and
     social/OG raw material).
   - `/showcase` and the rebuilt homepage (before/after reference for the owner,
     and raw material for the OG image if it beats the drawn motif).
   - `/dev/arrival-scene` Tokyo frames to choose the Task 1 composition.
3. **Signed-in captures (attempt, may be blocked):** investigate
   `NEXT_PUBLIC_MOCK_MODE=true` — if it yields a usable `/home` (Captain's Flight
   hero) and, ideally, a session view via the demo crew without real credentials,
   capture: teacher session view mid-game (leaderboard visible, NO answer key) and
   the student controller. If auth genuinely blocks you, report exactly what you
   need from the owner (e.g. one signed-in demo-crew session left open while you
   capture) instead of working around it.
4. **Use them sparingly:** screenshots earn a place only where they beat the current
   hand-crafted work. Primary candidate: the TwoScreensSection teacher frame — if a
   real session capture is sharp and legible at section size, swap it in (keep the
   browser-chrome framing and the phone overlay); if it is not clearly better, keep
   the mock and store the captures under `branding/screenshots/` for the owner's
   marketing use anyway. Optimize anything that ships (webp or compressed png,
   <200KB each, `next/image` if used in-page).
5. Record in the final summary: what you captured, what was blocked and why, where
   files landed.

## Task 3 — Review follow-ups from iteration 1

1. `src/app/(public)/video-lesson/opengraph-image.tsx`: `runtime = 'nodejs'` →
   `'edge'` (verified fact #3). Confirm `next build` then passes locally.
2. `/video-lesson` locked-section + signup CTA copy: sell the LIVE step, not more
   content — the CTA should read like "Sign up free and fly this lesson live with
   your class" and the locked rows should name live-loop things (student devices,
   live scoring, leaderboard), not "more activities". Check the current strings
   first — the other agent may have already adjusted some of this in d4c345f.
3. Delete the stray `city` file in the repo root (`Remove-Item city`). While there,
   add a `.gitignore` entry only if something would re-create it (otherwise just
   delete).

## Task 4 (optional, only if Tasks 1–3 land cleanly) — fuller altitude gradient

Iteration 1 implemented the runway strip + amber accents but not the per-section
twilight→warm background descent. If time permits: a subtle per-section treatment
(hero coolest, warming toward the runway strip). Constraint: backgrounds only,
no layout or copy changes, must not fight text legibility — if a section needs its
text recolored to survive the gradient, the gradient is too strong.

## Out of scope

- The recorded live-round marketing video (owner records; screenshots ≠ video).
- /pro, Stripe, pricing copy.
- Any change to game/session code.

## Verification

Per task: tsc + lint on changed files + tests. Visual checks are mandatory for
Tasks 1, 2 and 4 — screenshot the result at desktop and 390px widths and include the
images in your summary. Owner reviews on the deployed build; wait for "push" unless
told otherwise.
