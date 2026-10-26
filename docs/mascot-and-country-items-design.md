# Class mascot and country items: design (Phase A7 and A8)

Written 26 October 2026 by Claude for Matt. For discussion before building. From pilot 001 (Cairo to Dubai): a student
asked for a class mascot, another wanted an alien after Saturn appeared; Matt wants items earned by flying over a
country **and talking about it**.

Owner decisions so far: one mascot per flight, built or unlocked; Matt confirms a country was discussed with one
click; rarity in words.

## What already exists (and is reused)

- **Crew avatars** (`src/lib/crew-look.ts`, `CrewAvatar`): an SVG character from a short look code (skin, hair,
  headgear, eyewear, shirt). The mascot is drawn in the same sticker style.
- **Class souvenirs** (migration 065, `class_souvenirs`): what a class has earned, per class, no student names. The
  country items and mascot unlocks use the same pattern.
- **Live memory / "Talked about"** (`lesson-logbook-drawer.tsx`): the topics a lesson covered. A country click lands
  here too.
- **Polls with phones** (`startPoll`): quick class votes. The mascot builder is a run of quick votes.
- **Sky moments** (`journey-sky.ts`, `brightPlanet`): Saturn, the ISS, the moon are only offered when really
  visible, so an unlock tied to them is honest.

## A7. The class mascot

### How it feels in class

1. **Build** (about 2 minutes, at boarding or any quiet moment): the teacher taps "Make a mascot". Five quick votes
   on the phones, one after another, each showing 3-4 picture options on the big screen:
   1. Body: blob, bird, dragon, robot, cat, alien (if unlocked)...
   2. Colour.
   3. Eyes: one big eye, three eyes, sleepy, sparkly...
   4. Something on its head: horns, antenna, propeller hat, pilot cap, flower...
   5. Extra: wings, tail, cape, jetpack...
   Then a name vote between three silly suggestions (or the teacher types one). After each vote the mascot updates
   on screen, so the class watches it grow. Strange combinations are the point.
2. **Boards the plane**: the mascot walks up the airstairs like a student and sits in the front row, twice the size
   of an avatar, taking the two A-B seats of row 1 (or a spot beside the cabin if the class is full).
3. **Rides along**: small reactions at key moments (bounces at take-off, looks out at a landmark, cheers at the
   fly-past). It appears in the class selfie and on the landing card.
4. **Next flight**: the teacher picks which mascot boards: the last one, another from the collection, or "make a new
   one". One mascot per flight.

### Unlocks (earned, never bought)

- Unlocks add new **parts** to the builder, or a whole ready-made mascot, when the class really experiences
  something. Examples:
  - Saturn seen from the plane: **alien** body.
  - The ISS seen: **astronaut helmet**.
  - Northern lights: **glowing** colour.
  - First landmark photo: **camera** extra.
  - Crossing the equator: **sun hat**.
- The room shows a short, quiet toast ("Unlocked: alien body for your mascot!"), never a full-screen pop-up, and
  never mid-conversation; it can wait for the landing card if the teacher is busy.
- Rarity words come from how rare the event is ("rare unlock").

### Data

- New table `class_mascots` (class_id, id, name, look jsonb, created_session, created_at). Nothing names a student.
- New table `class_unlocks` (class_id, unlock_id, session_id, earned_at), unique per class. Used by mascots and
  country items alike.
- The parts themselves are code/data (`src/lib/mascot-parts.ts`), like the avatar parts.

### Art

- About 6 bodies x 6 colours x 6 eyes x 8 head items x 6 extras, in the crew sticker style: 32 SVG parts, any
  combination valid. Claude draws them; a gallery page shows random combinations for Matt to approve before they go
  in class.

### For students without a device

- Votes can be cast by the teacher for them (the existing "vote for a student" on their seat), or by a show of hands
  with the teacher tapping the winner.

## A8. Country items

### How it feels in class

1. The plane is over Saudi Arabia; the class talks about kabsa.
2. The teacher clicks the country on the route map or the "Below us: Saudi Arabia" chip, then **"We talked about
   this"**. One click.
3. A small toast: "Saudi Arabia added to Talked about. Your class earned: a coffee pot (dallah) for the cabin."
   The item appears on a shelf in the cabin view.
4. On the landing card: "Items earned today", next to the souvenirs.

### What the item is (first version)

- **One item per country, shared by the class** (not per student), shown in a **cabin shelf**: a strip of small
  sticker-style objects at the side of the cabin. It reuses `class_unlocks`.
- Items are **objects, not clothing** in the first version: food, crafts, instruments, animals, travel things (a
  dallah coffee pot, a Turkish lamp, a koala, a maple leaf). This avoids turning national dress into costumes, and
  needs no avatar layering.
- Later (Phase B4): wearable items for avatars, chosen per student, with a respectful list reviewed by Matt.

### Rules

- One item per country per class, ever (no farming the same country). Flying over a country without the click earns
  nothing: talking is the point.
- Countries crossed but not discussed show as greyed slots on the landing card ("Not discussed: Jordan"), a gentle
  hint for next time, not a penalty.
- Rarity words by how often routes cross that country.

### Data and content

- `class_unlocks` rows with `unlock_id = 'country:SA'`.
- `src/data/world-flight/country-items.json`: country code, item name, one-line fact, picture (sticker). About 120
  countries the routes cross. Codex drafts the list and facts; Matt reviews it for respect and accuracy; Claude draws
  the stickers in batches, starting with the countries on the most-flown routes.
- "Talked about" gets the country as a topic, so the Recap quiz can ask about it.

## Build order (proposal)

1. Migration 070: `class_mascots`, `class_unlocks` (Matt runs it).
2. Country items: the click, the toast, the shelf, the landing-card list, 20 countries' stickers first. Smaller and
   immediately useful in class.
3. Mascot builder: parts gallery for approval, then the vote flow, boarding and seat, selfie and landing card.
4. Unlocks: Saturn to alien first, then the others.

## Questions for Matt

1. Mascot seat: front row (takes two seats), or standing beside the cabin so no seats are lost?
2. Builder votes: phones only, or also a "teacher picks" mode for quick classes?
3. Country items as **objects first** (recommended), or do you want clothing from the start?
4. Should students see the shelf and mascot on their phones (boarding pass), or only on the big screen for now?
