# /video-lesson — Next Level (marketing tool upgrade)

Owner verdict on the current page: "pretty good" but it under-explains the product.
Diagnosis (agreed in review): the preview output reads like a WORKSHEET GENERATOR —
flat lists of vocab/questions — while the actual differentiator (a live, orchestrated
9-stage lesson students play) exists only as text in the locked box. This plan
reframes the page from "AI made you a handout" to "AI built you a lesson," and turns
every preview into a shareable marketing artifact.

**Global rules:** `pnpm test`, `npx tsc --noEmit`, `pnpm next lint --file <changed>`
before done. Lucide icons, never emoji. No PPP jargon in rendered strings. Minimal
diffs; read the CURRENT state of `VideoLessonClient.tsx` first — multiple agents have
touched it (sample-by-default, `?v=`/`?url=` params, auth-aware CTA all exist).
**Do NOT touch the preview API or generation prompt — every change here is
presentational.** The cache already holds seeded previews; a schema change would
orphan them. When the owner says "push", commit straight to main.

## Verified facts

1. `VideoLessonClient.tsx`: result URL already becomes shareable
   (`window.history.replaceState(..., '/video-lesson?v=' + videoId)` on build) — but
   there is NO visible share button. CTA (`handleCta`) is already auth-aware.
2. `PreviewResponse` already includes `stageLabels: string[]` (from the preset,
   server-side) and `transcriptUsed: boolean` — both currently underused.
3. Preview content is fixed: `hook`, `suggestedLevel`, `keyVocab[6]` (word /
   definition / example), `comprehensionQuestions[3]`, `discussionPrompts[2]`.
   Examples and questions contain literal `*word*` emphasis markers from the AI
   (the prompt asks for them) — currently rendered RAW with asterisks visible.
4. `getFeaturedRoute()` (`src/lib/discovery-shelves.ts`) is client-safe static data:
   `{ label, kind, phase }[]` for the 9 Captain's Flight stages. The landing hero and
   `MarketingRouteStrip` already consume it on logged-out pages.
5. Next.js `opengraph-image.tsx` files canNOT read searchParams. Dynamic per-video OG
   requires `generateMetadata({ searchParams })` in `page.tsx` pointing
   `openGraph.images` at an image route (see Task 3).
6. YouTube thumbnails are constructable from videoId alone:
   `https://i.ytimg.com/vi/{id}/hqdefault.jpg`.

## Task 1 — From worksheet to lesson: stage-mapped content (the core change)

Restructure the result section. Replace the monospace "THE LESSON, STAGE BY STAGE"
text row and the flat content lists with the lesson rendered AS a lesson:

