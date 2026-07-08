import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import type {
  ActivityContinueRequest,
  ActivityContinueResponse,
  ConversationRoundsContent,
  DesignStudioBrief,
  DesignStudioRound,
  DesignStudioState,
  FinaleOption,
  ScenarioRound,
} from '@/activities/types';
import type { Difficulty } from '@/lib/difficulty';
import { difficultyDescriptions } from '@/lib/difficulty';
import { normalizeDesignStudioBrief, normalizeDesignStudioRound } from '@/lib/design-studio';
import type { WorldFlightDesignMissionContext } from '@/lib/world-flight/investigations';

export const maxDuration = 60;

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

const designStudioOptionSchema: AISchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    benefit: { type: 'string' },
    tradeoff: { type: 'string' },
    designChange: { type: 'string' },
  },
  required: ['id', 'title', 'description', 'benefit', 'tradeoff', 'designChange'],
};

const designStudioRoundSchema: AISchema = {
  type: 'object',
  properties: {
    designStudioRound: {
      type: 'object',
      properties: {
        stage: { type: 'string' },
        question: { type: 'string' },
        whyItMatters: { type: 'string' },
        designSummary: { type: 'string' },
        options: {
          type: 'array',
          items: designStudioOptionSchema,
        },
      },
      required: ['stage', 'question', 'whyItMatters', 'designSummary', 'options'],
    },
  },
  required: ['designStudioRound'],
};

const designStudioBriefSchema: AISchema = {
  type: 'object',
  properties: {
    designStudioBrief: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' },
        intendedUsers: { type: 'array', items: { type: 'string' } },
        coreFeatures: { type: 'array', items: { type: 'string' } },
        evidenceAndReasoning: { type: 'array', items: { type: 'string' } },
        remainingTradeoffs: { type: 'array', items: { type: 'string' } },
        pitch: { type: 'string' },
      },
      required: ['title', 'summary', 'intendedUsers', 'coreFeatures', 'evidenceAndReasoning', 'remainingTradeoffs', 'pitch'],
    },
  },
  required: ['designStudioBrief'],
};

function formatDesignDecisions(state: DesignStudioState): string {
  if (state.decisions.length === 0) return 'No decisions yet.';
  return state.decisions.map((decision) => (
    `${decision.roundNumber}. ${decision.question}\n`
    + `Chosen: ${decision.selectedOption.title}\n`
    + `Design change: ${decision.selectedOption.designChange}\n`
    + `Accepted tradeoff: ${decision.selectedOption.tradeoff}`
  )).join('\n\n');
}

function formatWorldFlightMissionEvidence(mission?: WorldFlightDesignMissionContext): string {
  if (!mission?.evidence?.length) return 'No World Flight evidence attached.';

  return mission.evidence.slice(0, 3).map((evidence, index) => (
    `${index + 1}. ${evidence.city} - ${evidence.requirementLabel}\n`
    + `Lesson: ${evidence.focusTitle}\n`
    + `Key idea: ${evidence.keyIdea || 'Not recorded'}\n`
    + `Tradeoff: ${evidence.tradeoff || 'Not recorded'}\n`
    + `Possible design use: ${evidence.designUse || 'Not recorded'}`
  )).join('\n\n');
}

