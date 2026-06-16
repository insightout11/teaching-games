# Student Results: Retention & Share — Design Note

**Status:** Design / discussion. Not yet scheduled for build.
**Scope:** The *student device's* end-of-session landing screen and what happens to a
student's results afterward. This is the private, per-student bookend — distinct from the
*teacher-projected* arrival ceremony in `end-session-summary.tsx` (see
`memory/project_end_celebration.md`), which is the shared/class beat. Both are "landing"
moments; this note is the one in the student's hand.

---

## The problem

There are no student accounts. Today "Save my results" on the student end screen
(`student-controller.tsx`, the `!sessionActive` view) just opens `/debrief/{token}` in a
new tab. It does not *save* anything to a place the student can find later — the only way
back is to bookmark the URL or keep the tab. The `clientId` that identifies a student is
generated **per session** (`name-entry.tsx` `getOrCreateClientId`, stored under
`studentSession_${sessionId}`), so nothing threads a student's flights across days. The
label overpromises.

**Design constraint:** we are building for teachers we'll never meet. We cannot reliably
detect whether a device is personal or shared, so the design must degrade gracefully across
both and never silently assume device ownership.

---

## The key primitive: the per-participant token

`session_participants.debrief_token` (migration 039) is the one artifact that is
**audience-agnostic** — it works on any device, for any student, with no identity
assumption. Build everything on it; everything else is a convenience layer that announces
its own assumptions.

There is already proven precedent for "token → dynamic branded image" in the codebase:
`src/app/(public)/journey/[shareToken]/opengraph-image.tsx` (World Flight journey share).
A student results card is the same move applied to `debrief_token`.

---

## Two artifacts — keep them separate

The biggest trap is conflating these. They have opposite privacy properties.

| | **Brag card** | **Access link** |
|---|---|---|
| What | Designed image: first name, destination, accuracy, streak | The `debrief_token` URL |
| Privacy | **Public-safe** — no credential, nothing private | **Credential** — whoever has it opens the results |
| Use | Shared widely (parent, chat, etc.) | Shared deliberately to self / parent |

Rule: the public, shareable artifact (the image) must **never embed the credential** (no QR
or link to private results baked into the brag image). The card carries stats + first name +
destination only. The access link travels separately and deliberately.

---

## Layered model (degrades gracefully)

**Layer 0 — the token is the real "save" (universal, always on).**
At end of class, always make the link *capturable*: QR + "bookmark this" + optional short
human code. Works on any device with no assumptions. This is the durable artifact;
everything else is convenience.

**Layer 1 — the logbook (convenience, only where it's safe).**
A *stable per-browser* pilot id (one localStorage key reused across sessions, replacing the
per-session `clientId` for this purpose) accumulates flights into a `/logbook` page. Great
on personal devices; dangerous on shared ones (two kids → one logbook). Since we can't
detect device type, **the teacher decides** via a class/session "device context" setting:
- *Students use their own devices* → logbook offered.
- *Shared devices* → logbook suppressed; fall back to Layer 0 capture.
Best-effort only — browsers clear storage, kids switch browsers. Never call it a guarantee.

**Layer 2 — teacher distribution (classrooms that retain nothing).**
Young learners / no devices kept. The same tokens let the teacher export a
`name → results link` list and push it through their existing channel (Google Classroom,
email to parents). First-class path, not an afterthought.

**Layer 3 — future accounts.**
If student accounts ever exist, both the capability URL and the local logbook id become
*claimable* ("this flight is mine"). Nothing above paints us into a corner — it's a
migration path.

---

## Capture & share — the centerpiece

Make a **boarding-pass / arrival-postcard share card** the hero of the student landing
screen. It is simultaneously the capture, the share, and the link preview, from one edge
image off the existing token:

1. **The card** = edge OG image off the debrief token, mirroring the journey share image.
   Theme it with the flight identity (boarding pass / arrival postcard / logbook stamp) —
   the existing visual language does most of the design work.
2. **The share action** = Web Share API (`navigator.share`, including `{ files }` to share
   the image itself). Phones open the native sheet (Messages, WhatsApp, Classroom, AirDrop…);
   desktop falls back to copy-link / download.
3. **Link auto-unfurl** = because the debrief link carries the OG image, simply *pasting the
   link* into a chat unfurls into the boarding pass. The link becomes the share, with minimal
   new UI.

**Why it's worth building beyond retention:** this is the Wordle/Duolingo share-grid
mechanic, and the flight theme is tailor-made for it. Every shared card is a branded
impression (student → parent → "what app is that?") — the cheapest acquisition channel,
falling out of a retention problem we had to solve anyway.

---

## Caveats (these are mostly minors)

- **Use the native share sheet** — student/parent chooses the destination. Do **not** build
  "post to public social" funnels.
- **Never bake the credential into the public brag.** Card = stats + first name +
  destination. The access link is shared separately. (A debrief link unfurling in a *private*
  chat is fine; the risk is someone publicly posting the *link* — so the brag artifact must
  not be the link.)
- **First name / display name only** on anything shareable.
- Respect existing `score_visible` / privacy prefs on anything that shows rank.

---

## Recommendation

- **Default for every classroom:** Layer 0 (capture-the-link) + the boarding-pass share card.
  It is the only default that is correct in a classroom we can't see.
- **Logbook (Layer 1):** opt-in via a teacher "device context" setting; do not auto-assume.
- **Teacher distribution (Layer 2):** ship the `name → link` export as the path for
  no-retained-device classrooms.
- Build the card on the proven `journey/[shareToken]/opengraph-image.tsx` pattern.

## Quick wins available now (independent of the above)

From the earlier end-screen review, cheap and self-contained:
- Render the lesson vocab on the device end screen (`referenceVocab` is already in the
  `/api/student/session` payload but unrendered) — parity with the take-home debrief.
- Suppress rank when `totalParticipants <= 1` ("#1 of 1" is hollow).
- Make "Save my results" actually *capture* (QR + bookmark) rather than a bare new-tab link.

---

## Open decisions

1. Out-of-box default: Layer 0 + card only, with logbook opt-in? (Recommended.)
2. Is the logbook gated by a teacher class/session "device context" setting, or a
   per-student "remember me on this device" choice — or both?
3. Card art direction: boarding pass vs arrival postcard vs logbook stamp.
4. Does Layer 2 export live in the Control Room or the post-session summary?
