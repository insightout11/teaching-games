# LessonCaptain Copy Fixes — Implementation Plan

**Status:** Ready for implementation
**Created:** 2026-08-02
**Scope:** Fix the issues found in the review of the recent LessonCaptain copy pass, harden the demo-session validation change, and reconcile the three deterministic baseline test failures discovered during validation.
**Mode:** Product code changes are not part of this planning pass.

## Outcome

After this work:

- Teacher-facing labels describe the destination or state they actually control.
- `lesson`, `activity`, `stage`, `Teacher Cockpit`, `Control Room`, `Design Mission`, and source terminology follow one system.
- Aviation language provides framing without obscuring actions, billing limits, or requirements.
- Mock mode accepts named demo sessions but still rejects missing session IDs.
- Type-checking, linting, and the full test suite are green.

## Locked copy decisions

Use these decisions during implementation; do not reopen them file by file.

| Concept | Canonical copy | Notes |
| --- | --- | --- |
| Live private controls | Teacher Cockpit | Use only for the live teacher-control surface. |
| Post-session analytics | Control Room | Never label a Control Room link as Teacher Cockpit. |
| Whole class session | lesson | Aviation language may frame a transition or celebration, but should not be the sole functional label. |
| Student-facing task | activity | Keep `module` only in internal identifiers and types. |
| Pedagogical purpose | stage | Warm-up, Teach, Practice, Use, Wrap-up. |
| State inside one activity | activity status | Do not call lifecycle values such as `voting` or `reveal` a stage. |
| Finish control | Finish Lesson | Use consistently on the primary final action. |
| World Flight challenge | Design Mission | Keep internal `mission` identifiers where renaming would add risk. |
| Source instruction | source, video, reading, built from | Avoid `ground` or `grounding` as the main teacher instruction. |
| Free usage unit | live lesson credit | Keep `Test Flight` as the branded trial/CTA, then explain that each launch uses one live lesson credit. |

Intentional exceptions:

- Keep **Crew Radio** as a paired, explained feature name.
- Keep **crew stars** and celebratory crew language in World Flight rewards.
- Keep genuine narrative uses such as “flight crew” inside Cabin Mystery content.
- Do not rename internal variables, API fields, database columns, component names, or types solely for copy consistency.

## Workstream A — Correct misleading labels

### A1. Restore the correct post-session destination label

File:

- `src/components/session/end-session-summary.tsx`

Change:

- Keep the current `/control-room` route.
- Replace `Open Teacher Cockpit` with `View Control Room`.
- Correct the nearby JSX indentation while touching the block.

Acceptance:

- The button label and destination both describe the post-session analytics report.
- Live Teacher Cockpit links elsewhere continue to use the Teacher Cockpit label.

### A2. Separate activity status from pedagogical stage

File:

- `src/components/session/activity-shell.tsx`

Change:

- Replace the label `Stage:` with `Activity status:`.
- Add a small presentation helper for raw lifecycle values:
  - `idle` → `Ready`
  - `done`, `complete`, or `finished` → `Complete`
  - otherwise replace hyphens with spaces and sentence-case the result.
- Fix the current indentation drift in the label block.

Acceptance:

- Values such as `voting`, `reveal`, and `proposal-collect` are not presented as Flight Plan stages.
- The status remains descriptive only; no activity lifecycle behavior changes.

### A3. Make the launch checklist truthful

File:

- `src/components/planner/review-launch-screen.tsx`

Change:

- Replace the always-checked `Lesson content ready` row with `Content generates during the lesson`.
- Keep its `done: true` value because the row now describes a supported runtime behavior rather than completed generation.
- Preserve the launch gate; do not introduce pre-generation.

Acceptance:

- The review screen no longer implies that generated content already exists.
- Launch behavior and generation timing remain unchanged.

## Workstream B — Finish the canonical terminology sweep

### B1. Standardize final lesson actions

Files:

- `src/components/session/session-view.tsx`
- Any additional user-facing match found by the verification sweep

Change:

- Replace both main `Complete Lesson` button labels with `Finish Lesson`.
- Keep aviation celebration copy such as `You've Landed!` after the teacher finishes.
- Update stale user-facing references or comments only when they describe the renamed control.

Acceptance:

- Every primary final lesson control says `Finish Lesson`.
- `Complete Flight` is not used as the sole final control label.

### B2. Complete the Design Mission rename

Files:

- `src/app/(share)/journey/[shareToken]/page.tsx`
- Any additional user-facing `Flight mission` matches

Change:

- Replace `Flight missions` with `Design missions` on the shared journey statistics.
- Preserve activity-specific `Mission Debrief` wording unless it refers to World Flight Design Missions.

Acceptance:

- World Flight challenges are called Design Missions on teacher, student, and shared/public surfaces.

### B3. Remove remaining teacher-facing grounding instructions

Files:

- `src/components/planner/source-input-panel.tsx`
- Any additional teacher-facing matches found by the verification sweep

Change the two known strings to:

- `Build a lesson from a TED talk, YouTube video, or custom text. Pro feature.`
- `Use one source for the briefing, vocabulary, quick checks, and discussion.`

Do not alter technical comments or generation concepts where `grounding` has a precise internal meaning.

Acceptance:

- Teachers are told to add or use a source; they are not required to interpret `grounding` as an action.

### B4. Use lesson for session counts

File:

- `src/components/class/class-list.tsx`

Change:

- Render `lesson`/`lessons` from the existing `summary.flightCount` value.
- Prefer `last lesson:` over the ambiguous `last:` label.
- Keep internal `flightCount` and `formatLastFlight` identifiers unchanged.

Acceptance:

- Class cards use `students` and `lessons` for operational information.
- Aviation remains in the card visuals and World Flight progression rather than obscuring the count.

### B5. Resolve live lesson credit versus Test Flight

Primary files:

- `docs/lessoncaptain-copy-system.md`
- `src/components/ui/credit-badge.tsx`
- `src/components/ui/paywall-modal.tsx`
- `src/components/planner/review-launch-screen.tsx`
- `src/components/explore/ExploreClient.tsx`
- `src/components/discovery/TeacherHomeClient.tsx`
- `src/components/discovery/FeaturedFlightLaunchModal.tsx`
- `src/components/discovery/DiscoveryDetailDrawer.tsx`
- `src/components/planner/source-input-panel.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(public)/pro/page.tsx`
- Homepage pricing/trial surfaces containing `Test Flight credit`

Rules:

1. Use **live lesson credit** for counters, limits, paywalls, and entitlement explanations inside the product.
2. Keep **Test Flight** as the branded free-trial experience and CTA.
3. At the first relevant marketing explanation, state: `Each Test Flight uses one live lesson credit.`
4. Update the copy guide's first-use definition to define Test Flight as the experience, not the usage unit.
5. Do not change entitlement logic, RPC names, credit consumption, prices, or plan limits.

Acceptance:

- A teacher can understand exactly what one credit buys without decoding the aviation metaphor.
- `Test Flight credit` is no longer used as a competing canonical unit.
- Marketing can still say `Start a Test Flight`.

## Workstream C — Harden the mock-session route

File:

- `src/app/api/session/captain-suggestions/route.ts`

Required guard:

```ts
if (!sessionId || (!isMockMode && !UUID_RE.test(sessionId))) {
  return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
}
```

Behavior:

- Production: require a non-empty UUID.
- Mock mode: require a non-empty ID, but allow named IDs such as `live-demo`.

Tests:

- Add route-level coverage following existing API-test mocking patterns.
- Mock mode + `live-demo` → success.
- Mock mode + empty/missing ID → 400.
- Non-mock mode + non-UUID ID → 400.
- Non-mock mode + valid UUID continues to the ownership path.

Acceptance:

- The demo cockpit remains free of the `Invalid sessionId` alert.
- Mock mode no longer hides missing-ID client defects.

## Workstream D — Reconcile deterministic baseline test failures

These failures are not caused by the copy diff. Keep them in a separate commit or clearly separated patch section.

### D1. Captain Suggestions fallback expectation

Files:

- `src/lib/captain-suggestions.ts`
- `src/lib/captain-suggestions.test.ts`

Diagnosis:

- The implementation intentionally returns two questions plus one poll when no submissions exist.
- The test still expects one question plus one poll and then indexes the poll at position 1.

Plan:

- Preserve the current fallback behavior.
- Update the test to expect `['question', 'question', 'poll']`.
- Assert both question prompts are useful and assert poll options at index 2.

### D2. Opinion Shift degraded test

Files:

- `src/lib/landing-generators.ts`
- `src/app/api/landing/generate/route.ts`
- `src/__tests__/api/landing-generate.test.ts`

Diagnosis:

- `generateOpinionShift` is deliberately static and synchronous; it does not call the mocked AI function.
- The test claims AI failure should force degraded fallback, but that code path is never entered for Opinion Shift.

Plan:

- Preserve the deliberate non-AI generator.
- Rename/rewrite the test to assert a successful normal response even when AI is unavailable.
- Expect `degraded` to be absent or false and assert the neutral `Before today…` / `Now I think…` prompts.
- Keep degraded fallback coverage for the activities that actually call AI.

### D3. Functional English composer invariant

Files:

- `src/lib/planner-compose.test.ts`
- `src/lib/planner-compose.ts` only if investigation disproves the diagnosis

Diagnosis:

- The failing goal is `functional-english`.
- Its selected Trip Around preset contains `trip-*` activities that are intentionally outside `FLIGHT_PLAN_ITEMS`.
- The test checks only `getFlightPlanItem(...).goalFit`, so a valid functional-English preset appears to have no goal match.

Plan:

- Preserve the current Trip Around composition.
- Update the test so off-config, preset-owned activities are validated through the selected preset goal.
- Add an explicit assertion that Functional English composes the intended Trip Around activity family.
- Do not add broad metadata or alter composer selection unless a separate product requirement demands it.

Acceptance for Workstream D:

- The corrected tests describe current intentional behavior.
- No production behavior is changed merely to satisfy stale assertions.
- `pnpm test` passes all 424 tests currently discovered by the suite.

## Recommended implementation order

1. Apply A1–A3: misleading labels and states.
2. Apply B1–B4: bounded terminology corrections.
3. Resolve B5 as one coordinated credit-copy pass.
4. Apply C: route guard plus route tests.
5. Apply D in a separate patch section or commit.
6. Run the source sweeps and automated validation.
7. Browser-check the teacher journeys in mock mode.

This order keeps low-risk copy fixes separate from route behavior and unrelated baseline-test reconciliation.

## Verification checklist

### Source sweeps

Run targeted searches and classify every match rather than blindly replacing internals:

```powershell
rg -n -i "Open Teacher Cockpit|Complete Lesson|Complete Flight|Flight missions?|Test Flight credits?|live lesson credits?|Ground your lesson|Ground the briefing|crew member|Crew Console|Crew Tools|Next Module|Next Item|End Module" src docs/lessoncaptain-copy-system.md
rg -n -i "Teacher Cockpit|Control Room|Design Missions?|Finish Lesson|Activity status" src
```

Expected exceptions should be documented in the hand-off summary.

### Automated validation

```powershell
pnpm exec tsc --noEmit --pretty false
pnpm lint
pnpm exec vitest run src/lib/captain-suggestions.test.ts src/__tests__/api/landing-generate.test.ts src/lib/planner-compose.test.ts src/lib/mock/client.test.ts
pnpm test
git diff --check
```

Expected result:

- TypeScript passes.
- Lint passes; do not introduce warnings beyond the three existing React-hook warnings.
- Full suite: 68 files and 424 tests pass, unless the suite count legitimately changes with added route tests.
- No whitespace errors; line-ending notices may remain on existing Windows files.

### Browser acceptance

In mock mode, verify:

1. Planner review screen:
   - truthful runtime-generation checklist copy;
   - `Finish Lesson` terminology is reflected downstream;
   - credit copy is plain and consistent.
2. Live session:
   - activity status is readable;
   - final action says `Finish Lesson`.
3. End summary:
   - `View Control Room` opens the Control Room report.
4. Demo cockpit at `/sessions/live-demo/cockpit`:
   - suggestions load without `Invalid sessionId`;
   - empty-ID API requests still fail in route tests.
5. Classes page:
   - cards count students and lessons.
6. World Flight shared journey:
   - Design Mission terminology matches the main World Flight UI.

## Guardrails

- Preserve unrelated changes in the dirty worktree.
- Use `apply_patch` for edits.
- Do not rename internal `module`, `crew`, `mission`, `flightCount`, or callsign identifiers without a functional reason.
- Do not change billing behavior, entitlements, prices, or credit consumption.
- Do not change the Control Room route to make an incorrect label appear correct.
- Do not add AI generation to Opinion Shift.
- Do not stage, commit, push, open a pull request, deploy, or modify external services without explicit approval.

---

## Hand-off note for the implementing agent

Copy the following into the implementation task:

> Implement `docs/lessoncaptain-copy-fixes-implementation-plan.md` in `C:\Users\insig\Documents\teaching-games`.
>
> The goal is to finish the LessonCaptain terminology pass without weakening the useful aviation theme. Plain language must describe actions, destinations, requirements, and billing; aviation language should frame location, progression, and celebration.
>
> Work through Workstreams A–D in order. Key decisions are locked: Teacher Cockpit is live controls; Control Room is post-session analytics; activity lifecycle values are `Activity status`, not stages; the final action is `Finish Lesson`; World Flight challenges are Design Missions; counters and limits use `live lesson credit`, while Test Flight remains the branded trial/CTA; source instructions should say add/use/build from a source rather than grounding.
>
> Preserve internal identifiers and unrelated worktree changes. The only intended behavior change is the mock-session guard: named mock IDs such as `live-demo` remain valid, but empty IDs must return 400. Add route-level tests for that contract.
>
> Reconcile the three deterministic baseline tests separately: update the Captain Suggestions expectation to two questions plus a poll; update Opinion Shift coverage to reflect its intentional non-AI generator; update the Functional English composer invariant to recognize the preset-owned `trip-*` activity family. Do not change production behavior just to satisfy stale assertions.
>
> Validate with TypeScript, lint, focused tests, the full test suite, `git diff --check`, and mock-mode browser checks. Report exact files changed, intentional terminology exceptions, test totals, and any remaining warnings. Do not stage, commit, push, open a PR, or deploy without explicit approval.
