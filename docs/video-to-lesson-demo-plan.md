# Video → Lesson Public Demo — Implementation Plan

Audit viral idea #1 (`docs/audit-jun2026.md`): a public, unauthenticated page where
anyone pastes a YouTube link and watches a lesson preview materialize, ending in a
signup CTA. This is the marketing front door — the single most demoable thing the
product can do, and the screen-recording asset for all short-form marketing.

**Global rules:** run `pnpm test`, `npx tsc --noEmit`, and
`pnpm next lint --file <each changed file>` before done. Minimal diffs. Schema facts
must be verified against `supabase/migrations/*.sql` CREATE TABLE blocks before
querying (e.g. `sessions` has NO `teacher_id` — ownership is `sessions.class_id →
classes.teacher_id`).

---

## Verified facts (do NOT re-litigate these; they were checked Jun 2026)

1. **Any-video mode is the launch state — `SUPADATA_API_KEY` will be set in Vercel.**
   The feature's entire point is "paste ANY YouTube video"; without it the page is just
   the existing library (owner-confirmed: not worth building in that form). On-the-fly
   transcripts go through the Supadata API path already present in
   `src/app/api/source/extract/route.ts` — a third-party service, so the
   "Vercel is blocked from YouTube" constraint does not apply to it. The plan's caps
   (≤150 uncached previews/day global, 3/day per IP, cache-first) bound Supadata usage.
   Setting the key in prod ALSO un-breaks the sold Pro feature "source-based lessons
   from your own video" for paying teachers — same env var.
   - The route must still degrade gracefully when Supadata fails or a video has no
     captions: title-based preview via oEmbed if reachable, else "we can't read this
     one — try one of these" with curated chips. Never a dead end, never a fake preview.
   - ⚠️ oEmbed caveat: `youtube.com/oembed` from Vercel IPs is UNVERIFIED (the YouTube
     block may cover it). Treat oEmbed as best-effort only.
   - The owner must add `SUPADATA_API_KEY` to Vercel before launch; until then the page
     behaves in degraded/curated form automatically (key check already exists in the
     extract route — mirror it).
2. **Extraction is already cached** in `source_extractions` keyed by
   `(source_type, source_key)` — repeat requests for the same video are free.
3. **Do NOT call `/api/lesson-plan/generate` for anonymous visitors.** It fans out
   parallel generation for every module in the plan (the single most expensive call in
   the app). The public demo generates a light PREVIEW with exactly ONE `generateJSON`
   call.
4. The content cache (`src/lib/content-cache.ts`, `generated_content` table) accepts
   arbitrary `game_key` strings — reuse it for preview caching (see Phase 3).
5. Captain's Flight preset lives at `src/lib/flight-plan-presets.ts`
   (`id: 'all-around-flight-60'`); its `flightConfig.stages` provides the stage labels
   for the preview skeleton — render from the preset, never hardcode.

## UX flow (the whole feature in one paragraph)

