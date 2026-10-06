# Listening Flight: Concept

> Status: **concept for discussion.** Part of Flight Presets v2 (`docs/flight-presets-concept-v2.md`).
> Written Sep 30 2026.

## The idea

**"How much did you catch?"** The class hears the same recording at takeoff and at landing. At first they catch a little; by landing they catch most of it. The before → after is built into how listening is taught (gist → detail → full understanding), so this flight's result is the clearest of all: **"First listen: 40% caught → Landing: 85%"**.

Listening is also the most passive skill, so the flight's job is to make it **active and fun**: short clips, tapping answers, replays, games, and talking about what was heard at the end.

## Ground rules

- Phones are for **taps only** (no typing). Speaking happens out loud.
- **The teacher never listens out for anything**: phones do the checking.
- **Nothing on the shared screen gives the answer away**: no transcript until the reveal.
- It works on **Zoom**: the audio goes through Zoom's "share sound".

## Where the audio comes from

| Source | How | Notes |
|---|---|---|
| **Library videos** (main) | Clips cut from the video by transcript timestamps | Transcripts are already prefetched. The video player can already jump to a timestamp. |
| **Teacher's own video/audio** | Uploaded or pasted, with a transcript | Arbitrary videos use the paid transcript route. Uploaded audio files would be new. |
| **Generated script** (fallback) | AI writes a short script on the topic; a synthetic voice reads it | Uses the browser voice the phrasebook already has. The script stays hidden. Voice quality varies by computer. |
| **Classmates** | Students speaking (Mystery Traveller, Hot Seat) | Peer listening already exists in other flights. |

The teacher reading aloud doesn't work well: their script would appear on the shared screen. The synthetic voice solves that.

## The flight (fewer, deeper stages + breaks)

| Stage | What happens | Kind |
|---|---|---|
| **Takeoff: Sound Check + First Listen** | A quick "can you hear this?" chime (everyone taps). Then the whole clip plays once, followed by 3 gist questions on phones. **This is the "before".** | takeoff |
| **Words You'll Hear** | Language Toolkit: key words from the clip, each one *played* (from the clip or the voice) before it's shown. Students hear it first, then see it. | stage |
| *Break: Static* | Fun micro-game (below) | break |
| **Radio Check** | The clip in 3–4 short segments. After each one, a detail question on phones; replay is allowed. The class result per segment shows anonymously. | stage |
| *Break: Comms Check* | Existing vocab micro | break |
| **Black Box** | One key passage: rebuild what was said (below) | stage |
| **Talk about it** | Conversation Rounds / Hot Take on what they heard (listening → speaking) | stage |
| **Landing: Final Listen** | The whole clip again, the same gist questions plus one harder one. **This is the "after"**, revealed over the city. Then it plays once more *with the transcript* for the "oh, that's what they said!" moment. | landing |

## New activities (build order)

### 1. Radio Check (the core)
- A short segment plays and phones get one question: 3 options, tap. It covers a detail, a number, a name, who said what, or how someone feels.
- "Replay" plays the segment again. The shared screen shows *"9 of 12 caught it"* and never who missed it.
- After the answer, the key line is shown and the phrase is played again.
- Reuses: the video player's timestamp jumps, and the choice input on phones.

### 2. Static (a fun break, 2–3 minutes)
- A sentence from the clip is shown on the screen, but the audio has **one word swapped**. For example, the screen says "the train leaves at *nine*" while the voice says "*five*".
- Phones: tap the word that was different. Fast rounds, with a streak for consecutive hits.
- It trains close listening and it's silly, which makes it a good break.
- It uses the synthetic voice, so it needs no clip editing.

### 3. Black Box (reconstruct the recording)
- A key passage (2–3 sentences) plays twice. Phones show a **word cloud**: the passage's words plus decoys.
- Students tap the words they heard. The shared screen rebuilds the passage in order as words are caught, with gaps where nobody caught a word.
- Then comes the talk: *"What goes in the gap?"* After the class discusses, the teacher plays the audio a third time and the gaps fill.
- It's teamwork, not a test, and the class reconstructs the recording together.

### Maybe later
- **Who Said It?** A dialogue or interview clip: tap which speaker said each line.
- **Guess the Sound:** a place-audio clip for World Flight (the sounds of a market, a station) guessed on the map. It would pair with Mystery Flight.

## Also as a stage in other flights

A single **Radio Check** stage can drop into Captain's Flight (video source) or Travel (station announcements, a waiter's question), so listening appears everywhere, not just in this flight.

## For courses

- The course carries the words the class missed most (from Radio Check / Black Box) into the next lesson's warm-up.
- A podcast series or video playlist becomes a natural **listening course**, one episode per lesson. This fits the library's series.

## Risks

