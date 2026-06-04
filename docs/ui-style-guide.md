# LessonCaptain — Active Product UI Style Guide

**Status:** Adopted living guide. Phase 0 documented the baseline; Phase 1 and Phase A/B add inert primitives and compact-UI decisions before migrations.
**Scope:** Active product UI — dashboard, class pages, planner, control room, session shells, student UI, and games/activities (as expressive runtime surfaces only).
**Out of scope:** `/classroom-games`, `/classroom-activities`, `/worksheets`, `src/components/landing`, and any SEO/catalog page.

This document defines the target conventions for the product UI and the contract that later migration phases reference. Source values cited here reflect the current `globals.css`, `tailwind.config.ts`, and `src/components/ui/*` primitives.

## Phasing (for reference)

| Phase | Scope | Risk |
|---|---|---|
| 0 | Style guide / decisions (this doc) | none |
| 1 | Add primitives unused (additive only) | very low |
| 2 | Exact-match migrations: dashboard / class / planner / control-room | low |
| 2b | Discovery / home shelves | low–med |
| A | Compact UI micro-decisions | none |
| B | Compact primitive variants unused (additive only) | very low |
| 3 | Session shell normalization | medium (projected) |
| 4 | Student UI normalization (mobile screenshots) | high (live devices) |
| 5 | Game/activity chrome (preserve expressive visuals) | medium (per-file) |
| 6 | Optional enforcement (lint) | low — last only |

Migration rules: exact-match only at first; no redesign during migration; primitives land unused first; enforcement comes last. See §11.

---

## 1. Product UI principles

1. **Reduce duplicated chrome, not personality.** Goal is fewer hand-rolled buttons/inputs/panels/status strings — not a uniform look.
2. **Games can stay expressive.** Game/activity *content* visuals (boards, race trackers, score reveals, motion) are intentional and protected. Only incidental, repeated chrome is in scope.
3. **Dashboard / planner / control-room is the canonical product style.** These already use `lc-*` tokens cleanly and define "correct." When in doubt, match them.
4. **Student and session surfaces require extra caution.** Session UI is *projected to the class*; student UI runs *live on phones mid-lesson*. Changes here are screenshot-gated, never mechanical.

---

## 2. Color system

### Existing tokens (`lc-*`)

Defined in `globals.css`, mirrored in `tailwind.config.ts`:

- **Structure:** `lc-bg` `#070B14`, `lc-surface` `#0B1220`, `lc-card` `#101A2E`, `lc-border` `#1C2A44`, `lc-border-subtle` `#132033`
- **Text:** `lc-text` `#EAF1FF`, `lc-text2` `#A9B7D0`, `lc-text3` `#6F7F9C`
- **Brand / interactive:** `lc-blue` `#4DA3FF`, `lc-blue-hover` `#78BCFF`, `lc-blue-glow`
- **Accent:** `lc-amber` `#F59E0B` (+ `lc-amber-glow`, `lc-amber-muted`)
- **Status (today):** `lc-success` `#2FE59B`, `lc-warn` `#F6C177`, `lc-danger` `#FF4D4D`
- A `light` theme overrides structure/text/blue via `html[data-theme="light"]`.

### Semantic statuses (5)

| Status | Token | Notes |
|---|---|---|
| success | `lc-success` | exists |
| warning | `lc-warn` | exists — name kept as `lc-warn` (see Decision 3) |
| danger | `lc-danger` | exists |
| info | `lc-info` *(to add in Phase 1)* | initial value = same as `lc-blue`; kept as its own token so brand blue and info blue can diverge later |
| neutral | usage-only | derive from `lc-text3` / `lc-border-subtle`; no new swatch |

### Raw Tailwind colors — allowed vs discouraged

