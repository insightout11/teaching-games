# LessonCaptain Full Audit — June 2026

**Scope:** API surface (~35 route groups), auth/credit system, middleware, migrations, student and teacher flows, pricing/marketing pages, product direction docs.

**What it is:** a live classroom operating system for online ESL teachers — teacher screen-shares a session view over Zoom, students join from any browser via link, and ~17 games + ~40 activities run on a PPP pedagogy spine with AI-generated, source-groundable content, wrapped in a cohesive aviation theme (Flight Plans, World Flight journeys, Flight Cards, plane progression).

---

## Security & bugs (important ones only)

### 1. Pro is advertised but cannot be purchased — and free AI usage is unbounded
The landing page sells $79/yr / $12/mo, but `/pro` ends in a `mailto:` link ("self-serve checkout coming soon"). Meanwhile the per-round generation routes (`vocab-sprint/generate`, etc.) use `requireAuth()` only — no credits, no rate limit, and the 40-calls/week global backstop from `PRO_TIER_PLAN.md` was never implemented. Any free account (or a script with disposable accounts) can burn the Gemini/OpenAI budget indefinitely. Combined with `requireAuthWithCredits` **failing open** on RPC errors and the known v1.x gaps (Grammar Boss/Story Sprint not server-gated, Standard-topic restriction UI-only), the entire cost-control layer is effectively advisory. Most important fix in the repo: a per-teacher rolling budget check in `requireAuth` closes most of it.

### 2. `/api/student/join` allows cross-class writes and roster flooding
`src/app/api/student/join/route.ts` (Shape A, ~line 124): updates `students.avatar_seed` by raw `studentId` with **no check that the student belongs to the session's class** — anyone holding any active session ID can modify students in other teachers' classes (and join sessions as them). Shape B creates new students with no rate limit or per-class cap, so anyone with a shared join link can flood a teacher's permanent roster with junk names. `avatarSeed` length is also unvalidated. Fix: verify `students.class_id === session.class_id`, cap roster size, length-check the seed.

### 3. Vote counts are trivially inflatable
Class-questions and wonder-board votes dedupe on `client_id`, but the client mints its own UUIDs — a student can upvote one question hundreds of times by regenerating IDs. In-class griefing severity, but it surfaces on the projected teacher screen. Consider per-session-participant dedup (join before vote) or IP-window rate limiting.

### 4. Active sessions are long-lived open write endpoints
Student routes correctly gate on `session.status === 'active'`, but there is no TTL/auto-expiry — a teacher who forgets to end a session leaves a permanently valid anonymous write surface (submissions, roster joins, votes). A cron or `started_at`-based staleness check (e.g. auto-end after 12h) would close it.

