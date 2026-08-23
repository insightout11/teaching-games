# LessonCaptain Sound Design

Status: **v1 SHIPPED (Aug 2026).** 15 assets live, wired into the brand sting, all three
flight legs, both cruise micro-events, the end-of-session summary and the lobby. This doc
describes what exists; the plan it replaced is in git history.

The companion **[sound-ableton-production-guide.md](./sound-ableton-production-guide.md)** is
**superseded** — nothing here was produced in Ableton. Keep it only if hand-production ever
becomes worthwhile (e.g. bespoke lobby music).

---

## 1. Principles

1. **Sound rides the cinematic transitions, not the gameplay.** The full-screen overlays *are*
   the teacher-silent moments by design — that's where audio lives.
2. **Always additive, never load-bearing.** Meaning is carried on screen. If a sound is the
   only signal for something, that's a bug. Every play path is wrapped so a failure can never
   break a lesson.
3. **Restraint beats abundance.** A daily-use tool. The canary: if *you*, testing it dozens of
   times a day, want to mute it — teachers will too.
4. **Teacher screen only.** No audio on student devices, ever.
5. **One composed family.** One shared reverb space, one tonal centre (**G**), one loudness
   discipline, so the set reads as *designed* rather than scavenged.

---

## 2. Where sound plays

| Moment | Component | Cue |
|---|---|---|
| Brand reveal | `ui/brand-sting.tsx` | `brand-resolve` — cloud rush into the chime |
| Takeoff | `session/flight-transition-overlay.tsx` (`leg==='takeoff'`) | `takeoff-*` by engine class |
| Cruise | same (`leg==='cruise'`) | `cruise` — light passing swell |
| Turbulence micro-event | same (`stageId==='opinion-pulse'`) | `turbulence` |
| Navigation check | same (`stageId==='navigation-check'`) | `radar` |
| Descent | same (`leg==='descent'`) | `descent-*` by engine class, then `touchdown` |
| End of session | `session/end-session-summary.tsx` | `arrival-resolve` |
| Captain of the Day | same, on the reveal at +1050ms | `captain-applause` (class sessions only) |
| Lobby | `session/session-view.tsx`, keyed on `lesson.phase` | `lobby-bed` (music channel) |

### Lobby music — default ON

Previously spec'd as an ambient drone defaulting off. Both halves were wrong, and the Kahoot
comparison is why: their lobby music does a *job* — it fills dead air while stragglers join and
tells the room something is about to start. A featureless drone does none of that, and
default-off guarantees it never gets the chance.

- **Not Kahoot's register.** Theirs is bright and bouncy. Ours is a departure lounge before
  boarding: warm low pad, gentle forward motion.
- **No strong hook.** Kahoot is a weekly event; this is a daily tool. A teacher running four
  lessons a day hits this lobby four times a day, and hears it ~20x a week against any one
  student's once. Memorable melody = unbearable by Tuesday.
- **Stops dead when the first module starts.** Keyed on session phase, not on a component's
  lifetime.
- **Plays once and fades**, rather than looping.
- **Canary:** if the owner reaches for mute after a week of real lessons, it flips to opt-in.

### Captain of the Day — cabin applause, not a game show

Generic applause is the one gesture in this set with no aviation in it. The fix is not to
replace it but to RELOCATE it: passengers applauding a good landing is a real tradition, and
 is the landing chord, so a cabin clapping straight after is diegetic rather
than a quiz-show sting. The aviation-ness lives in the acoustics — measured at 3–4% of energy
above 3.5kHz, which is what damped walls and soft furnishings do to a room.

- **It is the one clip deliberately NOT in the shared reverb space (§1.5).** Adding the hall
  would undo the only thing making it read as a cabin.
- **Fires at +1050ms**, on the reveal spring, and sits ~4dB under the chord so the chord stays
  the ceremonial anchor and the applause is warmth beneath it.
- **Gated on **, exactly as the crown framing already is. Applauding a class of one
  reads as fake, and 1:1 is a real slice of usage.
- **Ties still get it** — more people to celebrate, not fewer.
- The cabin chime (the two-tone "bong") was the obvious first choice and is deliberately NOT
  used here: it is semantically the seatbelt sign, which is on screen during turbulence, so
  reusing it would make two unrelated moments sound like the same event.

