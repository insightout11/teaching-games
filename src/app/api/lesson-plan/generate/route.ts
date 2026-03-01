import { NextRequest, NextResponse } from 'next/server';
import { generateJSON as _generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { bulkSemaphore } from '@/lib/ai/concurrency';

const generateJSON: typeof _generateJSON = (prompt, schema, options) =>
  bulkSemaphore.run(() => _generateJSON(prompt, schema, { ...options, taskClass: 'bulk-generation' }));
import type { Difficulty } from '@/stores/session-store';
import { TargetTone } from '@/games/tone-transformer/types';
import type {
  LessonPlanGenerateRequest,
  LessonPlanGenerateResponse,
  ActivityGeneratedContent,
  WouldYouRatherContent,
  HotTakeArenaContent,
  TwoTruthsContent,
  RankItContent,
  FactDetectiveContent,
  ExpertPanelContent,
  ScenarioSimulatorContent,
  InterviewLabContent,
  ProblemSolversContent,
  QuickPulseContent,
  VocabRadarContent,
  PredictionRoundContent,
  SceneIgniterContent,
  GameGeneratedContent,
  VocabSprintGeneratedContent,
  GrammarBossGeneratedContent,
  WordChainGeneratedContent,
  SynonymShowdownGeneratedContent,
  ErrorHunterGeneratedContent,
  DialogueDetectiveGeneratedContent,
  ToneTransformerGeneratedContent,
  ConnectionGeneratedContent,
  ConnectionsGeneratedContent,
} from '@/activities/types';

// Difficulty descriptions for AI prompts
const difficultyDescriptions: Record<Difficulty, string> = {
  'Beginner': 'A1 level - Use very simple vocabulary and short sentences. Focus on basic concepts.',
  'Easy': 'A2 level - Use simple but functional vocabulary. Keep sentences straightforward.',
  'Intermediate': 'B1/B2 level - Use natural vocabulary and moderate complexity. Include some idioms.',
  'Advanced': 'C1 level - Use sophisticated vocabulary and complex sentence structures.',
  'Expert': 'C2/Native level - Use nuanced, academic language with subtle distinctions.',
};

// ============================================
// Activity Generators
// ============================================

async function generateWouldYouRather(topic: string, difficulty: Difficulty): Promise<WouldYouRatherContent> {
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

Each dilemma needs two options (both appealing OR both unappealing), a discussion prompt, and 3 follow-up questions.
Return JSON with 'dilemmas' array and 'potentialFollowUps' array (each with dilemmaId and questions).`;

  const parsed = await generateJSON<{ dilemmas: WouldYouRatherContent['dilemmas']; potentialFollowUps: Array<{ dilemmaId: string; questions: string[] }> }>(prompt, schema);

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

async function generateHotTakeArena(topic: string, difficulty: Difficulty): Promise<HotTakeArenaContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      statement: { type: 'string' },
      proArguments: { type: 'array', items: { type: 'string' } },
      conArguments: { type: 'array', items: { type: 'string' } },
      devilsAdvocate: {
        type: 'object',
        properties: {
          proChallenges: { type: 'array', items: { type: 'string' } },
          conChallenges: { type: 'array', items: { type: 'string' } },
        },
        required: ['proChallenges', 'conChallenges'],
      },
      vocabularyHighlights: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            word: { type: 'string' },
            definition: { type: 'string' },
          },
          required: ['word', 'definition'],
        },
      },
    },
    required: ['statement', 'proArguments', 'conArguments', 'devilsAdvocate', 'vocabularyHighlights'],
  };

  const prompt = `Generate a debate topic for ESL "Hot Take Arena".
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Create a provocative statement, 3-4 pro/con arguments, 3 devil's advocate challenges per side, and 5-8 vocabulary words, each with a short student-facing definition (max 15 words).`;

  const parsed = await generateJSON<{
    statement: string;
    proArguments: string[];
    conArguments: string[];
    devilsAdvocate: { proChallenges: string[]; conChallenges: string[] };
    vocabularyHighlights: Array<{ word: string; definition: string }>;
  }>(prompt, schema);
  return { activityKey: 'hot-take-arena', topicContext: topic, ...parsed };
}

async function generateTwoTruths(topic: string, difficulty: Difficulty): Promise<TwoTruthsContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      rounds: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            statements: { type: 'array', items: { type: 'string' } },
            fabricationIndex: { type: 'number' },
            explanation: { type: 'string' },
            difficulty: { type: 'string' },
          },
          required: ['id', 'statements', 'fabricationIndex', 'explanation', 'difficulty'],
        },
      },
    },
    required: ['rounds'],
  };

  const prompt = `Generate 5 rounds of "Two Truths & A Fabrication" for ESL class.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Each round: 3 statements (2 true, 1 false about the topic), fabricationIndex (0-2), explanation why it's false.
Mix difficulty levels (easy/medium/hard).`;

  const parsed = await generateJSON<{ rounds: TwoTruthsContent['rounds'] }>(prompt, schema);
  return { activityKey: 'two-truths', topicContext: topic, rounds: parsed.rounds };
}

