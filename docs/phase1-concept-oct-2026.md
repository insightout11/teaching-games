# Phase 1 concept: seats, "Where next?", free pictures

_Written Oct 19 2026, for the owner to review before building. Covers items 2, 4 and 5 of "Do first" in
`docs/design-direction-plan-v4.md`. Items 1 (flight timing) and 3 (quick bar per class) are already built and live._

Each part has **the idea**, **what you'd see**, and **questions for you** (my recommendation first).

---

## 1. Seats on the plane for students without devices (item 2)

### The idea
Every student on the class list gets a seat in the Cabin panel, whether or not they joined on a device. The picker,
Next speaker, hands-up queue and votes treat them like everyone else. The teacher speaks and taps for them.

### What you'd see
- **Cabin panel:** seats for the class list, in the order of the list.
  - Joined on a phone: their avatar, as now.
  - Not on a device: their avatar (or initials) with a small "no device" mark.
  - Absent: a faded seat.
- **Pick a student:** spins across everyone present, devices or not.
- **Tap a seat** (a student without a device) to get a small menu:
  - **Raise hand:** puts them in the hands-up queue, so the queue stays in the order hands went up.
  - **Mark answer:** right / wrong / took part, while an activity is running.
  - **Vote for them:** while a vote is open, tap their choice.
- **A student who joins late on a phone** takes their own seat (when they pick their name from the class list while joining, as phones already do; a student who types a new name instead gets a separate seat, which you can merge). They are counted
  once, never twice.
- **Avatars:** the class list page gets the same crew avatar picker phones use. A student who joins on a phone can still
  change theirs.

### Under the hood (for Codex and me, no decision needed)
- One attendance list per student: present by voice, by device, or both, counted once. A second device for the same
  student joins the same seat.
- The participation stars (Everyone Aboard) count class-list students and phone students together, once each. Today they
  leave out students without devices as soon as one phone joins, which can show 100% when half the class never took part.
  Tests for the mixed cases.

### Questions for you
1. **How does the room know a student without a device is in class?**
   - **(Recommended)** Everyone on the class list starts as present. Tap a seat, then "Absent", for anyone missing. Most
     of your classes are mostly present, so this is the fewest taps.
   - Or: everyone starts absent, and you tap each student who's there.
2. **Votes:** when you vote for a student without a device, should it count exactly like a phone vote (yes, I'd say), and
   should their seat show "voted" the same way?
3. **Scores:** a student without a device who answers out loud: should their points show on the leaderboard like phone
   students' points? (Recommended: yes, through "Mark answer". Junior classes stay unranked.)

---

## 2. "Where next?" (item 4)

### The idea
A strip on the teacher's panel with 4–6 topics that follow from the current one, each labelled by how it connects. One tap
makes it the topic. Your biggest need for Friday 2.

### What you'd see
- **Under "Now talking about", in Talk:** a row of chips, for example on "Olivia Rodrigo":
  - *Bigger picture:* Why teenagers love sad songs
  - *The other side:* Should singers write about their exes?
  - *Closer to home:* A song that means a lot to you
  - *In the news:* Her 2026 album
  - *Surprising link:* Disney actors who became pop stars
- **Tap one:** it becomes the topic (with Wikipedia facts when it's a named thing, and Deep dive if you've chosen it).
- **Back:** the strip also shows the last 2–3 topics covered today, so you can return to an earlier thread.
- **It never repeats** a topic already covered in this lesson (the lesson record already lists them).
- **Cost:** one cheap AI call per new topic, made with the topic briefing (no extra wait). No web search.

### Where it shows on the screen (question)
The class sees the teacher's screen. Should the strip be:
- **(Recommended)** on the shared screen but small and quiet, under the topic. Students seeing "where we could go next"
  can spark ideas, and they could even vote.
- Or: only in the private window (Sources), so the class never sees the choices.

---

## 3. Free pictures in the private window (item 5)

### The idea
When the topic changes, the private window (Sources) shows 6–8 free pictures for it from Wikimedia, with no searching and
no cost. Google Images (Serper) runs only when you press a button. Searches are saved, so a repeat topic costs nothing.

### What you'd see
- **A "Pictures" row at the top of Sources:** 6–8 thumbnails for the current topic, each with its credit line (Wikimedia
  licences need one).
- **Click a picture:** it shows on the big screen (the existing "Show").
- **Queue (optional):** a small star on each picture adds it to a queue of up to 4. "Next picture" on the big screen steps
  through them while students talk. This is how you already teach with pictures, made one click.
- **"More from Google Images":** a button under the row, with the topic already typed in. This is the only paid search.
- **Saved searches:** the same search in any class within a week is free (saved on our side). The daily cap planned in
  migration 057 gets applied too (it was never run on the live database; you'd run one SQL script).

### Good to know
- Wikimedia is strong for places, nature, history, science, animals and famous people; weak for everyday scenes, trends
  and very recent things. That's when the Google button helps.
- Pictures come from Wikimedia Commons search plus the topic's Wikipedia page picture. Nothing new to sign up for.

### Questions for you
1. **Queue:** worth having now, or start with just "click to show"? (Recommended: include it; it's small and matches how you
   teach Friday 2.)
2. **Safety:** Wikimedia has some adult and graphic images. I'd filter with Wikimedia's own safe-search flags and a word
   blocklist, and never auto-show a picture on the big screen (you always click first). Is that enough, or should the row
   only appear once you open it?

---

## Build order after your answers
1. Seats + attendance + stars fix (with tests), then avatars on the class list page.
2. "Where next?".
3. Free pictures + saved Serper searches + the cap script.

Each ships on its own, so you can try seats in Friday's class even if the others aren't ready.