### 5. Repo hygiene
A file literally named `nul` sits in the repo root (Windows redirection artifact — breaks some tools and can't be checked out on some systems), a dozen `.dev-server*/.world-flight*` logs are untracked clutter, and `supabase/.temp/linked-project.json` shouldn't be committed. Add to `.gitignore`, delete `nul` (`Remove-Item "\\?\C:\Users\insig\Documents\teaching-games\nul"`).

### Verified solid
Teacher-side session routes verify ownership via `verifyTeacherOwnsSession`; `/api/session/score` whitelists fields and validates the class→teacher chain; student direct submissions insert with `points: 0, counts_for_leaderboard: false` so students can't self-award points; `waiting-tips` looks up topic from the DB instead of trusting the client; middleware guards against `//` open redirects; no secrets in git; admin ingest is bearer-token + allowlist + size-capped.

---

## 5 improvements for teachers

1. **Teacher Remote (phone companion).** The teacher screen is projected, so the teacher has *no private surface* during class. A QR-launched phone view with submissions queue, next/freeze/spotlight, and the answer key would transform live control. Also fixes the structural tension in "never show answers on the teacher screen."
2. **A 2-minute "magic moment" demo with simulated students.** The product's core value (the live loop) only reveals itself with real students present — the worst possible onboarding dependency. A sandbox session where 4 fake students join, answer, and populate the leaderboard lets a teacher *feel* the product alone at 11pm, when they actually evaluate tools.
3. **Content preview & pinning before class.** Teachers distrust unseen AI content appearing live in front of students. The content cache already exists — expose it: preview tomorrow's generated rounds, regenerate or hand-edit items, pin approved sets to a Flight Plan. Converts "AI roulette anxiety" into confidence — the real Pro upsell.
4. **A "time left" re-planner.** Online lessons constantly overrun. A single button — "7 minutes left" — that compresses the remaining Flight Plan into a landing activity addresses the most common live-teaching stress; cheap to build on the existing planner.
5. **Make session artifacts travel.** Control Room data is trapped in the app. One-click outputs — parent-ready progress email, vocab review sheet from the actual session, "what we covered" message for the class group chat — turn every lesson into retention *and* word-of-mouth marketing to the people paying (parents).

## 5 improvements for students

1. **Personal persistent identity.** World Flight gives the *class* persistence; students get nothing across weeks. A lightweight per-student record (plane/avatar rank, vocab mastered, streaks across sessions) keyed to the existing roster is the biggest student retention lever.
2. **A personal take-home debrief link.** After session end, each student's device shows results and dies. A persistent link — what I got right, my best answer, 5 words to review — extends value past the hour and is visible to parents (who fund everything in ESL).
3. **Productive waiting.** During other students' turns the controller shows tips. Replace idle time with micro-practice: flashcards from this session's vocab, or "predict whether they'll get it right" mini-bets. Dead air on the student device is the biggest engagement leak in turn-based modes.
4. **Speaking on the student device.** ESL is spoken-first, yet student devices are entirely tap/type. Even a simple record → teacher plays to class flow would unlock pronunciation rounds and differentiate hard — no quiz competitor touches audio.
5. **Beginner-proof the controller.** A1 students face an English-only UI. L1 hint toggles for instructions (not content), bigger touch targets, reduced-motion, aggressive reconnect tolerance for bad connections (Vietnam, Brazil, rural China — where online ESL actually happens).

## 5 original ideas for the next level

1. **"Paste any YouTube video → live lesson in 60 seconds" as the public demo.** Source grounding and transcript extraction are already built — the hardest part. Make it the front door: a public page where a teacher pastes a video URL and watches a Flight Plan materialize. The most TikTok/Reels-demoable thing the product can do; no competitor does *live* lessons from arbitrary video.
2. **Public World Flight journey pages.** Each class's journey becomes a shareable read-only URL: map, cities visited, kilometers flown, plane evolution. Teachers post it in parent group chats at term end; every share is branded acquisition. Near-zero build cost on top of migration 035.
3. **Flight Plan marketplace with remix counts.** ESL teacher Facebook groups run on shared materials. Shareable Flight Plan links with author attribution and "flown by N classes" counters turn best users into distribution.
4. **Global live events.** "Around the World Week": all participating classes fly the same route, global leaderboard, printable certificates. Scheduled scarcity creates urgency and PR hooks — Gimkit and Blooket grew on event-driven spikes, and the aviation theme makes it coherent.
5. **Student-authored content day.** A review mode where students write the quiz items (AI validates/polishes) and the class plays their own questions. Pedagogically gold (generation effect), produces "my students made this" shareable artifacts, inverts the AI-trust problem into a feature.

---

## Overall rating

- **Visual concept: 8/10.** Aviation theme is distinctive and consistently executed — avoids the generic-edtech look completely. Risk: theme density occasionally fights legibility on dense surfaces.
- **Gameplay: 7/10.** Remarkable breadth (17 games, ~40 activities — more variety than Kahoot). Individual game feel good but not at Blooket/Gimkit's juice level; the differentiator is the orchestrated lesson flow, not any single game. Gap: per-game depth and student-device polish.
- **Teaching: 8.5/10.** Strongest dimension. CEFR-anchored difficulty, structurally enforced (never jargon-exposed) PPP spine, source-grounded content, post-session Control Room. Pedagogically *serious* in a category of pedagogically shallow quiz toys.
- **Versus competitors:** Kahoot/Blooket/Quizizz/Gimkit are quiz layers — massive and polished but generic K-12, not live-lesson-structured. Baamboozle/Wordwall own casual ESL game usage but have no AI, no lesson structure. Twee/Diffit do AI lesson *prep*, nothing live. **Nobody owns "live synchronous online ESL lesson OS"** — a real monetizable niche (Preply/iTalki/Cambly/independent tutors are sole proprietors who buy their own tools). Weaknesses: zero brand/distribution, no free-tier network effect yet, solo-project bus factor, no mobile apps, niche an order of magnitude smaller than K-12.
- **Overall: 7.5/10** — an unusually deep, coherent pre-revenue product whose biggest risks are distribution and the unwired monetization layer, not the product itself.

## MRR outlook

At $79/yr (~$6.60/mo effective) — squarely in the price band ESL teachers demonstrably pay (Baamboozle Premium ~$10/mo, Twee ~$10–25/mo).

- **Months 0–6 after checkout ships:** $300–1,500 MRR (ESL Facebook groups, Reddit, YouTube teacher channels).
- **12–24 months with consistent community marketing:** $3,000–10,000 MRR credible (≈450–1,500 subscribers).
- **Realistic ceiling as teacher-paid B2C:** $20–50k MRR. Beyond requires B2B (online ESL schools/agencies buying seats).

**How to get it higher, in order of leverage:**
1. Ship Stripe checkout now — every week of `mailto:` upgrade is incinerated revenue and corrupted conversion data.
2. Close the free-tier cost holes before any traffic push, or growth literally costs money.
3. Lead marketing with the video→lesson demo, not feature lists.
4. Build the viral surfaces that half-exist (public journey pages, shareable Flight Plans) so retention converts into acquisition.
5. Add an agency/school tier ($25–50/teacher/mo with admin dashboard) — 10 agency deals ≈ 500 individual subscribers.
6. Recruit 10–20 teacher-YouTuber affiliates (30–40% recurring) — the ESL tool market is influencer-driven.
7. Keep annual as the anchor; $12 monthly makes $79/yr look obvious — don't discount further.

**Honest summary:** the product is ahead of the business. Deeper, more pedagogically sound, and more distinctive than most funded edtech seed startups — but no payment rail, open cost-abuse vectors, no distribution engine. The next 90 days should be almost entirely checkout, cost controls, and one repeatable marketing motion, not new modules.
