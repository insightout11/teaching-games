import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty } from '@/lib/difficulty';
import { difficultyDescriptions } from '@/lib/difficulty';
import { getCachedContent, storeCachedContent, groundingVariant } from '@/lib/content-cache';
import type { FinalAnswerContent, MicDropContent, LightningRoundContent, OpinionShiftContent } from '@/activities/types';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import {
  finalAnswerFallback,
  micDropFallback,
  opinionShiftFallback,
  lightningRoundFallback,
} from '@/lib/fallback-content';

type LandingActivityKey = 'final-answer' | 'mic-drop' | 'lightning-round' | 'opinion-shift';

export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const { activityKey, topic, difficulty, sourceKey, missionContext } = await request.json() as {
    activityKey: LandingActivityKey;
    topic: string;
    difficulty: Difficulty;
    // Grounding identity — keeps a grounded lesson's landing from serving (or being served)
    // an unrelated lesson's cached content of the same topic/difficulty.
    sourceKey?: string;
    missionContext?: string[];
  };

  const variant = groundingVariant(sourceKey, missionContext?.join(''));

  try {
    // 1. Cache check
    const cached = await getCachedContent(activityKey, topic, difficulty, [], variant);
    if (cached) {
      return NextResponse.json({ content: cached.content_json, cacheId: cached.id });
    }

    // Cache miss — this will hit the AI. Enforce the free-tier weekly cap.
    const limited = await checkAndRecordAiUsage(teacher);
    if (limited) return limited;

    // 2. Generate
    let content: FinalAnswerContent | MicDropContent | LightningRoundContent | OpinionShiftContent;
    if (activityKey === 'final-answer') {
      content = await generateFinalAnswer(topic, difficulty);
    } else if (activityKey === 'mic-drop') {
      content = await generateMicDrop(topic, difficulty);
    } else if (activityKey === 'opinion-shift') {
      content = await generateOpinionShift(topic, difficulty);
    } else {
      content = await generateLightningRound(topic, difficulty);
    }

    // 3. Store (fire-and-forget)
    const cacheId = await storeCachedContent(activityKey, topic, difficulty, content, 1, variant);

    return NextResponse.json({ content, cacheId });
  } catch (error) {
    console.error('Landing generate error:', error);
    try {
      const emergency = await getCachedContent(activityKey, topic, difficulty, [], variant);
      if (emergency) {
        return NextResponse.json({ content: emergency.content_json, cacheId: emergency.id, degraded: true });
      }
    } catch { /* cache also failed */ }
    // Topic-aware deterministic fallback per activity key
    const fallbacks: Record<LandingActivityKey, () => FinalAnswerContent | MicDropContent | LightningRoundContent | OpinionShiftContent> = {
      'final-answer': () => finalAnswerFallback(topic) as FinalAnswerContent,
      'mic-drop': () => micDropFallback(topic) as MicDropContent,
      'opinion-shift': () => opinionShiftFallback(topic) as OpinionShiftContent,
      'lightning-round': () => lightningRoundFallback(topic) as LightningRoundContent,
    };
    return NextResponse.json({
      content: fallbacks[activityKey](),
      cacheId: null,
      degraded: true,
    });
  }
}

async function generateFinalAnswer(topic: string, difficulty: Difficulty): Promise<FinalAnswerContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      prompt: { type: 'string' },
      targetKeywords: { type: 'array', items: { type: 'string' } },
      sentenceStarter: { type: 'string' },
      exampleAnswer: { type: 'string' },
    },
    required: ['prompt', 'targetKeywords'],
  };

  const aiPrompt = `Generate a closing consolidation prompt for an ESL class.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Create:
- prompt: An open-ended consolidating question (max 15 words) that asks students to summarise or apply today's learning
- targetKeywords: 4-6 key vocabulary words from the topic that strong answers should include
- sentenceStarter: A scaffold sentence beginning (e.g. "I think that..." or "One important thing is...")
- exampleAnswer: A model answer (1-2 sentences) using the target keywords — shown to teacher only

Return JSON.`;

  const data = await generateJSON<{ prompt: string; targetKeywords: string[]; sentenceStarter?: string; exampleAnswer?: string }>(aiPrompt, schema);
  return {
    activityKey: 'final-answer',
    topicContext: topic,
    prompt: data.prompt,
    targetKeywords: data.targetKeywords ?? [],
    ...(data.sentenceStarter && { sentenceStarter: data.sentenceStarter }),
    ...(data.exampleAnswer && { exampleAnswer: data.exampleAnswer }),
  };
}

