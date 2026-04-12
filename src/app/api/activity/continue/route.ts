import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { ActivityContinueRequest, ActivityContinueResponse, ConversationRoundsContent, FinaleOption, ScenarioRound } from '@/activities/types';
import type { Difficulty } from '@/lib/difficulty';
import { difficultyDescriptions } from '@/lib/difficulty';

// Generic prompt for activities without specific handlers
function genericActivityPrompt(req: ActivityContinueRequest): string {
  const exchangeHistory = req.previousExchanges
    .map((e) => `${e.role}: ${e.content}`)
    .join('\n');

  return `You are helping facilitate an ESL classroom activity.

Activity: ${req.activityKey}
Topic: ${req.topicContext}

Previous exchanges:
${exchangeHistory}

Latest response: ${req.studentResponse}

Request type: ${req.requestType}

${req.requestType === 'follow-up' ? 'Generate a thought-provoking follow-up question that builds on the discussion.' : ''}
${req.requestType === 'challenge' ? 'Generate a challenging question or counter-point to push deeper thinking.' : ''}
${req.requestType === 'hint' ? 'Provide a helpful hint to guide the student.' : ''}
${req.requestType === 'evaluate' ? 'Evaluate with a score (1-10) and constructive feedback.' : ''}

Keep responses appropriate for ESL learners. Be encouraging. Include vocabulary highlights when relevant.`;
}

