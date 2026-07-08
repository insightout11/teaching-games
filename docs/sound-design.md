# LessonCaptain Sound Design

Status: **Design locked, not built.** Timing (owner, Jul 8 2026): **v1 ships after beta starts** — sound is additive by design and beta feedback won't hinge on it. Prerequisite for v1 remains producing the audio files (Ableton, per the production guide).

> **Correction (Jul 2026): the codebase is NOT greenfield.** Legacy TeachPlay-era audio exists:
> `public/sounds/{correct,wrong,streak}.mp3`, played via bare `new Audio(...)` in ~7 games
> (connections, dialogue-detective, error-hunter, flash-quiz, grammar-boss, grid-rush,
> sentence-scramble). These are **per-question correct/incorrect dings on the teacher screen —
> the exact "hard no" in §2** — with no mute, no volume control, and no shared loudness/space.
> **v1 must resolve them**: either delete them outright (cleanest; consistent with §2), or fold
> them under the new sound manager + global mute as a "feedback dings" channel defaulting OFF.
> Do not ship the new transition layer alongside unmanaged legacy dings.

Verified still-true (Jul 2026): every wiring target in §2 exists (`brand-sting.tsx`,
`flight-transition-overlay.tsx`, `turbulence-beat.tsx`, `end-session-summary.tsx`,
`lobby-airfield-scene.tsx`); the weather model (§ weather-reactive audio) shipped and flows
through the transition overlay; turbulence is built at `/dev/turbulence` but not yet wired live —
if it's still dev-only when v2 lands, the turbulence rumble waits with it.

This doc covers *what* the sound layer is, *where* it plays, *how* it's delivered and built,
and the rollout. The companion doc **[sound-ableton-production-guide.md](./sound-ableton-production-guide.md)**
is the step-by-step recipe for producing the actual audio files in Ableton.

---

## 1. Principles (the whole philosophy in five lines)

1. **Sound rides the cinematic transitions, not the gameplay.** The full-screen overlays
   (BrandSting, takeoff/cruise/descent, turbulence, arrival) *are* the teacher-silent moments
   by design — that's where audio lives.
2. **Always additive, never load-bearing.** Meaning is carried on screen. Audio is garnish.
   If a sound is the only signal for something, that's a bug.
3. **Restraint beats abundance.** A daily-use tool. Every sound you *don't* add is a sound
   that can't get old. The canary: if *you*, testing it dozens of times a day, want to mute
   it — teachers will too.
4. **Teacher screen only.** No audio on student devices, ever.
5. **One composed family.** Every clip shares one reverb space, one loudness target, one tonal
   center, so the set reads as *designed*, not scavenged.

---

## 2. Where sound plays

The teacher screen is shared/projected, so all audio is on the **session/teacher surface only**.

### Yes — self-contained, teacher-silent, already animated

| Moment | Component | Sound |
|---|---|---|
| Brand reveal (splash / bookend) | `src/components/ui/brand-sting.tsx` | Whoosh through cloud + soft resolve chime as the mark lands. The sonic logo. |
| Takeoff transition | `src/components/session/flight-transition-overlay.tsx` (`leg==='takeoff'`) | Engine spool-up + roll building to climb. Timing: `DEPARTURE_DURATION_MS` / `TRAVEL_DURATION`. |
| Descent / arrival | same (`leg==='descent'`, `isArrivalCity`) | Gear/air, then a touchdown thud at the bounce keyframe (`times:[0,0.52,0.60,1.0]` → 0.60 is touchdown). |
| Cruise transition | same (`leg==='cruise'`) | A short, low-key passing-air swell — lighter than takeoff. |
| Turbulence micro-event | `src/components/session/turbulence-beat.tsx` | Low rumble gated on the same `intensity > 0` that drives the jitter. |
| End-of-session summary | `src/components/session/end-session-summary.tsx` | Arrival resolve / soft celebration as the leaderboard reveals. |
| Lobby / waiting | `src/components/ui/lobby-airfield-scene.tsx` | Ambient cockpit drone (background bed) — see below. |

### Conditional — only with care

- **Arrival flavor:** a *short* one-shot tail (≤2–3s), fades fast. Never a looping city bed.
  If ever expanded, do it at the **region** level (coastal / metropolis / mountain / tropical)
  keyed off scene metadata — not one clip per city.
