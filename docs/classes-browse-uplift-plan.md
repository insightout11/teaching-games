# /classes + /browse UX/UI Uplift Plan

**Status:** Proposed (discussed 2026-07-02). Redesign pass — separate from the style-guide
exact-match migrations per `ui-style-guide.md` §11.2 ("no redesign during migration;
spacing/hierarchy improvements are proposed separately"). This is that separate proposal.

**Context locked elsewhere:**
- Classes section stays **teacher-private admin + analytics** — no student-facing ambitions
  (`memory/project_class_logbook.md`). Class-facing progress lives in lobby + end-session.
- `/explore` (labeled **Browse**) is becoming a **logged-in tool**: the marketing browse role
  moves to public `/showcase` (landing-page-100x plan). So Browse optimizes for scan → launch
  speed, not persuasion.
- Style guide governs: `lc-*` tokens, `Surface`/`panel-card`/compact variants, global
  focus-visible, Lucide icons, `.font-instrument` for numeric readouts.

---

## Part 1 — Why these pages feel weak (audit)

### /classes (list)
1. **Empty cards.** Card = name + "Created {date}" + a literal `h-16` spacer. Created-date is
   the least useful fact about a class. No student count, no flights flown, no last-taught,
   no World Flight state. The page holds the teacher's most valuable objects and shows
   nothing about them.
2. **Orphaned controls.** Level/Tone `Select`s are absolutely positioned *over* the Link card
   (z-index escape hatch). Visually they float, interaction-wise they fight the card click.
   They're settings, not index-page content.
3. **Flat page chrome.** `<h1>` + button + grid. No cockpit identity — compare `/home`.

### /classes/[classId] (detail)
4. **Roster editor dominates** — an admin chore is the hero; the class's story is absent.
5. **No World Flight presence at all**, despite it being the class's richest state.
6. **No Control Room link** — analytics reachable only from the *list* card. Detail page is a
   dead end.
7. **Flight Log rows are just timestamps** — no topic, no modules, no outcome. Reads as a
   server log, not a log book.
8. **"Delete class" sits casually in the header** next to the student count.

### /browse (`ExploreClient`)
9. **~35 identical text cards.** Same size, same weight: icon + name + paragraph + full
   skill-chip wall + minutes. Nothing guides the eye; category is a 2px left border.
10. **Chip noise.** Every skill on every card as uppercase mono chips — the loudest element
    is the least differentiating.
11. **Filter wall before content.** Search row + type tabs row + 8 skill pills row ≈ 180px of
    controls above the fold.
12. **Ambiguous affordance.** Whole card = invisible button → launch modal; the secondary
    "+ Add to lesson plan" hides in a footer strip. Neither reads as an action until hover.
13. **Overloaded launch modal.** Topic select + custom topic + difficulty + credit warnings +
    active-session shortcut + class list + inline class creation in one dialog.
14. **No product tie-in.** Raw registry dump; no link to presets/World Flight where a module
    shines.

---

## Part 2 — /classes plan

### C1. Living class cards (list page)
Replace the empty card body with a stat row + optional World Flight strip:

```
┌──────────────────────────────────────┐
│ ✈ (arc bg, kept)          [plane icon]│
│ Class 3B                              │
│ 12 crew · 14 flights · last: Jun 28   │  ← .font-instrument numerals
│ ── World Flight ──────────────────── │
│ 🌍 Tokyo · Tier 2 Prop · 6 stamps     │  ← only if class has WF state
│                                       │
│ [Start session]      Control Room →   │
└──────────────────────────────────────┘
```

- **Add:** crew count, flight count, last-flight date, WF strip (current city, plane tier
  name, stamp count). All from one batched server query in `classes/page.tsx`
  (`students`/`sessions` counts + `class_world_flight_state` + completed-leg counts,
  `.in('class_id', ids)` — same pattern as `world-flight/page.tsx`).
- **Add:** primary **Start session** action on the card (reuse `SessionStarter` entry) —
  today the card's only actions are navigate + Control Room.
- **Remove from card:** created-date; Level/Tone selects (→ detail page, C3).
- Keep `panel-card` + flight-arc bg (it's the right idiom per style guide §5) but the card
  earns its size now.
- Empty state: keep "Your hangar is empty" but pair with a small airfield illustration and a
  centered Create CTA — currently plain text.

### C2. Class detail becomes a hub, not a roster form
New layout, same route:

```
Header:  Class name (inline edit, kept) · crew count · [Start session]
         (Delete class → kebab menu, with confirm — off the header line)

Row 1 (summary cards, 3-up):
  [ Journey ]            [ Analytics ]           [ Defaults ]
  WF: current city,      accuracy % gauge-lite,  Level + Tone selects
  plane, stamps,         flights, top streak     (moved from list card)
  → Open World Flight    → Control Room
  → Share journey link   (mini numbers inline,
  (or "not started"      full detail lives in
   quiet state)          control room)

Row 2 (existing, reorganized):
  Roster (kept as-is, now one of two columns, not the hero)
  Flight Log (upgraded rows: date · topic/custom_topic · N modules · Debrief →)
```

- **Journey card** = the class-page face of World Flight: reads `class_world_flight_state` +
  leg count; deep-links to `/world-flight` (with this class selected) and hosts the
  `ShareJourneyButton` (promoted out of the passport panel; show on/off state + copy link,
  not fire-and-forget).
- **Analytics card** = 2–3 headline numbers (accuracy, flights, active streak-holder count)
  computed the same way `control-room/page.tsx` already does, linking to it. No student
  names on this card (keeps the page glanceable without it becoming a second control room).
- **Flight Log rows** gain `topic ?? custom_topic` and module count (from `rounds`); active
  session keeps the green Resume treatment.
- **Delete class** → kebab (⋯) menu in header with the existing confirm.
- Reserve a slot in Row 1 for the future **Class Logbook** card (project_class_logbook.md) —
  don't build it now, just don't design the row full.

### C3. Chrome polish (both class pages)
- Move Level/Tone defaults into the Defaults card (detail page); delete the absolute-position
  hack from `class-list.tsx`.
- Page header treatment consistent with `/home` vocabulary (uppercase micro-label + title —
  the ClassHeader already does this; apply to the list page too).
- All numerals `.font-instrument`; statuses via `lc-success/warn/danger` tokens (already
  mostly true here).

---

## Part 3 — /browse plan

### B1. One-row toolbar, collapsible depth
- Merge search + type tabs + skill filter into **one sticky toolbar row**: search input
  (grows), `All / Games / Activities` segmented control, and a single **Skill ▾** popover
  (or horizontally scrollable pill row on narrow widths). Frees ~120px above the fold.
- Result count + "clear filters" chip appears in the toolbar when filtered.
- Keep grouping by category shelves (it's good); shelf headers keep icon + `hud-rule`.

### B2. Card redesign — hierarchy over inventory
Current card is all-text, all-equal. New card (compact density, `Surface density="compact"`
per style guide §12):

```
┌────────────────────────────────┐
│ ▣ icon tile   Synonym Showdown │  ← tile: category-tinted bg (from
│ (tinted bg)   Game · 10 min    │     GAME_CATEGORY_INFO color, /10 alpha)
│ One-line description, clamped. │  ← line-clamp-2
│ Vocabulary · Precision  +3     │  ← max 2 chips + overflow count
│              [＋ plan] [Launch]│  ← explicit actions, always visible
└────────────────────────────────┘
```

- **Icon tile** carries the category color as a filled block — the grid stops being
  monochrome text without inventing imagery. Left-border accent can go.
- **Skills:** max 2 chips + `+N`; full list moves to a hover/expand detail (or title
  attribute). Kills the chip wall (#10).
- **Explicit buttons:** `Launch` (Button size="compact" primary) + icon-button for
  add-to-plan (`variant="icon"`, tooltip). Card body click can still open Launch, but the
  affordance is visible without hover (#12).
- **Type marker:** "Game · 10 min" line replaces the diamond-SVG "Games" fragment in shelf
  headers doing double duty.
- Estimated 5–6 cards visible per fold instead of ~3.

### B3. Launch modal → two clear zones
Keep one modal but restructure (no new steps):
1. **Where:** class list first (that's the decision) — active-session Continue pinned top,
   classes as compact rows, inline "+ New class" kept.
2. **How (collapsed by default):** "Topic & difficulty" as a summary line
   (`General · Intermediate ▾`) expanding to the selects + custom topic input. Most launches
   use defaults; stop paying the full form every time.
- Credit warnings stay (they're load-bearing), styled via `Badge tone="warning"` when that
  lands.

### B4. Small ties into the product
- Where a module is featured by a preset (`FLIGHT_PLAN_PRESETS`), a quiet one-line footnote
  on the card shelf ("In Captain's Flight") — discovery cross-link, not a redesign.
- Deferred, not in this pass: usage-based "recently used with this class" shelf (needs
  per-teacher round history — cheap query, but scope creep here).

---

## Part 4 — Sequencing, risk, verification

Order (each its own push, owner reviews deployed build per usual):

| Step | Scope | Risk |
|---|---|---|
| 1 | C1 list cards + data query | Low — teacher-only page |
| 2 | C2 detail hub restructure | Low — teacher-only; biggest layout change |
| 3 | C3 defaults move + delete-to-kebab | Trivial |
| 4 | B1 toolbar merge | Low |
| 5 | B2 card redesign | Medium — touches every registry item's presentation; screenshot pass across all categories |
| 6 | B3 modal restructure | Low–medium — launch path; verify full launch flow end-to-end |
| 7 | B4 preset footnotes | Trivial |

- All surfaces are teacher-only (nothing projected, nothing student-mobile) → push-and-
  screenshot review is sufficient per style guide §11.3.
- `pnpm tsc --noEmit` + `pnpm next lint --file <changed>` before every push.
- No schema changes anywhere; C1/C2 add read queries only.
- Use the frontend-design skill when implementing B2/C1 card visuals.

**Explicit non-goals:** no student-facing content on /classes (locked); no Class Logbook
build (separate plan); no /explore marketing work (that's /showcase); no style-guide
enforcement/lint changes.