- **Discouraged** (eventually disallowed) in *chrome*: dashboard, class, planner, control-room, session shells, student input chrome. Use `lc-*` tokens.
  Known offenders to fix during migration: raw `text-emerald-400` / `text-red-400` / `text-yellow-400` status strings in student input; `ring-cyan-500/50` focus rings; inline `rgba(...)` brand colors in `session-view.tsx`.
- **Allowed** inside game/activity *content* (see §10), and for the two *semantic* palette maps that should be tokenized but remain multi-hue: planner slot colors (`flight-plan-screen.tsx`) and control-room avatar colors (`participation-grid.tsx`).

### Expressive accent colors in games/activities

- Free to use vivid hues for game state (winner gold, board cells, etc.).
- Status *meaning* (success/warn/danger) should still read through the semantic tokens so "correct/incorrect" is consistent across games. Expressive ≠ remapping the meaning of green/red.
- Gradients are allowed but should come from the shared `Button variant="game"` once it exists (§6), not be retyped per file.

---

## 3. Typography

Three roles, three fonts (defined in `globals.css`):

- **Body** — Source Serif 4 (`--font-body`), applied on `body`. Default for all reading text, labels, form text. No per-component body-font overrides.
- **Display / `.font-game`** — DM Serif Display italic. Game/section display headers and expressive titles. Used consistently today; keep as-is.
- **Instrument / `.font-instrument`** — IBM Plex Mono **with tabular figures** (`font-feature-settings: 'tnum','zero'`). **Mandatory** for numeric readouts: timers, scores, codes, counts, gauges.

### `font-mono` rule

Raw `font-mono` (Tailwind default mono) is **not equivalent** to `.font-instrument` — it lacks tabular figures, so digits jitter as values change. Replace `font-mono` with `.font-instrument` anywhere it renders numbers/codes/readouts. `font-mono` may remain only for genuinely non-semantic monospace (rare; default is to migrate).

---

## 4. Radius scale

Semantic rules over existing Tailwind steps (no new utilities):

| Use | Radius |
|---|---|
| Controls (buttons, inputs, selects, small chips) | `rounded-xl` (matches Button) |
| Cards / panels | `rounded-2xl` |
| Modals | `rounded-2xl` |
| Pills / avatars / round toggles | `rounded-full` (intentional) |
| Game/runtime content surfaces | larger/expressive allowed; chrome inside games still follows control/card rules |

- **Arbitrary `rounded-[...]`** discouraged in chrome; `rounded-[2rem]` and similar collapse to `rounded-2xl` unless a game content visual specifically needs it.

---

## 5. Surface system

Three idioms today; end-state is one `Surface` component with variants (added Phase 1, alongside `Card` — Decision 5).

| Variant | Implementation | Use for |
|---|---|---|
| `card` | `bg-lc-card rounded-2xl border border-lc-border p-6` (the `Card` component) | Default product surface: dashboard/class/planner/control-room content blocks, list items, settings panels |
| `panel` | `.panel-card` (CSS): navy, blue border, amber L-corners, layered depth shadow, hover glow | Aviation/cockpit selection cards and HUD-styled surfaces |
| `glass` | `.glass` (CSS): translucent white 5%, blur 16, hairline border | Overlays and game/activity runtime panels over busy/animated backgrounds |

**Pattern mapping:** generic dashboard/control-room/planner boxes → `card`; session/cockpit + HUD surfaces → `panel`; game/activity result panels, in-runtime overlays, modals-over-scene → `glass`.

---

## 6. Button system

### Current (`button.tsx`)

Variants `primary | secondary | danger | ghost | game | hero | icon | link`; sizes `sm | md | lg | compact | icon`; `rounded-xl`; token-based; existing variants remain underused (imported in ~11 files vs ~707 native `<button>`).

### Future variants

- **`game`** — encapsulates the expressive gradient CTA (e.g. cyan→blue / yellow→orange) + `hover:scale` motion currently hand-typed in games. One definition; games opt in.
- **Compact command variants** — `hero`, `icon`, `link`, and `size="compact"` support discovery/planner chrome without redesigning it.
- Additional variants remain deferred until migration surfaces a real recurring need (Decision 8).