async function generateRankIt(topic: string, difficulty: Difficulty): Promise<RankItContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      challenges: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            prompt: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  hiddenFact: { type: 'string' },
                },
                required: ['id', 'name', 'hiddenFact'],
              },
            },
            revealFacts: { type: 'array', items: { type: 'string' } },
          },
          required: ['id', 'prompt', 'items', 'revealFacts'],
        },
      },
    },
    required: ['challenges'],
  };

  const prompt = `Generate 3 "Rank It!" challenges for ESL class.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Each challenge: a ranking prompt, 4-5 items with hidden facts that might change minds.
Example: "Rank these animals by survival ability" with surprising facts about each.`;

  const parsed = await generateJSON<{ challenges: RankItContent['challenges'] }>(prompt, schema);
  return { activityKey: 'rank-it', topicContext: topic, challenges: parsed.challenges };
}

async function generateFactDetective(topic: string, difficulty: Difficulty): Promise<FactDetectiveContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      claims: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            statement: { type: 'string' },
            isTrue: { type: 'boolean' },
            explanation: { type: 'string' },
            vocabulary: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  word: { type: 'string' },
                  definition: { type: 'string' },
                },
                required: ['word', 'definition'],
              },
            },
            difficulty: { type: 'string' },
          },
          required: ['id', 'statement', 'isTrue', 'explanation', 'vocabulary', 'difficulty'],
        },
      },
    },
    required: ['claims'],
  };

  const prompt = `Generate 6 fact/myth claims for "Fact Detective" ESL activity.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Mix of true facts and plausible myths. Include explanation and 2-3 vocabulary words per claim, each with a short student-facing definition (max 15 words).
Make claims progressively harder to guess.`;

  const parsed = await generateJSON<{ claims: FactDetectiveContent['claims'] }>(prompt, schema);
  return { activityKey: 'fact-detective', topicContext: topic, claims: parsed.claims };
}

async function generateExpertPanel(topic: string, difficulty: Difficulty): Promise<ExpertPanelContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      roles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            expertise: { type: 'array', items: { type: 'string' } },
            suggestedVocabulary: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  word: { type: 'string' },
                  definition: { type: 'string' },
                },
                required: ['word', 'definition'],
              },
            },
          },
          required: ['id', 'title', 'description', 'expertise', 'suggestedVocabulary'],
        },
      },
      starterQuestions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            targetRoleId: { type: 'string' },
            question: { type: 'string' },
            followUpHints: { type: 'array', items: { type: 'string' } },
          },
          required: ['id', 'targetRoleId', 'question', 'followUpHints'],
        },
      },
    },
    required: ['roles', 'starterQuestions'],
  };

  const prompt = `Generate an "Expert Panel" activity for ESL class.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Create 4 expert roles related to the topic (e.g., scientist, historian, economist, activist).
Each role: title, description, expertise areas, suggested vocabulary with short student-facing definitions (max 15 words each).
Create 6 starter questions (mix of roles targeted), each with follow-up hints.`;

  const parsed = await generateJSON<{ roles: ExpertPanelContent['roles']; starterQuestions: ExpertPanelContent['starterQuestions'] }>(prompt, schema);
  return { activityKey: 'expert-panel', topicContext: topic, roles: parsed.roles, starterQuestions: parsed.starterQuestions };
}