### Session end is a one-shot, not a bed

`end-session-summary.tsx` is a ~1.4s choreographed reveal. Music under a two-second animation
would be worse than nothing, so it gets a single `arrival-resolve` sting, cut so its chord peak
lands at 1.36s against the stat tiles settling at 1.35s.

### Hard no

- Per-question correct/incorrect dings on the teacher screen. The TeachPlay-era ones were
  deleted in this work: `{correct,wrong,streak}.mp3` were **0 bytes**, and their 12 call sites
  across 9 games had been failing silently for months.
- Countdown ticking.
- Any audio on student devices.
- **A cue on the instrument check.** A beep on an accuracy check is a hair from the
  per-question ding above, so that stage falls through to the plain cruise swell.

---

## 2a. Engine classes

`PLANE_ENTRIES` holds 14 planes. They do **not** get 14 engine sounds — expansion happens at the
*family* level, the same rule arrival audio follows for regions rather than cities.

| Class | Planes |
|---|---|
| `piston` | LC Cadet, Wayfarer, LC Scout, Cloud Hopper, Trailblazer, Sky Racer |
| `twin-prop` | Cargo Cruiser, Twin-Prop Scout, Storm Runner |
| `electric` | Solar Flyer, Aurora Glider |
| `jet` | Future Flyer, Starliner Mini, Comet Jet |

- `engineClass` is a **required** field on `PlaneEntry` — a single source of truth, not a lookup
  table that drifts.
- **Takeoff and descent both key off it.** A piston aircraft landing to a jet turbine is worse
  than silence.
- `touchdown` is tyre and gear — the runway, not the engine — so it is shared.
- No new prop plumbing: `flight-transition-overlay` already receives `planeKey`.

**This is a feature, not a cost.** Upgrading from the Cadet to the Comet Jet changes how your
departures sound, paying off a progression system that already existed.

---

## 3. The Captain's voice (PA announcements) — still v3, not built

Session bookends only, never per-transition; a voice competes with the teacher in a way SFX
never do. Requires pooled randomised lines (voice fatigues far faster than SFX), an intercom
filter, and pre-rendered static copy. Audience note: users teach English learners, so bookend
lines must be slow and clear.

---

## 4. Delivery reality (Zoom)

Audio and screen-share are different pipes: Zoom defaults to **no audio** unless the teacher
ticks "Share sound", and playing through room speakers instead lets noise suppression duck it.
**In-person with a projector is the best environment.** This is a large part of why audio stays
100% additive — and why the lobby bed can't be the only "we're starting" signal.

---

## 5. Sourcing, processing & licensing

**Assets are generated in ElevenLabs, then processed by
[`scripts/process-sound-assets.mjs`](../scripts/process-sound-assets.mjs).** Raw downloads live
*outside* the repo — they are large and disposable. Re-run the script to rebuild everything.

Verified terms (Aug 2026 — re-check, these move): free tier grants **no commercial rights** and
demands attribution; **all paid tiers** grant commercial use with none. Starter ($6/mo, 30k
credits) covers the whole set — SFX cost 200 credits/generation, Eleven Music 900/minute. On
downgrade you keep rights to anything generated *while paid*, so subscribe → generate → cancel
works. Eleven Music trained under opt-in deals with Merlin and Kobalt, which is why it is safe
where Suno/Udio free tiers are not.

### What is synthesised rather than generated

- **`takeoff-electric`** — near-silence plus a rising whine is trivial to synthesise and very
  hard to generate; generators only know recordings, and nobody records near-silence.
- **`turbulence`** — low-passed noise on two *incommensurable* LFOs, so the buffeting never
  settles into a countable pulse (which would read as a machine rather than weather).
- **`radar`** — filtered sweep wash plus sonar blips on G5.
- **The `brand-resolve` cloud rush** — the generated clip carried only 0.83s of run-up before
  its chime, so aligning that chime to the spark left the whole opening silent. The rush is
  synthesised and the generated chime layered on at 2.643s.