Visitor lands on **`/video-lesson`** (public, indexable). Pastes a YouTube URL →
"Building your lesson…" with staged progress (Extracting transcript → Reading the
video → Planning the flight) → the page renders a **lesson preview**: video
title/thumbnail, suggested level, the 9-stage Captain's Flight route (labels from the
preset), 6 key vocabulary items WITH definitions, 3 comprehension questions (real,
shown in full), 2 discussion prompts — then a locked section ("+ 4 more activities,
live student devices, scoring") with a **"Sign up free and fly this lesson"** CTA.
After signup, the pending video is auto-attached so their first Captain's Flight
launch is THIS video's lesson (conversion loop, Phase 4).

---

## Phase 1 — Preview API with hard abuse controls

**New route: `POST /api/public/video-lesson-preview`** (NO auth — that's the point;
the controls below are mandatory, not optional).

Body: `{ url: string }`.

1. **Validate + extract videoId** — reuse the regex already in
   `src/app/api/source/extract/route.ts` (`youtube.com/watch?v=|youtu.be/|embed/`).
   Non-YouTube URLs → 400 with a friendly message. Refactor note: export the regex (or
   a `parseYouTubeId(url)` helper) from a shared lib rather than duplicating it.
2. **Rate limiting (new migration `041_public_demo_usage.sql`):**
   ```sql
   create table public.public_demo_usage (
     id uuid primary key default gen_random_uuid(),
     ip_hash text not null,
     video_id text not null,
     created_at timestamptz not null default now()
   );
   create index public_demo_usage_ip on public.public_demo_usage (ip_hash, created_at desc);
   alter table public.public_demo_usage enable row level security;  -- no policies; service role only (project convention since 001)
   ```
   - Per-IP: max **3 distinct new videos / 24h** (hash = sha256 of
     `x-forwarded-for` first IP + `PUBLIC_DEMO_IP_SALT` env). Cache HITS do not count.
   - Global: max **150 uncached previews / 24h** (count rows in window). Past the cap,
     return `429` with `code: 'DEMO_BUSY'` — the page shows "We're at capacity — here
     are lessons from popular videos" + 3 cached examples (Phase 3 seeds).
3. **Cache-first, twice:**
   - Extraction: check `source_extractions` for `('youtube', videoId)` before calling
     Supadata (mirror the existing route's `getCachedExtraction` logic — or better,
     extract that logic into a shared helper used by both routes).
   - Preview: check `generated_content` via `getCachedContent('video-lesson-preview',
     videoId, 'Intermediate')` before generating. Store with `storeCachedContent` after.
     (`topic` = videoId — the cache key columns are just strings.)
4. **One AI call.** Input: title + summary (NOT the full raw transcript — cap input at
   ~6k chars of summary/transcript-head). Output schema:
   ```ts
   { suggestedLevel: string,           // CEFR phrasing, e.g. "B1 — Intermediate"
     hook: string,                      // 1 sentence: why this video works for ESL
     keyVocab: Array<{ word, definition, example }>,   // 6
     comprehensionQuestions: string[],  // 3
     discussionPrompts: string[] }      // 2
   ```
   Degraded path: if generation fails, return the extraction title + a topic-aware
   minimal preview (NEVER generic unrelated content — locked project rule).
5. Response also includes `title`, `videoId` (for thumbnail
   `https://i.ytimg.com/vi/{id}/hqdefault.jpg`), `cached: boolean`, and the stage
   labels derived server-side from `getFeaturedPreset()`.
6. When `SUPADATA_API_KEY` is unset OR Supadata returns no transcript: fall back to
   oEmbed title + generate the preview from title alone, flagged
   `transcriptUsed: false` (the page renders a small "based on the video's topic"
   note). The demo must never dead-end on a transcript failure.

**Acceptance:** same video twice → second call returns `cached: true`, no Supadata/AI
calls (assert via mocks); 4th distinct video from one IP in 24h → 429; non-YouTube
URL → 400; AI failure → 200 degraded preview mentioning the video title. Tests follow
the existing pattern (`src/__tests__/api/`, mock `@/lib/ai` + `@/lib/content-cache` +
supabase service).

## Phase 2 — Public page `/video-lesson`

**New route group file: `src/app/(public)/video-lesson/page.tsx`** + client component.

- Hero: "Turn any YouTube video into a live English lesson" + URL input + Build
  button, with the curated chips beneath as the instant-gratification path.
  Indexable (it should rank for "youtube video esl lesson plan" queries); add
  `metadata` + an `opengraph-image.tsx` (follow `src/app/(public)/journey/[shareToken]/opengraph-image.tsx`
  precedent — edge runtime).
- Loading state: 3 staged messages on a timer while the request runs (extraction can
  take ~5-10s for uncached videos). Aviation-themed, consistent with product voice
  ("Reading the transcript… Planning the flight…").
- Result: thumbnail + title + level chip + hook line; the 9 waypoint labels rendered
  as a route strip (visual reference: the FeaturedFlightHero boarding-pass timeline —
  reuse `getFeaturedRoute()` from `src/lib/discovery-shelves.ts` CLIENT-SIDE is fine,
  it's static data); vocab cards; comprehension + discussion lists; then the locked
  section (frosted/blurred placeholder rows, lock icon — lucide, never emoji) with the
  signup CTA.
- CTA → `/login?next=/home` (signup IS login — Supabase OAuth). Before navigating,
  write `localStorage['lc-pending-source'] = JSON.stringify({ sourceType: 'youtube',
  sourceKey: videoId, title, summary })` for Phase 4.
- Errors: 429 DEMO_BUSY → capacity message + cached examples; extraction failure →
  "We couldn't read this video — try another, or paste an article link in the app."
- Add the page to `src/app/sitemap.ts` and link it from the marketing homepage
  (`SourceBasedSection` is the natural anchor — small "Try it with your own video →"
  link, don't redesign the section).

**Acceptance:** mobile-clean (the share targets are phones), zero auth required, page
renders a complete preview for a cached video in <2s, lighthouse-reasonable. Keep the
planner-clean rule in mind: this page can be rich, but the preview itself is
information-dense — don't bury the vocab/questions under decoration.

## Phase 3 — Seed + capacity fallbacks

- Local script `scripts/seed-video-previews.ts` (run manually, like
  `prefetch-library-transcripts.ts`): warms `source_extractions` + preview cache for
  **~30 curated popular videos** (start from the existing video library data under
  `src/data/`; favor recognizable, high-search-volume videos). In curated mode (the
  launch state) this seed list IS the demo — its quality and recognizability carry the
  page, so choose videos a teacher would actually recognize and want.
- The page shows 3 of these as one-click chips under the input ("or try one of
  these") — clicking one always hits cache, so the instant-gratification path costs
  nothing and never fails. THIS is what gets screen-recorded for ads.

## Phase 4 — Signup conversion handoff

- In `TeacherHomeClient` (`src/components/discovery/TeacherHomeClient.tsx`): on mount,
  read + clear `localStorage['lc-pending-source']`. If present, set it as the planner
  store's source material and auto-open the Captain's Flight launch modal
  (`FeaturedFlightLaunchModal`) with a one-line banner "Your video lesson is ready to
  build". ⚠️ Verify the exact setter on `usePlannerStore` for source material (grep
  `sourceMaterial` in `src/stores/planner-store.ts`) and the shape it expects — set it
  the same way `SourceInputPanel` does after a successful extract. Do not invent a new
  shape.
- The modal already supports an attached source (`sourceAttached` prop logic) — no
  modal changes should be needed beyond opening it.

**Acceptance:** paste video on `/video-lesson` while logged out → sign up → land on
/home → modal is open with the video attached → launching generates the lesson
grounded in that video (existing behavior). The full loop is what the feature exists
for; test it end-to-end manually before calling it done.

## Env vars (add to `.env.local.example` + Vercel)

- `SUPADATA_API_KEY` — must be added to Vercel by the owner for launch (any-video
  mode is the point of the feature). Build everything without blocking on it; the
  page self-degrades to curated form while the key is absent.
- `PUBLIC_DEMO_IP_SALT` — any random string; hashing IPs rather than storing them.

## Explicitly out of scope (do not build)

- No full lesson-plan generation for anonymous users (cost).
- No article/PDF support on the public page v1 (YouTube only — sharper message).
- No interactive/playable preview (the demo-crew saga is shelved; this page shows
  CONTENT, which is deterministic and can't "look broken").
- No A/B infra, no analytics platform — at most a `console`-free simple counter via
  the existing usage table.

## Order of work + verification gates

1. Migration 041 + preview route + tests (the page is useless without it) →
   `supabase db push` BEFORE deploying code that queries the new table.
2. Page + OG image + homepage link.
3. Seed script + run it locally against prod DB.
4. Signup handoff.
5. Full-loop manual test on the deployed build (the owner reviews on deploys —
   push after typecheck+lint, then screenshot).