async function generateScenarioSimulator(topic: string, difficulty: Difficulty): Promise<ScenarioSimulatorContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      scenario: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          context: { type: 'string' },
          objective: { type: 'string' },
        },
        required: ['title', 'context', 'objective'],
      },
      roles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            goals: { type: 'array', items: { type: 'string' } },
          },
          required: ['id', 'name', 'description', 'goals'],
        },
      },
      initialSituation: { type: 'string' },
      branchingPoints: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            situation: { type: 'string' },
            choices: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  action: { type: 'string' },
                  consequence: { type: 'string' },
                },
                required: ['id', 'action', 'consequence'],
              },
            },
          },
          required: ['id', 'situation', 'choices'],
        },
      },
    },
    required: ['scenario', 'roles', 'initialSituation', 'branchingPoints'],
  };

  const prompt = `Generate a "Scenario Simulator" for ESL class.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Create an engaging scenario with:
- Title, context, and objective
- 3-4 roles with different goals
- Initial situation
- 4 branching points with 2-3 choices each, showing consequences`;

  const parsed = await generateJSON<{
    scenario: { title: string; context: string; objective: string };
    roles: Array<{ id: string; name: string; description: string; goals: string[] }>;
    initialSituation: string;
    branchingPoints: Array<{ id: string; situation: string; choices: Array<{ id: string; action: string; consequence: string }> }>;
  }>(prompt, schema);
  return { activityKey: 'scenario-simulator', topicContext: topic, ...parsed };
}

async function generateInterviewLab(topic: string, difficulty: Difficulty): Promise<InterviewLabContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      character: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          role: { type: 'string' },
          background: { type: 'string' },
          personality: { type: 'string' },
          expertise: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'role', 'background', 'personality', 'expertise'],
      },
      context: { type: 'string' },
      sampleQuestions: { type: 'array', items: { type: 'string' } },
      registers: { type: 'array', items: { type: 'string' } },
    },
    required: ['character', 'context', 'sampleQuestions', 'registers'],
  };

  const prompt = `Generate an "Interview Lab" character for ESL class.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Create an interesting character to interview:
- Name, role, background, personality
- Expertise areas
- Interview context
- 5 sample questions students could ask
- Registers: ['formal', 'casual']`;

  const parsed = await generateJSON<{
    character: { name: string; role: string; background: string; personality: string; expertise: string[] };
    context: string;
    sampleQuestions: string[];
    registers: ('formal' | 'casual')[];
  }>(prompt, schema);
  return { activityKey: 'interview-lab', topicContext: topic, ...parsed };
}

async function generateProblemSolvers(topic: string, difficulty: Difficulty): Promise<ProblemSolversContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      problem: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          resources: { type: 'array', items: { type: 'string' } },
          successCriteria: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'description', 'resources', 'successCriteria'],
      },
      constraints: { type: 'array', items: { type: 'string' } },
      complications: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            trigger: { type: 'string' },
            complication: { type: 'string' },
            hints: { type: 'array', items: { type: 'string' } },
          },
          required: ['id', 'trigger', 'complication', 'hints'],
        },
      },
    },
    required: ['problem', 'constraints', 'complications'],
  };

  const prompt = `Generate a "Problem Solvers" challenge for ESL class.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Create:
- Problem with title, description, 5-6 available resources, success criteria
- 3-4 constraints
- 3 complications that force adaptation (with hints)

Example: "Design a city for 10 million people with no cars"`;

  const parsed = await generateJSON<{
    problem: { title: string; description: string; resources: string[]; successCriteria: string[] };
    constraints: string[];
    complications: Array<{ id: string; trigger: string; complication: string; hints: string[] }>;
  }>(prompt, schema);
  return { activityKey: 'problem-solvers', topicContext: topic, ...parsed };
}

async function generateQuickPulse(topic: string, difficulty: Difficulty): Promise<QuickPulseContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      prompts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            text: { type: 'string' },
          },
          required: ['type', 'text'],
        },
      },
    },
    required: ['prompts'],
  };

  const prompt = `Generate 3 quick icebreaker mini-prompts for an ESL classroom about the topic below.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Prompt types (use this exact order): likert, yesno, likert
- likert: A statement students rate 1–5 (1=strongly disagree, 5=strongly agree). Keep it engaging and topic-relevant.
- yesno: A yes/no question about the topic. Should be interesting and spark curiosity.

Rules:
- Keep each prompt short (max 12 words)
- All prompts must clearly relate to the topic
- Avoid controversial or personal topics

Return JSON with a "prompts" array of exactly 3 objects, each with "type" (likert or yesno) and "text".`;

  const parsed = await generateJSON<{ prompts: Array<{ type: string; text: string }> }>(prompt, schema);

  return {
    activityKey: 'quick-pulse',
    topicContext: topic,
    prompts: [
      { type: 'likert', text: parsed.prompts[0]?.text ?? 'I find this topic interesting.' },
      { type: 'yesno', text: parsed.prompts[1]?.text ?? 'Have you experienced this before?' },
      { type: 'likert', text: parsed.prompts[2]?.text ?? 'I want to learn more about this topic.' },
    ],
  };
}