### Game/runtime button rule

Games use `Button variant="game"` for generic CTAs ("Start round", "Next", "Reveal"). Buttons that are *part of a game's mechanic/identity* are not chrome and are exempt.

### Not normalized yet

- Buttons with bespoke styling that don't map cleanly to a variant — leave until their phase.
- Student and session buttons until Phases 3–4.
- Phase 2 only swaps already-token-matching buttons in dashboard/class/planner/control-room.

---

## 7. Forms

Shared `Input`/`Select`/`Textarea` primitives exist, but most raw controls have not migrated yet (~87 raw controls across ~43 files). Rules embodied by the primitives:

- **Visual baseline:** `bg-lc-surface border border-lc-border rounded-xl`, text `lc-text`, placeholder `lc-text3`. Sizes `sm/md/lg/compact` map to the product density rules.
- **Focus rings:** one rule — the global `:focus-visible` blue outline (`#4DA3FF`, light `#2B8FFF`). Retire ad-hoc rings like `ring-cyan-500/50`.
- **Disabled:** `opacity-50` + `pointer-events-none` (matches Button), consistent across all controls.
- **Validation / status text:** a `StatusText` mapping success/warn/danger/info → tokens. Replaces raw `emerald/red/yellow-400` status strings (e.g. student input "Signal sent / failed / Stand by").
- **Select:** a real Select primitive removes the need for the global `select option { background:#1e293b }` hack.

---

## 8. Badges / chips / status

Consolidate inline `bg-X-500/20 text-X-300` pills into a small set. Single `Badge` component with a `tone` prop + `variant` + `size` (Decision 6); readout style via `.font-instrument`.

- **Status badge** — success/warning/danger/info/neutral, token-driven. "Demo Mode," "Pro," answered/published states.
- **Skill / category chip** — neutral chip for tags, slot types, categories. Planner `SLOT_COLORS` becomes a tokenized chip palette (semantic, multi-hue, single source).
- **Score chip** — game score readout using `.font-instrument`; games may color by score band but share the chip shell.
- **Timer / readout chip** — instrument-style (`.font-instrument`, tabular), e.g. `.hud-control`. Control-room avatar palette becomes a tokenized neutral chip set.

---

## 9. Layout shells

- **Dashboard shell** (`(dashboard)/layout.tsx` + `Sidebar`): sidebar + `SkyBackground` + token content area. Canonical. Mobile shows the "open on laptop" fallback intentionally.
- **Runtime / session shell** (`session-view.tsx`): full-bleed `theme-Midnight hud-bg` + SkyBackground; currently uses negative-margin escapes (`-m-6 lg:-m-8`). Future `RuntimeShell` primitive to remove the hack — Phase 3, not now.
- **Student mobile shell** (`join/[sessionId]`): currently a one-off `from-slate-900 via-slate-800` gradient that matches nothing else. Proposed alignment to `lc-bg` + SkyBackground — Phase 4, with mobile screenshots.

**Do not change yet:** all three shells' structure/positioning until their respective phases. This doc records intended end-state; it does not authorize layout edits.

---

## 10. Game / activity expressive zone

### May remain fully custom (protected)

- Connections grid, sector-strike / zone / grid boards, race tracker, spin wheel, cabin-mystery visuals, score-reveal animations.
- Scene/decorative SVGs (clouds, earth, airfield, runway, transition overlay) and their motion.
- `.font-game` display type and celebratory gradient *accents within content*.
- Game-specific layouts and state-driven color.

### Repeated chrome that can eventually be normalized (Phase 5, per-file)

- Generic CTAs → `Button variant="game"`.
- Generic result/round panels and overlays → `Surface variant="glass"`.
- Score/status chips → shared `Badge` / score chip.
- Numeric readouts → `.font-instrument`.

