# Landing Page 100x — Implementation Plan

Goal: rebuild the logged-out marketing homepage (`src/app/(marketing)/page.tsx`) from a
text-heavy feature list into a visual, interactive pitch for what LessonCaptain actually
is — an orchestrated live-lesson product, not a pile of activities. Owner has approved
every item below (audit conversation, Jun 2026).

**Global rules:** run `pnpm test`, `npx tsc --noEmit`, and
`pnpm next lint --file <each changed file>` before done (Vercel fails on ESLint errors
that tsc misses, e.g. unused imports). When the owner says "push", commit straight to
main — no feature branches. Lucide icons only, never emoji glyphs. Minimal diffs:
extract/refactor only what the new work needs; leave old local constants alone.

**Coordination warning:** a separate agent is concurrently improving `/video-lesson`
(pre-loaded sample preview, shareable `?v=<videoId>` URLs, logged-in CTA swap, thumbnail
chips). Before starting Phase 1, check `git log` for those commits and read the current
state of `src/app/(public)/video-lesson/VideoLessonClient.tsx` — do not duplicate or
conflict with that work. This plan does NOT modify the /video-lesson page itself.

---

## Verified facts (checked Jun 2026 — do not re-litigate)

1. `src/app/(marketing)/page.tsx:26` redirects signed-in users to `/home`. KEEP this
   behavior. (Owner previews the landing page via incognito.)
2. **Locked product rule: PPP jargon must never appear in user-facing strings.** The
   current hero (`src/components/homepage/HeroSection.tsx:8-22`) renders
   "Presentation / Practice / Production" labels — this violates the rule and must go.
   `src/components/explore/ExploreClient.tsx:63-68` (`getStageBadge`) also renders
   "Present / Practice / Produce" badges — remove the badge entirely (do not rename it;
   the categories/skills filters carry the same information).
3. The flagship lesson structure is **Captain's Flight** (`all-around-flight-60` in
   `src/lib/flight-plan-presets.ts:348`): 9 stages — Warm-up, Briefing, Language
   Toolkit, Opinion Pulse, Explore, Accuracy Check, Main Discussion, Review Game,
   Wrap-up — each with a flight phase (takeoff/climb/cruise/descent/landing).
4. `getFeaturedRoute()` in `src/lib/discovery-shelves.ts:419` returns exactly that
   route as `RouteWaypoint[] { label, kind, phase }`. It is static data, safe to call
   client-side. ALWAYS render the route from this function — never hardcode stages.
5. `FeaturedFlightHero` / `TeacherHomeClient` (`src/components/discovery/`) are wired
   to `usePlannerStore`, credits, and launch modals. Do NOT remount them on public
   pages — build read-only presentational variants instead.
6. The public SEO landing pages `/classroom-games` and `/classroom-activities` (hubs +
   detail pages, `src/content/`) exist, are indexable, and currently receive ZERO
   internal links from the homepage or footer.
7. `/video-lesson` is public, capped, and cache-backed. Its 3 example chips
   (`FEATURED_CHIPS` in `src/lib/video-lesson-demos.ts`) always hit cache once seeded.
   Thumbnails come from `https://i.ytimg.com/vi/{id}/hqdefault.jpg` — if you use
   `next/image` for them, check `next.config` `images.remotePatterns` first; plain
   `<img>` is acceptable (the existing VideoLessonClient precedent).
8. Free-tier copy "5 Test Flight credits" is CORRECT (migration 029). Test Flight /
   credits framing is evergreen — never describe it as a beta or temporary program.
9. Pricing reality: `/pro` still ends in a `mailto:` (Stripe built but dormant). Do not
   touch `/pro` or pricing claims in this plan — out of scope (see bottom).
10. Game-name copy errors in `src/components/homepage/ProductDetailStrip.tsx`:
    "Grid Rush" → "GridRush", "Defend It" → "Defend the Indefensible",
    "Twenty Questions" → "20 Questions" (verified against plugin `name:` fields).
11. The marketing layout (`src/app/(public)/layout.tsx` logged-out branch and
    `(marketing)` equivalent) uses `SkyBackground` + a fixed dark overlay. The golden
    runway-light motif exists in the app shell (see `airfield-scene.tsx` /
    world-flight scene components) — reuse/extract only the lights strip if needed.

