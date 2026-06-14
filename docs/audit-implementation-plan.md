# Audit Implementation Plan — June 2026

Source: `docs/audit-jun2026.md`. Tasks ordered by **(ease of fix × importance)** — top of the list is the best ratio. Each task is self-contained and written so it can be handed to a model/dev with no other context. Do them in order unless noted.

**Global rules for every task:**
- Run `pnpm test` and `npx tsc --noEmit` before considering a task done.
- Run `pnpm next lint --file <each changed file>` (Vercel build fails on ESLint errors that tsc misses).
- Do NOT refactor surrounding code; make the minimal change described.
- Schema facts: `sessions(id, class_id, status, started_at, ended_at)` — ownership is `sessions.class_id → classes.teacher_id` (there is NO `sessions.teacher_id`). Verify any other column by reading the relevant `supabase/migrations/*.sql` CREATE TABLE block before querying it.

---

## Task 1 — Repo hygiene (Effort: trivial · Importance: low-medium)

**Problem:** A file named `nul` in the repo root (Windows artifact, breaks tooling), untracked dev logs, and `supabase/.temp/linked-project.json` heading toward commit.

**Steps:**
1. Delete the `nul` file. On Windows PowerShell: `Remove-Item "\\?\C:\Users\insig\Documents\teaching-games\nul"`.
2. Add to `.gitignore`:
   ```
   # local dev logs / scratch
   *.err.log
   .dev-server*.log
   .world-flight*.log
   tmp/
   .playwright-cli/
   supabase/.temp/
   nul
   ```
3. If `supabase/.temp/cli-latest` is tracked (it shows as modified), run `git rm -r --cached supabase/.temp` so the ignore takes effect.

**Acceptance:** `git status` no longer shows the log files, `tmp/`, `.playwright-cli/`, or `supabase/.temp/`; `nul` is gone from the repo root.

---

## Task 2 — Fix `/api/student/join` cross-class write + roster flooding (Effort: small · Importance: HIGH — security)

**File:** `src/app/api/student/join/route.ts`

**Problem (3 parts):**
1. Shape A (join with `studentId`): the route updates `students.avatar_seed` and reads the student **without verifying the student belongs to `session.class_id`**. Anyone with any active sessionId can modify/join as students from other teachers' classes.
2. Shape B (join with `newName`): creates students with no cap — anyone with a join link can flood a teacher's permanent roster.
3. `avatarSeed` is accepted at any length.

**Steps (non-mock path only; leave the `NEXT_PUBLIC_MOCK_MODE` branch alone):**
1. Validate `avatarSeed`: after the existing `const seed = ...` line, clamp it: if `seed.length > 32`, return 400 (`{ error: 'Invalid avatarSeed' }`).
2. Shape A: change the student SELECT to filter by class, and run it BEFORE the avatar update:
   ```ts
   const { data: student } = await supabase
     .from('students')
     .select('id, name')
     .eq('id', studentId)
     .eq('class_id', session.class_id)   // ← the fix
     .single();
   if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
   // only now update avatar_seed for student.id
   ```
3. Shape B: before inserting a new student, count students in the class:
   ```ts
   const { count } = await supabase
     .from('students')
     .select('id', { count: 'exact', head: true })
     .eq('class_id', session.class_id);
   if ((count ?? 0) >= 100) return NextResponse.json({ error: 'Class roster is full' }, { status: 400 });
   ```
   (Cap = 100. Only applies to the *insert new student* branch — the existing-name match branch is unaffected.)

**Acceptance:**
- Joining with a `studentId` that belongs to a different class returns 404 and does NOT update that student's row.
- A class with 100 students rejects new-name joins with 400 but still allows roster-pick joins.
- `avatarSeed` longer than 32 chars returns 400.
- Existing happy paths unchanged (roster pick, new name, repeat join with same name). `pnpm test` passes.

---

## Task 3 — Auto-expire stale sessions (Effort: small · Importance: HIGH — security)