async function generateVocabRadar(topic: string, difficulty: Difficulty): Promise<VocabRadarContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      words: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            word: { type: 'string' },
            partOfSpeech: { type: 'string' },
            definition: { type: 'string' },
          },
          required: ['word', 'partOfSpeech', 'definition'],
        },
      },
    },
    required: ['words'],
  };

  const prompt = `Generate 5 key vocabulary words for an ESL classroom lesson about the topic below.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Choose words that:
- Are central to understanding the topic
- Range from more common to more specialised (mix of familiar and new words)
- Are appropriate for the difficulty level

For each word include the part of speech AND a short definition (max 15 words, plain English, suitable for language learners — no circular definitions).

Return JSON with a "words" array of exactly 5 objects, each with "word", "partOfSpeech", and "definition".`;

  const parsed = await generateJSON<{ words: Array<{ word: string; partOfSpeech?: string; definition?: string }> }>(prompt, schema);

  return {
    activityKey: 'vocab-radar',
    topicContext: topic,
    words: parsed.words.slice(0, 6).map((w) => ({ word: w.word, partOfSpeech: w.partOfSpeech, definition: w.definition })),
  };
}

async function generatePredictionRound(topic: string, difficulty: Difficulty): Promise<PredictionRoundContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            optionA: { type: 'string' },
            optionB: { type: 'string' },
            correctAnswer: { type: 'string' },
            revealFact: { type: 'string' },
          },
          required: ['text', 'optionA', 'optionB', 'correctAnswer', 'revealFact'],
        },
      },
    },
    required: ['questions'],
  };

  const prompt = `Generate 3 prediction questions for an ESL classroom lesson about the topic below.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Each question should:
- Present a surprising or debatable claim about the topic that students can predict on before being taught
- Use True/False format (optionA: "True", optionB: "False") or a binary either/or (e.g. "More" vs "Less")
- Have a clear correct answer
- Include a short, interesting revealFact (1–2 sentences) explaining the answer

Mix in at least one counterintuitive or surprising fact to spark curiosity.

Return JSON with a "questions" array of exactly 3 objects with: text, optionA, optionB, correctAnswer ("A" or "B"), revealFact.`;

  const parsed = await generateJSON<{ questions: Array<{ text: string; optionA: string; optionB: string; correctAnswer: string; revealFact: string }> }>(prompt, schema);

  const fallback = { text: 'Did you know something surprising about this topic?', optionA: 'True', optionB: 'False', correctAnswer: 'A' as const, revealFact: 'Many things about this topic are surprising.' };

  return {
    activityKey: 'prediction-round',
    topicContext: topic,
    questions: [
      { text: parsed.questions[0]?.text ?? fallback.text, optionA: parsed.questions[0]?.optionA ?? 'True', optionB: parsed.questions[0]?.optionB ?? 'False', correctAnswer: (parsed.questions[0]?.correctAnswer as 'A' | 'B') ?? 'A', revealFact: parsed.questions[0]?.revealFact ?? fallback.revealFact },
      { text: parsed.questions[1]?.text ?? fallback.text, optionA: parsed.questions[1]?.optionA ?? 'True', optionB: parsed.questions[1]?.optionB ?? 'False', correctAnswer: (parsed.questions[1]?.correctAnswer as 'A' | 'B') ?? 'A', revealFact: parsed.questions[1]?.revealFact ?? fallback.revealFact },
      { text: parsed.questions[2]?.text ?? fallback.text, optionA: parsed.questions[2]?.optionA ?? 'True', optionB: parsed.questions[2]?.optionB ?? 'False', correctAnswer: (parsed.questions[2]?.correctAnswer as 'A' | 'B') ?? 'A', revealFact: parsed.questions[2]?.revealFact ?? fallback.revealFact },
    ],
  };
}

