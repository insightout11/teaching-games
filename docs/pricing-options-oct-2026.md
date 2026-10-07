# Pricing options

_Oct 6 2026. Roadmap Phase 1 #1. Options for the owner to decide between; nothing changes until a decision.
Builds on `docs/pricing-pro-audit.md` and `docs/pricing-pro-implementation-plan.md` (Jul 2026)._

## Where pricing is today
- **Free**: 5 "Test Flight" credits on sign-up (one per lesson launch). A 1-credit-a-month top-up for used-up accounts
  was written in July (`supabase/migrations/052_credit_trickle.sql`); migrations are applied by hand, so check it's live.
- **Pro**: $8 a month or $79 a year (shown as down from $99). Pro removes credit limits and unlocks Course Builder,
  Control Room notes, and now book upload and scanned books.
- **Stripe is built but not live** (`docs/billing-setup.md`); the Pro checkout button isn't shown yet.
- **Out of date:** the Pro page and homepage still say "Founding price until August 31, 2026". That date has passed.
  Whatever is decided, this copy needs changing.

## What it costs us
**Estimates** from the models and the size of the calls; logging real per-lesson costs is a small follow-up.
| Item | Estimated cost |
|---|---|
| Preparing one lesson (about 8-12 AI calls, Gemini 2.5 Flash-Lite) | about 1¢ |
| AI during the class (checking answers, follow-ups) | about 1¢ |
| **One lesson, all AI** | **about 2-3¢** |
| A scanned book (Gemini 2.5 Flash, measured) | about 1¢ per 30-40 pages; 2.5¢ for a 76-page book |
| A pasted YouTube video's transcript (Supadata, paid per call) | a fraction of a cent to a few cents |
| Hosting (Supabase Pro + Vercel Pro) | about $45/month fixed, whatever the number of teachers |
| Card fees (Stripe, typical) | about 2.9% + 30¢ per payment: **6.6% of an $8 monthly payment**, 3.3% of $79 a year |

So a teacher running 20 lessons a month costs us roughly 50¢ in AI. **Price isn't driven by AI cost**; it's driven by
what teachers will pay and how easy it is to start. Yearly plans lose much less to card fees than monthly ones.

## What similar tools charge (teacher plans, 2026)
| Tool | Price |
|---|---|
| Wordwall Pro | $10.80/month, or $7.20/month billed yearly ($86.40) |
| Kahoot! (education) | Free plan; paid plans about $3-15 per teacher per month (yearly) |
| Blooket Plus | $2.99/month billed yearly, $4.99 month to month |

LessonCaptain does more than these (whole lessons planned in seconds, flights, courses, book reading courses), and its
first audience is online ESL teachers, who are paid per lesson and value prep time saved.

## Options
### A. Keep the current shape, tidy it
- Free: 5 lessons to try, then 1 a month. Pro: $8/month or $79/year, everything included.
- Books and scanned books in Pro (with the monthly page limit).
- **For:** already built; simple. **Against:** "credits" are a hard idea to explain, and 5 lessons is a short trial
  for a teacher who teaches 2-3 times a week.

### B. Free every month, Pro for unlimited (recommended)
- **Free: 4 full lessons every month, every flight included.** No credits to explain: "4 free lessons a month".
- **Pro: unlimited lessons, plus** Course Builder, book upload and scans, reports and the class logbook history,
  teacher notes. $9/month or $79/year (yearly is the plan to push).
- **Founding Crew** (already decided): free Pro during the beta, then 50% off for life.
- **For:** teachers can keep using it free (they recommend it, students see it), cost is tiny (4 lessons ≈ 10¢ a
  month), and the upgrade reason is clear: "I teach more than 4 lessons a month". **Against:** needs the allowance
  built (replaces credits; one migration), and some teachers will stay free.

### C. Three tiers
- Free (as B) / Pro $8 (unlimited lessons) / Pro Plus about $15 (books, scans, courses, reports, Junior art packs).
- **For:** more revenue from heavy users. **Against:** more to explain and build; harder decisions for teachers;
  too early before there's usage data.

### D. Schools and teams (later, alongside any option)
- A per-teacher price for 3+ teachers, shared courses, one invoice, an admin view.
- After the Departures Board; language schools are a natural second market.

## Separate from teacher plans
- **Departures Board**: teachers keep 100% at first; later an optional booking fee of about 10-15% (0% in the first
  year for Founding Crew), as decided in September.
- **Parents never pay LessonCaptain** directly for lessons (they pay the teacher through the board's payment flow).

## Decisions for the owner
1. Option A, B or C (B recommended)?
2. Pro price: keep $8/month and $79/year, or $9/month (B) to make yearly the better deal?
3. Free allowance: 4 lessons a month, or another number?
4. What's Pro-only: Course Builder, book upload and scans, reports/history, teacher notes? Anything else?
5. Replace the expired "founding price" line now (with the Founding Crew offer), even before billing goes live?

## Sources
[Wordwall price plans](https://wordwall.net/price-plans) ·
[Kahoot pricing 2026 (Wooclap)](https://www.wooclap.com/en/blog/kahoot-pricing/) ·
[Blooket pricing (Nibble)](https://nibble-app.com/blog/blooket-pricing) ·
Gemini prices: Google AI list prices (Flash-Lite $0.10/$0.40, Flash $0.30/$2.50 per million tokens in/out).

## Owner decision (Oct 7 2026)
**Option B, as recommended**: Free = 4 full lessons every month (every flight included, no credits); Pro = unlimited
plus Course Builder, book upload and scans, reports/history and teacher notes; **$9/month or $79/year** (push yearly);
Founding Crew = free Pro in the beta, then 50% off for life. The expired founding-price line was replaced on Oct 7.
