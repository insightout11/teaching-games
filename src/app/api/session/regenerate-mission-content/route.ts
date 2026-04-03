import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { difficultyDescriptions } from '@/lib/difficulty';
import type { Difficulty } from '@/lib/difficulty';
import type { ActivityGeneratedContent } from '@/activities/types';

// Activities that can be regenerated with mission context
const MISSION_AWARE_KEYS = new Set(['would-you-rather', 'expert-panel', 'scenario-simulator', 'hot-take-arena', 'opinion-shift']);

function missionContextBlock(context: string, contextType: 'mission' | 'characters'): string {
  if (contextType === 'mission') {
    return `\nThe class chose this question as their lesson mission: "${context}"\nUse this to lightly shape examples, vocabulary, and scenarios — but do NOT change the subject of the content. The topic above always takes priority. Keep the format, difficulty level, and structure identical.\n`;
  }
  return `\nThe class started the lesson with these character perspectives:\n${context}\nUse these themes to lightly shape examples, vocabulary, and scenarios — but do NOT change the subject of the content. The topic above always takes priority. Keep the format, difficulty level, and structure identical.\n`;
}

async function regenWouldYouRather(topic: string, difficulty: Difficulty, context: string, contextType: 'mission' | 'characters'): Promise<ActivityGeneratedContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      dilemmas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            optionA: { type: 'string' },
            optionB: { type: 'string' },
            discussionPrompt: { type: 'string' },
          },
          required: ['id', 'optionA', 'optionB', 'discussionPrompt'],
        },
      },
      potentialFollowUps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            dilemmaId: { type: 'string' },
            questions: { type: 'array', items: { type: 'string' } },
          },
          required: ['dilemmaId', 'questions'],
        },
      },
    },
    required: ['dilemmas', 'potentialFollowUps'],
  };

  const prompt = `Generate 5 "Would You Rather?" dilemmas for an ESL classroom.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}
${missionContextBlock(context, contextType)}
Each dilemma needs two options (both appealing OR both unappealing), a discussion prompt, and 3 follow-up questions.
Return JSON with 'dilemmas' array and 'potentialFollowUps' array (each with dilemmaId and questions).`;

  const parsed = await generateJSON<{ dilemmas: unknown[]; potentialFollowUps: Array<{ dilemmaId: string; questions: string[] }> }>(prompt, schema);
  const followUpsRecord: Record<string, string[]> = {};
  if (Array.isArray(parsed.potentialFollowUps)) {
    for (const item of parsed.potentialFollowUps) {
      if (item.dilemmaId && Array.isArray(item.questions)) {
        followUpsRecord[item.dilemmaId] = item.questions;
      }
    }
  }
  return { activityKey: 'would-you-rather', topicContext: topic, dilemmas: parsed.dilemmas, potentialFollowUps: followUpsRecord };
}

async function regenHotTakeArena(topic: string, difficulty: Difficulty, context: string, contextType: 'mission' | 'characters'): Promise<ActivityGeneratedContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      statement: { type: 'string' },
      proArguments: { type: 'array', items: { type: 'string' } },
      conArguments: { type: 'array', items: { type: 'string' } },
      devilsAdvocatePro: { type: 'array', items: { type: 'string' } },
      devilsAdvocateCon: { type: 'array', items: { type: 'string' } },
      vocabularyWords: { type: 'array', items: { type: 'string' } },
    },
    required: ['statement', 'proArguments', 'conArguments', 'devilsAdvocatePro', 'devilsAdvocateCon', 'vocabularyWords'],
  };

  const debateSubject = contextType === 'mission' ? context : topic;
  const prompt = `Generate a hot take debate for an ESL classroom inspired by this question: "${debateSubject}"
Difficulty: ${difficultyDescriptions[difficulty]}
The "statement" field MUST be a bold opinionated assertion that students can AGREE or DISAGREE with — NOT a question. It should take a clear stance (e.g. "Bitcoin is a far better investment than Ethereum right now"). Never use question marks in the statement.
Create 3-4 pro arguments, 3-4 con arguments, 3 devil's advocate challenges per side, and 5-8 vocabulary words.
Return JSON with: statement, proArguments, conArguments, devilsAdvocatePro, devilsAdvocateCon, vocabularyWords.`;

  const data = await generateJSON<Record<string, unknown>>(prompt, schema);
  return { activityKey: 'hot-take-arena', topicContext: topic, ...data };
}

