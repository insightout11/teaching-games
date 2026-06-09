# Future Product Direction - May 2026

Status: exploratory product direction, not an implementation plan.

This note captures the current strategic direction for LessonCaptain after discussion about scoring, teacher devices, class progression, student-facing discovery, marketplace potential, micro-events, and aviation-themed flagship activities.

## Strategic Fork

LessonCaptain may be moving from:

- Teacher tool for running live ESL lessons

Toward:

- A live ESL learning platform with teachers, students, classes, progression, and marketplace effects

This direction is exciting, but it should be sequenced carefully. The immediate product still needs a coherent live-class foundation before marketplace or student-payment layers are added.

## 1. Teacher Remote

A teacher phone companion is one of the strongest near-term ideas.

The teacher is usually screen-sharing the main LessonCaptain view. A private teacher device could become the control surface for running the lesson without exposing everything to students.

Potential uses:

- Review student submissions privately
- See scripts, definitions, teaching notes, and suggested follow-ups
- Advance, pause, freeze input, or spotlight responses
- Moderate student answers without clicking around the shared screen
- Keep the public screen clean while the teacher gets richer controls

Recommended MVP:

- Teacher scans a QR code from the main dashboard
- Phone opens a web-based Teacher Remote
- Tabs: Script, Submissions, Notes, Controls
- Actions: next, pause, freeze input, spotlight, view submissions

Recommendation:

Build eventually as a web-based companion, not a native app. This may be more valuable than Flight Cards because it directly improves live teaching control.

## 2. Class Plane Progression

A class-owned plane avatar is a strong brand and retention idea.

It gives the class a shared identity and avoids the risk of embarrassing weaker students through permanent individual rankings.

Potential model:

- Each class starts with an early plane, such as the Wright Flyer
- The class earns upgrade progress through sessions
- Upgrades follow a rough aviation history/progression arc
- Class chooses between visual upgrades over time

Potential earning signals:

- Participation rate
- Sessions completed
- Class goals reached
- Everyone answers at least once
- Team challenges completed
- Consistent attendance or improvement

Recommendation:

Make progression class-first before adding deep individual avatar progression. Student avatars can come later, but the class plane is more aligned with collaboration and safer emotionally.

## 3. Student-Facing Departures Board And Marketplace

The student-facing departures board idea has major upside and major risk.

Concept:

- A public student-facing screen styled like an airport departures board
- Shows upcoming classes:
  - departure time
  - topic
  - level
  - class length
  - spots available
  - free or paid
  - teacher

This could start with the founder's beta classes and later expand to trusted teachers.

Potential longer-term model:

- Pro teachers can become LessonCaptain teachers
- Teachers complete several free "Test Pilot" lessons
- Students rate the experience
- Approved teachers can list classes
- Teachers promote their own classes on social media
- LessonCaptain takes a platform cut from paid student classes

Upside:

- Creates a viral loop
- Gives teachers a reason to promote LessonCaptain
- Opens student-side revenue
- Makes LessonCaptain feel like a live learning platform, not only a tool

Risks and hurdles:

- Teacher vetting and quality control
- Student safety and trust
- Ratings, cancellations, refunds, and disputes
- Scheduling and seat management
- Payment splitting and payouts
- Higher support burden
- If minors are involved, risk and compliance increase significantly

Payments note:

A marketplace would likely require Stripe Connect or similar infrastructure for split payments and teacher payouts. This introduces onboarding, KYC, payout, refund, and dispute complexity.

Recommended sequence:

1. Departures board for founder-run beta classes only
2. Invite 3-5 trusted Test Pilot teachers manually
3. Let approved teachers list classes
4. Add student payments and platform cut only after demand is proven

Do not build a full open marketplace yet.

## 4. More Micro-Events And Student Choice

More class energy should come from more moments, not necessarily more full activities.

Promising direction:

- One-round versions of existing modules
- Very short transition events
- Students make quick choices
- Events last 10-30 seconds
- The teacher can trigger them between modules

Examples:

- One-round Vocab Sprint
- One-round Sentence Scramble
- One-question Quick Pulse
- Quick prediction
- Tiny written challenge

Recommendation:

Build Scoring V2 first. Then add a lightweight "Flight Event" or transition slot. Do not let this become a second lesson planner.

## 5. Cabin Mystery

A murder-mystery-style activity set on a plane is a strong flagship activity idea.

Possible name:

- Cabin Mystery

Core concept:

- Students receive character cards
- An incident happens during the flight
- Students question selected passengers
- Each character has things they must include in answers
- Students gather clues and vote on the culprit or explanation
- Debrief reveals clues and language targets

Why it fits:

- Strong aviation theme
- Great ESL speaking structure
- Naturally social and memorable
- Strong screen-share potential
- Could become a premium/beta class offer

Risks and hurdles:

- Needs careful role/clue design
- Needs appropriate content for age and level
- AI generation must be constrained or it may create inconsistent mysteries
- Teacher controls and pacing matter

Recommendation:

Build first as a scripted premium activity or preset, not as a fully AI-generated open system.

## Recommended Sequence

The safest sequence is:

1. Scoring V2
2. Teacher Remote
3. Class plane progression and class goals
4. Cabin Mystery pilot activity
5. Departures board for founder-run beta classes
6. Flight Events / micro-events
7. Trusted teacher marketplace experiment
8. Student payments and revenue share

## Product Principle

The live class experience must become excellent before marketplace expansion.

The strongest near-term product promise is:

- The teacher feels in control
- Students feel involved
- The class feels alive
- Progress belongs to the class, not only the top students
- Aviation theming is functional, not decorative

The marketplace idea is powerful, but only after LessonCaptain feels magical in founder-run and trusted-teacher classes.