- **The descent beds** — derived from each class's own takeoff source, low-passed with a
  falling cutoff since distance eats highs first, then ducked before the wheels.

### Cohesion pass (this is what makes 15 separate sources sound like one set)

Trim, mono-fold, resample, level-match, fade, shared reverb, mp3. Notes that matter:

- **Levels are deliberately NOT uniform.** Ceremony cues sit forward (−18 to −20 dB RMS), dense
  engines sit back (−22) so they don't dominate a classroom, descent beds sit further back
  (−30), and `takeoff-electric` sits at −32 because that contrast *is* the aircraft's character.
  Do not flatten these to one target.
- **Tonal centre is G (393 Hz)**, measured. `brand-resolve`'s chime is a 393 Hz fundamental;
  `arrival-resolve` is a C major triad on a G bass sharing that fundamental; the sting's pad is
  a **G major triad** (G3/B3/D4/G4/B4). The major third is load-bearing — the earlier pad was
  bare octaves and fifths in a low register, which is precisely the interval set that reads as
  ominous rather than friendly.
- **The cloud rush is pad-led, not noise-led.** Filtered noise *is* wind, so no amount of
  lowering its cutoff stopped it sounding windy; inverting the balance is what made it
  atmospheric. Its filter tops out around 950 Hz.
- **Reverb** is a Schroeder network (4 combs → 2 allpasses). It puts the family in one space and
  stops the synthesised layers sounding dry against the generated ones. Keep decays short enough
  that tails don't ring past their visuals.
- **Noise must come from `fillNoise` (xorshift32).** An earlier LCG multiplied a 31-bit seed by
  1103515245, overflowing JS's 2^53 integer precision, so the sequence collapsed into a short
  repeating cycle — and repeating noise is a tone. That was an audible oscillation artefact, not
  a subtle one.

**Format: mono MP3** via `@breezystack/lamejs` (pure JS, ~100KB devDependency — an ffmpeg binary
is not worth it for one asset script). Note plain `lamejs@1.2.1` is broken on Node: its source
entry throws `MPEGMode is not defined` and its prebuilt bundles export nothing. Whole set is
**1.6 MB** including two minutes of music.

---

## 6. Implementation

`src/lib/audio/` is the only place that touches playback.

1. **`sounds.ts`** — semantic registry plus the derived timing constants. Components call
   `play('touchdown')` / `playTakeoff(engineClass)` and never touch file paths, so re-cutting an
   asset never ripples into component code.
2. **`manager.ts`** — one-shot playback (cloned elements so overlapping cues don't cut each
   other), the music channel, preferences, and `unlock()`.
3. **`use-audio.ts`** — `useAudioPrefs()` for UI.
4. **Preferences live in localStorage, deliberately NOT in `SessionSettings`.** That store is
   lesson content which syncs to students and persists into saved lessons; muting your own
   classroom speakers is neither. Defaults: **SFX on, music on.**
5. **`ui/audio-control.tsx`** — bottom-right, dim until hovered (this screen is projected).
   Mute must be reachable *during* a lesson; a teacher whose room has gone quiet cannot go
   hunting through settings.
6. **`ui/audio-unlocker.tsx`** — browsers grant playback only inside a real gesture, and the
   first cue can fire on a route change, so this listens once at document level. **The very
   first brand sting on a cold app load will still be silent** — the permission does not exist
   yet at that moment, and nothing can be done about it.

### Timing — derived, do not re-guess

| Cue | Lands at | Derivation |
|---|---|---|
| Brand chime | **2.643s** | `MARK_DELAY` 1.7s + spark `delay 0.65` + `times[1] 0.45 × 0.65` |
| Touchdown (city arrival) | **`A_TOUCHDOWN_END × travelMs`** ≈ 3744ms | wheels are down when the settle completes |
| Touchdown (bare runway) | `0.60 × TRAVEL_DURATION` = 1920ms | plane variant's own bounce keyframe |
| Takeoff length | ~4.8s | `DEPARTURE_DURATION_MS` = 4800, **not** `TRAVEL_DURATION` |

### Micro-event beats are not gated on the cruise leg