async function generateSceneIgniter(topic: string, difficulty: Difficulty): Promise<SceneIgniterContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      lines: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            lineIndex: { type: 'number' },
            character: { type: 'string' },
            text: { type: 'string' },
          },
          required: ['lineIndex', 'character', 'text'],
        },
      },
    },
    required: ['title', 'lines'],
  };

  const prompt = `Generate a short dialogue scene with 4 characters (A, B, C, D) for an ESL classroom.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Requirements:
- A catchy short title for the scene
- Exactly 12 lines total (characters A, B, C, D each speak 3 times, distributed naturally)
- Natural, conversational dialogue related to the topic
- Vocabulary and sentence complexity appropriate for the difficulty level
- Lines numbered sequentially from 1 to 12

Return JSON: { title: string, lines: Array<{ lineIndex: number, character: string, text: string }> }`;

  const parsed = await generateJSON<{ title: string; lines: Array<{ lineIndex: number; character: string; text: string }> }>(prompt, schema);

  const fallbackLines: Array<{ lineIndex: number; character: string; text: string }> =
    ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D'].map((char, i) => ({
      lineIndex: i + 1,
      character: char,
      text: `Something about ${topic}.`,
    }));

  const validChars = new Set(['A', 'B', 'C', 'D']);
  const raw = parsed.lines ?? [];
  const valid = raw.filter(
    (l) => typeof l.lineIndex === 'number' && typeof l.text === 'string' && validChars.has(l.character)
  );
  const charCounts = new Map(
    ['A', 'B', 'C', 'D'].map((c) => [c, valid.filter((l) => l.character === c).length])
  );
  const counts = Array.from(charCounts.values());
  const isBalanced =
    Math.min(...counts) > 0 && Math.max(...counts) - Math.min(...counts) <= 2;

  const lines = (valid.length >= 8 && isBalanced)
    ? valid.map((l, i) => ({ lineIndex: i + 1, character: l.character, text: l.text }))
    : fallbackLines;

  return {
    activityKey: 'scene-igniter',
    topicContext: topic,
    title: parsed.title ?? 'Scene Igniter',
    lines,
  };
}

// ============================================
// Game Generators
// ============================================

async function generateVocabSprint(topic: string, difficulty: Difficulty): Promise<VocabSprintGeneratedContent> {
  const schema: AISchema = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        sentence: { type: 'string' },
        weakWord: { type: 'string' },
        hint: { type: 'string' },
      },
      required: ['sentence', 'weakWord', 'hint'],
    },
  };

  const prompt = `Generate 5 unique, natural English sentences for an English learner at ${difficultyDescriptions[difficulty]}
Topic: ${topic}.

CRITICAL RULES:
1. Each sentence must contain exactly ONE 'generic' or 'weak' word (the 'weakWord') to be replaced.
2. EVERY sentence must use a DIFFERENT weak word - NO REPEATS across the 5 sentences.
3. Prioritize VERBS and ADJECTIVES as weak words.

Choose weak words from this list (use variety - pick 5 DIFFERENT ones):
- Adjectives: good, bad, big, small, nice, interesting, important, happy, sad, great, amazing, terrible, beautiful
- Verbs: said, went, got, think, look, make, do, take, give, show, change, tell, walk, run

Provide a 'hint' for each sentence—a short, friendly piece of advice (max 10 words).
Return exactly 5 objects as a JSON array with varied weak words.`;

  const sentences = await generateJSON<Array<{ sentence: string; weakWord: string; hint: string }>>(prompt, schema);
  return { gameKey: 'vocab-sprint', sentences };
}

async function generateGrammarBoss(topic: string, difficulty: Difficulty): Promise<GrammarBossGeneratedContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      task: { type: 'string' },
      exampleSentence: { type: 'string' },
    },
    required: ['task', 'exampleSentence'],
  };

  const grammarTargets = ['tense', 'conditional', 'passive', 'relative clause', 'reported speech'];
  const randomTarget = grammarTargets[Math.floor(Math.random() * grammarTargets.length)];

  const prompt = `Generate a short speaking challenge for an English learner at ${difficultyDescriptions[difficulty]}
Topic: ${topic}.
Target Grammar: ${randomTarget}.

Provide:
1. A concise, engaging speaking task (1-2 sentences) that naturally requires the target grammar.
2. A perfect example sentence using the target grammar correctly.`;

  const data = await generateJSON<{ task: string; exampleSentence: string }>(prompt, schema);
  return { gameKey: 'grammar-boss', task: data.task, exampleSentence: data.exampleSentence };
}

async function generateWordChain(topic: string, difficulty: Difficulty): Promise<WordChainGeneratedContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      startingWord: { type: 'string' },
      hint: { type: 'string' },
    },
    required: ['startingWord', 'hint'],
  };

  const prompt = `Generate a starting word for a word association chain game at ${difficultyDescriptions[difficulty]}
Topic: ${topic}.

Choose a starting word that:
1. Has MANY possible associations (at least 10+ related concepts)
2. Is appropriate for the difficulty level
3. Relates to the topic
4. Is a concrete noun or common concept (easier to associate)

Also provide a short hint about the type of associations expected (max 8 words).`;

  const data = await generateJSON<{ startingWord: string; hint: string }>(prompt, schema);
  return { gameKey: 'word-chain', startingWord: data.startingWord, hint: data.hint };
}

