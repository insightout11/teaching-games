# LessonCaptain — Ableton Production Guide

A step-by-step recipe for producing the LessonCaptain sound set in Ableton Live. Companion to
**[sound-design.md](./sound-design.md)** (the *what/where/why*). This is the *how to make it*.

Goal: a small, **cohesive** family of clips that all sound like they happen in the same cabin —
synthesized originals (owned outright), plus the processed Captain voice.

Everything you build stays in one `.als` project so you can reopen and tweak forever. Suggested:
`audio-src/lessoncaptain-sound.als` (keep the project out of `public/`; only the rendered exports
go to `public/sounds/`).

---

## Part A — Project setup (do this once)

- [ ] **New Live Set.** Sample rate **48 kHz** (Preferences → Audio). Tempo **120 BPM** (arbitrary
      but fixed — makes loop math clean).
- [ ] **Pick ONE key and stick to it.** Recommendation: **F major** (chimes = F / A / C). Every
      melodic element (brand resolve, arrival chime, drone root) uses this so the set is
      harmonically related. Write it at the top of the project (a locator named "KEY = F").
- [ ] **Build the shared "Cabin Bus" (your glue).** This is what makes a pile of separate clips
      sound like one product. Create a **Return track** named `Cabin Verb`:
  - [ ] **Reverb** device: small/medium room, Decay ~0.8–1.2s, Dry/Wet 100% (it's a send).
        Predelay ~10ms. This is the room *everything* lives in.
  - [ ] Keep it subtle — you'll send each sound 10–25% to this return, not drench it.
- [ ] **Master chain (for consistent loudness):**
  - [ ] **EQ Eight** — gentle high-shelf tame if anything's harsh.
  - [ ] **Limiter** — Ceiling **−1.0 dB**. Every export passes through this so all clips land at
        the same level (your touchdown and your chime arrive equal loudness).
- [ ] **One audio track to render onto** (named `RENDER`), plus instrument tracks per sound.

> Cohesion rule of thumb: same key + same Cabin Verb send + same master Limiter = "designed," not
> "scavenged."

---

## Part B — The sound checklist (build these)

Work top-down; the v1 three are all you need to unblock engineering.

### ☐ 1. `brand-resolve` — the sonic logo *(v1)*
The chime as the BrandSting mark lands. Length **1.5–2.5s**.
- [ ] Instrument: a soft mallet/bell (Operator sine-ish, or a Collection mallet). Warm, not glassy.
- [ ] Play the **F major triad** resolving up to the tonic (e.g. C → F, or a quick A–C–F arp
      landing on F). Let the tail ring.
- [ ] Add a sub-layer: one low sine on the F root, short, for body.
- [ ] Send ~20% to `Cabin Verb`.
- [ ] Feel: premium, low-frequency, "arrival." This is the one to get *right* — it's the brand.

### ☐ 2. `takeoff` — engine spool + roll + climb *(v1)*
Length **2.5–3.2s** (match `TRAVEL_DURATION` ≈ 3.2s / `DEPARTURE_DURATION_MS`).
- [ ] **Layer 1 — engine:** filtered noise (Operator/Simpler noise, or an Analog noise osc). Use an
      **Auto Filter** (bandpass) and **automate the cutoff sweeping up** over the clip → the spool.
      Add slow LFO for a subtle engine waver.
- [ ] **Layer 2 — air/whoosh:** white noise through a bandpass that opens, with **rising pitch**
      (envelope on pitch or a riser sample). This is the "speed build."
- [ ] **Shape:** quiet start → builds → peaks as it "rotates" → slight fall as it climbs out. Use a
      volume envelope, not a flat blast.
- [ ] Send ~15%. Keep low-mid energy up so it reads "powerful," not "hissy."

### ☐ 3. `touchdown` — landing thud + tyre chirp *(v1)*
Length **0.6–1.2s**. Fires on the descent bounce keyframe (`0.60`).
- [ ] **Layer 1 — thud:** a low **sine** with a fast downward pitch envelope (e.g. 120 Hz → 50 Hz)
      + short amp decay. The "boom."
- [ ] **Layer 2 — chirp:** a tiny noise burst, very short, slightly bright — the tyre on tarmac.
- [ ] Tight transient, short tail. Send ~10% (less verb — it's an impact, should feel close).

### ☐ 4. `cruise` — passing-air swell *(v2)*
Length **1.5–2.5s**. The mid-flight transition; lighter sibling of `takeoff`.
- [ ] Reuse the takeoff air layer but **gentler**: a soft swell in and out, no big pitch rise, no
      engine spool. A breath of wind passing, not a launch.

### ☐ 5. `turbulence` — low rumble *(v2)*
Length **2–4s**, can be a one-shot or short loop.
- [ ] Low filtered noise (energy mostly **< 200 Hz**) with an **amplitude LFO** for the buffet/shake.
- [ ] Optional faint cabin rattle layer (very quiet mid noise, tremolo).
- [ ] Keep it *felt, not loud* — it underscores the screen jitter, doesn't announce itself.

### ☐ 6. `arrival-chime` — arrival resolve *(v2)*
Length **1.5–2.5s**.
- [ ] **Same instrument as `brand-resolve`**, same key — a gentler, slightly different voicing of
      the F chord (e.g. C–A–F descending and settling). They should feel like siblings.

### ☐ 7. `ambient-drone` — cockpit pad loop *(v2)*
Length **30–60s**, **must loop seamlessly**.
- [ ] Pad: 2–3 detuned oscillators on the **F root** + fifth, slow filter movement (slow LFO on a
      low-pass), maybe a faint airflow noise layer underneath.
- [ ] **Mix to sit UNDER the teacher's voice:** high-pass nothing important into 300 Hz–3 kHz; keep
      the energy low (sub/low-mid), roll off the mids. Even overlapping the teacher it won't mask
      speech.
- [ ] **Seamless loop:** compose to a bar boundary, render a whole number of bars, then crossfade
      the loop seam (or render with a tail and overlap-fade in Ableton) so there's **no click**.
      Test by looping it in Live for 2 minutes — if you hear the seam, fix it.
- [ ] Stereo is OK here (width is nice for a bed). Send ~25% for space.

### ☐ 8. `thunder` — weather one-shot *(v2)*
Length **1.5–3s**.
- [ ] Synth or a **CC0** recording (run through the Cabin Bus). Distant, rolling — not a sharp crack.
      Fires when `WEATHER_PROFILE.lightning` is true.

### ☐ 9. Captain voice ×10–12 *(v3)*
Pooled lines — **5–6 takeoff** + **5–6 arrival** variants, each **3–6s**. Generic, topic-agnostic,
**slow and clear** (ESL audience).
- [ ] Generate raw voice externally (ElevenLabs free tier covers this; pick one calm "captain"
      voice and keep it consistent). Sample lines:
  - Takeoff: "This is your Captain. Cabin crew, prepare for departure." / "Welcome aboard — we're
    cleared for takeoff." / "Flight deck to cabin: here we go."
  - Arrival: "We've arrived. Thanks for flying with us today." / "Cabin crew, prepare for landing."
    / "Welcome to your destination."
- [ ] Drop each into Ableton on an audio track with the **PA chain** (Part C). Render each separately.

---

## Part C — The Captain PA chain (cabin intercom effect)

Put this device chain on the voice track. It's what makes free TTS sound *intentional*.

- [ ] **EQ Eight** — steep **high-pass ~300 Hz**, steep **low-pass ~3.5 kHz** (the telephone/PA band).
- [ ] **Saturator** (or light Bitcrush) — a little grit, like a compressed intercom feed. Keep subtle.
- [ ] **Reverb** — a short **small-room / cabin** space so he's *inside* the plane (or send to a
      tighter version of the Cabin Bus).
- [ ] **PA key click** — add a tiny static "click/pop" at the head and tail (the intercom keying on
      and off). This single touch sells it more than anything. (Make a 30ms noise blip, place one
      before and one after the line.)
- [ ] Optional: a hair of compression to even out the TTS dynamics.

---

## Part D — Export settings (per clip)

For each finished sound:

- [ ] **Trim tight** — no leading/trailing silence (latency matters when a sound fires on a
      keyframe). Crop the clip to exactly start→end.
- [ ] **Confirm it passed the master Limiter** (consistent loudness across the whole set).
- [ ] **Render to WAV**, 48 kHz, 16-bit. (`File → Export Audio/Video`, render the selection.)
- [ ] **Mono** for all SFX + voice (Export → check mono, or collapse). **Drone** may stay stereo.
- [ ] Name it exactly the semantic key: `takeoff.wav`, `brand-resolve.wav`, `touchdown.wav`, …
      (no `_final_v3`).

### Encode for web (after Ableton)
WAV is the master; the app ships compressed. Convert each (ffmpeg, free):

```bash
# Opus (primary) — tiny
ffmpeg -i takeoff.wav -c:a libopus -b:a 96k takeoff.webm
# MP3 (Safari fallback)
ffmpeg -i takeoff.wav -c:a libmp3lame -q:a 4 takeoff.mp3
```

- [ ] Drop the `.webm` + `.mp3` pairs into `public/sounds/`.
- [ ] Whole set should total **< 1 MB**. If it's bigger, your clips are too long or bitrate too high.

---

## Part E — Final checklist before handing to engineering

- [ ] **v1 trio rendered:** `brand-resolve`, `takeoff`, `touchdown` (both `.webm` + `.mp3`).
- [ ] All three went through the **same Cabin Verb + master Limiter** (cohesion check: play them
      back-to-back — do they sound like the same product? If one feels louder/brighter/dryer, fix).
- [ ] Filenames match the `SOUNDS` keys 1:1.
- [ ] Files in `public/sounds/`.
- [ ] (If any CC0 source used) logged in `public/sounds/LICENSE.md`.
- [ ] `.als` project saved to `audio-src/` so you can reopen and iterate.

Once the v1 trio is in `public/sounds/`, engineering can wire the sound manager + `/dev/sounds`
board and ship v1.