export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  // This will hit the AI. Enforce the free-tier weekly cap.
  const limited = await checkAndRecordAiUsage(teacher);
  if (limited) return limited;

  try {
    const body = (await request.json()) as ActivityContinueRequest;
    const { activityKey, requestType } = body;

    if (activityKey === 'design-studio' && requestType === 'design-studio-start') {
      const {
        challenge,
        originalIdeas,
        difficulty,
        successCriteria,
        worldFlightMission,
      } = JSON.parse(body.studentResponse ?? '{}') as {
        challenge: string;
        originalIdeas: string[];
        difficulty?: string;
        successCriteria?: string[];
        worldFlightMission?: WorldFlightDesignMissionContext;
      };
      const languageRule = difficultyDescriptions[(difficulty as Difficulty) ?? 'Intermediate']
        ?? difficultyDescriptions.Intermediate;
      const ideas = (originalIdeas ?? []).slice(0, 20).map((idea, index) => `${index + 1}. ${idea}`).join('\n');
      const prompt = `Facilitate the first decision in a progressive classroom Design Studio.

${languageRule}

DESIGN CHALLENGE:
${challenge}

STUDENT STARTING IDEAS:
${ideas || challenge}

SUCCESS CRITERIA:
${(successCriteria ?? []).map((criterion) => `- ${criterion}`).join('\n')}

CROSS-CITY EVIDENCE:
${formatWorldFlightMissionEvidence(worldFlightMission)}

Synthesize the ideas into exactly three genuinely different starting design directions.
This is a class vote, so none may be obviously correct.

Return one designStudioRound:
- stage: "Starting Direction"
- question: one direct question asking which direction should become the class design
- whyItMatters: one short sentence
- designSummary: one neutral sentence describing the challenge before a direction is selected
- options: exactly three options with ids A, B, C
- each option needs a short title, concrete description, real benefit, meaningful tradeoff, and designChange
- designChange must be a complete 1-2 sentence summary of what the shared design becomes if selected
- preserve the students' ideas; do not replace the subject with a different project
- when cross-city evidence is attached, make the options respond to its real ideas without inventing facts about those cities`;

      const parsed = await generateJSON<{ designStudioRound: DesignStudioRound }>(
        prompt,
        designStudioRoundSchema,
        { taskClass: 'activity-facilitation' },
      );
      const state: DesignStudioState = {
        challenge,
        originalIdeas: originalIdeas ?? [],
        designSummary: '',
        decisions: [],
      };
      return NextResponse.json({
        designStudioRound: normalizeDesignStudioRound(parsed.designStudioRound, state),
      } satisfies ActivityContinueResponse);
    }

    if (activityKey === 'design-studio' && requestType === 'design-studio-next') {
      const {
        state,
        difficulty,
        successCriteria,
        maxDecisions,
        worldFlightMission,
      } = JSON.parse(body.studentResponse ?? '{}') as {
        state: DesignStudioState;
        difficulty?: string;
        successCriteria?: string[];
        maxDecisions?: number;
        worldFlightMission?: WorldFlightDesignMissionContext;
      };
      const languageRule = difficultyDescriptions[(difficulty as Difficulty) ?? 'Intermediate']
        ?? difficultyDescriptions.Intermediate;
      const nextNumber = state.decisions.length + 1;
      const remaining = Math.max(1, (maxDecisions ?? 6) - state.decisions.length);
      const stageGuide = ['Purpose', 'People', 'Core Features', 'Access and Fairness', 'Constraint and Adaptation', 'Final Refinement'];
      const suggestedStage = stageGuide[Math.min(nextNumber - 1, stageGuide.length - 1)];
      const prompt = `Continue a progressive classroom Design Studio.

${languageRule}

CHALLENGE:
${state.challenge}

CURRENT SHARED DESIGN:
${state.designSummary}

DECISIONS ALREADY LOCKED:
${formatDesignDecisions(state)}

SUCCESS CRITERIA:
${(successCriteria ?? []).map((criterion) => `- ${criterion}`).join('\n')}

CROSS-CITY EVIDENCE:
${formatWorldFlightMissionEvidence(worldFlightMission)}

Generate the next contextual design decision. There are ${remaining} decisions remaining.
Suggested progress stage: ${suggestedStage}.

Rules:
- Build directly from the current design and locked decisions.
- Never contradict, erase, or quietly replace an earlier class decision.
- Do not repeat a question already answered.
- Ask about the most important unresolved design issue.
- Present exactly three meaningfully different choices with ids A, B, C.
- No option may be obviously correct. Every option needs a real benefit and tradeoff.
- designChange must be a complete updated 1-3 sentence design summary that preserves all earlier decisions and applies that option.
- Keep choices concrete enough for students to debate aloud.
- designSummary must accurately summarize the current design before this new vote.
- when cross-city evidence is attached, progressively connect it to the design; do not merely name cities or invent new city facts.`;

      const parsed = await generateJSON<{ designStudioRound: DesignStudioRound }>(
        prompt,
        designStudioRoundSchema,
        { taskClass: 'activity-facilitation' },
      );
      return NextResponse.json({
        designStudioRound: normalizeDesignStudioRound(parsed.designStudioRound, state),
      } satisfies ActivityContinueResponse);
    }

    if (activityKey === 'design-studio' && requestType === 'design-studio-finalize') {
      const {
        state,
        difficulty,
        successCriteria,
        worldFlightMission,
      } = JSON.parse(body.studentResponse ?? '{}') as {
        state: DesignStudioState;
        difficulty?: string;
        successCriteria?: string[];
        worldFlightMission?: WorldFlightDesignMissionContext;
      };
      const languageRule = difficultyDescriptions[(difficulty as Difficulty) ?? 'Intermediate']
        ?? difficultyDescriptions.Intermediate;
      const prompt = `Create the final class design brief from a completed progressive Design Studio.

${languageRule}

CHALLENGE:
${state.challenge}

FINAL SHARED DESIGN:
${state.designSummary}

CLASS DECISION HISTORY:
${formatDesignDecisions(state)}

SUCCESS CRITERIA:
${(successCriteria ?? []).map((criterion) => `- ${criterion}`).join('\n')}

CROSS-CITY EVIDENCE:
${formatWorldFlightMissionEvidence(worldFlightMission)}

Return one designStudioBrief:
- title: a memorable, specific design name
- summary: 2-4 sentences accurately describing the final design
- intendedUsers: 2-4 groups the design serves
- coreFeatures: 4-7 concrete features created by the class decisions
- evidenceAndReasoning: 3-6 concise reasons tied to benefits, accepted tradeoffs, and any attached cross-city evidence
- remainingTradeoffs: 2-4 honest unresolved risks or compromises
- pitch: a persuasive 2-3 sentence class presentation

Do not invent decisions the class did not make.
When cross-city evidence is attached, explicitly explain how the final design learned from each city without inventing facts.`;

      const parsed = await generateJSON<{ designStudioBrief: DesignStudioBrief }>(
        prompt,
        designStudioBriefSchema,
        { taskClass: 'activity-facilitation' },
      );
      return NextResponse.json({
        designStudioBrief: normalizeDesignStudioBrief(parsed.designStudioBrief, state),
      } satisfies ActivityContinueResponse);
    }

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