async function generateSynonymShowdown(topic: string, difficulty: Difficulty): Promise<SynonymShowdownGeneratedContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      targetWord: { type: 'string' },
      contextSentence: { type: 'string' },
      hint: { type: 'string' },
    },
    required: ['targetWord', 'contextSentence', 'hint'],
  };

  const prompt = `Generate a synonym challenge for ${difficultyDescriptions[difficulty]}
Topic: ${topic}.

Create:
1. A target word that has MANY possible synonyms (at least 5-10 valid alternatives)
2. A context sentence using that word, showing its meaning clearly
3. A short hint about the CONTEXT or FEELING, NOT listing synonyms (max 8 words)

Requirements:
- Choose a word with rich synonym options (adjectives and verbs work best)
- The context should make the word's specific meaning clear
- CRITICAL: The hint must NEVER include actual synonyms!`;

  const data = await generateJSON<{ targetWord: string; contextSentence: string; hint: string }>(prompt, schema, { temperature: 1.2 });
  return { gameKey: 'synonym-showdown', targetWord: data.targetWord, contextSentence: data.contextSentence, hint: data.hint };
}

async function generateErrorHunter(topic: string, difficulty: Difficulty): Promise<ErrorHunterGeneratedContent> {
  const difficultyConfig: Record<Difficulty, { errors: number; description: string }> = {
    'Beginner': { errors: 2, description: 'Beginner (A1) level. Use very simple sentences with obvious spelling/grammar errors.' },
    'Easy': { errors: 3, description: 'Easy (A2) level. Use simple sentences with basic grammar errors.' },
    'Intermediate': { errors: 4, description: 'Intermediate (B1/B2) level. Use standard sentences with grammar and word choice errors.' },
    'Advanced': { errors: 4, description: 'Advanced (C1) level. Use complex sentences with subtle grammar errors.' },
    'Expert': { errors: 5, description: 'Expert (C2/Native) level. Use sophisticated sentences with nuanced errors.' },
  };

  const config = difficultyConfig[difficulty];

  const schema: AISchema = {
    type: 'object',
    properties: {
      paragraph: { type: 'string' },
      errorCount: { type: 'integer' },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            position: { type: 'integer' },
            word: { type: 'string' },
            errorType: { type: 'string' },
            correction: { type: 'string' },
          },
          required: ['position', 'word', 'errorType', 'correction'],
        },
      },
    },
    required: ['paragraph', 'errorCount', 'errors'],
  };

  const prompt = `Generate a paragraph with exactly ${config.errors} intentional errors for ${config.description}
Topic: ${topic}.

Create a 3-4 sentence paragraph about the topic that contains exactly ${config.errors} errors.

Error types to include (mix them):
- Spelling errors
- Subject-verb agreement
- Wrong tense
- Wrong word form
- Article errors
- Preposition errors

Return the paragraph with errors embedded, plus an array of error details.`;

  const data = await generateJSON<{ paragraph: string; errorCount: number; errors: Array<{ position: number; word: string; errorType: string; correction: string }> }>(prompt, schema);
  return { gameKey: 'error-hunter', paragraph: data.paragraph, errorCount: data.errorCount, _errors: data.errors };
}

async function generateDialogueDetective(topic: string, difficulty: Difficulty): Promise<DialogueDetectiveGeneratedContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      speakerA_before: { type: 'string' },
      speakerA_after: { type: 'string' },
      context: { type: 'string' },
      goal: { type: 'string' },
    },
    required: ['speakerA_before', 'speakerA_after', 'context', 'goal'],
  };

  const prompt = `Generate a dialogue puzzle for ${difficultyDescriptions[difficulty]}
Topic: ${topic}.

Create a 3-line conversation where:
- Speaker A says something (line 1)
- Speaker B responds (line 2) - THIS IS THE BLANK the student fills in
- Speaker A replies to B's response (line 3)

Provide:
- speakerA_before: What A says first
- speakerA_after: What A says after B's response
- context: Brief setting (e.g., "At a restaurant", "Job interview")
- goal: What B needs to accomplish

Requirements:
- The conversation should be natural and realistic
- B's response should be inferable from context
- The dialogue should relate to the topic`;

  const data = await generateJSON<{ speakerA_before: string; speakerA_after: string; context: string; goal: string }>(prompt, schema);
  return { gameKey: 'dialogue-detective', speakerA_before: data.speakerA_before, speakerA_after: data.speakerA_after, context: data.context, goal: data.goal };
}

