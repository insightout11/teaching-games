// Shared generators for closing "landing" activities. These are called from BOTH
// /api/lesson-plan/generate (full-lesson pre-generation) and /api/landing/generate (on-demand
// landing regeneration). Keep them here so the two routes can never drift — previously each route
// had its own copy and the landing one silently missed source grounding + the language-rule sweep.

import { generateJSON, type AISchema } from '@/lib/ai';
import { languageRule, type Difficulty } from '@/lib/difficulty';
import type {
  FinalAnswerContent,
  MicDropContent,
  LightningRoundContent,
  OpinionShiftContent,
} from '@/activities/types';

export async function generateFinalAnswer(
  topic: string,
  difficulty: Difficulty,
  sourceContext = '',
): Promise<FinalAnswerContent> {
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
${languageRule(difficulty)}
${sourceContext}

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

export async function generateMicDrop(
  topic: string,
  difficulty: Difficulty,
  sourceContext = '',
): Promise<MicDropContent> {
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
${languageRule(difficulty)}
${sourceContext}

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

// Open, neutral reflection scaffolds the student completes in their OWN words. Deliberately static
// (not AI-written): AI versions finished the thought with a specific opinion and assumed the
// student's view had changed, reading as if telling them what to conclude.
export function generateOpinionShift(topic: string): OpinionShiftContent {
  return {
    activityKey: 'opinion-shift',
    topicContext: topic,
    beforePrompt: 'Before today, I thought…',
    nowPrompt: 'Now I think…',
  };
}

export async function generateLightningRound(
  topic: string,
  difficulty: Difficulty,
  sourceContext = '',
): Promise<LightningRoundContent> {
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
${languageRule(difficulty)}
${sourceContext}

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
  while (prompts.length < 3) {
    prompts.push({ text: `What did you learn about ${topic}?`, targetKeywords: [] });
  }
  return { activityKey: 'lightning-round', topicContext: topic, prompts };
}