async function regenScenarioSimulator(topic: string, difficulty: Difficulty, context: string, contextType: 'mission' | 'characters'): Promise<ActivityGeneratedContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      setup: { type: 'string' },
      round1: {
        type: 'object',
        properties: {
          situation: { type: 'string' },
          options: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, text: { type: 'string' } }, required: ['label', 'text'] } },
        },
        required: ['situation', 'options'],
      },
    },
    required: ['title', 'setup', 'round1'],
  };

  const prompt = `Generate a scenario simulator opening for an ESL classroom.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}
${missionContextBlock(context, contextType)}
Create: a title, a dramatic setup paragraph, and Round 1 with a situation and 3 options (A/B/C).
Return JSON with: title, setup, round1 (situation + options array with label and text).`;

  const data = await generateJSON<Record<string, unknown>>(prompt, schema);
  return { activityKey: 'scenario-simulator', topicContext: topic, ...data };
}

async function regenExpertPanel(topic: string, difficulty: Difficulty, context: string, contextType: 'mission' | 'characters'): Promise<ActivityGeneratedContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      roles: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } }, required: ['name', 'description'] } },
      questions: { type: 'array', items: { type: 'string' } },
    },
    required: ['roles', 'questions'],
  };

  const prompt = `Generate an expert panel for an ESL classroom.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}
${missionContextBlock(context, contextType)}
Create 6 expert roles and 6 panel questions that put these experts in interesting disagreement.
Return JSON with: roles (array of name + description), questions (array of strings).`;

  const data = await generateJSON<Record<string, unknown>>(prompt, schema);
  return { activityKey: 'expert-panel', topicContext: topic, ...data };
}

async function regenOpinionShift(topic: string, difficulty: Difficulty, context: string, contextType: 'mission' | 'characters'): Promise<ActivityGeneratedContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      beforePrompt: { type: 'string' },
      nowPrompt: { type: 'string' },
    },
    required: ['beforePrompt', 'nowPrompt'],
  };

  const missionLine = contextType === 'mission'
    ? `The class chose this question as their lesson mission: "${context}"\nThe sentence starters should specifically connect to what students might have thought about this question before vs. after the lesson.`
    : missionContextBlock(context, contextType);

  const prompt = `Generate an "Opinion Shift" closing reflection activity for an ESL class.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}
${missionLine}

Create two sentence starters for a Before/Now reflection:
- beforePrompt: A sentence starter beginning with "Before this lesson I thought..." — tied to the mission question above (max 12 words)
- nowPrompt: A sentence starter beginning with "Now I think..." or "Now I believe..." — tied to the mission question above (max 12 words)

The two prompts should contrast clearly to highlight learning progression.
Return JSON.`;

  const data = await generateJSON<{ beforePrompt: string; nowPrompt: string }>(prompt, schema);
  return { activityKey: 'opinion-shift', topicContext: topic, beforePrompt: data.beforePrompt, nowPrompt: data.nowPrompt };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      sessionId: string;
      context: string;
      contextType: 'mission' | 'characters';
      activityKeys: string[];
      topic: string;
      difficulty: Difficulty;
    };

    const { context, contextType, activityKeys, topic, difficulty } = body;

    if (!context || !activityKeys || !topic || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedContent: Record<string, ActivityGeneratedContent> = {};
    const regenPromises: Promise<void>[] = [];

    for (const key of activityKeys) {
      if (!MISSION_AWARE_KEYS.has(key)) continue;

      const regen = async () => {
        try {
          let result: ActivityGeneratedContent | null = null;
          if (key === 'would-you-rather') result = await regenWouldYouRather(topic, difficulty, context, contextType);
          else if (key === 'hot-take-arena') result = await regenHotTakeArena(topic, difficulty, context, contextType);
          else if (key === 'scenario-simulator') result = await regenScenarioSimulator(topic, difficulty, context, contextType);
          else if (key === 'expert-panel') result = await regenExpertPanel(topic, difficulty, context, contextType);
          else if (key === 'opinion-shift') result = await regenOpinionShift(topic, difficulty, context, contextType);
          if (result) updatedContent[key] = result;
        } catch (err) {
          console.warn(`[regenerate-mission-content] Failed to regen ${key}:`, err);
        }
      };

      regenPromises.push(regen());
    }

    await Promise.allSettled(regenPromises);

    return NextResponse.json({ success: true, updatedContent });
  } catch (error) {
    console.error('[regenerate-mission-content] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