async function generateToneTransformer(topic: string, difficulty: Difficulty): Promise<ToneTransformerGeneratedContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      originalSentence: { type: 'string' },
      currentTone: { type: 'string' },
      context: { type: 'string' },
    },
    required: ['originalSentence', 'currentTone', 'context'],
  };

  const prompt = `Generate a sentence for a tone transformation exercise at ${difficultyDescriptions[difficulty]}
Topic: ${topic}.

Create:
1. A natural sentence with a clear tone (casual, formal, friendly, etc.)
2. Label what tone the sentence currently has
3. A brief context explaining when/where this sentence might be used (max 10 words)

The sentence should be appropriate for the difficulty level.`;

  const data = await generateJSON<{ originalSentence: string; currentTone: string; context: string }>(prompt, schema);

  // Get a contrasting target tone
  const tones = Object.values(TargetTone) as string[];
  const currentLower = (data.currentTone as string).toLowerCase();
  const contrastingTones = tones.filter(t => !currentLower.includes(t.toLowerCase()));
  const targetTone = contrastingTones[Math.floor(Math.random() * contrastingTones.length)];

  return { gameKey: 'tone-transformer', originalSentence: data.originalSentence, currentTone: data.currentTone, targetTone, context: data.context };
}

async function generateConnection(topic: string, difficulty: Difficulty): Promise<ConnectionGeneratedContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      word1: { type: 'string' },
      word2: { type: 'string' },
      category: { type: 'string' },
      hint: { type: 'string' },
    },
    required: ['word1', 'word2', 'category', 'hint'],
  };

  const prompt = `Generate a "What's the Link?" word pair challenge for ${difficultyDescriptions[difficulty]}
Topic: ${topic}.

Create two words that share a hidden connection. The student must figure out what links them.

Requirements:
1. word1 and word2: Two words that seem unrelated at first but share a connection
2. category: The hidden connection (e.g., "Both are keyboard keys", "Both are types of clouds")
3. hint: A subtle clue that doesn't give away the answer (max 10 words)

Guidelines:
- The connection should be discoverable through vocabulary knowledge and reasoning
- Avoid overly obscure trivia
- The words should appear unrelated at first glance`;

  const data = await generateJSON<{ word1: string; word2: string; category: string; hint: string }>(prompt, schema, { temperature: 1.2 });
  return { gameKey: 'connection', word1: data.word1, word2: data.word2, category: data.category, hint: data.hint };
}

