# Critical issues audit — brief for Codex (Astra)

Written 13 October 2026. **Read and report only.** Claude will verify each finding and make any changes afterwards.

## What this is for

LessonCaptain is about to be used by real teachers with real classes of children and teenagers. Find the small number of problems that would seriously hurt a teacher, a student or the owner. Nothing else.

The product: a teacher signs in with Google and shares one screen. Students join from phones with a code, with no account. Lessons call paid AI services. There is a free limit of 4 lessons a month and a Pro tier.

## The bar for a finding

Report a problem only if you can show, from the code, that it leads to one of these:

1. **Someone sees or changes data that is not theirs.** One teacher reaching another teacher's classes, sessions, students, notes or books. A student or anonymous visitor reading or altering another session. Children's names or answers readable by the public.
2. **Someone can run up the owner's bill.** An AI, speech, transcript or upload route that can be called without signing in, without a limit, or in a loop.
3. **A live lesson breaks or loses its work** with a normal class of 2 to 30 students: stuck screens, lost answers, a lesson that cannot end, rewards counted twice or not at all.
4. **Someone is locked out, or data is destroyed** and cannot be recovered.
5. **A paid limit can be bypassed** by a simple client-side change.

If a problem does not reach that bar, leave it out. Do not report: code style, naming, refactors, missing tests, dependency versions, accessibility, small performance points, unused code, theoretical attacks that need the attacker to already hold a teacher's Google account or the service key, or anything in files that are not reachable from production.

**At most 10 findings.** Fewer is better. If you find nothing critical in an area, say so in one line.

## Where to look, in this order

1. **Database access rules.** Read every `supabase/migrations/*.sql` for row-level security. List each table that anonymous visitors can read or write, and say exactly what a stranger holding only the public anon key could read or change. `session_private_state` is public-read by design and must never hold names or individual answers: check that every writer honours this. Note that `sessions` has no `teacher_id`; ownership runs through `sessions.class_id → classes.teacher_id`.
2. **Server routes that use the service-role client** (`src/lib/supabase/service.ts`). This client bypasses the access rules, so the route itself must check who is asking. For each route under `src/app/api/` that uses it, confirm that it checks the signed-in teacher owns the class or session it touches, or that the student really belongs to that session. Report routes that take an id from the request and trust it.
3. **Student routes.** Students have no accounts. Check what identifies a student, and whether one phone can submit answers, scores or votes as another student, join a session it was not invited to, or read another class.
4. **Routes that cost money.** Everything that calls `src/lib/ai`, `/api/tts`, the transcript service (Supadata), source extraction, book upload and scanning, and everything under `src/app/api/public/`. For each: who can call it, what stops repeated calls, and what the worst-case cost of abuse looks like. Also check the source extractor for fetching arbitrary addresses on the server (internal addresses, cloud metadata).
5. **The free limit and Pro gating.** Is the 4-lessons-a-month count and every Pro-only feature enforced on the server, or only hidden in the interface? The Stripe code is built but not live: check the webhook verifies its signature, and nothing else about billing.
6. **Live lesson correctness under a real class.** `src/components/session/`, the student polling and submit path, timers, ending a session, and the World Flight reward path (`record_world_flight_reward`, `finish_world_flight_session`, `src/app/api/session/[sessionId]/room-leg/`, `world-flight/`). Look for double-counted rewards on retry or refresh, races when many students submit at once, and states the teacher cannot get out of.
7. **Things that should not be reachable in production.** `src/app/dev/` routes, mock mode (`NEXT_PUBLIC_MOCK_MODE`), debug endpoints, and any secret that reaches the browser bundle.
8. **Content shown on the shared screen.** Any place that renders text from a student, a pasted source or the AI as raw HTML.
9. **Sign-in.** Read only. Check the `next=` redirect after login cannot send a teacher to another site. Do not propose rewrites of the sign-in or callback code.

## Before you report a finding, prove it

- Trace the whole path: the request, the check that is missing, and the data or cost that is reached. Quote the file and line for each step.
- Check whether something else already blocks it (middleware, a database rule, a limit elsewhere). Many apparent holes are closed one layer down.
- If you could not confirm a step, say so and mark the finding "unconfirmed". An unconfirmed finding is welcome; a confident wrong one wastes a day.

## Rules

- Work from `origin/main` in your own worktree. The main checkout is far behind: do not use it.
- Change no application code, no data files, no migrations. Do not install packages.
- Make no writes to the production database and send no test attacks at the live site. Reading the live access rules is fine if you already have read access; never print or copy a key.
- Do not write fixes. For each finding give one or two sentences on the smallest change that would close it. No new systems, layers or libraries.

## The report

Write `docs/critical-audit-report.md` on a branch `codex/critical-audit`. Commit locally. No push, no merge.

For each finding, most serious first:

- **Title** in plain words.
- **Which of the five harms** it causes, and who is affected.
- **How it happens**: numbered steps a real person would take, with file and line for each.
- **Evidence**: the exact code that should have stopped it and does not.
- **Confidence**: confirmed, or unconfirmed with what is missing.
- **Smallest fix**: one or two sentences.

End with two short lists: areas you checked and found sound, and areas you did not get to.