### Explicit "do not touch" examples

- Do not restyle the vocab-sprint race result *layout* or its score-band colors — only swap the generic CTA/panel shell if it's incidental.
- Do not normalize anything that is the game's identity. If unsure whether a surface is "chrome" or "content," treat it as content and leave it.

---

## 11. Migration rules

1. **Exact-match only at first.** A swap is allowed only when the primitive's rendered classes equal the current classes (true today in dashboard/class/planner/control-room). No visual delta.
2. **No redesign during migration.** Consolidation ≠ restyling. Spacing/hierarchy improvements are separate, proposed separately.
3. **Screenshots required** for any change to student, session, or game/activity surfaces (projected screen + real mobile). Teacher-only dashboard/control-room/planner can rely on push-and-screenshot.
4. **Primitives land unused first** (Phase 1), behavior-neutral, before any consumer migrates.
5. **Enforcement comes last.** No lint/Tailwind restriction banning raw colors or native buttons until migration is mostly complete and violations are near-zero.
6. **One phase / one area per change set**, so diffs stay reviewable and regressions stay isolated.

---

## 12. Compact UI decisions (Phase A/B)

Planner, discovery, and explore use a compact product convention that is intentional: denser surfaces, smaller controls, and more shelf/card chrome than the dashboard/control-room style. The target is to represent this existing convention in primitives, not to redesign it into the larger dashboard style.

Locked decisions:

1. **Focus policy:** use the global `:focus-visible` outline as the standard. New form primitives do not add custom `focus:ring-*` rules. Existing planner rings migrate only in screenshot-gated passes.
2. **Compact surface density:** `Surface` supports `density="compact"` for compact cards: `bg-lc-card rounded-xl border border-lc-border p-4`. Existing `p-5` compact cards collapse to `p-4` during future migrations.
3. **Compact controls:** `Input`, `Textarea`, and `Select` support `inputSize="compact"` using `rounded-lg`, `py-2`, and `text-sm`.
4. **Search fields:** `Input variant="search"` reserves leading/trailing icon space with `pl-9 pr-9`; clear buttons remain separate controls.
5. **Input background:** compact primitives use `bg-lc-surface`. Older `bg-lc-bg` search fields can migrate later with screenshots because this is a subtle visible change.
6. **Compact buttons:** `Button` supports `size="compact"` plus `variant="icon"`, `variant="link"`, and `variant="hero"` for the repeated compact command shapes. The existing game CTA remains `variant="game"`.
7. **Compact badges:** `Badge` supports `size="xs" | "sm" | "md"` so discovery/planner chips can consolidate without inventing per-file pill classes.

These variants land unused first. Future migrations must still be area-scoped, screenshot-gated, and explicit about any visual change.

---

## Resolved decisions

These were the open items in the draft; resolved with defaults below. Each may be revisited before its implementing phase.

1. **`lc-info` token** — added in Phase 1; initial value equals `lc-blue`. Kept as a distinct token so it can diverge later. `neutral` is usage-only (no swatch).
2. **Light-theme status colors** — skip for now; current `lc-amber/success/warn/danger` values are acceptable on light surfaces. Revisit if contrast issues appear.
3. **`lc-warn` naming** — keep `lc-warn` (avoid a rename touching many call sites).
4. **Control radius** — standardize controls on `rounded-xl` to match Button.
5. **Surface vs Card** — add `Surface` in Phase 1 *alongside* `Card`; keep `Card` working; migrate consumers later.
6. **Badge vs Chip** — single `Badge` with `tone` + `variant`; instrument readout style via `.font-instrument`.
7. **Game gradient** — owned by `Button variant="game"`. Revisit a shared gradient *token* only if non-button accents need it.
8. **Extra Button variants** — compact `link`, `icon`, `hero`, and `size="compact"` were added in Phase B. Other variants remain deferred until migration surfaces a recurring need.