- **Background music / ambient drone:** lobby + pre/post-session bookends **only**. Must stop or
  duck the instant a module starts. Default **off**.

### Hard no

- Per-question correct/incorrect dings on the teacher screen (teacher is talking; sounds like a buzzer).
- Countdown ticking.
- Any audio on student devices.

---

## 3. The Captain's voice (PA announcements)

**Verdict: yes, but session bookends only — never per-transition.** A voice competes with the
teacher in a way SFX never do, so the entire design is about *frequency and placement*.

- **Works:** once per session, in teacher-silent bookends — start ("This is your Captain. Cabin
  crew, prepare for departure.") over takeoff; end ("We've arrived. Thanks for flying with us.")
  over the summary.
- **Fails:** any per-module or mid-lesson announcement. He'd talk over the teacher and the
  identical line gets cringe by session two.

Three non-negotiables that make it delight vs. gimmick:

1. **Pooled, randomized lines** — 5–6 variants each for takeoff and arrival. Voice fatigues far
   faster than SFX; identical-every-time is the trap.
2. **Intercom filter** — bandpass + grit + cabin reverb + a PA key click. Sells the fantasy *and*
   masks free-TTS imperfections so mediocre TTS sounds intentional.
3. **Pre-rendered static lines** — generic, topic-agnostic copy generated **once** as files. No
   runtime TTS, no latency, no Vercel concern. (The moment you want the actual lesson topic
   spoken, you're into runtime TTS and it's not worth it.)

Audience note: users teach English learners. Keep bookend lines **slow and clear**. (An authentic
fast announcement as *deliberate listening content* is a different feature — don't conflate.)

Ships at **v3**, after the silent version is proven on a real call.

---

## 4. Delivery reality (Zoom)

- Audio and screen-share are different pipes. Zoom screen-share defaults to **no audio**; the
  teacher must tick **"Share sound."**
- Playing through room speakers on a call instead → the teacher's mic picks it up and Zoom's noise
  suppression may *duck or kill* it as background noise.
- **Consequence:** remote audio is outside our control → audio must stay 100% additive (§1.2).
- **In-person (projector + room speakers) is the best audio environment** — no Zoom processing.
  Audio shines in physical rooms and is flaky on Zoom. That's fine; it argues for keeping audio a
  light "nice when it lands" layer.
- **Customer education:** first time a teacher enables sound, show a one-liner —
  *"For remote classes, enable 'Share sound' in Zoom."*

---

## 5. Sourcing & licensing

LessonCaptain is commercial SaaS, so license safety > vibe.

- **Primary path: synthesize originals in Ableton.** Whooshes, impacts, chimes, drone are all
  bread-and-butter sound design. Owned outright (no licensing, no CREDITS file), perfectly
  cohesive (same instruments + master bus), tunable forever (keep the `.als`). See the production
  guide.
- **Captain voice:** external TTS (ElevenLabs free tier covers ~12 static lines), then *processed*
  in Ableton.
- **Fallback only:** genuinely acoustic one-shots you don't want to synth (e.g. a real distant
  thunder roll) → **CC0 only** (Kenney, Mixkit, or Freesound filtered to CC0; never CC-BY-NC).
  Run them through the same master chain so they share the space.
- **Music-generation caveat:** Suno/Udio free tiers are **non-commercial only** — don't use their
  free output in the product. If a melodic bed is ever needed, MusicGen (local, commercial-OK) is
  the clean free path. For *ambient* (the drone), produce it in Ableton — no generator needed.

---

## 6. Implementation architecture

Five pieces. None large.

1. **Sound manager** — one module + a `useSound()` hook. Use **Howler.js** (handles autoplay
   unlock, sprites, per-channel volume, fades). A registry maps semantic keys to files; components
   call `play('takeoff')` and never touch files directly.

   ```ts
   // src/lib/audio/sounds.ts
   export const SOUNDS = {
     takeoff: '/sounds/takeoff.webm',
     cruise: '/sounds/cruise.webm',
     touchdown: '/sounds/touchdown.webm',
     turbulence: '/sounds/turbulence.webm',
     brandResolve: '/sounds/brand-resolve.webm',
     arrivalChime: '/sounds/arrival-chime.webm',
   } as const;
   ```

2. **Autoplay gate.** Browsers block audio until a user gesture. The session-start click ("Start
   flight" / launch) unlocks the AudioContext — and the takeoff is the first sound, so it's
   naturally gesture-triggered. Just ensure the *first* sound isn't auto-fired on mount.

3. **Wiring into the cinematic moments** — 1–3 lines per component, off existing timing constants:
   - `brand-sting.tsx`: whoosh on mount; resolve chime at `MARK_DELAY`.
   - `flight-transition-overlay.tsx`: `useEffect` on mount → `play(leg)`; descent → second timer at
     the `0.60` keyframe → `play('touchdown')`.
   - `turbulence-beat.tsx`: rumble in/out on the same `intensity > 0` gate.

4. **Global mute / volume — non-negotiable.** Lives in `sessionSettings` (next to `timerSeconds`,
   `difficulty`), persisted. Defaults: **SFX on, music off.** Also gate ambient/music off when
   `prefers-reduced-motion` is set (we already check `useReducedMotion()` everywhere).

5. **Background music = separate channel.** Loops on lobby/bookends only, low volume, fade in/out
   on enter/leave; **stops or ducks the instant a module starts.** Tie its lifecycle to session
   phase, not to a long-lived component.

### Weather-reactive audio (free variation)

The weather model (`WEATHER_PROFILE`, the `rain/storm/snow/aurora` states) already flows through
`flight-transition-overlay.tsx` and tints the clouds. Audio can read the same value at near-zero
cost: a faint rain hiss under a `rain`/`storm` cruise; one distant thunder roll when `p.lightning`
is true (same gate as the lightning flash); a darker whoosh in bad weather. Keep it a **tint, not a
track** — one thunder one-shot, never a looping storm bed. Bonus: weather varies per flight, so
transitions are never identical twice without authoring variants.

---

## 7. Tuning workflow

No local dev server (we review on deploy), and audio tuning is brutally iterative. **Build a
`/dev/sounds` soundboard first** (matches the existing `/dev/turbulence` + arrival-scene gallery
pattern): every clip with a play button, the real overlays with their real timing, and live volume
sliders. Tune the whole mix without running a session — and never discover a bad level while
projecting to 30 kids. Make it 404 outside dev (per repo convention).

---

## 8. Rollout

- **v1** — 3 SFX (brand resolve, takeoff, touchdown) + global mute + `/dev/sounds` board.
  Highest impact, lowest risk; proves the manager + autoplay plumbing. Ships in an afternoon once
  the audio files exist.
- **v2** — turbulence rumble + cruise swell + synthesized ambient drone (lobby/bookends) +
  weather tint.
- **v3** — Captain bookend announcements (pooled lines, intercom filter, pre-rendered).

Open decisions (small): the exact v1 clip list (above is the proposal) and whether the captain
slips earlier than v3.

---

## 9. Asset list & file conventions

Filenames map 1:1 to semantic keys (`takeoff.webm`, not `whoosh_final_v3.webm`) so the registry
never chases a renamed asset. All clips: trimmed tight, mono (drone may be stereo), one shared
loudness ceiling, `.webm`/Opus primary + `.mp3` fallback for Safari. Whole set < 1 MB.

| Key | File | Type | ~Length | v |
|---|---|---|---|---|
| `brandResolve` | `brand-resolve.webm` | one-shot | 1.5–2.5s | 1 |
| `takeoff` | `takeoff.webm` | one-shot | 2.5–3.2s | 1 |
| `touchdown` | `touchdown.webm` | one-shot | 0.6–1.2s | 1 |
| `cruise` | `cruise.webm` | one-shot | 1.5–2.5s | 2 |
| `turbulence` | `turbulence.webm` | one-shot/loop | 2–4s | 2 |
| `arrivalChime` | `arrival-chime.webm` | one-shot | 1.5–2.5s | 2 |
| `ambientDrone` | `ambient-drone.webm` | loop | 30–60s | 2 |
| `thunder` | `thunder.webm` | one-shot | 1.5–3s | 2 |
| captain takeoff ×5–6 | `captain-takeoff-1..6.webm` | voice | 3–6s | 3 |
| captain arrival ×5–6 | `captain-arrival-1..6.webm` | voice | 3–6s | 3 |

Store under `public/sounds/`. If any CC0 fallback is used, log source + license in
`public/sounds/LICENSE.md`.