async function generateMicDrop(topic: string, difficulty: Difficulty): Promise<MicDropContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      prompt: { type: 'string' },
      targetKeywords: { type: 'array', items: { type: 'string' } },
      exampleLine: { type: 'string' },
    },
    required: ['prompt', 'targetKeywords'],
  };

  const aiPrompt = `Generate a "Mic Drop" expressive writing prompt for an ESL closing activity.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Create:
- prompt: An expressive opinion or reflection prompt (max 15 words) asking for a powerful personal statement
- targetKeywords: 4-6 vocabulary words from the topic that strong answers should use
- exampleLine: A punchy, memorable model answer (1 sentence) — shown to teacher only

Return JSON.`;

  const data = await generateJSON<{ prompt: string; targetKeywords: string[]; exampleLine?: string }>(aiPrompt, schema);
  return {
    activityKey: 'mic-drop',
    topicContext: topic,
    prompt: data.prompt,
    targetKeywords: data.targetKeywords ?? [],
    ...(data.exampleLine && { exampleLine: data.exampleLine }),
  };
}

async function generateOpinionShift(topic: string, difficulty: Difficulty): Promise<OpinionShiftContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      beforePrompt: { type: 'string' },
      nowPrompt: { type: 'string' },
    },
    required: ['beforePrompt', 'nowPrompt'],
  };

  const aiPrompt = `Generate an "Opinion Shift" closing reflection activity for an ESL class.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Create two sentence starters for a Before/Now reflection:
- beforePrompt: A sentence starter beginning with "Before this lesson I thought..." — students complete it to describe their original thinking about the topic (max 12 words)
- nowPrompt: A sentence starter beginning with "Now I think..." or "Now I believe..." — students complete it to show how their thinking has changed (max 12 words)

The two prompts should contrast clearly to highlight learning progression.
Return JSON.`;

  const data = await generateJSON<{ beforePrompt: string; nowPrompt: string }>(aiPrompt, schema);
  return { activityKey: 'opinion-shift', topicContext: topic, beforePrompt: data.beforePrompt, nowPrompt: data.nowPrompt };
}

async function generateLightningRound(topic: string, difficulty: Difficulty): Promise<LightningRoundContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      prompts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            targetKeywords: { type: 'array', items: { type: 'string' } },
          },
          required: ['text', 'targetKeywords'],
        },
      },
    },
    required: ['prompts'],
  };

  const aiPrompt = `Generate 4 rapid-fire closing prompts for an ESL Lightning Round activity.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Create exactly 4 prompts in this order:
1. Vocabulary recall — ask for one word or fact from the lesson
2. Quick opinion — ask for a one-sentence personal view
3. Practical application — ask how to use or apply something from the lesson
4. Memorable takeaway — ask what they will remember

Rules for EVERY prompt:
- Maximum 8 words
- Must be answerable with a single word, phrase, or short sentence
- Do NOT write essay-style, open-ended discussion prompts
- At least one prompt must directly contain a targetKeyword

Good examples: "One rainforest animal?", "Biggest rainforest threat?", "Rainforest: helpful or dangerous?", "One way to protect forests?"
Bad example: "What do you think about humanity's impact on the environment?"
Do NOT start any prompt with: "What do you think", "Explain", or "Describe" — these produce essay answers and break the lightning format.

Each prompt:
- text: the prompt, max 8 words
- targetKeywords: 2-4 key vocabulary words expected in strong answers

Return JSON with a "prompts" array of exactly 4 items.`;

  const data = await generateJSON<{ prompts: LightningRoundContent['prompts'] }>(aiPrompt, schema);
  const prompts = Array.isArray(data.prompts) ? data.prompts.slice(0, 5) : [];
  // Pad to minimum 3 if AI returned fewer
  while (prompts.length < 3) {
    prompts.push({ text: `What did you learn about ${topic}?`, targetKeywords: [] });
  }
  return { activityKey: 'lightning-round', topicContext: topic, prompts };
}