A beat (`turbulence`, `radar`) **replaces the whole transition scene** — it renders its own sky
and never draws the runway or plane. So it never needed the cruise leg's visuals, only permission
to run.

That matters because the leg is chosen by **slot position**, not by the stage's declared phase:
`nextIndex === 1` → takeoff, last → descent, otherwise cruise. Requiring `leg === 'cruise'` meant
a micro-event at slot 1 — where `opinion-pulse` sits in the Speaking Fluency preset — silently
rendered as a takeoff and its beat never played at all.

The gate is now `isMicroEvent && leg !== 'descent'`. Descent stays excluded so an arrival is never
swallowed. Two consequences to keep in step:

- **Audio checks the beat before the leg**, matching the render. Checking the leg first would play
  a takeoff engine over a turbulence scene.
- **The city waypoint card is suppressed on a beat**, or it announces a departure that isn't on
  screen.

Two more traps worth naming, because both cost a round of "it's mistimed":

- **`A_APPROACH_END` is not touchdown.** It is where the *flare* ends. `PlaneLayer` blends
  `yOffset` toward the runway calibration across the whole touchdown phase, so the aircraft keeps
  sinking until `A_TOUCHDOWN_END`. Firing on the earlier mark puts the chirp ~1s ahead of the
  wheels.
- **Never put `useReducedMotion()` in an audio effect's dependencies.** It resolves `null` →
  boolean after mount, which re-runs the effect and fires the cue a second time a few ms behind
  the first — two engines phasing against each other. Read it through a ref.

### Related: plane runway calibration

`groundContactOffset` cancels the transparent padding under each plane's landing gear, since
`PlaneLayer` aligns the image *box* bottom to `LAYOUT.runwayY`. It was calibrated for only 3 of 14
aircraft, so the rest visibly hovered on both takeoff and landing.
[`scripts/measure-plane-ground-offsets.mjs`](../scripts/measure-plane-ground-offsets.mjs) measures
it from each PNG's alpha; re-run it if art is re-exported. A test asserts every plane stays
calibrated.

**It is a separate field from `runwayYOffset`, and that separation is the whole point.** Padding
differs per view angle — Aurora Glider is 24.9% of image height side-on but **34.0%** head-on — so
a side-view correction applied to a front view is simply wrong. `runwayYOffset` is read by
front-facing and sprite surfaces (`RunwayPlaneScene`, `ClassPlaneSprite`) and keeps its original
hand-tuned values; only `PlaneLayer`'s side view reads `groundContactOffset`. A THIRD field, `hangarYOffset`, does the
same job for the front-three-quarter art in the lobby hangar — it too was set for only 3 of 14
planes, so the rest floated there independently of anything audio-related. Calibrating the
shared field instead displaced planes across the hangar and lobby, because 11 aircraft went from
an inert `0` to a live value on the wrong axis.

---

## 7. Tuning workflow

**`/dev/sounds`** is the board. Unlike every other `/dev` route it stays reachable on Vercel
**previews** (404 only in production), because levels get reviewed on deploys rather than a local
dev server.

It mounts the **real** `FlightTransitionOverlay` and `BrandSting` with the same props the live
session passes — including the home-base departure/arrival scenes, which is what puts takeoff on
its 4800ms path rather than 3200ms. A clip played against a blank screen cannot tell you whether
it lands on the beat it was cut for; that lesson was learned the hard way.

---

## 8. What shipped, and what is left

**Shipped:** the full transition layer, per-engine takeoff and descent, both cruise
micro-events, the lobby bed, global mute/volume, and the tuning board.

**Not built:**

- **v2:** weather-tinted audio (the `WEATHER_PROFILE` values already flow through the overlay,
  so a rain hiss or a thunder one-shot gated on `p.lightning` is nearly free), and optional
  stat-tile stamp thunks on the end-summary reveal — a one-time ceremony, so not the §2 hard no,
  but judge it on the board first.
- **v3:** Captain bookend announcements.
- **Turbulence is wired live** — an earlier note calling it dev-only was stale.
- **Known art issue, not fixable in code:** the "L" livery is off-centre in some plane artwork
  (Cargo Cruiser worst). It is painted into the raster asset.

---

## 9. Asset list