// Activity-specific prompts
const activityPrompts: Record<string, (req: ActivityContinueRequest) => string> = {
  'would-you-rather': (req) => {
    const exchangeHistory = req.previousExchanges
      .map((e) => `${e.role}: ${e.content}`)
      .join('\n');

    return `You are helping facilitate a "Would You Rather?" ESL discussion activity.

Topic context: ${req.topicContext}

Previous exchanges:
${exchangeHistory}

Latest response: ${req.studentResponse}

Request type: ${req.requestType}

Based on the discussion so far, provide:
${req.requestType === 'follow-up' ? '- A thought-provoking follow-up question that deepens the discussion' : ''}
${req.requestType === 'hint' ? '- A helpful hint to guide the student\'s thinking' : ''}
${req.requestType === 'evaluate' ? '- An evaluation with a score (1-10) and constructive feedback' : ''}
- A brief teacher note with a suggested discussion angle (optional)
- 2-3 vocabulary words that could be introduced (optional)

Keep responses appropriate for ESL learners. Be encouraging and focus on language practice.`;
  },

  'hot-take-arena': (req) => {
    const exchangeHistory = req.previousExchanges
      .map((e) => `${e.role}: ${e.content}`)
      .join('\n');

    return `You are playing "Devil's Advocate" in a classroom debate activity.

Topic context: ${req.topicContext}

Debate so far:
${exchangeHistory}

Latest response: ${req.studentResponse}

Request type: ${req.requestType}

${req.requestType === 'challenge' ? `Generate a challenging counter-argument or question that:
- Pushes the students to think deeper
- Is fair and debatable (not a "gotcha")
- Uses vocabulary appropriate for ESL learners
- Could realistically change someone's mind` : ''}

${req.requestType === 'follow-up' ? `Generate a follow-up question that:
- Builds on what was just said
- Encourages more elaboration
- Helps quieter students participate` : ''}

${req.requestType === 'evaluate' ? `Evaluate the argument:
- Score the strength of reasoning (1-10)
- Note any good vocabulary usage
- Suggest improvements` : ''}

${req.requestType === 'counter-argument' ? `Generate a targeted counter-argument or question that:
- Directly challenges the specific claim just made (not a general debate point)
- Is 1–2 sentences, fair, and not a strawman
- Could be posed verbally by the teacher: "How would you respond to someone who says..."
- Uses vocabulary appropriate for ESL learners
Put the result in the 'challenge' field.` : ''}

Include a teacher note and relevant vocabulary when appropriate.`;
  },

  'interview-lab': (req) => {
    const exchangeHistory = req.previousExchanges
      .map((e) => `${e.role}: ${e.content}`)
      .join('\n');

    return `You are an AI character being interviewed by ESL students.

Topic/Context: ${req.topicContext}

Interview so far:
${exchangeHistory}

Student's question: ${req.studentResponse}

Respond as the character would, keeping in mind:
- Stay in character with consistent personality
- Use vocabulary appropriate for ESL learners
- Give interesting, conversation-continuing answers
- Encourage follow-up questions

Provide the response in 'nextQuestion' field (it's the character's answer).`;
  },
};

const schema: AISchema = {
  type: 'object',
  properties: {
    nextQuestion: { type: 'string' },
    challenge: { type: 'string' },
    hint: { type: 'string' },
    evaluation: {
      type: 'object',
      properties: {
        score: { type: 'number' },
        feedback: { type: 'string' },
      },
    },
    teacherNote: { type: 'string' },
    vocabularyHighlight: {
      type: 'array',
      items: { type: 'string' },
    },
    top3Picks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          text: { type: 'string' },
          tag: { type: 'string' },
        },
      },
    },
    generatedRound: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        readLines: { type: 'array', items: { type: 'string' } },
        situation: { type: 'string' },
        choices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              text: { type: 'string' },
              consequence: { type: 'string' },
              goalDelta: { type: 'number' },
              dangerDelta: { type: 'number' },
            },
          },
        },
      },
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ActivityContinueRequest;
    const { activityKey, requestType } = body;

    // generate-round: scenario-simulator — generate next round based on winning choice
    if (activityKey === 'scenario-simulator' && requestType === 'generate-round') {
      const { storyContext, roundNumber, choiceText, consequence, tone, goalLabel, dangerLabel, goalTotal, dangerTotal, roundHistory, difficulty } =
        JSON.parse(body.studentResponse ?? '{}') as {
          storyContext: string;
          roundNumber: number;
          choiceText: string;
          consequence: string;
          tone: string;
          goalLabel: string;
          dangerLabel: string;
          goalTotal: number;
          dangerTotal: number;
          roundHistory: string;
          difficulty?: string;
        };

      const roundSchema: AISchema = {
        type: 'object',
        properties: {
          generatedRound: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              readLines: { type: 'array', items: { type: 'string' } },
              situation: { type: 'string' },
              choices: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    text: { type: 'string' },
                    consequence: { type: 'string' },
                    goalDelta: { type: 'number' },
                    dangerDelta: { type: 'number' },
                  },
                  required: ['label', 'text', 'consequence', 'goalDelta', 'dangerDelta'],
                },
              },
            },
            required: ['id', 'readLines', 'situation', 'choices'],
          },
        },
        required: ['generatedRound'],
      };

      const arcGuide: Record<number, string> = {
        2: 'first complication — the situation changes because of the Round 1 choice',
        3: 'escalating crisis — a new obstacle or enemy appears',
        4: 'turning point — high risk, high stakes, something must give',
        5: 'final moment — desperate last chance before the finale',
      };

      const langRule = difficultyDescriptions[(difficulty as Difficulty) ?? 'Intermediate'] ?? difficultyDescriptions['Intermediate'];

      const roundPrompt = `Continue a "Scenario Simulator" story for an ESL class.

${langRule}

STORY CONTEXT: ${storyContext}
TONE: ${tone}
GOAL LABEL: ${goalLabel} (current: ${goalTotal}) | DANGER LABEL: ${dangerLabel} (current: ${dangerTotal})

WHAT JUST HAPPENED:
The class chose: "${choiceText}"
Consequence shown: "${consequence}"

ROUND HISTORY (what choices led here):
${roundHistory}

NOW GENERATE ROUND ${roundNumber} — narrative role: ${arcGuide[roundNumber] ?? 'escalate tension'}

Rules:
- readLines: exactly 3 dramatic lines (≤12 words each) that DIRECTLY follow from the consequence above.
  The first line must reference or react to what just happened.
- situation: 1 short sentence (≤15 words) describing the new challenge.
- choices: exactly 3 (labels A/B/C, ≤10 words each):
  - Must be DIFFERENT TYPE of action from any previous round's choices
  - Must be distinct strategies, not variations of the same verb
  - Each consequence: 1–2 sentences of plain narrative text ONLY — NEVER include "goalDelta", "dangerDelta", or any field names in this string
  - goalDelta/dangerDelta: separate number fields, -2 to +2, no easy obvious best answer
- The situation must feel like a new problem, not a repeat of Round ${roundNumber - 1}

Return JSON with a single "generatedRound" object (id: ${roundNumber}).`;

      const parsed = await generateJSON<{ generatedRound: ScenarioRound }>(roundPrompt, roundSchema, { taskClass: 'activity-facilitation' });
      return NextResponse.json({ generatedRound: parsed.generatedRound } satisfies ActivityContinueResponse);
    }

    // pick-top3: scenario-simulator finale — select 3 best student submissions
    if (activityKey === 'scenario-simulator' && requestType === 'pick-top3') {
      const submissions: Array<{ text: string }> = JSON.parse(body.studentResponse ?? '[]');
      const pickSchema: AISchema = {
        type: 'object',
        properties: {
          top3Picks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                text: { type: 'string' },
                tag: { type: 'string' },  // 'bold' | 'safe' | 'risky'
              },
              required: ['label', 'text', 'tag'],
            },
          },
        },
        required: ['top3Picks'],
      };
      const pickPrompt = `Pick the 3 best "final moves" from student submissions for: "${body.topicContext}".
Submissions:
${submissions.map((s, i) => `${i + 1}. ${s.text}`).join('\n')}

Select 3 that are most creative, viable, or dramatically interesting.
Rephrase each as a punchy action phrase ≤12 words (15-word constraint — trim if needed).
Assign a tag to each: "bold" (daring gamble, high risk high reward), "safe" (cautious but reasonable), "risky" (desperate or unconventional).
Order matters: A = best/most viable, B = second best, C = wild card (risky or unusual).
If fewer than 3 submissions exist, invent plausible alternatives.
Return top3Picks array with exactly 3 items, labels A/B/C.`;
      const parsed = await generateJSON<{ top3Picks: FinaleOption[] }>(pickPrompt, pickSchema, { taskClass: 'activity-facilitation' });
      return NextResponse.json({ top3Picks: parsed.top3Picks } satisfies ActivityContinueResponse);
    }

    // conversation-rounds: regenerate scenario on demand
    if (activityKey === 'conversation-rounds' && requestType === 'generate-round') {
      const { topic, difficulty } = JSON.parse(body.studentResponse ?? '{}') as {
        topic: string;
        difficulty: string;
      };
      const convSchema: AISchema = {
        type: 'object',
        properties: {
          scenario: { type: 'string' },
          context: { type: 'string' },
          roles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                goal: { type: 'string' },
                situation: { type: 'string' },
                phrases: { type: 'array', items: { type: 'string' } },
                lifelines: { type: 'array', items: { type: 'string' } },
              },
              required: ['title', 'goal', 'situation', 'phrases', 'lifelines'],
            },
          },
          complications: { type: 'array', items: { type: 'string' } },
        },
        required: ['scenario', 'context', 'roles', 'complications'],
      };
      const diff = (difficulty ?? 'Intermediate') as Difficulty;
      const convPrompt = `Generate a NEW "Conversation Rounds" role-play scenario for an ESL class.
Topic/Scenario: ${topic}
Difficulty: ${difficultyDescriptions[diff]}

Create a DIFFERENT scenario from any you may have seen before — vary the situation and roles.
Two-person scenario where both roles need each other to resolve a conflict or request.

Rules:
- scenario: short descriptive title (max 6 words)
- context: 1-2 sentences setting the scene for the watching class
- roles: EXACTLY 2 role objects with title, goal, situation (1 sentence of private context only), phrases (4-5 starters max 8 words), lifelines (2-3 complete verbatim sentences)
- complications: exactly 4 short twist sentences (max 15 words each)

Return JSON with scenario, context, roles (array of 2), complications (array of 4).`;
      const convData = await generateJSON<{
        scenario: string; context: string;
        roles: ConversationRoundsContent['roles'];
        complications: string[];
      }>(convPrompt, convSchema, { taskClass: 'activity-facilitation' });
      const newContent: ConversationRoundsContent = {
        activityKey: 'conversation-rounds',
        topicContext: topic,
        scenario: convData.scenario ?? topic,
        context: convData.context ?? `Two students will role-play a situation related to ${topic}.`,
        roles: convData.roles,
        complications: (convData.complications ?? []).slice(0, 4),
      };
      return NextResponse.json({ regeneratedContent: newContent } satisfies ActivityContinueResponse);
    }

    // Get the appropriate prompt generator (or use generic fallback)
    const promptGenerator = activityPrompts[activityKey] || genericActivityPrompt;
    const prompt = promptGenerator(body);

    const parsed = await generateJSON<ActivityContinueResponse>(prompt, schema, {
      taskClass: 'activity-facilitation',
    });

    // Ensure we have at least one of the expected fields
    const response: ActivityContinueResponse = {
      nextQuestion: parsed.nextQuestion,
      challenge: parsed.challenge,
      hint: parsed.hint,
      evaluation: parsed.evaluation,
      teacherNote: parsed.teacherNote,
      vocabularyHighlight: parsed.vocabularyHighlight,
    };

    // Provide defaults if AI didn't return expected field
    if (requestType === 'follow-up' && !response.nextQuestion) {
      response.nextQuestion = 'Can you tell us more about your thinking?';
    }
    if (requestType === 'challenge' && !response.challenge) {
      response.challenge = 'What would you say to someone who completely disagrees?';
    }
    if (requestType === 'counter-argument' && !response.challenge) {
      response.challenge = 'What evidence would you give to someone who completely disagrees?';
    }
    if (requestType === 'hint' && !response.hint) {
      response.hint = 'Think about the consequences of each choice.';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Activity continue error:', error);

    // Return graceful fallback
    const fallbackResponse: ActivityContinueResponse = {
      nextQuestion: 'What else can you tell us about your opinion?',
      teacherNote: 'Consider asking students to elaborate on their reasoning.',
    };

    return NextResponse.json(fallbackResponse);
  }
}