async function generateConnections(topic: string, difficulty: Difficulty): Promise<ConnectionsGeneratedContent> {
  const difficultyPrompts: Record<Difficulty, string> = {
    'Beginner': 'All 4 groups should have very obvious, straightforward connections. Use basic vocabulary.',
    'Easy': 'Groups should be clear with common vocabulary. Minimal red herrings.',
    'Intermediate': 'Mix of obvious and moderate difficulty connections. Include some red herrings.',
    'Advanced': 'Subtle connections that require thinking. Include deliberate red herrings.',
    'Expert': 'Include wordplay, puns, or double meanings. Multiple plausible groupings with one correct answer.'
  };

  const schema: AISchema = {
    type: 'object',
    properties: {
      groups: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            words: { type: 'array', items: { type: 'string' } },
            difficulty: { type: 'string' },
            color: { type: 'string' }
          },
          required: ['category', 'words', 'difficulty', 'color']
        }
      }
    },
    required: ['groups']
  };

  const prompt = `Generate a Connections puzzle (like NYT Connections) for ESL learners.
Topic: ${topic}
${difficultyPrompts[difficulty]}

Create exactly 4 groups of 4 words each (16 words total). Each word must be a single word.

Group structure:
- Group 1 (Yellow/easy): Most obvious connection
- Group 2 (Green/medium): Clear but requires thinking
- Group 3 (Blue/hard): Subtle connection
- Group 4 (Purple/tricky): Requires lateral thinking

Return JSON with groups array. Words should be UPPERCASE.`;

  const data = await generateJSON<{ groups: Array<{ category: string; words: string[]; difficulty: string; color: string }> }>(prompt, schema, { temperature: 1.0 });

  // Ensure words are uppercase
  for (const group of data.groups) {
    group.words = group.words.map((w: string) => w.toUpperCase());
  }

  // Shuffle all words for the grid
  const allWords = data.groups.flatMap((g) => g.words);
  const shuffledWords = [...allWords].sort(() => Math.random() - 0.5);

  return { gameKey: 'connections', words: shuffledWords, groups: data.groups as ConnectionsGeneratedContent['groups'] };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LessonPlanGenerateRequest;
    const { customTopic, difficulty, activities, games } = body;

    // Allow requests with only games (no activities required)
    const hasActivities = activities && activities.length > 0;
    const hasGames = games && games.length > 0;

    if (!customTopic || !difficulty || (!hasActivities && !hasGames)) {
      return NextResponse.json({ error: 'Missing required fields: customTopic, difficulty, and at least one activity or game' }, { status: 400 });
    }

    const diff = difficulty as Difficulty;
    const content: Record<string, ActivityGeneratedContent> = {};
    const gameContent: Record<string, GameGeneratedContent> = {};
    const generators: Promise<void>[] = [];

    // Generate activity content
    if (hasActivities) {
      for (const activityKey of activities) {
        switch (activityKey) {
          case 'would-you-rather':
            generators.push(generateWouldYouRather(customTopic, diff).then((r) => { content[activityKey] = r; }));
            break;
          case 'hot-take-arena':
            generators.push(generateHotTakeArena(customTopic, diff).then((r) => { content[activityKey] = r; }));
            break;
          case 'two-truths':
            generators.push(generateTwoTruths(customTopic, diff).then((r) => { content[activityKey] = r; }));
            break;
          case 'rank-it':
            generators.push(generateRankIt(customTopic, diff).then((r) => { content[activityKey] = r; }));
            break;
          case 'fact-detective':
            generators.push(generateFactDetective(customTopic, diff).then((r) => { content[activityKey] = r; }));
            break;
          case 'expert-panel':
            generators.push(generateExpertPanel(customTopic, diff).then((r) => { content[activityKey] = r; }));
            break;
          case 'scenario-simulator':
            generators.push(generateScenarioSimulator(customTopic, diff).then((r) => { content[activityKey] = r; }));
            break;
          case 'interview-lab':
            generators.push(generateInterviewLab(customTopic, diff).then((r) => { content[activityKey] = r; }));
            break;
          case 'problem-solvers':
            generators.push(generateProblemSolvers(customTopic, diff).then((r) => { content[activityKey] = r; }));
            break;
          case 'quick-pulse':
            generators.push(generateQuickPulse(customTopic, diff).then((r) => { content[activityKey] = r; }));
            break;
          case 'vocab-radar':
            generators.push(generateVocabRadar(customTopic, diff).then((r) => { content[activityKey] = r; }));
            break;
          case 'prediction-round':
            generators.push(generatePredictionRound(customTopic, diff).then((r) => { content[activityKey] = r; }));
            break;
          case 'scene-igniter':
            generators.push(generateSceneIgniter(customTopic, diff).then((r) => { content[activityKey] = r; }));
            break;
          default:
            console.warn(`Unknown activity: ${activityKey}`);
        }
      }
    }

    // Generate game content
    if (hasGames) {
      for (const gameKey of games) {
        switch (gameKey) {
          case 'vocab-sprint':
            generators.push(generateVocabSprint(customTopic, diff).then((r) => { gameContent[gameKey] = r; }));
            break;
          case 'grammar-boss':
            generators.push(generateGrammarBoss(customTopic, diff).then((r) => { gameContent[gameKey] = r; }));
            break;
          case 'word-chain':
            generators.push(generateWordChain(customTopic, diff).then((r) => { gameContent[gameKey] = r; }));
            break;
          case 'synonym-showdown':
            generators.push(generateSynonymShowdown(customTopic, diff).then((r) => { gameContent[gameKey] = r; }));
            break;
          case 'error-hunter':
            generators.push(generateErrorHunter(customTopic, diff).then((r) => { gameContent[gameKey] = r; }));
            break;
          case 'dialogue-detective':
            generators.push(generateDialogueDetective(customTopic, diff).then((r) => { gameContent[gameKey] = r; }));
            break;
          case 'tone-transformer':
            generators.push(generateToneTransformer(customTopic, diff).then((r) => { gameContent[gameKey] = r; }));
            break;
          case 'connection':
            generators.push(generateConnection(customTopic, diff).then((r) => { gameContent[gameKey] = r; }));
            break;
          case 'connections':
            generators.push(generateConnections(customTopic, diff).then((r) => { gameContent[gameKey] = r; }));
            break;
          default:
            console.warn(`Unknown game: ${gameKey}`);
        }
      }
    }

    await Promise.all(generators);

    const response: LessonPlanGenerateResponse = { success: true, content, gameContent };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Lesson plan generation error:', error);
    return NextResponse.json(
      { success: false, content: {}, error: error instanceof Error ? error.message : 'Failed to generate lesson plan' } as LessonPlanGenerateResponse,
      { status: 500 }
    );
  }
}
