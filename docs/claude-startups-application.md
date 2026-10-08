# Claude for Startups: application draft

_Oct 8 2026. Program: claude.com/programs/startups (1 year Claude Team up to 5 seats for new Team orgs, $1,000 API
credits for 6 months, office hours, partner offers)._

## Facts
- Company: LessonCaptain (not a registered company yet; sole founder, lives in Thailand, Canadian). Based in: Thailand. Founded: March 2026. Funding: none (bootstrapped).
- Website: https://lessoncaptain.com · Email: an @lessoncaptain.com address (Google Workspace).
- Existing Claude Team org: none.
- Claude Console organization: **Lesson Captain** (created Oct 8 2026 with the @lessoncaptain.com account); API key in
  Vercel and `.env.local`, verified working (no credit balance yet, so the app falls back to Gemini until credits land).
- **Check before applying:** whether the program accepts an unregistered sole founder. If it requires a legal entity,
  register first (or ask the program team).

## What we're building with Claude (2-4 sentences)
LessonCaptain is a live-lesson platform for independent online English teachers who teach small groups of kids and
teens: the teacher shares one "Live Room" screen, students play on their phones, and anything the class talks about
becomes the topic that activities, words and discussion prompts follow. We've integrated Claude Haiku 5.5 through the
Anthropic API, with structured outputs, for the writing that has to be right for children (levelled retellings of the
books teachers upload, reading-comprehension packs and topic briefings at each CEFR level, each checked by our own
validators before a class sees it), and the program's credits would let us run that writing on Claude in production.
Claude Code is our main engineering tool and built most of the product.

## How we'd use it
- **API credits ($1,000, 6 months):** the writing route above in the beta, plus regenerating our content library
  (book retellings, reading packs, 150 topic briefings) with Claude, and measuring Haiku 5.5 vs Sonnet 5.5 per task.
- **Team seats:** the founder (product, engineering with Claude Code) and Lintang (marketing: teacher-facing copy,
  social posts, outreach).
- **Office hours:** routing and cost (which tasks deserve Sonnet vs Haiku), prompt caching for repeated lesson context.
- **Marketplace plugin:** not now; a "turn this into a LessonCaptain lesson" plugin for teachers who plan in Claude is
  a possible later step.