1. **Route visual:** render the 9-stage route with `MarketingRouteStrip` (it fits
   this narrower column better than the full `LessonCaptainFlightPlan`; route from
   `getFeaturedRoute()`, not from the API's string labels). Mobile keeps a compact
   form (the strip already handles small widths — verify at 390px).
2. **Stage-grouped content** beneath it, in lesson order. Attach the REAL generated
   content to the stage where it lives, and mark the rest honestly as
   generated-at-launch:
   - **Warm-up** → locked chip: "3 prediction questions about this video —
     generated when you fly it"
   - **Briefing** → the video itself: compact thumbnail card + "watch together,
     then check understanding" + the 3 `comprehensionQuestions`
   - **Language Toolkit** → the 6 `keyVocab` cards ("from this video's transcript")
   - **Opinion Pulse / Explore / Accuracy Check** → one combined locked chip row:
     "class vote · student questions · error-hunt round — built from this video at
     launch"
   - **Main Discussion** → the 2 `discussionPrompts`
   - **Review Game / Wrap-up** → locked chip: "quiz built from today's vocabulary +
     class wrap-up"
   Locked chips use a small lock icon + muted styling — they SELL the full product
   ("there's more than what's free here") while staying truthful: never render fake
   content as if generated. Real content sections keep their current substance
   (vocab cards, question list styling) — they move and get stage headers, they
   don't get rewritten.
3. **Honesty rule:** the mapping above is presentational framing of the standard
   Captain's Flight structure. Don't claim a specific module name will run unless
   the preset actually contains it — check `all-around-flight-60`'s `moduleSequence`
   in `src/lib/flight-plan-presets.ts` and phrase chips from what's really there.

## Task 2 — Animated reveal (the screen-recording moment)

When a build completes, the result should assemble, not appear:

- Route strip lights stage-by-stage (the strip already has a sweep animation —
  trigger it on result mount).
- Stage sections stagger in as the sweep reaches them (framer-motion, ~80ms
  stagger); vocab cards deal in with a slight rise.
- Total choreography under ~2.5s, runs once, respects `useReducedMotion` (instant
  render), and must not re-trigger on the pre-loaded sample (sample renders calm —
  the animation is the reward for the visitor's OWN paste/chip click).

## Task 3 — Share loop

1. **Visible "Copy lesson link" button** in the result header: copies
   `https://lessoncaptain.com/video-lesson?v=<id>` (build from
   `window.location.origin`), `navigator.clipboard` with a fallback, "Copied ✓"
   state. Lucide `Link`/`Check` icons.
2. **Dynamic per-video OG card:** add `generateMetadata({ searchParams })` to
   `src/app/(public)/video-lesson/page.tsx` — when `?v=` is present, look up the
   cached preview server-side (`getCachedContent('video-lesson-preview', videoId,
   'Intermediate')` — CACHE ONLY, never generate in metadata) for the real title;
   point `openGraph.images` at a new edge image route (e.g.
   `/api/og/video-lesson?v=<id>`) that composes: video thumbnail (fact #6) +
   "A 9-stage live English lesson" framing + brand. No cached preview → fall back
   to the existing static OG export untouched. Check how the existing static
   `opengraph-image.tsx` and `generateMetadata` interact — the dynamic images entry
   must override it only when `?v=` resolves.
3. Why this matters (context, not a task): a teacher sharing their own video's
   lesson into a Facebook group is this page's viral mechanism — the unfurled card
   must look like a lesson, not a generic site link.

## Task 4 — Locked section: show, don't tell

Replace the text-only locked box with a visual: a blurred/frosted mini-leaderboard
(3 believable demo rows — reuse the name style from the landing TwoScreensSection)
plus a small student-phone outline mid-answer, behind a lock badge. Keep the current
heading + CTA copy ("Sign up free and fly this lesson" is good). No real session
code — hardcoded mock, consistent with TwoScreensSection's approach.

## Task 5 — Polish batch (one commit)

1. **Asterisk parser:** tiny helper that renders `*word*` as a styled `<em>`
   (accent color, no italics needed) in vocab examples + comprehension questions.
   Handle unmatched `*` gracefully (render literally). Unit-test the parser.
2. **Demote the thumbnail:** the result header's video thumbnail shrinks to a
   compact card (e.g. ~200px wide beside title/level/hook on desktop, smaller and
   centered on mobile). The lesson content must out-weigh the YouTube content
   visually (locked rule — see memory: video demo is an entry point, not the
   identity).
3. **Transcript trust line:** when `transcriptUsed` is true, a small line under the
   title: "Built from this video's transcript." When false, keep the existing
   "based on the video's topic" note.
4. **Scroll CTA:** a slim sticky bottom bar (or floating button) appearing after
   the visitor scrolls past the vocabulary section, repeating the primary CTA —
   dismissible, never overlapping the locked-section CTA when it's in view.

## Verification

- tsc + lint + tests (including the new parser test).
- Screenshots: full result page desktop + 390px mobile; the reveal animation as a
  short capture if your tooling allows; the OG image rendered for one seeded chip
  video (hit the image route directly).
- Confirm the pre-loaded sample still renders instantly with no animation, and that
  `?v=` shared links land on a fully-rendered preview with the dynamic OG title.