- **Zoom sound sharing** is the biggest one. If "share sound" is off, nothing works. The takeoff Sound Check catches it immediately (and tells the teacher how to turn it on).
- **Clip timestamps** depend on transcript quality. Some videos will need manual trimming or the fallback.
- **Synthetic voice** quality varies. A paid voice service later could fix it, at a cost.
- **Level:** fast native videos are hard for kids, so the difficulty setting should pick shorter clips, more replays and easier questions.

## Decisions (owner, Sep 30 2026)

1. The result is **"% caught, first listen vs final listen"**: agreed.
2. Main audio: **podcasts and videos** (the owner hasn't taught a dedicated listening lesson yet). So podcast clips need to be a first-class source, alongside library videos.
3. The synthetic voice is fine as a fallback. The phrasebook's speech delay was fixed first (`src/lib/speech.ts`: on-device voice, preloaded).
4. Build order: **Radio Check → Static → Black Box**: agreed.

## Build plan (Oct 5 2026)

### What exists now
- **Activities built:** Radio Check (video segments or synthetic voice), Static, Black Box. Radio Check also runs as
  Travel's Announcement break.
- **Content:** library clips with **listening packs** (3 timed segments each: question, options, exact key line): 30
  merged, 30 more coming (Codex round 12), spread over kids A1–A2, B1 and B2. Transcripts are prefetched.
- **Logbook:** any flight can now save its before → after (`docs/logbook-flight-results-proposal.md`).

### The flight, concretely

| Stage | Built from | Notes |
|---|---|---|
| **Takeoff: Sound Check + First Listen** | The clip's **listening window** (from just before the first pack segment to just after the last, ~2–3 min; kids ~90s) plays once, then **3 gist questions** on phones | The **before**. Gist = the big picture (topic, main point, how someone feels), *not* the details Radio Check will teach |
| **Words You'll Hear** | Language Toolkit from the transcript | Each word played before it's shown |
| *Break: Static* | Sentences from the transcript, one word swapped | Synthetic voice |
| **Radio Check** | The pack's 3 timed segments (detail questions, replays) | Already built for video segments |
| *Break* | Turbulence pool | |
| **Black Box** | The passage around one pack key line | Already built |
| **Talk about it** | See question 2 | Listening → speaking |
| **Landing: Final Listen** | The same window, the same 3 gist questions + 1 harder one; then one more play **with the transcript** | The **after**: "% caught" first vs final, saved to the logbook |

### Build order (once the questions are answered)
1. **First Listen / Final Listen** activities (window playback + gist check + reveal + logbook save).
2. **Gist questions:** generated from the transcript (with a validity check), plus a data task for Codex to add
   checked `gist` questions to every listening pack.
3. **The preset** (`listening-60`) wired to listening-pack clips: Radio Check and Black Box read the pack's segments.
4. **Launch:** in the planner and the Live Room flight panel, with a "clips with listening packs" filter by level.

## Questions for you
1. **Before/after on gist, not detail.** The first and final listens ask the same 3 *gist* questions (big picture), so
   the middle (Radio Check's detail questions) teaches without giving the landing answers away. OK?
2. **Talk about it:** which format? **Quick-fire** (everyone, 10s, on a question from the clip) fits the no-spotlight
   rule best; alternatives are **Pass the Line** (act out a conversation from the clip) or **Hot Take** (agree/disagree
   with something said).
3. **Where clips come from at first:** only library clips that have a listening pack (60, checked), or also any library
   video with a transcript (segments generated by AI, less reliable)? Teacher's own videos would come later.
4. **Clip length:** cap the listening window at ~3 min (teens) / ~90s (kids)?
5. **Transcript at the end:** keep the final play *with the transcript on screen* (the "oh, that's what they said!"
   moment)?

## Decisions (owner, Oct 5 2026)
All recommendations accepted: (1) before/after on **gist** questions; (2) **Quick-fire** for "Talk about it";
(3) start with **listening-pack clips only**; (4) listening window cap **~3 min teens / ~90s kids**; (5) final play **with
the transcript** on screen.

## Pack-based activities + planner picker (Oct 6 2026)
- **Static** uses the clip's checked rounds (`packStaticRounds`, ≥4 valid) instead of AI rounds.
- **Black Box** uses the clip's passage (`packBlackBox`: up to 6 content-word gaps spread through it, the pack's decoys)
  and **plays that stretch of the video** (player under a "recorder" cover, sound only; no "Slower" for clips).
- **Words you'll hear** = the clip's pack words, each with the transcript line it's said in.
- All three only in the Listening flight (it opens with First listen); other flights keep their AI content.
- **Lesson Planner**: the Listening and Reading templates open a picker (clips by class level / book lessons), same
  lists as the Live Room.