All mono MP3 under `public/sounds/`, 1.6 MB total. Filenames map 1:1 to semantic keys.

| Key | File | Length | RMS |
|---|---|---|---|
| `brandResolve` | `brand-resolve.mp3` | 4.8s | −20 |
| `touchdown` | `touchdown.mp3` | 0.85s | −18 |
| `arrivalResolve` | `arrival-resolve.mp3` | 4.1s | −25 |
| `cruise` | `cruise.mp3` | 3.4s | −26 |
| `turbulence` | `turbulence.mp3` | 3.4s | −27 |
| `radar` | `radar.mp3` | 4.4s | −26 |
| `takeoff.piston` | `takeoff-piston.mp3` | 4.9s | −22 |
| `takeoff.twin-prop` | `takeoff-twin-prop.mp3` | 4.85s | −22 |
| `takeoff.jet` | `takeoff-jet.mp3` | 4.6s | −22 |
| `takeoff.electric` | `takeoff-electric.mp3` | 4.6s | −32 |
| `descent.*` | `descent-{piston,twin-prop,jet,electric}.mp3` | 3.9s | −30 / −38 |
| `captainApplause` | `captain-applause.mp3` | 2.6s | −29 |
| `LOBBY_BED` | `lobby-bed.mp3` | 120s @ 16kHz | −30 |

The bed is 16kHz because it measured **0.0% energy above 3kHz** — transparent for that material,
and it keeps two minutes of music under 1 MB.

### Generation prompts

For regenerating or extending the set. The load-bearing trick for engines is naming the
**change**, not the scene: "builds from idle to full power" produced a steady loop with fades,
while *revs up · RPM climbing · pitch rising · quieter and more distant · one continuous take
with a clear change from slow to fast* produced a real spool-up.

- **`brand-resolve`** — *A soft airy whoosh passes through cloud, then settles into a single warm
  bell-like chime with a bright shimmer that rings out and fades. Premium brand logo sound, clean
  and hopeful, no music bed.* (Whoosh lead-in must reach the chime in **under 1.7s**.)
- **`touchdown`** — *Aircraft main landing gear touching down on a runway — a firm rubber tyre
  chirp with a short skid and a small suspension thud. No engine. Close, dry, quick.*
- **`arrival-resolve`** — *Warm cinematic arrival resolve — a soft swell rising into a bright
  major chord with a gentle bell shimmer, like a long journey completing. Uplifting but
  restrained. No drums, no percussion, short tail.*
- **`takeoff-piston`** — *A vintage radial piston aircraft taking off, recorded from beside the
  runway. Starts at low idle revs, then the engine revs up hard — propeller RPM climbing, pitch
  rising as it accelerates down the runway — then it lifts off and flies away, growing quieter
  and more distant as it climbs. One continuous take with a clear RPM change from slow to fast.*
- **`takeoff-twin-prop`** — as above with *two heavy turboprop engines… a slow beating between
  the two engines*. That beat (~8.5 Hz) is what distinguishes it from the piston.
- **`takeoff-jet`** — as above with *a modern jet airliner… high metallic turbine whine at idle…
  bright turbine whine clearly audible throughout, not just low rumble.* Without that last
  clause the model's prior is runway-side rumble, which comes back darker than the props and
  inverts the tier progression.
- **`cruise`** — *A distant jet airliner cruising high overhead, heard from the ground — a
  smooth, soft wash of air and engine that swells gently as it passes and fades away.*
- **`lobby-bed`** (Eleven **Music**) — *A warm, quietly uplifting ambient track for an airport
  departure lounge just before boarding. Gentle forward momentum — a soft muted pulse and slowly
  rising harmony that leans forward. Deep warm low pad underneath, middle frequencies left fairly
  open so speech stays clear. Constant soft level, no big climax, full texture from the very
  first second. No vocals, no loud drums, no memorable melody hook. Hopeful and anticipatory
  rather than sleepy or meditative. In the key of G.*

**Judging a lobby bed:** measure its speech-band (300 Hz–3 kHz) share. The first attempt sat at
60–90% and would have fought the teacher; the shipped one is ~31%. Also check its dynamic range
— a bed wants a few dB across its length, not twenty.