## Design bar (applies to every phase)

This is the company's front door. No generic-AI-aesthetic output: no centered-icon
card grids as the default answer, no uniform navy-card-on-navy monotony. The page's
organizing visual metaphor is **altitude**: the hero sits at twilight cruise; sections
descend; the page bottoms out at a warm golden runway (amber accent —
currently almost unused on this page) just above the footer CTA. Use framer-motion
`whileInView` consistently with the existing sections. Mobile must be clean — the
share targets are phones.

---

## Phase 1 — Hero rebuild (the magic moment + the real flight path)

Rewrite `src/components/homepage/HeroSection.tsx`:

1. **Keep** the headline territory ("Run interactive ESL lessons while you screen
   share") but tighten: lead with the live loop, subline mentions Zoom/Meet/Teams.
2. **Add the interactive video-paste input directly in the hero**: a URL input +
   "Build my lesson" button + the 3 `FEATURED_CHIPS` rendered as thumbnail cards
   (not text pills). Submitting navigates to `/video-lesson` carrying the URL so the
   build starts on arrival — check what query-param contract the other agent
   implemented (likely `?v=<videoId>` for cached and/or `?url=`); if none exists for
   auto-build-from-param, add a minimal one to `VideoLessonClient` (read param on
   mount → call `build()`), coordinating with their shareable-URL work rather than
   duplicating it. Microcopy under the input: "Free · no sign-up · 60 seconds".
3. **Replace the flight-path visualization**: delete `DEMO_STEPS` / `PLAN_SLOTS` (the
   5-step PPP demo). Render the 9-stage Captain's Flight route from
   `getFeaturedRoute()` as a boarding-pass-style route strip (visual reference:
   FeaturedFlightHero's timeline — build a small presentational component, e.g.
   `src/components/homepage/MarketingRouteStrip.tsx`, that takes `RouteWaypoint[]`).
   Animate it plotting stage-by-stage on load (staggered reveal along the path), with
   phase grouping visible (takeoff → climb → cruise → descent → landing). Hidden or
   simplified below ~480px as today.
4. Primary CTA stays "Start a Test Flight" → `/login`. Secondary CTA changes from
   `/explore` to the new `/showcase` (Phase 4).

**Acceptance:** no PPP strings anywhere in the hero; route renders from the preset
data; pasting a YouTube URL in the hero lands on /video-lesson with the build running;
chips show video thumbnails; mobile layout clean.

## Phase 2 — "Two screens" product section (NEW)

New `src/components/homepage/TwoScreensSection.tsx`, placed after HowItWorks.

The claim "students join from any browser, no accounts" must become a picture: a
framed teacher-screen mock (rounded browser chrome) showing a live game round —
leaderboard visible, a question on screen — with a phone-sized overlay at the corner
showing the student controller mid-answer (DynamicInput-style buttons). Build it as a
hand-crafted illustrative composition (HTML/CSS/SVG, real product colors and
components-inspired, content hardcoded) — NOT screenshots, NOT a real session mount.
Keep it honest: teacher screen shows no answer keys (teacher screen is always
projected to the class — locked rule). Caption row: three short claims (students join
via link/QR · no student accounts · teacher keeps control).

**Acceptance:** section reads at a glance on mobile (stack the two frames), no real
session code imported, no invented features depicted.

## Phase 3 — World Flight section (NEW)

New `src/components/homepage/WorldFlightSection.tsx`, placed after TwoScreens.

The emotional differentiator: "Your class flies the world together. Every lesson is a
leg of the journey." Reuse existing art — the arrival-scene library
(`src/components/world-flight/arrival-scene/`) and/or the journey map visuals. Pick
ONE strong composition (e.g. a route arc across a stylized map into an arrival scene
vignette + a journey stat row: cities visited, km flown). Decorative scene rule: a
single scaling SVG composition (one viewBox), correct near/far perspective. If a
public journey share page exists (`/journey/[shareToken]`), link "See a class's
journey" to a real shared example ONLY if the owner provides a token; otherwise no
link, no fake data labeled as real.

**Acceptance:** uses existing arrival-scene/world-flight components or assets (check
their props before citing/mounting — verify, don't assume); no new bespoke SVG
mega-scene built from scratch; section is the visual peak of the page.

## Phase 4 — Public showcase page + CTA rewiring

1. New public route `src/app/(marketing)/showcase/page.tsx` (logged-out browse
   destination, replacing `/explore` in marketing surfaces). Layout modeled on
   `/home`'s discovery pattern: a read-only Captain's Flight hero (reuse
   `MarketingRouteStrip` from Phase 1 + preset description) followed by 3–4
   teacher-job shelves of game/activity cards. Source the shelf groupings from
   `src/lib/discovery-shelves.ts` if its data functions are auth-free (verify); else
   group from the registries (`getAllGames()` / `getAllActivities()`,
   filtering `flightPlanOnly`). Cards are view-only: name, tagline, category accent;
   every click → `/login`. Add metadata + sitemap entry.
2. Rewire marketing links: `MarketingNav` "Explore" → `/showcase`;
   `PresetsSection` "Browse activities →" → `/showcase`;
   hero secondary CTA → `/showcase` (Phase 1). `/explore` itself keeps working
   (logged-in users still use it) — just no longer the marketing entry point.
3. Add a quiet text row on /showcase linking the SEO hubs: "Browse by type:
   Classroom Games · Classroom Activities" → `/classroom-games`,
   `/classroom-activities`.

**Acceptance:** /showcase renders logged-out with zero auth/planner imports
(`usePlannerStore`, `useTeacherTier` must NOT appear in it); every interactive element
routes to /login or a public page; no PPP strings.

## Phase 5 — SEO, metadata, copy fixes (small, do in one commit)

1. `MarketingFooter`: add links — Showcase, Classroom Games (`/classroom-games`),
   Classroom Activities (`/classroom-activities`), Video to Lesson (`/video-lesson`),
   Pricing (`/pro`), keep Login.
2. Homepage OG image: `src/app/(marketing)/opengraph-image.tsx` following the
   `src/app/(public)/journey/[shareToken]/opengraph-image.tsx` precedent (edge
   runtime, brand colors, route-strip motif + tagline).
3. `ProductDetailStrip` name fixes (verified fact #10).
4. `ExploreClient` PPP badge removal (verified fact #2).

## Phase 6 — Visual rhythm pass (after structure is in)

1. Implement the altitude descent: per-section background treatment from cool twilight
   (hero) to warmer/darker, ending with a golden runway-lights strip directly above
   `TestFlightSection` (reuse/extract the existing runway-lights rendering — do not
   redraw it by hand if a component exists).
2. Introduce amber/gold sparingly: section eyebrow accents alternating with blue, the
   runway strip, and the final CTA glow. Do not recolor primary CTAs (stay lc-blue).
3. Social proof placeholder: a single quiet line near pricing — built-by-a-teacher
   framing ("Built by an online ESL teacher for online ESL teachers") — positioned so
   real testimonials can replace it later. No invented quotes, no fake counts.
4. Final section order on the page:
   Hero → HowItWorks → TwoScreens → WorldFlight → ProductDetailStrip →
   SourceBasedSection (keep; its /video-lesson link can stay) → TrustSection →
   Pricing (+ founder line) → runway strip → TestFlightSection.
   `PresetsSection` is superseded by /showcase + the hero — remove it from the page
   (leave the component file in place).

## Explicitly out of scope

- `/pro` page, Stripe go-live, pricing copy changes (separate effort —
  `docs/billing-setup.md`).
- Any change to `/video-lesson` beyond the minimal query-param auto-build hook in
  Phase 1 (another agent owns that page right now).
- Recorded product video/GIF for the hero (owner must record it; the interactive
  paste demo is the v1 hero).
- Testimonials, analytics, A/B infra.

## Order + verification gates

Work the phases in order; each phase is one commit. After every phase:
`npx tsc --noEmit` + `pnpm next lint --file <changed files>` + `pnpm test`. The owner
reviews on the deployed build — after the final phase, say so and wait for "push"
unless already told; then commit to main directly. Final manual check (incognito,
logged out): hero paste flow end-to-end, /showcase click-through to /login, mobile
viewport (~390px) for every new section, no PPP strings anywhere
(`grep -ri "presentation\b" src/components/homepage src/app/\(marketing\)` should
return no rendered-label hits).
