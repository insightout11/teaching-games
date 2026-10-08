# Claude in LessonCaptain

_Oct 8 2026. Built for the writing that has to be right for children, and for the "Claude for Startups" application._

## What uses Claude
A new AI task class, **`writing`** (`src/lib/ai/routing.ts`), tries Claude first, then Gemini, then OpenAI:
- **Simplified retellings** of teachers' uploaded books (`simplifyBookPart`, lesson-plan generate route).
- **Reading packs** for uploaded books, including "Previously…" and the cast (`readingPackFromText`).
- **Live Room Focus briefings** for topics not in the ready bank (`/api/session/[sessionId]/focus`).

Everything else stays on Gemini (cheap, fast, already tuned). Every Claude output still goes through our own
validators (`validSimplified`, `validReadingPack`, `validPrevious`) before a class sees it.

## How it works
- Provider: `src/lib/ai/providers/anthropic.ts`, official `@anthropic-ai/sdk`, structured outputs
  (`output_config.format` json_schema), effort `low`, no `temperature` (current models reject it). A refusal moves
  straight to the next provider. The SDK loads on first use only.
- Model: **Claude Haiku 5.5** (`claude-haiku-5-5`, released Oct 7 2026: $0.10 / $0.50 per million tokens for prompts
  under 100k tokens). Override with `ANTHROPIC_MODEL` (e.g. `claude-sonnet-5-5` if a task needs more).
- **No key = no change**: without `ANTHROPIC_API_KEY` the provider is skipped and Gemini writes as before.

## Turning it on (owner)
1. Create an account at the Claude Console (platform.claude.com) for LessonCaptain, ideally with an
   @lessoncaptain.com address (the Startups program credits go to an organization).
2. Create an API key.
3. Add `ANTHROPIC_API_KEY` in Vercel (Production + Preview) and in the main checkout's `.env.local`.
4. Tell Claude: it then measures quality and cost on real book parts and topics (as for scanned books) before
   anything else moves.

## Not yet measured
Quality vs Gemini and real cost per lesson need the key. Expected cost: a Simplified part or a reading pack is a few
thousand tokens, so well under 1¢ each on Haiku 5.5.
