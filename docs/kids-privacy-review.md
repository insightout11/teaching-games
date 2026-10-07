# Kids' privacy and safety review

_Oct 6 2026. Roadmap Phase 1 #2. A plain-language starting point for decisions, **not legal advice**: before launch
(and before the Departures Board), have a privacy lawyer check the final plan._

## Why it matters now
LessonCaptain is used with kids and teens worldwide, many under 13. Three sets of rules matter most:
- **COPPA (United States)**: covers online services that collect personal information from children under 13. The
  amended rule (in force June 2025, **compliance required from April 22, 2026**) adds a written data-retention policy
  (no keeping children's data indefinitely), separate parental consent before sharing with third parties, and stricter
  security rules. Personal information includes a full name, contact details, photos/voice, and persistent
  identifiers used for anything beyond running the service.
- **GDPR (EU) and UK GDPR**: children's data needs a lawful basis; where consent is the basis, parents consent for
  children under the country's age (13 to 16). Data kept on US servers needs the providers' transfer agreements.
- **UK Children's Code** (Age Appropriate Design Code): online services likely to be used by UK children must be
  private by default, collect the minimum, avoid nudges and profiling, and do a data protection impact assessment.

## The good news: the product is already close to "collect almost nothing"
The strongest position is to design LessonCaptain so it collects **no personal information from children** beyond what
running the lesson needs. Much of that is already true:
- **No student accounts.** Students join with a class code; no email, password or birth date.
- **Spoken-first.** Phones tap; most activities never let students type, so they can't type personal details.
- **Student data is teacher-only.** Rosters, scores, submissions, notes and results are readable only by the owning
  teacher (row-level security), reached through our server.
- **No screen recording** in analytics; flight results store counts only, never names
  (`session_private_state` is public-readable, so names are never put there).
- **Videos** in the planner and Live Room use YouTube's privacy-enhanced (no-cookie) player.

## What we store about students today
| Data | Where | Who can read it | Note |
|---|---|---|---|
| Name (typed by the teacher in the roster, or by the student when joining, up to 40 characters) | `students`, `session_participants`, `student_submissions` | The teacher | Free text: a student can type a full name |
| Avatar look | `students.avatar_seed` | The teacher, the class screen | Not personal |
| A random browser id | `localStorage` on the phone; `client_id` in tables | The teacher | Used only to run the session (allowed as "internal operations") |
| Answers, votes, scores | `scores`, `rounds`, `student_submissions`, votes tables | The teacher | Mostly taps; some games still take typed text |
| Teacher notes about a student (Pro) | `student_session_notes` | The teacher | Can contain anything the teacher writes |
| Results page for a student | `/debrief/[token]` | **Anyone with the link** (for 30 days) | Shows the first name and the student's stats |
| Typed answers sent to AI to check them | Gemini (Google) | Google, as our processor | Only in games that take typed text |
| Page views | PostHog (US) | Us | **Loads on every page, including students' phones** |

Nothing is deleted automatically: sessions, names and answers are kept until a teacher deletes the class.

## Gaps, by priority
### Must fix before marketing to new teachers
1. **No analytics on student pages.** **Done Oct 7:** PostHog no longer loads on `/join`, `/questions`, `/debrief`,
   `/journey` or `/logbook` (`src/lib/analytics/student-paths.ts`).
2. **First names or nicknames only.** **Done Oct 7:** the join screen and roster ask for "First name or nickname";
   new names are stored as one word plus an initial at most ("Mia Kowalski" → "Mia K", `src/lib/student-name.ts`).
   Names entered before this stay as they are.
3. **A real privacy policy.** Today's `/privacy` page covers beta applications only. It needs to say what we collect
   from teachers and students, why, who processes it (Supabase, Vercel, Google Gemini, PostHog, YouTube), where it's
   stored, how long it's kept, how to delete it, and the children's section COPPA requires. Plus **terms of service**
   (there are none) that make teachers responsible for telling parents and getting their consent where required.
4. **A retention policy, enforced.** Decide how long student data is kept (suggestion: names, answers and scores
   deleted or anonymised 12 months after the last session; class totals and flight results without names can stay),
   publish it, and add a scheduled clean-up job. COPPA now requires this.
5. **Results links.** `/debrief/[token]` shows a child's results to anyone with the link. Links already stop working
   30 days after the lesson. **Done Oct 7:** the page now shows the first name only (like the share image). Still to do:
   a teacher switch to turn sharing off (needs a database column).

### Before the Departures Board (minors meet paying parents)
6. **Parent consent flow.** The board takes bookings for children from their parents: that's direct collection from
   parents and children, so it needs a parent account (not the child's), clear consent, and age gating. Group classes
   only (already decided).
7. **Safety and moderation.** Teacher identity checks, reporting, no private messages with minors (decided), what
   teachers may show publicly.
8. **Payments**: handled by the payment provider; no card data ever touches LessonCaptain.

### Good practice (soon after)
9. **Typed text filter.** Where students can still type, block contact details (emails, phone numbers, addresses,
   links) before anything is stored or sent to AI.
10. **Delete on request.** A teacher button to delete a student (and everything about them) and a whole class;
    a contact address for parents' requests.
11. **Provider agreements.** Confirm data processing agreements and EU/UK transfer terms with Supabase, Vercel,
    Google (Gemini API, paid tier: inputs not used for training) and PostHog; consider PostHog's EU hosting.
12. **Data protection impact assessment** (UK Children's Code): a short written assessment of risks to children.
13. **Teacher notes guidance**: remind teachers not to write sensitive details (health, family) about students.

## Suggested order
1, 2 and 5 are small code changes I can make now (no owner decision needed beyond yes). 3 and 4 need owner decisions
(retention length, how teachers handle parent consent) and then a lawyer's review of the policy text. 6-8 belong to the
Departures Board concept. 9-13 follow.

## Decisions for the owner
1. **Retention**: how long to keep named student data (12 months suggested)?
2. **Consent model**: teachers confirm in the terms that they've informed parents and have consent where required
   (common for teacher tools), or LessonCaptain collects parent consent itself (heavier; needed for the board anyway)?
3. **Results links**: keep shareable links (first name, expiring), or teacher-only?
4. **Lawyer**: who reviews the policy and terms before launch?

## Sources
- FTC COPPA amendments, compliance dates: [BBB National Programs](https://bbbprograms.org/media/insights/blog/coppa-amended),
  [Hunton](https://www.hunton.com/privacy-and-cybersecurity-law-blog/coppa-rule-amendment-compliance-deadline-approaches),
  [Securiti](https://securiti.ai/ftc-coppa-final-rule-amendments/).