**Problem:** Student-facing routes gate on `session.status === 'active'`, but sessions never expire. A forgotten session is a permanently open anonymous write endpoint (joins, submissions, votes).

**Approach (no cron needed):** treat sessions older than 12 hours as inactive at read time.

**Steps:**
1. Create `src/lib/session-freshness.ts`:
   ```ts
   export const SESSION_MAX_AGE_HOURS = 12;
   export function isSessionStale(startedAt: string | null): boolean {
     if (!startedAt) return false;
     return Date.now() - new Date(startedAt).getTime() > SESSION_MAX_AGE_HOURS * 60 * 60 * 1000;
   }
   ```
2. In each student-facing route that checks `session.status !== 'active'`, add `started_at` to the session SELECT and treat stale as inactive:
   - `src/app/api/student/join/route.ts`
   - `src/app/api/student/submit/route.ts`
   - `src/app/api/student/vote/route.ts`
   - `src/app/api/class-questions/vote/route.ts`
   - `src/app/api/wonder-board/submit/route.ts` and `wonder-board/vote/route.ts`
   - `src/app/api/waiting-tips/generate/route.ts`
   Pattern: `if (session.status !== 'active' || isSessionStale(session.started_at)) { return <existing inactive response>; }`
3. Do NOT auto-end the session in the DB from these routes (read paths shouldn't write). Optionally (separate, skippable): a `scripts/` cleanup script that sets `status='ended', ended_at=now()` for active sessions older than 24h, to be run manually or via Supabase scheduled function.

**Acceptance:** A session row with `started_at` 13 hours ago and `status='active'` is rejected by join/submit/vote with the same response shape as an ended session. Fresh active sessions behave exactly as before. Unit test for `isSessionStale` added under `src/__tests__/lib/`.

---

## Task 4 — Per-teacher AI generation rate limit (Effort: medium · Importance: CRITICAL — cost abuse)

**Problem:** All per-round generate routes (`vocab-sprint/generate`, `synonym-showdown/generate`, etc.) call `requireAuth()` only — any free authenticated account can make unlimited AI calls. The planned "40 AI calls/week" backstop from `PRO_TIER_PLAN.md` was never implemented.

**Approach:** add a rolling-window counter checked inside the auth helper so every generate route is covered with one change. Pro/developer accounts are exempt.

**Steps:**
1. New migration `supabase/migrations/036_ai_usage.sql`:
   ```sql
   create table public.ai_usage (
     id uuid primary key default gen_random_uuid(),
     teacher_id uuid not null references public.teachers(id) on delete cascade,
     created_at timestamptz not null default now()
   );
   create index ai_usage_teacher_window on public.ai_usage (teacher_id, created_at desc);
   ```
   (Check `supabase/migrations/001_initial_schema.sql` for the actual teachers table name/PK before writing the FK — if the table is not `public.teachers`, adapt.)
2. In `src/lib/auth-credits.ts` add:
   ```ts
   const FREE_WEEKLY_AI_CALLS = 200; // generous; per-round calls are cheap — this stops scripts, not teachers

   export async function checkAndRecordAiUsage(teacher: AuthedTeacher): Promise<NextResponse | null> {
     if (teacher.isPro || teacher.isDeveloper) return null;
     const service = createServiceClient();
     const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
     const { count, error } = await service
       .from('ai_usage')
       .select('id', { count: 'exact', head: true })
       .eq('teacher_id', teacher.id)
       .gte('created_at', weekAgo);
     if (error) { console.error('ai_usage count error:', error); return null; } // fail open, but logged
     if ((count ?? 0) >= FREE_WEEKLY_AI_CALLS) {
       return NextResponse.json(
         { error: 'Weekly free AI limit reached. Upgrade to Pro for unlimited generation.', code: 'AI_LIMIT_REACHED' },
         { status: 429 }
       );
     }
     await service.from('ai_usage').insert({ teacher_id: teacher.id });
     return null;
   }
   ```
   IMPORTANT: `requireAuth()` returns `isPro: false` always (it doesn't hit the DB). So `checkAndRecordAiUsage` must look up tier itself: call `get_teacher_credits` RPC first (same pattern as `requireAuthWithCredits`) and skip the limit when `is_pro` or `is_developer`. Cache nothing; keep it simple.
3. Wire it into every generate/evaluate route that calls `generateJSON` and currently uses bare `requireAuth()`. Find them: `grep -rl "requireAuth()" src/app/api`. In each, after the auth check:
   ```ts
   const limited = await checkAndRecordAiUsage(teacher);
   if (limited) return limited;
   ```
   Place it AFTER the cache check where one exists (cache hits must not consume budget) — e.g. in `vocab-sprint/generate`, insert after the `if (cached)` early return.
4. Client handling: the session view already handles error responses from generate calls; ensure a 429 with `code: 'AI_LIMIT_REACHED'` surfaces the paywall modal (`src/components/ui/paywall-modal.tsx`) rather than a generic error. If wiring this is complex, a readable toast/error message is acceptable for v1.

**Acceptance:** A non-pro teacher's 201st AI call inside 7 days returns 429 with `code: 'AI_LIMIT_REACHED'`; cache hits don't count; Pro/developer accounts unaffected; all existing tests pass plus a new test for `checkAndRecordAiUsage` (mock the supabase chain: `select → eq → gte` resolving `{ count }`).

---

## Task 5 — Server-gate Pro modules + harden vote dedup (Effort: medium · Importance: medium-high)

Two smaller security closures, can be one PR.

**5a. Pro per-round routes are UI-gated only.** `grammar-boss/generate|evaluate` and `story-sprint/*` routes accept any authenticated user. In each, replace `requireAuth()` with `requireAuthForGeneration({ requestHasProModules: true })` (already exists in `src/lib/auth-credits.ts` — returns 403 `PRO_REQUIRED` for non-pro). NOTE: teachers with onboarding credits but no subscription will now be blocked by `requireAuthForGeneration` — check how `lesson-plan/generate` treats credit-holders and mirror that (credit-holders should be allowed; if needed use `requireAuthWithCredits` + `consumeCredit` instead).

**5b. Vote inflation.** `class-questions/vote` and `wonder-board/vote` dedupe on client-minted `client_id`, so a student can vote repeatedly with fresh UUIDs. Fix: before accepting a vote, verify the `client_id` exists in `session_participants` for that session:
```ts
const { data: participant } = await supabase
  .from('session_participants')
  .select('client_id')
  .eq('session_id', sessionId)
  .eq('client_id', clientId)
  .maybeSingle();
if (!participant) return NextResponse.json({ error: 'Join the session first' }, { status: 403 });
```
Check first (read the student controller flow in `src/components/student/student-controller.tsx`) that voting students have always joined via `/api/student/join` — if anonymous voting without join is an intended flow anywhere, skip 5b and note why.

**Acceptance:** Non-pro request to grammar-boss/story-sprint generate returns 403/402 (not content); a vote with a `client_id` not in `session_participants` returns 403; votes from joined students work as before.

---

## Task 6 — Stripe self-serve checkout (Effort: large · Importance: CRITICAL — business)

**Problem:** Pricing page advertises $79/yr (launch, list $99) / $12/mo, but `/pro` (`src/app/(public)/pro/page.tsx`) ends in a `mailto:`. No revenue can be collected.

**Scope (keep minimal):**
1. Stripe products: `pro_yearly` ($79/yr) and `pro_monthly` ($12/mo). Keys in env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. `POST /api/billing/checkout` — auth required (`requireAuth`), creates a Stripe Checkout Session (`mode: 'subscription'`, `client_reference_id: teacher.id`, success/cancel URLs back to `/home?upgraded=1` and `/pro`), returns `{ url }`.
3. `POST /api/billing/webhook` — verifies signature with `STRIPE_WEBHOOK_SECRET` (use `stripe.webhooks.constructEvent` on the RAW body — in Next 14 route handlers use `await request.text()`, NOT `request.json()`). Handle:
   - `checkout.session.completed` → set `subscription_status = 'active'` + store `stripe_customer_id` / `stripe_subscription_id` on the teacher row (these columns already exist in the schema — verify names in migrations before writing).
   - `customer.subscription.deleted` / `customer.subscription.updated` with non-active status → set `subscription_status` accordingly.
   Use `createServiceClient()` for the DB writes.
4. `POST /api/billing/portal` — auth required, creates a Stripe Billing Portal session from the stored `stripe_customer_id`, returns `{ url }` (handles cancel/card-update so you don't have to build UI).
5. Update `/pro` page: replace the mailto CTA with two buttons (yearly/monthly) that POST to `/api/billing/checkout` and redirect to the returned URL. Show "Manage subscription" (portal) when `useTeacherTier` reports pro.
6. The entitlement system already keys off `subscription_status = 'active'` (`get_teacher_credits` RPC) — no entitlement changes needed. Verify by reading `supabase/migrations/013_credit_system.sql`.

**Acceptance:** In Stripe test mode: checkout completes → teacher row shows `subscription_status='active'` → `useTeacherTier` reports Pro → Pro modules unlock without manual DB edits; cancelling in the portal flips status back. Webhook rejects requests with bad signatures (400).

---

## Task 7 — Demo session with simulated students (Effort: medium · Importance: high — onboarding/conversion)

**Problem:** The product's core value (live loop) only shows with real students present; a teacher evaluating alone never experiences it.

**Scope:**
1. "Try a demo lesson" button on `/home` for teachers with 0 ended sessions (and always available somewhere discoverable).
2. Clicking creates a real session against a hidden demo class (create per-teacher on demand: class named "Demo Class", flag it — check `classes` schema in migration 001 for a metadata column, or name-prefix `[demo]`).
3. A client-side simulator drives 4 fake students: after the teacher launches a module that broadcasts an InputSpec, the simulator waits 2–6s per fake student and POSTs plausible answers through the real `/api/student/submit` endpoint (use fixed clientId UUIDs per fake student, join them via `/api/student/join` shape B with names like "Demo Mia"). Going through the real endpoints means the realtime/leaderboard path is exercised authentically — do NOT build a parallel fake-data path.
4. Plausible answers: for choice/binary inputs pick randomly with a 70% bias to the first option; for text inputs use a small canned pool per game key (hardcode ~3 generic strings per input type; do not call AI).
5. Banner on the session view: "Demo mode — these students are simulated."

**Acceptance:** A brand-new account can click one button and within 30 seconds see 4 students join, answer a Vocab Sprint round, and populate the leaderboard, with no second device. Demo sessions/classes excluded from Control Room aggregates if trivially possible (name-prefix filter); otherwise note as follow-up.

---

## Task 8 — Public World Flight journey share page (Effort: medium · Importance: high — viral growth)

**Problem:** Class World Flight journeys (migration 035) are visible only to the logged-in teacher. A shareable page turns every class's term into branded marketing parents pass around.

**Scope:**
1. New route `src/app/(public)/journey/[shareToken]/page.tsx` — public, read-only, `noindex` off (we WANT indexing), OG image.
2. Migration: add `share_token uuid default gen_random_uuid()` + `share_enabled boolean default false` to the world-flight journey table (find exact table name in `supabase/migrations/035_world_flight_journeys.sql` — read it first).
3. Teacher toggle "Share journey" on the `/world-flight` page → enables and copies link.
4. Page content (read via `createServiceClient()`, filtered by token + `share_enabled`): class display name (first name/initial only — NO student names anywhere), map of route flown (reuse existing World Flight map components), cities visited with dates, total km, current plane tier. Footer: "Powered by LessonCaptain — live lessons that fly" + signup CTA.
5. OG image via the existing `opengraph-image.tsx` edge pattern (see `src/app/classroom-games/[slug]/opengraph-image.tsx` for the precedent): plane + "Class X has flown 14,230 km".

**Acceptance:** With sharing enabled, an incognito browser renders the journey page from the token URL with zero student PII; disabling the toggle 404s the page; the link unfurls with a custom OG card.

---

## Task 9 — Student take-home debrief link (Effort: medium · Importance: medium-high — retention)

**Problem:** Student results die with the session; nothing reaches parents.

**Scope:**
1. At session end, the student controller already shows personal results (`personalResults` in `GET /api/student/session`). Persist access: generate a per-participant token (add `debrief_token uuid default gen_random_uuid()` to `session_participants` via migration), and show "Save my results" link/QR on the student end screen.
2. New public route `src/app/(public)/debrief/[token]/page.tsx`: looks up participant by token (service client), renders: display name, points, accuracy, best streak, rank, and up to 10 vocab items from the session's reference materials (`src/lib/reference-materials.ts` — reuse the same normalized vocab the session used).
3. Read-only, no session mutation possible from this page; valid for 30 days (compare `sessions.ended_at`).

**Acceptance:** After a session ends, a student can open their debrief URL on another device/day and see their own results + session vocab; tokens from other participants show only that participant's data; links older than 30 days show a friendly expiry message.

---

## Task 10 — Content preview & pinning for teachers (Effort: large · Importance: medium-high — trust/Pro value)

**Problem:** Teachers can't see or edit AI content before it appears live in class.

**Scope (v1, keep tight):**
1. New page `/library/content` (or a tab in the existing library): lists rows from `generated_content` for cacheable game keys, filterable by game/topic/difficulty (read via an authed API route, not client-side service role).
2. Preview renderer per game key: render the `content_json` in a readable card (sentences for vocab-sprint, groups for connections, etc.). A generic JSON-pretty view is the fallback for keys without a custom renderer — ship with custom renderers for vocab-sprint and connections only.
3. Actions: **Regenerate** (calls the existing generate route with `excludeCacheIds=[this id]`) and **Edit** (textarea over the JSON with validation against the game's expected shape before save; save via a new authed `PATCH /api/admin/... `-style route using the service client, teacher-scoped is fine for v1 since content is shared/global — gate the page to `isPro || isDeveloper`).
4. Defer "pin to Flight Plan" to a follow-up; v1 is see + fix.

**Acceptance:** A Pro teacher can browse cached vocab-sprint content for a topic, edit a bad sentence, save, and the next session that hits that cache row serves the edited version.

---

## Task 11 — Productive waiting on the student device (Effort: medium · Importance: medium)

**Problem:** During other students' turns the controller shows static tips — the biggest student-side engagement leak.

**Scope:** When the student controller is in waiting state AND the session has `referenceVocab` (already returned by `GET /api/student/session`), show a self-paced flashcard loop: word → tap to flip → meaning/example, cycling through session vocab. No scoring, no network calls beyond the existing poll. Falls back to current tips when no vocab exists.

**Acceptance:** In a session with reference vocab, a waiting student can flip through vocab cards; when an InputSpec arrives the cards are instantly replaced by the input UI (input must always win); sessions without vocab behave exactly as today.

---

## Suggested batching for cheap models

| Batch | Tasks | Notes |
|-------|-------|-------|
| 1 (same day) | 1, 2, 3 | Small, isolated, testable. Do 2 and 3 as separate commits. |
| 2 | 4, then 5 | Touch `auth-credits.ts` sequentially, not in parallel. |
| 3 | 6 | Needs Stripe test keys from the owner before starting. |
| 4 | 7, 8, 9 | Independent of each other — parallelizable. |
| 5 | 10, 11 | Product polish, after the above. |

Tasks 1–5 are pure hardening (no product decisions needed). Task 6 needs Stripe account setup by the owner. Tasks 7–11 involve light UX judgment — review screenshots before merging.
