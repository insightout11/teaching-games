import { NextRequest, NextResponse } from 'next/server';
import { generateJSON as _generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { bulkSemaphore } from '@/lib/ai/concurrency';
import { requireAuthForGeneration } from '@/lib/auth-credits';
import { isValidStandardTopicId, getStandardTopicLabel } from '@/lib/standard-topics';

const generateJSON: typeof _generateJSON = (prompt, schema, options) =>
  bulkSemaphore.run(() => _generateJSON(prompt, schema, { ...options, taskClass: 'bulk-generation' }));
import type { Difficulty } from '@/lib/difficulty';
import { difficultyDescriptions, languageRule } from '@/lib/difficulty';
import {
  generateValidatedWouldYouRather,
  type RawWouldYouRatherContent,
} from '@/lib/would-you-rather-generation';
import {
  generateFinalAnswer,
  generateMicDrop,
  generateOpinionShift,
  generateLightningRound,
} from '@/lib/landing-generators';
import { TargetTone } from '@/games/tone-transformer/types';
import type {
  LessonPlanGenerateRequest,
  LessonPlanGenerateResponse,
  ActivityGeneratedContent,
  WonderBoardContent,
  GrammarClarifyContent,
  VocabMicroContent,
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
  ListeningGapFillContent,
  GapFillItem,
  SceneIgniterContent,
  SceneIgniterScene,
  CharacterCardsContent,
  CharacterCard,
  ImposterContent,
  ImposterRound,
  PasswordContent,
  PasswordRound,
  BluffDefinitionContent,
  BluffDefinitionRound,
  TabooSprintContent,
  TabooRound,
  GrammarCheckInContent,
  GrammarProofContent,
  FinalWordContent,
  ConversationRoundsContent,
  GameGeneratedContent,
  StorySprintGeneratedContent,
  VocabSprintGeneratedContent,
  GrammarBossGeneratedContent,
  WordChainGeneratedContent,
  SynonymShowdownGeneratedContent,
  ErrorHunterGeneratedContent,
  DialogueDetectiveGeneratedContent,
  ToneTransformerGeneratedContent,
  ConnectionGeneratedContent,
  ConnectionsGeneratedContent,
  VideoPlayerContent,
  DecisionCouncilContent,
  TeamDebateContent,
  SourceVocabItem,
} from '@/activities/types';
import type { ComprehensionQuestion } from '@/types/source-material';
import { generateMissionSelectorContent } from '@/lib/generate-mission-selector';
import { getCachedContent, storeCachedContent, groundingVariant } from '@/lib/content-cache';
import type { SourceMaterial } from '@/types/source-material';
import { buildSourceContext, getGapFillMode, fetchSourceTranscript } from '@/lib/source-context';
import { normalizePastedSourceMaterial } from '@/lib/pasted-source';
import { buildSourceGroundingContract, type SourceGroundingContract } from '@/lib/source-grounding';
import { generateGroundedRankIt } from '@/lib/rank-it-generation';
import { buildCourseContinuityPrompt } from '@/lib/course-context';
import { getReadingTurnWordTarget } from '@/lib/read-aloud';
import tedLibrary from '@/data/ted-library.json';
import tededLibrary from '@/data/teded-library.json';
import bbcLibrary from '@/data/bbc-library.json';
import bbcIdeasLibrary from '@/data/bbc-ideas-library.json';
import kurzgesagtLibrary from '@/data/kurzgesagt-library.json';
import bigthinkLibrary from '@/data/bigthink-library.json';
import voxLibrary from '@/data/vox-library.json';
import kidsLibrary from '@/data/kids-library.json';
import natgeoLibrary from '@/data/natgeo-library.json';
import crashCourseLibrary from '@/data/crash-course-library.json';
import travelEnglishLibrary from '@/data/travel-english-library.json';
import worldFlightLibrary from '@/data/world-flight-library.json';
import businessEnglishLibrary from '@/data/business-english-library.json';
import internetMemesLibrary from '@/data/internet-memes-library.json';
import minecraftLibrary from '@/data/minecraft-library.json';
import sportsLibrary from '@/data/sports-library.json';
import { switchedSuitcase } from '@/activities/cabin-mystery/cases/switched-suitcase';

export const maxDuration = 60;


// ============================================
// Mission Context Helper
// ============================================

function missionContextBlock(missionContext?: string[]): string {
  if (!missionContext || missionContext.length === 0) return '';
  const list = missionContext.map((m) => `- "${m}"`).join('\n');
  return `\nThe students in this class chose the following personal mission questions at the start of the lesson:\n${list}\nUse these to lightly shape examples, vocabulary, and scenarios — but do NOT change the subject of the content. The topic above always takes priority. Keep the format, difficulty level, and structure identical.\n`;
}

function pppContextBlock(stage: 'presentation' | 'practice' | 'production'): string {
  const map: Record<string, string> = {
    presentation: 'LESSON STAGE: Presentation — this is an opening activity to activate prior knowledge and set the scene. Keep language accessible, examples familiar, and tasks low-stakes.',
    practice: 'LESSON STAGE: Practice — students are applying language in a structured, guided context. Prioritize clear scaffolding and controlled tasks over open-ended ones.',
    production: 'LESSON STAGE: Production — students are expected to use language freely and creatively. Prioritize open-ended, expressive tasks with minimal scaffolding.',
  };
  return `\n${map[stage]}\n`;
}

// ============================================
// Activity Generators
// ============================================

async function generateWouldYouRather(topic: string, difficulty: Difficulty, missionContext?: string[], sourceContext = ''): Promise<WouldYouRatherContent> {
  return generateValidatedWouldYouRather({
    topic,
    difficulty,
    context: `${pppContextBlock('practice')}${missionContextBlock(missionContext)}${sourceContext}`,
    generate: (prompt, schema) => generateJSON<RawWouldYouRatherContent>(prompt, schema),
  });
}

async function generateHotTakeArena(topic: string, difficulty: Difficulty, missionContext?: string[], sourceContext = ''): Promise<HotTakeArenaContent> {
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

  const prompt = `Generate a debate for ESL "Hot Take Arena" about the topic: "${topic}"
${languageRule(difficulty)}
${pppContextBlock('production')}${missionContextBlock(missionContext)}${sourceContext}The "statement" field MUST be a bold opinionated assertion specifically about "${topic}" that students can AGREE or DISAGREE with — NOT a question. It should take a clear stance (e.g. if the topic is guitars: "Electric guitars are superior to acoustic in every way"). Never use question marks in the statement.
Create 3-4 pro/con arguments, 3 devil's advocate challenges per side, and 5-8 vocabulary words, each with a short student-facing definition (max 15 words).`;

  const parsed = await generateJSON<{
    statement: string;
    proArguments: string[];
    conArguments: string[];
    devilsAdvocate: { proChallenges: string[]; conChallenges: string[] };
    vocabularyHighlights: Array<{ word: string; definition: string }>;
  }>(prompt, schema);
  return { activityKey: 'hot-take-arena', topicContext: topic, ...parsed };
}

async function generateDecisionCouncil(topic: string, difficulty: Difficulty, missionContext?: string[], sourceContext = ''): Promise<DecisionCouncilContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      councilQuestion: { type: 'string' },
      contextBrief: { type: 'string' },
      stanceOptions: { type: 'array', items: { type: 'string' } },
      sourceDetails: { type: 'array', items: { type: 'string' } },
      usefulPhrases: { type: 'array', items: { type: 'string' } },
      challengeStarters: { type: 'array', items: { type: 'string' } },
    },
    required: ['councilQuestion', 'contextBrief', 'stanceOptions', 'usefulPhrases', 'challengeStarters'],
  };

  const prompt = `LANGUAGE RULE (follow strictly, even if the source below is more advanced): ${difficultyDescriptions[difficulty]}

Generate content for an ESL "Decision Council" production speaking activity about: "${topic}"
${pppContextBlock('production')}${missionContextBlock(missionContext)}${sourceContext}
Write EVERYTHING in plain language at the level above — short sentences, common words, no academic jargon or abstract nominalizations. Even when grounding in the source, simplify the wording.
Rules:
- councilQuestion: One open-ended decision question ≤16 words in everyday words. Must feel real and debatable. E.g. "What should the school do about phone use in lessons?"
- contextBrief: 2–3 short sentences of background. Students must read it in under 30 seconds.
- stanceOptions: 3–4 possible positions students might take (short, plain noun phrases ≤7 words each). E.g. "Ban phones entirely", "Allow use during breaks".
- sourceDetails: ${sourceContext ? '3–5 key facts drawn directly from the source material above.' : 'Leave as empty array — no source provided.'}
- usefulPhrases: 5–6 sentence starters for proposing and defending. E.g. "I believe we should...", "The strongest reason is...", "Evidence shows that..."
- challengeStarters: 4–5 sentence starters for challenging other proposals. E.g. "Have you considered...", "What about the impact on...", "Couldn't we argue that..."
Return JSON only.`;

  const parsed = await generateJSON<{
    councilQuestion: string;
    contextBrief: string;
    stanceOptions?: string[];
    sourceDetails?: string[];
    usefulPhrases?: string[];
    challengeStarters?: string[];
  }>(prompt, schema);

  return { activityKey: 'decision-council', topicContext: topic, ...parsed };
}

async function generateTeamDebate(topic: string, difficulty: Difficulty, missionContext?: string[], sourceContext = ''): Promise<TeamDebateContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      motion: { type: 'string' },
      context: { type: 'string' },
      forLabel: { type: 'string' },
      againstLabel: { type: 'string' },
      forPrompts: { type: 'array', items: { type: 'string' } },
      againstPrompts: { type: 'array', items: { type: 'string' } },
      usefulPhrases: { type: 'array', items: { type: 'string' } },
    },
    required: ['motion', 'context', 'forLabel', 'againstLabel', 'forPrompts', 'againstPrompts', 'usefulPhrases'],
  };

  const prompt = `LANGUAGE RULE (follow strictly, even if the source below is more advanced): ${difficultyDescriptions[difficulty]}

Generate content for an ESL "Team Debate": two teams argue a motion (Opening → Rebuttal → Closing).
Topic: "${topic}"
${pppContextBlock('production')}${missionContextBlock(missionContext)}${sourceContext}
Write EVERYTHING (motion, context, angles, phrases) in plain language at the level above — short sentences, common words, no academic jargon or abstract nominalizations. Even when grounding in the source, simplify the wording.
Rules:
- motion: One clear, genuinely two-sided debate motion. Phrase as a statement, ideally starting "This house believes that...". Credible arguments on BOTH sides. ≤16 words, everyday words.
- context: 2–3 short, neutral sentences students can read in ~30 seconds. Do NOT take a side.
- forLabel / againstLabel: Short stance labels (≤5 words each) for the two sides — e.g. "For" / "Against", or position-specific like "Ban it" / "Allow it".
- forPrompts: 3–4 concrete argument angles supporting the motion — short, plain phrases (≤12 words) the For team can build on.
- againstPrompts: 3–4 concrete argument angles opposing the motion (for the Against team) — short, plain phrases (≤12 words).
- usefulPhrases: 5–6 simple debate starters usable by either side. E.g. "We believe that...", "The evidence shows...", "Our opponents say... but...", "In conclusion...".
${sourceContext ? '- Ground the motion, context, and argument angles in the source material above — but keep the wording simple.' : ''}
Return JSON only.`;

  const parsed = await generateJSON<{
    motion: string;
    context: string;
    forLabel: string;
    againstLabel: string;
    forPrompts?: string[];
    againstPrompts?: string[];
    usefulPhrases?: string[];
  }>(prompt, schema);

  return {
    activityKey: 'team-debate',
    topicContext: topic,
    motion: parsed.motion,
    context: parsed.context,
    forLabel: parsed.forLabel,
    againstLabel: parsed.againstLabel,
    forPrompts: parsed.forPrompts ?? [],
    againstPrompts: parsed.againstPrompts ?? [],
    usefulPhrases: parsed.usefulPhrases ?? [],
  };
}

async function generateTwoTruths(topic: string, difficulty: Difficulty, missionContext?: string[], sourceContext = ''): Promise<TwoTruthsContent> {
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
${languageRule(difficulty)}
${pppContextBlock('practice')}${missionContextBlock(missionContext)}${sourceContext}
Each round: 3 statements (2 true, 1 false about the topic), fabricationIndex (0-2), explanation why it's false.
Mix difficulty levels (easy/medium/hard).`;

  const parsed = await generateJSON<{ rounds: TwoTruthsContent['rounds'] }>(prompt, schema);
  return { activityKey: 'two-truths', topicContext: topic, rounds: parsed.rounds };
}

async function generateRankIt(
  topic: string,
  difficulty: Difficulty,
  missionContext?: string[],
  sourceContext = '',
  groundingContract: SourceGroundingContract | null = null,
): Promise<RankItContent> {
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
            correctOrder: { type: 'array', items: { type: 'string' } },
            correctRationale: { type: 'string' },
          },
          required: ['id', 'prompt', 'items'],
        },
      },
    },
    required: ['challenges'],
  };

  const prompt = `Generate 3 "Rank It!" challenges for ESL class.
Topic: ${topic}
${languageRule(difficulty)}
${pppContextBlock('practice')}${missionContextBlock(missionContext)}${sourceContext}
CRITICAL: Every challenge, every item being ranked, and every hidden fact MUST be specifically about "${topic}". Do not drift to any other place, person, or subject. If a source is provided above, draw the items and facts from it.
Each challenge: a ranking prompt about "${topic}", with 4-5 items (all about "${topic}") and a hidden fact per item that might change minds.
Example shape (do NOT copy the subject — use "${topic}" instead): "Rank these X by Y" where X and Y come from "${topic}".
CORRECT ORDER (optional, per challenge): If — and only if — the challenge has a genuinely factual/objective ideal order (e.g. ranking by a measurable, verifiable quantity like size, date, distance, or population), include "correctOrder" as the item ids in that ideal order, plus a one-line "correctRationale". For subjective/opinion prompts (preferences, "most important", "best"), OMIT both fields entirely so the challenge stays open-ended.`;

  return generateGroundedRankIt({
    topic,
    prompt,
    schema,
    contract: groundingContract,
    generate: (nextPrompt, nextSchema) => generateJSON<{ challenges: RankItContent['challenges'] }>(nextPrompt, nextSchema),
  });
}

async function generateFactDetective(topic: string, difficulty: Difficulty, missionContext?: string[], sourceContext = ''): Promise<FactDetectiveContent> {
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

  const prompt = `LANGUAGE RULE (follow strictly, even if the source below is more advanced): ${difficultyDescriptions[difficulty]}

Generate 6 fact/myth claims for "Fact Detective" ESL activity.
Topic: ${topic}
${pppContextBlock('practice')}${missionContextBlock(missionContext)}${sourceContext}
Write each claim as ONE short, plain sentence in everyday words — no academic jargon or abstract nominalizations. Even when grounding in the source, simplify the wording.
Mix of true facts and plausible myths. Include explanation and 2-3 vocabulary words per claim, each with a short student-facing definition (max 15 words).
Make claims progressively harder to guess (by content, not by harder vocabulary).`;

  const parsed = await generateJSON<{ claims: FactDetectiveContent['claims'] }>(prompt, schema);
  return { activityKey: 'fact-detective', topicContext: topic, claims: parsed.claims };
}

async function generateExpertPanel(topic: string, difficulty: Difficulty, n: number = 9, missionContext?: string[], sourceContext = ''): Promise<ExpertPanelContent> {
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
            tags: { type: 'array', items: { type: 'string' } },
            starters: { type: 'array', items: { type: 'string' } },
          },
          required: ['id', 'title', 'tags', 'starters'],
        },
      },
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            text: { type: 'string' },
          },
          required: ['id', 'text'],
        },
      },
    },
    required: ['roles', 'questions'],
  };

  const prompt = `Generate an "Expert Panel" talk show activity for an ESL class of ${n} students.
Topic: ${topic}
${languageRule(difficulty)}
${pppContextBlock('production')}${missionContextBlock(missionContext)}${sourceContext}
Create exactly ${n} expert role cards — one per student.
Each role: id (slug like "role-1"), title (2–4 words), tags (exactly 3 short noun phrases, max 3 words each),
starters (exactly 2 short sentence starters, max 10 words each, e.g. "From my view, ..." / "A real example is ...").
No descriptions, no vocabulary, no biographies.

Create exactly ${n} debate-friendly questions — one per student.
Rules for questions:
- Max 12 words each
- Include a concrete noun (parks, tourists, flights, trash, prices, farms, city, animals, etc.)
- Answerable in 20 seconds by an intermediate ESL student speaking out loud
- Avoid abstract words: "prioritize", "exploitation", "sustainability", "rather than"
- Provocative and varied in angle

Return JSON: { "roles": [...${n} items], "questions": [...${n} items] }`;

  const parsed = await generateJSON<{ roles: ExpertPanelContent['roles']; questions: ExpertPanelContent['questions'] }>(prompt, schema);
  const roles = (parsed.roles ?? []).slice(0, n);
  const questions = (parsed.questions ?? []).slice(0, n);
  return { activityKey: 'expert-panel', topicContext: topic, roles, questions };
}

async function generateScenarioSimulator(topic: string, difficulty: Difficulty, missionContext?: string[], sourceContext = ''): Promise<ScenarioSimulatorContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      hook: { type: 'string' },
      tone: { type: 'string' },
      goalLabel: { type: 'string' },
      dangerLabel: { type: 'string' },
      openingLines: { type: 'array', items: { type: 'string' } },
      storyContext: { type: 'string' },
      rounds: {
        type: 'array',
        items: {
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
      finalePrompt: { type: 'string' },
      successBanner: { type: 'string' },
      failureBanner: { type: 'string' },
    },
    required: ['title', 'hook', 'tone', 'goalLabel', 'dangerLabel', 'openingLines', 'storyContext', 'rounds', 'finalePrompt', 'successBanner', 'failureBanner'],
  };

  const prompt = `Generate a "Scenario Simulator" activity for an ESL class.

LANGUAGE RULE: ${difficultyDescriptions[difficulty]}
Topic: ${topic}
${pppContextBlock('production')}${missionContextBlock(missionContext)}${sourceContext}
You are writing a choose-your-own-adventure story that will be told over 5 rounds.
Only write Round 1 now. The other rounds will be generated live based on student votes.

OPENING (openingLines): 2–3 short dramatic lines (≤10 words each) that establish:
- The setting (who, where, what's happening)
- The stakes (what could go wrong)
- The starting situation
These are read aloud by students before voting begins.
Example: "Championship final. Score tied. Ten seconds left."

STORY CONTEXT (storyContext): 2–3 sentences of internal narrative context.
This will be passed to the AI for each subsequent round so the story stays coherent.
Include: genre, setting, tone, and the story's central conflict.
Example: "A soccer championship match in the final minute. The class plays as the team captain deciding under pressure. Tone is tense sports drama."

ROUND 1 (the first decision moment):
- id: 1
- readLines: exactly 3 dramatic lines (≤12 words each) that set up the first decision.
  These must be DIFFERENT from openingLines — they narrow in on a specific moment.
- situation: 1 short sentence (teacher context, ≤15 words) describing what's happening.
- choices: exactly 3 (labels A/B/C, ≤10 words each, punchy, distinct strategies):
  - Each choice must be a DIFFERENT TYPE of action (not variations of the same verb)
  - Each consequence: 1–2 sentences of plain narrative text ONLY — NEVER include "goalDelta", "dangerDelta", or any field names in this string
  - goalDelta/dangerDelta: separate number fields, -2 to +2, spread so no obvious best answer

STORY RULES:
- tone: pick best fit [thriller, comedy, sci-fi, mystery, default]
- goalLabel/dangerLabel: 2–3 words (e.g. Score/Pressure, Escape/Chaos, Trust/Suspicion)
- hook: 1 vivid urgent sentence (≤15 words), distinct from openingLines
- finalePrompt: 1 direct question asking for the final move
- successBanner / failureBanner: short punchy ALL CAPS phrases (3–5 words)

Return valid JSON.`;

  const parsed = await generateJSON<{
    title: string;
    hook: string;
    tone: string;
    goalLabel: string;
    dangerLabel: string;
    openingLines: string[];
    storyContext: string;
    rounds: Array<{
      id: number;
      readLines: string[];
      situation: string;
      choices: Array<{ label: string; text: string; consequence: string; goalDelta: number; dangerDelta: number }>;
    }>;
    finalePrompt: string;
    successBanner: string;
    failureBanner: string;
  }>(prompt, schema);
  return { activityKey: 'scenario-simulator', topicContext: topic, ...parsed } as ScenarioSimulatorContent;
}

async function generateInterviewLab(topic: string, difficulty: Difficulty, missionContext?: string[], sourceContext = ''): Promise<InterviewLabContent> {
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
${languageRule(difficulty)}
${pppContextBlock('production')}${missionContextBlock(missionContext)}${sourceContext}
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

async function generateProblemSolvers(topic: string, difficulty: Difficulty, missionContext?: string[], sourceContext = ''): Promise<ProblemSolversContent> {
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
      submissionMaxWords: { type: 'number' },
      sentenceStarters: { type: 'array', items: { type: 'string' } },
    },
    required: ['problem', 'constraints', 'complications', 'submissionMaxWords', 'sentenceStarters'],
  };

  const difficultyConfig: Record<string, {
    resources: string; constraints: string; complications: string;
    submissionMaxWords: number; startersNote: string; example: string;
  }> = {
    Beginner: {
      resources: '3 very simple physical objects (e.g. rope, bucket, stick)',
      constraints: '2 simple one-sentence constraints, no jargon',
      complications: '1 complication',
      submissionMaxWords: 25,
      startersNote: 'A1–A2 starters e.g. "I would use…", "My idea is…", "We can…"',
      example: 'Problem: "The school water tap is broken. Students need water to clean after lunch." Resources: mop, bucket, big bottle.',
    },
    Easy: {
      resources: '3–4 everyday objects',
      constraints: '2–3 short constraints',
      complications: '1–2 complications',
      submissionMaxWords: 40,
      startersNote: 'A2–B1 starters e.g. "I would use…", "My idea is…", "We could…"',
      example: 'Problem: "The classroom is too hot and the fan is broken." Resources: paper, window, door, cloth.',
    },
    Intermediate: {
      resources: '4 resources',
      constraints: '3 constraints',
      complications: '2 complications',
      submissionMaxWords: 60,
      startersNote: 'B1–B2 starters e.g. "One solution is…", "We could try…", "By using…"',
      example: 'Problem: "A local park floods every time it rains, damaging the playground." Resources: sandbags, drainage pipe, volunteers, social media.',
    },
    Advanced: {
      resources: '5 resources',
      constraints: '3–4 constraints',
      complications: '3 complications',
      submissionMaxWords: 90,
      startersNote: 'C1 starters e.g. "One approach would be…", "Building on…", "A phased solution…"',
      example: 'Problem: "A rural hospital has unreliable electricity, threatening patient safety." Resources: solar panels, generator, volunteers, local government, tools.',
    },
    Expert: {
      resources: '5–6 resources',
      constraints: '4 constraints',
      complications: '3 complications',
      submissionMaxWords: 120,
      startersNote: 'C1–C2 starters e.g. "A viable strategy would be…", "Accounting for constraints…", "The core trade-off is…"',
      example: 'Problem: "A city water treatment plant is failing and a major storm is forecast in 72 hours." Resources: emergency engineers, filtration units, reserve funds, storage tanks, press team.',
    },
  };

  const cfg = difficultyConfig[difficulty] ?? difficultyConfig['Intermediate'];

  const prompt = `LANGUAGE RULE: ${difficultyDescriptions[difficulty]}

Generate a "Problem Solvers" activity for an ESL class.
Topic: ${topic}
${pppContextBlock('production')}${missionContextBlock(missionContext)}${sourceContext}

DIFFICULTY STRUCTURE (${difficulty}):
- Problem: short concrete title + 1–2 sentence description using the language rule above (no jargon, no abstract concepts for lower levels)
- Resources: ${cfg.resources}
- Constraints: ${cfg.constraints} — each one sentence, use the language rule
- Complications: ${cfg.complications} — each needs: trigger (1 short sentence), complication (1 sentence), 2 short hints
- submissionMaxWords: ${cfg.submissionMaxWords}
- sentenceStarters: exactly 3 short starters (${cfg.startersNote})

Level-appropriate example:
${cfg.example}

Return JSON matching the schema exactly.`;

  const parsed = await generateJSON<{
    problem: { title: string; description: string; resources: string[]; successCriteria: string[] };
    constraints: string[];
    complications: Array<{ id: string; trigger: string; complication: string; hints: string[] }>;
    submissionMaxWords: number;
    sentenceStarters: string[];
  }>(prompt, schema);
  return { activityKey: 'problem-solvers', topicContext: topic, ...parsed };
}

async function generateWonderBoard(topic: string, difficulty: Difficulty, sourceContext = ''): Promise<WonderBoardContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      framingPrompt: { type: 'string', description: 'One sentence introducing the board to students' },
    },
    required: ['framingPrompt'],
  };

  const prompt = `Generate one short sentence a teacher can say to introduce a student question board about this topic.
Topic: ${topic}
${languageRule(difficulty)}
${sourceContext}

The sentence should invite students to ask questions about the topic. It should be natural, encouraging, and under 20 words.
Example: "What are you wondering about climate change? Ask your question now."

Return JSON with a "framingPrompt" field.`;

  const parsed = await generateJSON<{ framingPrompt: string }>(prompt, schema);

  return {
    activityKey: 'wonder-board',
    topicContext: topic,
    framingPrompt: parsed.framingPrompt ?? `What are you wondering about ${topic}? Ask your question now.`,
  };
}

async function generateQuickPulse(topic: string, difficulty: Difficulty, sourceContext = ''): Promise<QuickPulseContent> {
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
${languageRule(difficulty)}
${sourceContext}

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

function extractAsteriskWords(text: string): string[] {
  const matches = text.match(/\*([^*]+)\*/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.replace(/\*/g, '').trim()).filter(Boolean)));
}

function stripAsterisks(text: string): string {
  return text.replace(/\*([^*]+)\*/g, '$1');
}

async function generateVocabRadar(topic: string, difficulty: Difficulty, sourceContext = ''): Promise<VocabRadarContent> {
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
${languageRule(difficulty)}
${sourceContext}

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

const SOURCE_VOCAB_FALLBACK: SourceVocabItem[] = [
  { term: 'perspective', meaning: 'a particular way of thinking about something', example: "From a student's perspective, homework can feel overwhelming.", prompt: 'Share your perspective on this topic in one sentence.' },
  { term: 'significant', meaning: 'important or large enough to have an effect', example: 'Climate change has had a significant impact on weather patterns.', prompt: 'What is one significant fact about this topic?' },
  { term: 'approach', meaning: 'a way of dealing with a situation or problem', example: 'Scientists use a careful approach when testing new ideas.', prompt: 'Describe one approach someone could take to address this issue.' },
  { term: 'impact', meaning: 'a strong effect or influence on something', example: 'Technology has had a huge impact on how we communicate.', prompt: 'What impact does this topic have on everyday life?' },
  { term: 'consider', meaning: 'to think carefully about something before deciding', example: 'Before acting, it is important to consider all options.', prompt: 'What should people consider when thinking about this issue?' },
];

async function generateSourceVocab(topic: string, difficulty: Difficulty, sourceContext: string): Promise<SourceVocabItem[]> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            term: { type: 'string' },
            meaning: { type: 'string' },
            example: { type: 'string' },
            prompt: { type: 'string' },
            sourceContext: { type: 'string' },
          },
          required: ['term', 'meaning', 'example', 'prompt'],
        },
      },
    },
    required: ['items'],
  };

  const isSourceGrounded = sourceContext.length > 0;
  const extractInstruction = isSourceGrounded
    ? `${sourceContext}\n\nExtract vocabulary from the source above. Terms MUST come from this source text — do not invent topic-general words. Every term must appear in the provided text.`
    : `Choose terms that will recur naturally in student discussion about the topic: ${topic}.`;

  const aiPrompt = `Generate 6 vocabulary terms for an ESL classroom lesson.
${isSourceGrounded ? '' : `Topic: ${topic}\n`}${languageRule(difficulty)}
${extractInstruction}

For each term provide:
- meaning: plain English definition, ≤15 words, no circular definitions
- example: a natural sentence using the term in context
- prompt: one open discussion or reflection question prompting students to use the term
- sourceContext (optional): exact sentence from source where the term appears

Return JSON with an "items" array of exactly 6 objects.`;

  const parsed = await generateJSON<{ items: Array<{ term?: string; meaning?: string; example?: string; prompt?: string; sourceContext?: string }> }>(aiPrompt, schema);

  const seen = new Set<string>();
  const normalized: SourceVocabItem[] = [];
  for (const raw of parsed.items) {
    const term = (raw.term ?? '').trim();
    const meaning = (raw.meaning ?? '').trim();
    const example = (raw.example ?? '').trim();
    const prompt = (raw.prompt ?? '').trim();
    if (!term || !meaning || !example || !prompt) continue;
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ term, meaning, example, prompt, ...(raw.sourceContext ? { sourceContext: raw.sourceContext.trim() } : {}) });
    if (normalized.length >= 8) break;
  }

  // Only top-up with generic fallbacks for true topic-only (no source text)
  if (!isSourceGrounded) {
    const existing = new Set(normalized.map((i) => i.term.toLowerCase()));
    for (const fb of SOURCE_VOCAB_FALLBACK) {
      if (normalized.length >= 5) break;
      if (!existing.has(fb.term.toLowerCase())) { normalized.push(fb); existing.add(fb.term.toLowerCase()); }
    }
  }

  return normalized;
}

async function generatePredictionRound(topic: string, difficulty: Difficulty, sourceContext = ''): Promise<PredictionRoundContent> {
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

  // "Listen for it" mode: when the lesson has a source, the predictions become questions the class
  // can only settle by reading/watching the briefing next — the answer must live IN that source, and
  // revealFact points back to it. The activity holds the reveal until after the briefing.
  const deferReveal = sourceContext.trim().length > 0;
  const sourceInstruction = deferReveal
    ? `\nIMPORTANT — these predictions are asked BEFORE the class reads/watches the source, and the answers will be revealed AFTER. So:
- Every claim MUST be answerable directly from the source material above — do not ask anything the source doesn't settle.
- Pick facts a student would notice while reading/watching, so the reveal pays off their attention ("the answer was in what you just read").
- Each revealFact must state the answer as it appears in the source (quote or closely paraphrase the relevant detail).\n`
    : '';

  const prompt = `Generate 3 prediction questions for an ESL classroom lesson about the topic below.
Topic: ${topic}
${languageRule(difficulty)}
${sourceContext}
${sourceInstruction}
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
    deferReveal,
    questions: [
      { text: parsed.questions[0]?.text ?? fallback.text, optionA: parsed.questions[0]?.optionA ?? 'True', optionB: parsed.questions[0]?.optionB ?? 'False', correctAnswer: (parsed.questions[0]?.correctAnswer as 'A' | 'B') ?? 'A', revealFact: parsed.questions[0]?.revealFact ?? fallback.revealFact },
      { text: parsed.questions[1]?.text ?? fallback.text, optionA: parsed.questions[1]?.optionA ?? 'True', optionB: parsed.questions[1]?.optionB ?? 'False', correctAnswer: (parsed.questions[1]?.correctAnswer as 'A' | 'B') ?? 'A', revealFact: parsed.questions[1]?.revealFact ?? fallback.revealFact },
      { text: parsed.questions[2]?.text ?? fallback.text, optionA: parsed.questions[2]?.optionA ?? 'True', optionB: parsed.questions[2]?.optionB ?? 'False', correctAnswer: (parsed.questions[2]?.correctAnswer as 'A' | 'B') ?? 'A', revealFact: parsed.questions[2]?.revealFact ?? fallback.revealFact },
    ],
  };
}

async function generateListeningGapFill(
  topic: string,
  difficulty: Difficulty,
  sourceContext = '',
  grammarTarget?: string,
  mode: 'listening' | 'reading' = 'listening',
): Promise<ListeningGapFillContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            display:      { type: 'string' },
            full:         { type: 'string' },
            answer:       { type: 'string' },
            alternatives: { type: 'array', items: { type: 'string' } },
            hint:         { type: 'string' },
          },
          required: ['display', 'full', 'answer'],
        },
      },
    },
    required: ['items'],
  };

  const grammarLine = grammarTarget
    ? `Focus blanks on the grammar target: ${grammarTarget}.`
    : 'Focus blanks on key vocabulary words (nouns, verbs, adjectives).';

  const isListening = mode === 'listening';
  const sourceNoun = isListening ? 'transcript' : 'source text';
  const activityLabel = isListening ? 'listening activity' : 'reading check';
  const title = isListening ? 'Listening Check' : 'Reading Check';
  const instruction = isListening
    ? 'Students listen back for the missing word.'
    : 'Students use the briefing text to fill in the missing word.';
  const sourceRule = sourceContext
    ? `Extract real sentences from the ${sourceNoun} above and blank out key words. Do not invent facts.`
    : 'Generate topic-relevant original sentences.';

  const prompt = `Generate 5–6 gap-fill sentences for an ESL classroom listening activity.
Topic: ${topic}
${languageRule(difficulty)}
${grammarLine}
${sourceContext}

Rules:
- Each sentence must have EXACTLY one blank, shown as ___ in the "display" field.
- "full" is the complete sentence with the correct word restored.
- "answer" is the correct word, lowercase and normalized (e.g. "discovered").
- "alternatives" lists other accepted spellings or inflections (e.g. ["discovers", "discover"]) — omit if none.
- "hint" is a 1–3 word grammatical label, e.g. "verb (past tense)", "adjective", "noun" — keep it brief.
- Sentences should be 8–16 words long, natural, and related to the topic.
- Vary the part of speech blanked across items.
- ${sourceRule}

Return JSON with an "items" array of 5–6 objects with fields: display, full, answer, alternatives (optional), hint (optional).`;

  const parsed = await generateJSON<{ items: Array<Partial<GapFillItem>> }>(
    prompt.replace('listening activity', activityLabel),
    schema,
  );

  const fallback: GapFillItem = {
    display: `This topic is ___ for English learners.`,
    full: `This topic is important for English learners.`,
    answer: 'important',
    hint: 'adjective',
  };

  const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
  const items: GapFillItem[] = rawItems.length >= 3
    ? rawItems.slice(0, 6).map((item) => ({
        display: item.display ?? fallback.display,
        full: item.full ?? fallback.full,
        answer: (item.answer ?? 'important').toLowerCase().trim(),
        ...(Array.isArray(item.alternatives) && item.alternatives.length > 0
          ? { alternatives: item.alternatives.map((a) => a.toLowerCase().trim()) }
          : {}),
        ...(item.hint ? { hint: item.hint } : {}),
      }))
    : [fallback];

  return { activityKey: 'listening-gap-fill', topicContext: topic, mode, title, instruction, items };
}

function formatTranscriptForAI(rawTranscript: string): string {
  let segments: Array<{ text: string; offset: number }> = [];
  try {
    const parsed = JSON.parse(rawTranscript) as Array<{ text: string; offset: number }>;
    if (Array.isArray(parsed)) segments = parsed;
  } catch {
    // Plain text fallback — no timestamps available
    return rawTranscript.slice(0, 12000);
  }

  // Group into ~15-second chunks to keep the prompt readable
  const CHUNK_MS = 15000;
  const chunks: Array<{ startMs: number; text: string }> = [];
  let currentChunk: { startMs: number; parts: string[] } | null = null;

  for (const seg of segments) {
    if (!currentChunk || seg.offset - currentChunk.startMs >= CHUNK_MS) {
      if (currentChunk) chunks.push({ startMs: currentChunk.startMs, text: currentChunk.parts.join(' ') });
      currentChunk = { startMs: seg.offset, parts: [seg.text] };
    } else {
      currentChunk.parts.push(seg.text);
    }
  }
  if (currentChunk) chunks.push({ startMs: currentChunk.startMs, text: currentChunk.parts.join(' ') });

  return chunks
    .map((c) => {
      const totalSec = Math.floor(c.startMs / 1000);
      const m = Math.floor(totalSec / 60);
      const s = String(totalSec % 60).padStart(2, '0');
      return `[${m}:${s}] ${c.text}`;
    })
    .join('\n')
    .slice(0, 14000);
}

export interface ComprehensionSet {
  questions: ComprehensionQuestion[];
  discussionPrompt?: string;
}

/**
 * Generate an end-of-content comprehension check from a block of text (video
 * transcript/summary or reading text). Q1 tests the main idea; the rest test
 * details/inferences, with one optionally probing a target vocab word in
 * context. Each question carries a one-sentence rationale and a short evidence
 * quote; video questions also carry the [M:SS] moment they relate to (for
 * on-demand rewatch). A closing open-ended discussion prompt is included.
 * Used by both the video player and the reader.
 */
/**
 * Fisher–Yates shuffle of multiple-choice options that keeps correctIndex
 * pointing at the right answer. Counters the LLM's tendency to put the correct
 * answer in the first slot.
 */
function shuffleOptions(options: string[], correctIndex: number): { options: string[]; correctIndex: number } {
  const indexed = options.map((opt, i) => ({ opt, isCorrect: i === correctIndex }));
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }
  return {
    options: indexed.map((x) => x.opt),
    correctIndex: Math.max(0, indexed.findIndex((x) => x.isCorrect)),
  };
}

async function generateComprehensionQuestions(
  title: string,
  contentBlock: string,
  kind: 'video' | 'reading',
  difficulty: Difficulty,
  opts: { vocabWords?: string[]; count?: number } = {},
): Promise<ComprehensionSet> {
  const count = opts.count ?? 3;
  const isVideo = kind === 'video';
  const noun = isVideo ? 'video' : 'reading';
  const vocab = (opts.vocabWords ?? []).slice(0, 8);

  const schema: AISchema = {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            options: { type: 'array', items: { type: 'string' } },
            correctIndex: { type: 'number' },
            explanation: { type: 'string' },
            evidence: { type: 'string' },
            ...(isVideo ? { timestampLabel: { type: 'string' } } : {}),
          },
          required: ['question', 'options', 'correctIndex', 'explanation', 'evidence'],
        },
      },
      discussionPrompt: { type: 'string' },
    },
    required: ['questions', 'discussionPrompt'],
  };

  const prompt = `You are generating an end-of-${noun} comprehension check for an ESL classroom that has just finished the ${noun} below.

LANGUAGE RULE: ${difficultyDescriptions[difficulty]}
All questions, options, explanations and the discussion prompt must use language at this level.

Title: "${title}"

CONTENT:
${contentBlock.slice(0, 14000)}

Generate exactly ${count} multiple-choice comprehension questions:
- Question 1 tests the MAIN IDEA / overall gist of the whole ${noun}.
- The remaining questions test specific details or reasonable inferences drawn from the content.
${vocab.length > 0 ? `- Make ONE question test the meaning or use, in context, of one of these key words: ${vocab.join(', ')}.\n` : ''}- Each question has 4 options (A–D), exactly one correct, based on what the content actually says.
- Test understanding, not trivial word recall.

For every question also provide:
- explanation: ONE short sentence saying why the correct answer is right.
- evidence: a SHORT direct quote (a phrase or sentence) from the content that supports the answer.
${isVideo ? '- timestampLabel: the [M:SS] timestamp from the transcript where this is discussed (use a real timestamp shown in the content).\n' : ''}
Finally, write ONE open-ended discussionPrompt: a speaking question about the ${noun} that has no single correct answer and invites students to share opinions or experiences.

correctIndex is 0-based (0=A, 1=B, 2=C, 3=D). Return JSON with a "questions" array of ${count} objects and a "discussionPrompt" string.`;

  const parsed = await generateJSON<{
    questions: Array<{ question: string; options: string[]; correctIndex: number; explanation?: string; evidence?: string; timestampLabel?: string }>;
    discussionPrompt?: string;
  }>(prompt, schema);

  const questions: ComprehensionQuestion[] = (parsed.questions ?? []).slice(0, count).map((q, i) => {
    const rawOptions = q.options?.slice(0, 4) ?? ['Option A', 'Option B', 'Option C', 'Option D'];
    const rawCorrect = typeof q.correctIndex === 'number' ? Math.max(0, Math.min(q.correctIndex, rawOptions.length - 1)) : 0;
    // LLMs bias the correct answer toward option A. Shuffle so the answer
    // position is uniformly random regardless of where the model placed it.
    const { options, correctIndex } = shuffleOptions(rawOptions, rawCorrect);
    const base: ComprehensionQuestion = {
      question: q.question ?? (i === 0 ? 'What is the main idea?' : 'What is one detail mentioned?'),
      options,
      correctIndex,
      ...(q.explanation ? { explanation: q.explanation } : {}),
      ...(q.evidence ? { evidence: q.evidence } : {}),
    };
    if (isVideo && q.timestampLabel) {
      const [minStr, secStr] = q.timestampLabel.split(':');
      const secs = (parseInt(minStr ?? '0', 10) * 60) + parseInt(secStr ?? '0', 10);
      if (secs > 0) {
        base.timestampLabel = q.timestampLabel;
        base.timestamp = secs;
      }
    }
    return base;
  });

  return { questions, ...(parsed.discussionPrompt ? { discussionPrompt: parsed.discussionPrompt } : {}) };
}

/** Video variant: prefers the stored timestamped transcript, falls back to the summary. */
async function generateVideoComprehensionQuestions(source: SourceMaterial, difficulty: Difficulty, count = 3): Promise<ComprehensionSet> {
  let contentBlock = source.summary;
  if (source.sourceKey) {
    try {
      const { createServiceClient } = await import('@/lib/supabase/service');
      const supabase = createServiceClient();
      const { data } = await supabase
        .from('source_extractions')
        .select('raw_transcript')
        .eq('source_type', source.sourceType)
        .eq('source_key', source.sourceKey)
        .single();
      if (data?.raw_transcript) {
        contentBlock = formatTranscriptForAI(data.raw_transcript);
      }
    } catch { /* fall through to summary */ }
  }
  return generateComprehensionQuestions(source.title, contentBlock, 'video', difficulty, { count });
}

async function generateSingleScene(
  topic: string,
  difficulty: Difficulty,
  charCount: 2 | 3 | 4,
  sourceContext = '',
): Promise<SceneIgniterScene> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      context: { type: 'string' },
      improvPrompt: { type: 'string' },
      improvScript: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            character: { type: 'string' },
            text: { type: 'string' },
            hint: { type: 'string' },
          },
          required: ['character', 'text'],
        },
      },
      lines: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            lineIndex: { type: 'number' },
            character: { type: 'string' },
            text: { type: 'string' },
            direction: { type: 'string' },
          },
          required: ['lineIndex', 'character', 'text'],
        },
      },
    },
    required: ['title', 'context', 'improvPrompt', 'improvScript', 'lines'],
  };

  const charList = charCount === 4 ? 'A, B, C, D' : charCount === 3 ? 'A, B, C' : 'A, B';
  const lineCount = charCount === 4 ? 12 : charCount === 3 ? 9 : 8;
  const linesEach = charCount === 2 ? 4 : 3;

  const prompt = `Generate a short dialogue scene with ${charCount} characters (${charList}) for an ESL classroom.

LANGUAGE RULE: ${difficultyDescriptions[difficulty]}

Topic: ${topic}
${sourceContext}

Requirements:
- A catchy short title for the scene
- A "context" field: 2–3 sentences describing where the characters are, who they are, and what situation they are in (the scene setup for students to read before performing)
- Exactly ${lineCount} lines total (characters ${charList} each speak ${linesEach} times, distributed naturally)
- Natural, conversational dialogue related to the topic
- Vocabulary and sentence complexity appropriate for the difficulty level
- Lines numbered sequentially from 1 to ${lineCount}
- A "direction" field on most lines (1–2 words describing how the line should be delivered, e.g. "nervously", "whispering", "excitedly", "sighing", "leaning in") — not every line needs one
- An "improvPrompt" field: one sentence describing a fun twist for students to redo the scene in their own words, e.g. "Now do it again — but A forgot their wallet!"
- An "improvScript" field: 8 dialogue lines using the same characters (${charList}).
  Each line's "text" must contain 1–2 blanks written as ___ where students improvise a word or phrase.
  The blanks should replace key nouns, emotions, or topic-specific phrases related to the twist.
  Each line must also have a "hint" field: 2–3 short example words that could fill the blank, formatted as "e.g. word1, word2, word3".
  The hint should give concrete options, not abstract labels. Good: "e.g. nervous, angry, shocked". Bad: "Try an emotion".
  Example: { "character": "A", "text": "I can't believe you used to be a ___ champion!", "hint": "e.g. chess, baking, trivia" }
  Example: { "character": "B", "text": "Well, it taught me how to stay ___ under pressure.", "hint": "e.g. calm, focused, cool" }

Return JSON: { title: string, context: string, improvPrompt: string, improvScript: Array<{ character: string, text: string, hint?: string }>, lines: Array<{ lineIndex: number, character: string, text: string, direction?: string }> }`;

  const parsed = await generateJSON<{
    title: string;
    context?: string;
    improvPrompt?: string;
    improvScript?: Array<{ character: string; text: string; hint?: string }>;
    lines: Array<{ lineIndex: number; character: string; text: string; direction?: string }>;
  }>(prompt, schema);

  const expectedChars = charCount === 4 ? ['A', 'B', 'C', 'D'] : charCount === 3 ? ['A', 'B', 'C'] : ['A', 'B'];
  const fallbackLines = expectedChars.flatMap((char, ci) =>
    Array.from({ length: linesEach }, (_, li) => ({
      lineIndex: ci * linesEach + li + 1,
      character: char,
      text: `Something about ${topic}.`,
    }))
  );

  const validChars = new Set(expectedChars);
  const raw = parsed.lines ?? [];
  const valid = raw.filter(
    (l) => typeof l.lineIndex === 'number' && typeof l.text === 'string' && validChars.has(l.character)
  );
  const charCounts = new Map(
    expectedChars.map((c) => [c, valid.filter((l) => l.character === c).length])
  );
  const counts = Array.from(charCounts.values());
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);
  const isBalanced = minCount > 0 && maxCount - minCount <= 2;

  const lines = valid.length >= charCount * 2 && isBalanced
    ? valid.map((l, i) => ({
        lineIndex: i + 1,
        character: l.character,
        text: l.text,
        ...(l.direction ? { direction: l.direction } : {}),
      }))
    : fallbackLines;

  const fallbackImprovScript = Array.from({ length: charCount * 2 }, (_, i) => ({
    character: expectedChars[i % charCount],
    text: 'I never expected this situation to be so ___!',
  }));

  const validImprovScript =
    Array.isArray(parsed.improvScript) &&
    parsed.improvScript.length >= charCount * 2 &&
    parsed.improvScript.every(
      (l) => typeof l.character === 'string' && typeof l.text === 'string' && l.text.includes('___')
    );

  return {
    title: parsed.title ?? 'Scene Igniter',
    context: parsed.context ?? `A scene about ${topic}.`,
    improvPrompt: parsed.improvPrompt ?? 'Now try the scene again in your own words!',
    improvScript: validImprovScript
      ? parsed.improvScript!.map((l) => ({
          character: l.character,
          text: l.text,
          ...(l.hint ? { hint: l.hint } : {}),
        }))
      : fallbackImprovScript,
    lines,
  };
}

async function generateSceneIgniter(topic: string, difficulty: Difficulty, sourceContext = '', studentCount?: number): Promise<SceneIgniterContent> {
  // Size each group's cast to the actual class. The activity splits students into group 1
  // (up to 4) and group 2 (the rest); mirror that so 2 students get a 2-character scene, not 4.
  const clampCast = (n: number): 2 | 3 | 4 => (n <= 2 ? 2 : n === 3 ? 3 : 4);
  const g1Cast = clampCast(studentCount ? Math.min(studentCount, 4) : 4);
  const g2Cast = studentCount && studentCount > 4 ? clampCast(studentCount - 4) : 3;
  const [scene1, scene2, scene1alt, scene2alt] = await Promise.all([
    generateSingleScene(topic, difficulty, g1Cast, sourceContext),
    generateSingleScene(topic, difficulty, g2Cast, sourceContext),
    generateSingleScene(topic, difficulty, g1Cast, sourceContext),
    generateSingleScene(topic, difficulty, g2Cast, sourceContext),
  ]);
  return {
    activityKey: 'scene-igniter',
    topicContext: topic,
    scenes: [scene1, scene2, scene1alt, scene2alt],
  };
}

// ============================================
// Game Generators
// ============================================

async function generateVocabSprint(topic: string, difficulty: Difficulty, keyVocabWords?: string[], sourceContext = ''): Promise<VocabSprintGeneratedContent> {
  const schema: AISchema = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        sentence: { type: 'string' },
        weakWord: { type: 'string' },
        hint: { type: 'string' },
        level: { type: 'string' },
        targetWord: { type: 'string' },
      },
      required: ['sentence', 'weakWord', 'hint', 'level', 'targetWord'],
    },
  };

  const hardRoundInstructions = keyVocabWords?.length
    ? `Use EXACTLY these vocabulary words as the targetWord for your 2 hard sentences (one word per sentence): ${keyVocabWords.slice(0, 2).join(', ')}.`
    : 'Choose 2 challenging topic-specific vocabulary terms appropriate for this difficulty level.';

  const prompt = `Generate exactly 6 English sentences for vocabulary practice at ${difficultyDescriptions[difficulty]}
Topic: ${topic}.
${sourceContext}

DISTRIBUTE EXACTLY: 2 easy + 2 medium + 2 hard sentences (level field must be "easy", "medium", or "hard").

--- EASY (2 sentences) ---
Each sentence contains ONE generic weak word (the "weakWord") for the student to replace with a stronger synonym.
Choose from: good, bad, big, small, nice, interesting, important, happy, sad, great, amazing, terrible, said, went, got, think, look, make, walk, run.
Set targetWord to "" for easy sentences.

--- MEDIUM (2 sentences) ---
Each sentence uses a topic-adjacent phrase that is imprecise (the "weakWord") which the student replaces with more precise vocabulary.
Example: "The factory puts out a lot of gas." → weakWord: "puts out" → better: "emits"
Set targetWord to "" for medium sentences.

--- HARD (2 sentences) ---
Each sentence describes a key vocabulary concept in plain language. The "weakWord" is the descriptive phrase. The student must type the PRECISE vocabulary term.
${hardRoundInstructions}
Example: "We need to cut down our total effect on the climate from energy use." → weakWord: "total effect on the climate from energy use" → targetWord: "carbon footprint"
Set targetWord to the exact precise term expected.

Return exactly 6 objects as a JSON array ordered: 2 easy, 2 medium, 2 hard.`;

  const sentences = await generateJSON<Array<{ sentence: string; weakWord: string; hint: string; level: string; targetWord: string }>>(prompt, schema);
  return {
    gameKey: 'vocab-sprint',
    sentences: sentences.map(s => ({
      ...s,
      level: (['easy', 'medium', 'hard'].includes(s.level) ? s.level : 'easy') as 'easy' | 'medium' | 'hard',
      targetWord: s.targetWord || undefined,
    })),
  };
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

async function generateWordChain(topic: string, difficulty: Difficulty, sourceContext = ''): Promise<WordChainGeneratedContent> {
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
${sourceContext}

Choose a starting word that:
1. Has MANY possible associations (at least 10+ related concepts)
2. Is appropriate for the difficulty level
3. Relates to the topic
4. Is a concrete noun or common concept (easier to associate)

Also provide a short hint about the type of associations expected (max 8 words).`;

  const data = await generateJSON<{ startingWord: string; hint: string }>(prompt, schema);
  return { gameKey: 'word-chain', startingWord: data.startingWord, hint: data.hint };
}

async function generateSynonymShowdown(topic: string, difficulty: Difficulty, sourceContext = '', keyVocabWords?: string[]): Promise<SynonymShowdownGeneratedContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      targetWord: { type: 'string' },
      contextSentence: { type: 'string' },
      hint: { type: 'string' },
    },
    required: ['targetWord', 'contextSentence', 'hint'],
  };

  // Vocab spine (Stage 3): bias the challenge toward a word the Language Toolkit just taught, so the
  // class produces synonyms for a word they own. Falls back to a free synonym-rich pick when absent.
  const targetInstruction = keyVocabWords?.length
    ? `1. Set targetWord to ONE of these words the class just learned (pick the one with the richest synonym options): ${keyVocabWords.join(', ')}`
    : '1. A target word that has MANY possible synonyms (at least 5-10 valid alternatives)';

  const prompt = `Generate a synonym challenge for ${difficultyDescriptions[difficulty]}
Topic: ${topic}.
${sourceContext}

Create:
${targetInstruction}
2. A context sentence using that word, showing its meaning clearly
3. A short hint about the CONTEXT or FEELING, NOT listing synonyms (max 8 words)

Requirements:
- ${keyVocabWords?.length ? 'The chosen word should still have several valid synonyms' : 'Choose a word with rich synonym options (adjectives and verbs work best)'}
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

Return the paragraph with errors embedded, plus an array of error details.

IMPORTANT: Double-check each error before including it — only mark words that are genuinely incorrect. Do not mark grammatically correct words as errors.`;

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

async function generateConnections(topic: string, difficulty: Difficulty, sourceContext = ''): Promise<ConnectionsGeneratedContent> {
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
${sourceContext}

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

// ============================================
// New Lesson Type Generators
// ============================================

async function generateCharacterCards(topic: string, difficulty: Difficulty, missionContext?: string[], sourceContext = '', variant?: string): Promise<CharacterCardsContent> {
  const cached = await getCachedContent('character-cards', topic, difficulty, [], variant, 1);
  if (cached) {
    const c = cached.content_json as { characters: CharacterCard[] };
    return { activityKey: 'character-cards', topicContext: topic, characters: c.characters ?? [], topic };
  }

  const schema: AISchema = {
    type: 'object',
    properties: {
      characters: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            viewpoint: { type: 'string' },
            speakingLine: { type: 'string' },
          },
          required: ['name', 'viewpoint', 'speakingLine'],
        },
      },
    },
    required: ['characters'],
  };

  const prompt = `Generate 9 characters for an ESL class warm-up activity on the topic: ${topic}
${languageRule(difficulty)}
${pppContextBlock('presentation')}${missionContextBlock(missionContext)}${sourceContext}
Each character represents a DIFFERENT perspective or viewpoint on the topic. Their viewpoints should genuinely disagree with or contrast each other — not all be positive.

Rules:
- Name format: "The [Role]" (e.g. "The Skeptic", "The Expert", "The Newcomer")
- viewpoint: A complete description of their position (max 20 words). Second person: "You think…" or "You believe…". Full sentence, no trailing ellipses.
- speakingLine: A complete sentence the student reads aloud AS this character (max 20 words). First person: "I think…", "I believe…", "In my opinion…". Natural spoken English, no trailing ellipses.
- Names must be memorable and appropriate for a classroom
- Viewpoints and speaking lines must genuinely differ — avoid characters who all agree
- Keep language at ${difficultyDescriptions[difficulty]} level

Return JSON with a "characters" array of exactly 9 objects.`;

  try {
    const data = await generateJSON<{ characters: CharacterCard[] }>(prompt, schema);
    const characters = Array.isArray(data.characters) ? data.characters.slice(0, 9) : [];
    void storeCachedContent('character-cards', topic, difficulty, { characters }, 1, variant);
    return { activityKey: 'character-cards', topicContext: topic, characters, topic };
  } catch {
    // Fallback: generic characters
    const fallback: CharacterCard[] = [
      { name: 'The Enthusiast', viewpoint: `You love everything about ${topic} and can't stop talking about it.`, speakingLine: `I absolutely love ${topic} — it's one of the most exciting things I know.` },
      { name: 'The Skeptic', viewpoint: `You are not convinced ${topic} is as important as people say.`, speakingLine: `Honestly, I'm not sure ${topic} is really as important as everyone claims.` },
      { name: 'The Expert', viewpoint: `You have studied ${topic} for years and always share your knowledge.`, speakingLine: `In my experience, the most important thing to understand about ${topic} is the details.` },
      { name: 'The Newcomer', viewpoint: `You are just learning about ${topic} for the first time.`, speakingLine: `I only just started learning about ${topic}, and I find it really interesting.` },
      { name: 'The Traditionalist', viewpoint: `You believe the old ways of thinking about ${topic} are still the best.`, speakingLine: `I think the traditional approach to ${topic} has worked well and shouldn't change.` },
      { name: 'The Optimist', viewpoint: `You believe ${topic} will lead to great things in the future.`, speakingLine: `I believe ${topic} is going to lead to some really wonderful things in the future.` },
      { name: 'The Realist', viewpoint: `You see both the good and bad sides of ${topic} clearly.`, speakingLine: `I think ${topic} has real benefits, but we also need to be honest about its problems.` },
      { name: 'The Activist', viewpoint: `You feel strongly that people need to take action on ${topic}.`, speakingLine: `I feel very strongly that we all need to take action on ${topic} right now.` },
      { name: 'The Philosopher', viewpoint: `You like to ask deep questions about what ${topic} really means.`, speakingLine: `I think the big question about ${topic} is what it really means for how we live.` },
    ];
    return { activityKey: 'character-cards', topicContext: topic, characters: fallback, topic };
  }
}

async function generateImposter(topic: string, difficulty: Difficulty, sourceContext = '', variant?: string): Promise<ImposterContent> {
  const cached = await getCachedContent('imposter', topic, difficulty, [], variant, 1);
  if (cached) {
    const c = cached.content_json as { rounds: ImposterRound[] };
    return { activityKey: 'imposter', topicContext: topic, rounds: c.rounds ?? [], topic };
  }

  const schema: AISchema = {
    type: 'object',
    properties: {
      rounds: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            word: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['word', 'description'],
        },
      },
    },
    required: ['rounds'],
  };

  const prompt = `Generate 3 secret words for an ESL classroom Imposter game on the topic: ${topic}
${languageRule(difficulty)}
${sourceContext}
Rules:
- Each word must be a single concrete NOUN directly from the topic category (e.g. if topic is "food", use words like "noodle", "spice", "broth")
- No verbs, adjectives, or abstract concepts — nouns only
- The word must be clearly describable without saying it directly (good for giving one-word clues)
- The description (1 sentence, max 20 words) is revealed to the class after the round — it explains the word simply
- Words must be distinct from each other and appropriately challenging for ${difficultyDescriptions[difficulty]} level
- Avoid proper nouns, brand names, or anything culturally specific to one region

Return JSON with a "rounds" array of exactly 3 objects, each with "word" and "description".`;

  try {
    const data = await generateJSON<{ rounds: ImposterRound[] }>(prompt, schema);
    const rounds = Array.isArray(data.rounds) ? data.rounds.slice(0, 3) : [];
    void storeCachedContent('imposter', topic, difficulty, { rounds }, 1, variant);
    return { activityKey: 'imposter', topicContext: topic, rounds, topic };
  } catch {
    const fallback: ImposterRound[] = [
      { word: 'classroom', description: 'A room in a school where students gather to learn.' },
      { word: 'notebook', description: 'A small book with blank or lined pages used for writing notes.' },
      { word: 'dictionary', description: 'A book that lists words and explains what they mean.' },
    ];
    return { activityKey: 'imposter', topicContext: topic, rounds: fallback, topic };
  }
}

async function generatePassword(topic: string, difficulty: Difficulty, sourceContext = '', variant?: string): Promise<PasswordContent> {
  const cached = await getCachedContent('password', topic, difficulty, [], variant, 1);
  if (cached) {
    const c = cached.content_json as { rounds: PasswordRound[] };
    return { activityKey: 'password', topicContext: topic, rounds: c.rounds ?? [], topic };
  }

  const schema: AISchema = {
    type: 'object',
    properties: {
      rounds: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            word: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['word', 'description'],
        },
      },
    },
    required: ['rounds'],
  };

  const prompt = `Generate 3 secret passwords for an ESL classroom Password game on the topic: ${topic}
${languageRule(difficulty)}
${sourceContext}
Rules:
- Each word must be a single word (noun, verb, or adjective) related to the topic
- The word must be natural to include in conversation about the topic without sounding forced
- Avoid words so central that every sentence would obviously contain them (e.g. for "food" avoid "eat")
- Not too obscure — students should recognise it; not too obvious — it should take skill to hide
- description: one sentence (max 20 words) explaining the word, revealed to the class after the round
- All 3 words must be different parts of speech or difficulty level for variety

Return JSON: { "rounds": [{ "word": string, "description": string }] } — exactly 3 rounds.`;

  try {
    const data = await generateJSON<{ rounds: PasswordRound[] }>(prompt, schema);
    const rounds = Array.isArray(data.rounds) ? data.rounds.slice(0, 3) : [];
    void storeCachedContent('password', topic, difficulty, { rounds }, 1, variant);
    return { activityKey: 'password', topicContext: topic, rounds, topic };
  } catch {
    const fallback: PasswordRound[] = [
      { word: 'practice', description: 'Doing something repeatedly to get better at it.' },
      { word: 'fluent', description: 'Able to speak a language easily and accurately.' },
      { word: 'mistake', description: 'An error made when doing or saying something.' },
    ];
    return { activityKey: 'password', topicContext: topic, rounds: fallback, topic };
  }
}

async function generateBluffDefinition(topic: string, difficulty: Difficulty, sourceContext = '', variant?: string): Promise<BluffDefinitionContent> {
  const cached = await getCachedContent('bluff-definition', topic, difficulty, [], variant, 1);
  if (cached) {
    const c = cached.content_json as { rounds: BluffDefinitionRound[] };
    return { activityKey: 'bluff-definition', topicContext: topic, rounds: c.rounds ?? [], topic };
  }

  const schema: AISchema = {
    type: 'object',
    properties: {
      rounds: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            word: { type: 'string' },
            correctDefinition: { type: 'string' },
          },
          required: ['word', 'correctDefinition'],
        },
      },
    },
    required: ['rounds'],
  };

  const prompt = `Generate 3 words for an ESL classroom Bluff Definition (Balderdash-style) game on the topic: ${topic}
${languageRule(difficulty)}
${sourceContext}
Rules:
- Each word must be a single noun or adjective that students may recognise but not know precisely
- The word should be interesting enough that students can write a plausible-sounding fake definition (not too obscure, not too obvious)
- correctDefinition: one clear sentence (max 20 words) that defines the word — this is revealed after voting
- The definition must be factual and specific enough that a teacher can confirm it
- Words must be distinct from each other and directly related to the topic
- Avoid words with obviously guessable definitions (e.g. "transport" for a travel topic)

Return JSON with a "rounds" array of exactly 3 objects, each with "word" and "correctDefinition".`;

  try {
    const data = await generateJSON<{ rounds: BluffDefinitionRound[] }>(prompt, schema);
    const rounds = Array.isArray(data.rounds) ? data.rounds.slice(0, 3) : [];
    void storeCachedContent('bluff-definition', topic, difficulty, { rounds }, 1, variant);
    return { activityKey: 'bluff-definition', topicContext: topic, rounds, topic };
  } catch {
    const fallback: BluffDefinitionRound[] = [
      { word: 'lexicon', correctDefinition: 'The vocabulary of a person, language, or branch of knowledge.' },
      { word: 'syntax', correctDefinition: 'The set of rules governing how words are arranged to form sentences.' },
      { word: 'nuance', correctDefinition: 'A subtle difference in meaning, expression, or tone.' },
    ];
    return { activityKey: 'bluff-definition', topicContext: topic, rounds: fallback, topic };
  }
}

async function generateTabooSprint(topic: string, difficulty: Difficulty, sourceContext = '', variant?: string): Promise<TabooSprintContent> {
  const cached = await getCachedContent('taboo-sprint', topic, difficulty, [], variant, 1);
  if (cached) {
    const c = cached.content_json as { rounds: TabooRound[] };
    return { activityKey: 'taboo-sprint', topicContext: topic, rounds: c.rounds ?? [], topic };
  }

  const schema: AISchema = {
    type: 'object',
    properties: {
      rounds: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            word: { type: 'string' },
            description: { type: 'string' },
            forbiddenWords: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['word', 'description', 'forbiddenWords'],
        },
      },
    },
    required: ['rounds'],
  };

  const prompt = `Generate 3 rounds for an ESL classroom Taboo Sprint game on the topic: ${topic}
${languageRule(difficulty)}
${sourceContext}
Rules:
- Each round needs a secret word and exactly 4 forbidden words
- The secret word must be natural to use in conversation about the topic (noun, verb, or adjective)
- The 4 forbidden words must be thematically related to the secret word but NOT synonyms — they are the obvious words speakers would normally reach for
  (e.g. for word="explore" forbidden=["discover", "travel", "find", "journey"])
- Choosing forbidden words well forces speakers to find creative, less obvious angles
- description: one sentence (max 20 words) defining the secret word — revealed after guessing
- All 3 secret words must be different parts of speech or difficulty level

Return JSON: { "rounds": [{ "word": string, "description": string, "forbiddenWords": string[] }] } — exactly 3 rounds, each with exactly 4 forbidden words.`;

  try {
    const data = await generateJSON<{ rounds: TabooRound[] }>(prompt, schema);
    const rounds = Array.isArray(data.rounds) ? data.rounds.slice(0, 3).map((r) => ({
      ...r,
      forbiddenWords: Array.isArray(r.forbiddenWords) ? r.forbiddenWords.slice(0, 4) : [],
    })) : [];
    void storeCachedContent('taboo-sprint', topic, difficulty, { rounds }, 1, variant);
    return { activityKey: 'taboo-sprint', topicContext: topic, rounds, topic };
  } catch {
    const fallback: TabooRound[] = [
      { word: 'communicate', description: 'To share information or ideas with others.', forbiddenWords: ['talk', 'speak', 'tell', 'say'] },
      { word: 'strategy', description: 'A plan designed to achieve a long-term goal.', forbiddenWords: ['plan', 'method', 'approach', 'idea'] },
      { word: 'inspire', description: 'To fill someone with the urge or ability to do something creative.', forbiddenWords: ['motivate', 'encourage', 'influence', 'push'] },
    ];
    return { activityKey: 'taboo-sprint', topicContext: topic, rounds: fallback, topic };
  }
}

async function generateGrammarCheckIn(topic: string, difficulty: Difficulty, grammarTarget?: string, skipCache = false): Promise<GrammarCheckInContent> {
  const cacheVariant = grammarTarget ?? 'auto';
  const cached = skipCache ? null : await getCachedContent('grammar-check-in', topic, difficulty, [], cacheVariant, 1);
  if (cached) {
    const c = cached.content_json as { grammarTarget: string; sentences: GrammarCheckInContent['sentences'] };
    return { activityKey: 'grammar-check-in', topicContext: topic, grammarTarget: c.grammarTarget ?? cacheVariant, sentences: c.sentences ?? [] };
  }

  const targetInstruction = grammarTarget
    ? `Grammar target: ${grammarTarget}. Generate 3 sentences specifically using this structure.`
    : `Pick the most appropriate grammar target for ${difficultyDescriptions[difficulty]} level and generate 3 sentences using it.`;

  const schema: AISchema = {
    type: 'object',
    properties: {
      grammarTarget: { type: 'string' },
      sentences: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            isCorrect: { type: 'boolean' },
            explanation: { type: 'string' },
          },
          required: ['text', 'isCorrect', 'explanation'],
        },
      },
    },
    required: ['grammarTarget', 'sentences'],
  };

  const prompt = `Generate a grammar confidence check for an ESL class.
Topic: ${topic}
${languageRule(difficulty)}
${targetInstruction}

Create exactly 3 sentences about the topic. Mix correct and incorrect sentences (e.g. 2 correct + 1 incorrect, or 1 correct + 2 incorrect).
Each sentence should feel natural and topic-relevant — not artificially awkward.
The explanation is shown AFTER students vote — explain clearly WHY each sentence is correct or incorrect.

Return JSON with:
- grammarTarget: the grammar structure being tested (e.g. "past perfect", "passive voice")
- sentences: array of 3 objects with text, isCorrect (boolean), explanation`;

  try {
    const data = await generateJSON<{ grammarTarget: string; sentences: GrammarCheckInContent['sentences'] }>(prompt, schema);
    const result = {
      grammarTarget: data.grammarTarget ?? (grammarTarget ?? 'grammar'),
      sentences: Array.isArray(data.sentences) ? data.sentences.slice(0, 3) : [],
    };
    if (!skipCache) void storeCachedContent('grammar-check-in', topic, difficulty, result, 1, cacheVariant);
    return { activityKey: 'grammar-check-in', topicContext: topic, ...result };
  } catch {
    return {
      activityKey: 'grammar-check-in',
      topicContext: topic,
      grammarTarget: grammarTarget ?? 'present perfect',
      sentences: [
        { text: `I have visited many places related to ${topic}.`, isCorrect: true, explanation: 'Correct — "have visited" is the present perfect form.' },
        { text: `She has went to the ${topic} event last year.`, isCorrect: false, explanation: 'Incorrect — should be "has gone", not "has went".' },
        { text: `They have already finished learning about ${topic}.`, isCorrect: true, explanation: 'Correct — "have finished" uses the present perfect correctly.' },
      ],
    };
  }
}

async function generateGrammarProof(topic: string, difficulty: Difficulty, grammarTarget: string, skipCache = false): Promise<GrammarProofContent> {
  const cached = skipCache ? null : await getCachedContent('grammar-proof', topic, difficulty, [], grammarTarget, 1);
  if (cached) {
    const c = cached.content_json as { prompt: string; exampleSentences: string[] };
    return { activityKey: 'grammar-proof', topicContext: topic, grammarTarget, prompt: c.prompt ?? '', exampleSentences: c.exampleSentences ?? [] };
  }

  const schema: AISchema = {
    type: 'object',
    properties: {
      prompt: { type: 'string' },
      exampleSentences: { type: 'array', items: { type: 'string' } },
    },
    required: ['prompt', 'exampleSentences'],
  };

  const aiPrompt = `Generate a grammar writing task for an ESL class.
Topic: ${topic}
${languageRule(difficulty)}
Grammar target: ${grammarTarget}

Create:
1. A writing prompt asking students to write 2 sentences about the topic using ${grammarTarget}. The prompt should be open-ended and natural — not a grammar drill instruction.
2. Two example sentences (teacher-only model answers) that correctly use ${grammarTarget} in the context of ${topic}.

Return JSON with:
- prompt: the writing instruction (max 20 words, natural and topic-relevant)
- exampleSentences: array of 2 model answer strings`;

  try {
    const data = await generateJSON<{ prompt: string; exampleSentences: string[] }>(aiPrompt, schema);
    const result = { prompt: data.prompt ?? '', exampleSentences: Array.isArray(data.exampleSentences) ? data.exampleSentences.slice(0, 2) : [] };
    if (!skipCache) void storeCachedContent('grammar-proof', topic, difficulty, result, 1, grammarTarget);
    return { activityKey: 'grammar-proof', topicContext: topic, grammarTarget, ...result };
  } catch {
    return {
      activityKey: 'grammar-proof',
      topicContext: topic,
      grammarTarget,
      prompt: `Write 2 sentences about ${topic} using ${grammarTarget}.`,
      exampleSentences: [`Example 1 using ${grammarTarget} about ${topic}.`, `Example 2 using ${grammarTarget} about ${topic}.`],
    };
  }
}

async function generateGrammarClarify(topic: string, difficulty: Difficulty, grammarTarget: string, sourceContext = '', skipCache = false): Promise<GrammarClarifyContent> {
  // Depth scales with the source: a grammar source already taught it, so keep it a concise anchor;
  // without one, Clarify carries the teaching, so make it richer (more examples + fuller use).
  const rich = !sourceContext;
  const cached = skipCache ? null : await getCachedContent('grammar-clarify', topic, difficulty, [], grammarTarget, 1);
  if (cached) {
    const c = cached.content_json as { form?: string; examples?: string[]; whenToUse?: string; pitfall?: string };
    return { activityKey: 'grammar-clarify', topicContext: topic, grammarTarget, form: c.form ?? '', examples: c.examples ?? [], whenToUse: c.whenToUse ?? '', pitfall: c.pitfall ?? '' };
  }

  const schema: AISchema = {
    type: 'object',
    properties: {
      form: { type: 'string' },
      examples: { type: 'array', items: { type: 'string' } },
      whenToUse: { type: 'string' },
      pitfall: { type: 'string' },
    },
    required: ['form', 'examples', 'whenToUse', 'pitfall'],
  };

  const prompt = `Explain the grammar structure "${grammarTarget}" for an English class at ${difficultyDescriptions[difficulty]}.
Topic: ${topic}. Every example sentence MUST be about this topic.
${sourceContext}${sourceContext ? 'A source already taught this structure — keep the explanation concise (a quick anchor/recap).\n' : ''}
Provide:
- form: ${rich ? 'a clear 1–2 sentence explanation of how the structure is built' : 'one concise sentence on how the structure is built'}
- examples: ${rich ? '3' : '2'} short model sentence(s) using ${grammarTarget}, all about ${topic}
- whenToUse: one sentence on when/why to use ${grammarTarget}
- pitfall: one common mistake learners make with ${grammarTarget}`;

  try {
    const data = await generateJSON<{ form: string; examples: string[]; whenToUse: string; pitfall: string }>(prompt, schema);
    const result = {
      form: data.form ?? '',
      examples: Array.isArray(data.examples) ? data.examples.slice(0, 3) : [],
      whenToUse: data.whenToUse ?? '',
      pitfall: data.pitfall ?? '',
    };
    if (!skipCache) void storeCachedContent('grammar-clarify', topic, difficulty, result, 1, grammarTarget);
    return { activityKey: 'grammar-clarify', topicContext: topic, grammarTarget, ...result };
  } catch {
    return {
      activityKey: 'grammar-clarify',
      topicContext: topic,
      grammarTarget,
      form: `Review how ${grammarTarget} is formed before practising it.`,
      examples: [`A sentence about ${topic} using ${grammarTarget}.`],
      whenToUse: `Use ${grammarTarget} when it fits the meaning you want to express.`,
      pitfall: `Watch the form carefully when using ${grammarTarget}.`,
    };
  }
}

async function generateVocabMicro(topic: string, difficulty: Difficulty, sourceContext = ''): Promise<VocabMicroContent> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      sentence: { type: 'string' },
      options: { type: 'array', items: { type: 'string' } },
      correctIndex: { type: 'number' },
      word: { type: 'string' },
      explanation: { type: 'string' },
      example: { type: 'string' },
    },
    required: ['sentence', 'options', 'correctIndex', 'word', 'explanation'],
  };

  const prompt = `Create one quick "which word fits?" vocabulary check for an English class at ${difficultyDescriptions[difficulty]}.
Topic: ${topic}.
${sourceContext}${sourceContext ? 'Draw the target word and sentence from the source material above.\n' : ''}
The sentence must be a REAL, natural sentence that a person would actually say or write within the world of "${topic}" — like a line of real travel/everyday English. It must NOT be a sentence that talks ABOUT the lesson, the topic, or "English" itself. Do NOT include the words "topic", "lesson", "English", or the literal phrase "${topic}" in the sentence. (Bad: "The travel English is for a situation at the ___." Good, for travel: "Excuse me, where can I check in for my ___ to São Paulo?")

Provide:
- sentence: one natural, in-context sentence with a single gap shown as "___"
- options: exactly 4 single-word choices that all fit the gap grammatically, with ONE clearly best by MEANING. The three distractors should be plausible in the same context (same part of speech, same general domain) — never random unrelated nouns.
- correctIndex: 0-based index of the best word in options
- word: the correct word (equal to options[correctIndex])
- explanation: one sentence on the word's meaning and why it fits
- example: one more short example sentence using the word`;

  try {
    const data = await generateJSON<{ sentence: string; options: string[]; correctIndex: number; word: string; explanation: string; example?: string }>(prompt, schema);
    const options = Array.isArray(data.options) && data.options.length >= 2 ? data.options.slice(0, 4) : ['interesting', 'table', 'quickly', 'blue'];
    const correctIndex = Math.min(Math.max(data.correctIndex ?? 0, 0), options.length - 1);
    return {
      activityKey: 'vocab-micro',
      topicContext: topic,
      sentence: data.sentence ?? `The word that fits best here is "___".`,
      options,
      correctIndex,
      word: data.word ?? options[correctIndex],
      explanation: data.explanation ?? '',
      example: data.example,
    };
  } catch {
    return {
      activityKey: 'vocab-micro',
      topicContext: topic,
      sentence: `That sounds really ___ — tell me more!`,
      options: ['interesting', 'boring', 'confusing', 'ordinary'],
      correctIndex: 0,
      word: 'interesting',
      explanation: '"Interesting" describes something that holds your attention and makes you want to know more.',
      example: `I find ${topic} really interesting.`,
    };
  }
}

async function generateFinalWord(topic: string, difficulty: Difficulty, sourceContext = '', variant?: string): Promise<FinalWordContent> {
  const cached = await getCachedContent('final-word', topic, difficulty, [], variant, 1);
  if (cached) {
    const c = cached.content_json as { prompt: string };
    return { activityKey: 'final-word', topicContext: topic, prompt: c.prompt ?? '' };
  }

  const schema: AISchema = {
    type: 'object',
    properties: { prompt: { type: 'string' } },
    required: ['prompt'],
  };

  const aiPrompt = `Generate a single spoken prompt for an ESL class closing activity on the topic: ${topic}
${languageRule(difficulty)}
${sourceContext}

The prompt asks every student to say ONE sentence to the class — their genuine opinion or takeaway.
Requirements:
- Opinion-based, no wrong answer
- Short and clear (max 15 words)
- Accessible to all levels — if a student has been listening all lesson, they can answer this
- Starts with "In one sentence..." or "Tell us..." or similar

Return JSON with a single "prompt" string.`;

  try {
    const data = await generateJSON<{ prompt: string }>(aiPrompt, schema);
    void storeCachedContent('final-word', topic, difficulty, { prompt: data.prompt }, 1, variant);
    return { activityKey: 'final-word', topicContext: topic, prompt: data.prompt ?? `In one sentence, what do you think is the most important thing about ${topic}?` };
  } catch {
    return { activityKey: 'final-word', topicContext: topic, prompt: `In one sentence, what do you think is the most important thing about ${topic}?` };
  }
}

async function generateConversationRounds(topic: string, difficulty: Difficulty, sceneContext?: { title: string; context: string }, sourceContext = '', taskRoleplay = false): Promise<ConversationRoundsContent> {
  const schema: AISchema = {
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
      taskChecklist: { type: 'array', items: { type: 'string' } },
    },
    required: ['scenario', 'context', 'roles', 'complications'],
  };

  const sceneNote = sceneContext
    ? `\nIMPORTANT: Base this role-play directly on the Scene Igniter scene the class just performed: "${sceneContext.title}" — ${sceneContext.context}\nThe roles and situation must continue naturally from that scene. Do not invent an unrelated scenario.\n`
    : '';

  const prompt = `Generate a "Conversation Rounds" role-play activity for an ESL class.
Topic/Scenario: ${topic}
${languageRule(difficulty)}${sceneNote}
${pppContextBlock('production')}${sourceContext}
Create one realistic two-person scenario where both roles NEED each other to resolve a situation — not just exchange opinions. There must be a clear conflict of interest or an asymmetric goal.

Rules:
- scenario: short descriptive title (max 6 words)
- context: 1-2 sentences that set the scene for the watching class (simple language, all levels can follow)
- roles: EXACTLY 2 role objects
  - title: role name (2-4 words, e.g. "Hotel Guest", "Restaurant Manager")
  - goal: what they want to achieve — 1 sentence starting with a verb (${difficultyDescriptions[difficulty]})
  - situation: their private context the other person doesn't know — 1 sentence only (${difficultyDescriptions[difficulty]})
  - phrases: 4-5 sentence starters useful for this role (max 8 words each, authentic spoken English)
  - lifelines: 2-3 COMPLETE sentences they can say verbatim if stuck — full natural utterances (${difficultyDescriptions[difficulty]})
- complications: exactly 4 short twist sentences the teacher reads aloud mid-conversation to raise the stakes (max 15 words each)
${taskRoleplay ? '- taskChecklist: exactly 3 concrete things the customer/traveler role must accomplish in the conversation (max 8 words each, e.g. "Ask the price", "Request a non-smoking room", "Confirm the dates")\n' : ''}
Return JSON with scenario, context, roles (array of exactly 2), complications (array of exactly 4)${taskRoleplay ? ', and taskChecklist (array of exactly 3)' : ''}.`;

  try {
    const data = await generateJSON<{
      scenario: string;
      context: string;
      roles: ConversationRoundsContent['roles'];
      complications: string[];
      taskChecklist?: string[];
    }>(prompt, schema);
    return {
      activityKey: 'conversation-rounds',
      topicContext: topic,
      ...(taskRoleplay ? { taskChecklist: (data.taskChecklist ?? []).slice(0, 3) } : {}),
      scenario: data.scenario ?? topic,
      context: data.context ?? `Two students will role-play a situation related to ${topic}.`,
      roles: data.roles ?? [
        { title: 'Role A', goal: 'Resolve the situation', situation: 'You need help.', phrases: ['Could you help me...', 'I was hoping...'], lifelines: ['Excuse me, I need some help with this.'] },
        { title: 'Role B', goal: 'Assist while managing constraints', situation: 'You want to help but have limits.', phrases: ["I understand...", 'What I can do is...'], lifelines: ['I completely understand. Let me see what I can do for you.'] },
      ],
      complications: (data.complications ?? []).slice(0, 4),
    };
  } catch {
    return {
      activityKey: 'conversation-rounds',
      topicContext: topic,
      scenario: topic,
      context: `Two students will role-play a situation related to ${topic}.`,
      roles: [
        { title: 'Role A', goal: 'Resolve the situation', situation: 'You need help.', phrases: ['Could you help me...', 'I was hoping...'], lifelines: ['Excuse me, I need some help with this.'] },
        { title: 'Role B', goal: 'Assist while managing constraints', situation: 'You want to help but have limits.', phrases: ["I understand...", 'What I can do is...'], lifelines: ['I completely understand. Let me see what I can do for you.'] },
      ],
      complications: [],
      ...(taskRoleplay ? { taskChecklist: ['Greet and explain what you need', 'Ask a key question', 'Confirm the details'] } : {}),
    };
  }
}

async function generateStorySprint(topic: string, difficulty: Difficulty, sceneContext?: { title: string; context: string }, sourceContext = ''): Promise<StorySprintGeneratedContent> {
  const difficultyLevels: Record<Difficulty, string> = {
    'Beginner': 'A1 beginner — use simple words and short sentences',
    'Easy': 'A2 elementary — use basic vocabulary and simple structure',
    'Intermediate': 'B1/B2 intermediate — use varied vocabulary and engaging detail',
    'Advanced': 'C1 advanced — use sophisticated language and vivid imagery',
    'Expert': 'C2/Native expert — use masterful prose with rich detail',
  };
  const schema: AISchema = {
    type: 'object',
    properties: { starterSentence: { type: 'string' } },
    required: ['starterSentence'],
  };
  const prompt = sceneContext
    ? `Generate an engaging opening sentence for a collaborative story that continues naturally from this classroom scene: "${sceneContext.title}" — ${sceneContext.context}
Write at ${difficultyLevels[difficulty]} level.
Exactly ONE sentence (15-30 words). Leave the story open for students to continue.`
    : `Generate an engaging opening sentence for a collaborative story about "${topic}".
${sourceContext}Write at ${difficultyLevels[difficulty]} level.
Exactly ONE sentence (15-30 words). Leave it open for continuation.`;
  try {
    const parsed = await generateJSON<{ starterSentence: string }>(prompt, schema);
    return { gameKey: 'story-sprint', starterSentence: parsed.starterSentence ?? `Something unexpected happened that changed everything about ${topic}.` };
  } catch {
    return { gameKey: 'story-sprint', starterSentence: `Something unexpected happened that changed everything about ${topic}.` };
  }
}

async function generateTopicBrief(topic: string, difficulty: Difficulty): Promise<{ title: string; text: string }> {
  const schema: AISchema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      text: { type: 'string' },
    },
    required: ['title', 'text'],
  };

  const prompt = `Write a short classroom reading passage for ESL students.
Topic: "${topic}"
${languageRule(difficulty)}
${pppContextBlock('presentation')}
Requirements:
- 4–5 paragraphs, approximately 280–320 words total
- Clear, natural prose at the specified language level
- Grounded in real facts or common perspectives about the topic
- No headers, bullet points, or lists — flowing paragraphs only
- End the final paragraph with an open question or debatable claim students can discuss
Return JSON with "title" (short, engaging) and "text" (the full passage).`;

  const parsed = await generateJSON<{ title: string; text: string }>(prompt, schema);
  return { title: parsed.title ?? topic, text: parsed.text ?? '' };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LessonPlanGenerateRequest & {
      grammarTarget?: string;
      standardTopicId?: string;
      sessionId?: string;
      taskRoleplay?: boolean;
    };

    const {
      customTopic: rawCustomTopic,
      standardTopicId,
      difficulty,
      activities,
      games,
      studentCount,
      goal,
      missionContext,
      grammarTarget,
      taskRoleplay,
      needsSourceVocab,
      sourceVocab: sourceVocabFromRequest,
      courseContext,
    } = body;

    const sourceMaterial = normalizePastedSourceMaterial(body.sourceMaterial);

    // Fetch real transcript from DB — used by ALL generators, not just checkpoints
    const sourceRawTranscript = await fetchSourceTranscript(sourceMaterial);

    const sourceCtx = `${buildSourceContext(sourceMaterial, sourceRawTranscript)}${buildCourseContinuityPrompt(courseContext)}`;
    // Grammar drills key their cache on grammarTarget and skip the cache when a source is
    // attached (they don't reuse across sources). Everything else variant-keys on the actual
    // grounding (source text + mission), so grounded lessons get their own cache namespace
    // yet still reuse across identical grounding — instead of skipping the cache entirely.
    const skipCache = !!sourceMaterial;
    const grounding = groundingVariant(sourceCtx, missionContext && missionContext.length > 0 ? missionContext.join('') : undefined);

    // Resolve effective topic: Pro users send customTopic, Standard users send standardTopicId
    const customTopic: string =
      rawCustomTopic ||
      (standardTopicId && isValidStandardTopicId(standardTopicId)
        ? getStandardTopicLabel(standardTopicId)
        : '');
    const sourceGrounding = buildSourceGroundingContract(sourceMaterial, customTopic, sourceRawTranscript);

    // Auth only (credits are consumed at session creation, not per generation)
    const { error: authError } = await requireAuthForGeneration();
    if (authError) return authError;

    // Allow requests with only games (no activities required)
    const hasActivities = activities && activities.length > 0;
    const hasGames = games && games.length > 0;

    if (!customTopic || !difficulty || (!hasActivities && !hasGames)) {
      return NextResponse.json({ error: 'Missing required fields: topic, difficulty, and at least one activity or game' }, { status: 400 });
    }

    const diff = difficulty as Difficulty;
    const content: Record<string, ActivityGeneratedContent> = {};
    const gameContent: Record<string, GameGeneratedContent> = {};
    const generators: Promise<void>[] = [];

    // Canonical source vocab: generate once at start, carry forward to all source-grounded activities
    let sourceVocab: SourceVocabItem[] = sourceVocabFromRequest ?? [];
    if (needsSourceVocab && sourceVocab.length === 0 && sourceCtx.length > 0) {
      try {
        sourceVocab = await generateSourceVocab(customTopic, diff, sourceCtx);
      } catch (err) {
        console.warn('generateSourceVocab failed:', err instanceof Error ? err.message.slice(0, 100) : err);
      }
    }

    // Vocab Blitz shared word list: run Vocab Radar first, pass words to Vocab Sprint
    const vocabBlitzMode = hasActivities && hasGames &&
      activities.includes('vocab-radar') && games.includes('vocab-sprint');
    if (vocabBlitzMode) {
      try {
        const vocabRadarResult = await generateVocabRadar(customTopic, diff, sourceCtx);
        content['vocab-radar'] = vocabRadarResult;
        const keyVocabWords = vocabRadarResult.words.map((w) => w.word);
        gameContent['vocab-sprint'] = await generateVocabSprint(customTopic, diff, keyVocabWords, sourceCtx);
        content['in-your-words'] = { activityKey: 'in-your-words', topicContext: customTopic, words: keyVocabWords };
      } catch (err) {
        console.warn('Vocab blitz sequential chain failed, continuing:', err instanceof Error ? err.message.slice(0, 100) : err);
      }
    }

    // Read-Aloud + Vocab Radar: run Vocab Radar first so both share the same word list
    const readAloudVocabMode = hasActivities &&
      activities.includes('read-aloud') && activities.includes('vocab-radar') && !vocabBlitzMode;
    let readAloudVocabWords: string[] | undefined;
    if (readAloudVocabMode) {
      try {
        const radarResult = await generateVocabRadar(customTopic, diff, sourceCtx);
        content['vocab-radar'] = radarResult;
        readAloudVocabWords = radarResult.words.map((w) => w.word);
      } catch (err) {
        console.warn('readAloudVocabMode vocab-radar failed:', err instanceof Error ? err.message.slice(0, 100) : err);
      }
    }

    // Scene chain: Scene Igniter feeds Conversation Rounds and/or Story Sprint
    const hasSceneIgniter = hasActivities && activities.includes('scene-igniter');
    const hasConvRounds = hasActivities && activities.includes('conversation-rounds');
    const hasStorySprint = hasGames && games?.includes('story-sprint');
    const sceneChainMode = hasSceneIgniter && (hasConvRounds || hasStorySprint);
    if (sceneChainMode) {
      try {
        const sceneResult = await generateSceneIgniter(customTopic, diff, sourceCtx, studentCount);
        content['scene-igniter'] = sceneResult;
        const primaryScene = sceneResult.scenes[0];
        const sceneCtx = { title: primaryScene.title, context: primaryScene.context };
        if (hasConvRounds) content['conversation-rounds'] = await generateConversationRounds(customTopic, diff, sceneCtx, sourceCtx, taskRoleplay);
        if (hasStorySprint) gameContent['story-sprint'] = await generateStorySprint(customTopic, diff, sceneCtx, sourceCtx);
      } catch (err) {
        console.warn('Scene chain sequential generation failed, continuing:', err instanceof Error ? err.message.slice(0, 100) : err);
      }
    }

    // Generate activity content
    if (hasActivities) {
      for (const activityKey of activities) {
        if (vocabBlitzMode && activityKey === 'vocab-radar') continue; // already generated above
        switch (activityKey) {
          case 'would-you-rather':
            generators.push(generateWouldYouRather(customTopic, diff, missionContext, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'hot-take-arena':
            generators.push(generateHotTakeArena(customTopic, diff, missionContext, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'decision-council':
            generators.push(generateDecisionCouncil(customTopic, diff, missionContext, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'team-debate':
            generators.push(generateTeamDebate(customTopic, diff, missionContext, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'two-truths':
            generators.push(generateTwoTruths(customTopic, diff, missionContext, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'two-truths-and-a-lie':
            // No AI generation — content is student-generated at runtime
            generators.push(Promise.resolve().then(() => { content[activityKey] = { activityKey, topicContext: customTopic }; }));
            break;
          case 'rank-it':
            generators.push(generateRankIt(customTopic, diff, missionContext, sourceCtx, sourceGrounding).then((r) => { content[activityKey] = r; }));
            break;
          case 'fact-detective':
            generators.push(generateFactDetective(customTopic, diff, missionContext, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'expert-panel':
            generators.push(generateExpertPanel(customTopic, diff, studentCount ?? 9, missionContext, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'scenario-simulator':
            generators.push(generateScenarioSimulator(customTopic, diff, missionContext, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'interview-lab':
            generators.push(generateInterviewLab(customTopic, diff, missionContext, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'problem-solvers':
            generators.push(generateProblemSolvers(customTopic, diff, missionContext, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'design-studio':
            content[activityKey] = {
              activityKey: 'design-studio',
              topicContext: customTopic,
              challenge: customTopic,
              openingPrompt: 'What should the class create to respond to this challenge?',
              successCriteria: [
                'Build directly from the starting idea',
                'Make choices with real benefits and tradeoffs',
                'Create a design the class can explain and defend',
              ],
              maxDecisions: 6,
            };
            break;
          case 'wonder-board':
            generators.push(generateWonderBoard(customTopic, diff, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'quick-pulse':
            generators.push(generateQuickPulse(customTopic, diff, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'vocab-radar':
            if (readAloudVocabMode) break; // already generated above
            if (vocabBlitzMode) break; // already generated above
            if (sourceVocab.length > 0) {
              content[activityKey] = {
                activityKey: 'vocab-radar',
                topicContext: customTopic,
                words: sourceVocab.slice(0, 6).map((v) => ({ word: v.term, definition: v.meaning })),
              };
              break;
            }
            generators.push(generateVocabRadar(customTopic, diff, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'prediction-round':
            generators.push(generatePredictionRound(customTopic, diff, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'contribution-break':
            generators.push(Promise.resolve().then(() => {
              const topicLabel = customTopic ? ` about ${customTopic}` : '';
              content[activityKey] = {
                activityKey: 'contribution-break',
                topicContext: customTopic,
                prompt: `Submit one useful idea, question, or phrase${topicLabel} for the next stage`,
              };
            }));
            break;
          case 'language-toolkit':
            if (sourceVocab.length > 0) {
              content[activityKey] = { activityKey: 'language-toolkit', topicContext: customTopic, items: sourceVocab };
            } else if (needsSourceVocab) {
              // sourceVocab still empty — generate inline (source stage may not have run yet)
              generators.push(generateSourceVocab(customTopic, diff, sourceCtx).then((items) => {
                if (items.length) sourceVocab = items;
                content[activityKey] = { activityKey: 'language-toolkit', topicContext: customTopic, items };
              }));
            } else {
              // Standalone use (not in a source-vocab lesson)
              generators.push(generateSourceVocab(customTopic, diff, sourceCtx).then((items) => {
                content[activityKey] = { activityKey: 'language-toolkit', topicContext: customTopic, items };
              }));
            }
            break;
          case 'listening-gap-fill':
            generators.push(generateListeningGapFill(customTopic, diff, sourceCtx, grammarTarget ?? undefined, getGapFillMode(sourceMaterial)).then((r) => { content[activityKey] = r; }));
            break;
          case 'read-aloud': {
            const rawText = sourceMaterial?.briefingText ?? sourceMaterial?.rawText ?? sourceMaterial?.summary ?? '';
            if (rawText.length > 0) {
              const cleanText = stripAsterisks(rawText);
              const vocabWords = sourceVocab.length > 0
                ? sourceVocab.map((v) => v.term)
                : (readAloudVocabWords ?? extractAsteriskWords(rawText));
              const readTitle = sourceMaterial?.title ?? customTopic;
              generators.push(
                generateComprehensionQuestions(readTitle, cleanText, 'reading', diff, { vocabWords })
                  .catch((): ComprehensionSet => ({ questions: [] }))
                  .then(({ questions, discussionPrompt }) => {
                    content[activityKey] = {
                      activityKey: 'read-aloud',
                      topicContext: customTopic,
                      sourceText: cleanText,
                      sourceTitle: readTitle,
                      readingTurnWords: getReadingTurnWordTarget(diff),
                      ...(sourceMaterial?.citations?.length ? { sourceCitations: sourceMaterial.citations } : {}),
                      ...(vocabWords.length > 0 ? { vocabWords } : {}),
                      ...(sourceMaterial?.slides ? { slides: sourceMaterial.slides } : {}),
                      ...(questions.length > 0 ? { comprehensionQuestions: questions } : {}),
                      ...(discussionPrompt ? { discussionPrompt } : {}),
                    };
                  }),
              );
            } else {
              // Topic-only: generate brief first, then extract canonical vocab from it
              generators.push(generateTopicBrief(customTopic, diff).then(async (brief) => {
                if (needsSourceVocab && sourceVocab.length === 0 && brief.text) {
                  try {
                    const briefCtx = `Source material — ground ALL content ONLY in this text:\n\n${brief.text}`;
                    sourceVocab = await generateSourceVocab(customTopic, diff, briefCtx);
                  } catch (err) {
                    console.warn('generateSourceVocab from brief failed:', err instanceof Error ? err.message.slice(0, 100) : err);
                  }
                }
                const briefVocab = sourceVocab.map((v) => v.term);
                const { questions, discussionPrompt } = brief.text
                  ? await generateComprehensionQuestions(brief.title, brief.text, 'reading', diff, { vocabWords: briefVocab }).catch((): ComprehensionSet => ({ questions: [] }))
                  : { questions: [], discussionPrompt: undefined };
                content[activityKey] = {
                  activityKey: 'read-aloud',
                  topicContext: customTopic,
                  sourceText: brief.text,
                  sourceTitle: brief.title,
                  readingTurnWords: getReadingTurnWordTarget(diff),
                  ...(briefVocab.length > 0 ? { vocabWords: briefVocab } : {}),
                  ...(questions.length > 0 ? { comprehensionQuestions: questions } : {}),
                  ...(discussionPrompt ? { discussionPrompt } : {}),
                };
              }));
            }
            break;
          }
          case 'video-player': {
            const youtubeLibraries: Record<string, Array<{ id: string; youtubeId: string }>> = {
              bbc: bbcLibrary as Array<{ id: string; youtubeId: string }>,
              'bbc-ideas': bbcIdeasLibrary as Array<{ id: string; youtubeId: string }>,
              kurzgesagt: kurzgesagtLibrary as Array<{ id: string; youtubeId: string }>,
              bigthink: bigthinkLibrary as Array<{ id: string; youtubeId: string }>,
              vox: voxLibrary as Array<{ id: string; youtubeId: string }>,
              kids: kidsLibrary as Array<{ id: string; youtubeId: string }>,
              natgeo: natgeoLibrary as Array<{ id: string; youtubeId: string }>,
              'crash-course': crashCourseLibrary as Array<{ id: string; youtubeId: string }>,
              'travel-english': travelEnglishLibrary as Array<{ id: string; youtubeId: string }>,
              'world-flight': worldFlightLibrary as Array<{ id: string; youtubeId: string }>,
              'business-english': businessEnglishLibrary as Array<{ id: string; youtubeId: string }>,
              'internet-memes': internetMemesLibrary as Array<{ id: string; youtubeId: string }>,
              minecraft: minecraftLibrary as Array<{ id: string; youtubeId: string }>,
              sports: sportsLibrary as Array<{ id: string; youtubeId: string }>,
            };
            const isYouTubeLibrary = sourceMaterial?.sourceType != null && sourceMaterial.sourceType in youtubeLibraries;
            if (sourceMaterial && (sourceMaterial.sourceType === 'youtube' || sourceMaterial.sourceType === 'ted' || sourceMaterial.sourceType === 'teded' || isYouTubeLibrary) && sourceMaterial.sourceKey) {
              generators.push(generateVideoComprehensionQuestions(sourceMaterial, diff).then(({ questions, discussionPrompt }) => {
                let videoUrl: string;
                if (sourceMaterial.sourceType === 'ted') {
                  const tedTalk = (tedLibrary as Array<{ id: string; url: string }>).find((t) => t.id === sourceMaterial.sourceKey);
                  const slug = tedTalk?.url.split('/').pop() ?? sourceMaterial.sourceKey;
                  videoUrl = `https://embed.ted.com/talks/${slug}`;
                } else if (sourceMaterial.sourceType === 'teded') {
                  const tedEdTalk = (tededLibrary as Array<{ id: string; youtubeId: string }>).find((t) => t.id === sourceMaterial.sourceKey);
                  videoUrl = `https://www.youtube.com/watch?v=${tedEdTalk?.youtubeId ?? sourceMaterial.sourceKey}`;
                } else if (isYouTubeLibrary) {
                  const lib = youtubeLibraries[sourceMaterial.sourceType];
                  const entry = lib.find((t) => t.id === sourceMaterial.sourceKey);
                  videoUrl = `https://www.youtube.com/watch?v=${entry?.youtubeId ?? sourceMaterial.sourceKey}`;
                } else {
                  videoUrl = `https://www.youtube.com/watch?v=${sourceMaterial.sourceKey}`;
                }
                const videoContent: VideoPlayerContent = {
                  activityKey: 'video-player',
                  topicContext: customTopic,
                  videoUrl,
                  videoTitle: sourceMaterial.title,
                  comprehensionQuestions: questions,
                  ...(discussionPrompt ? { discussionPrompt } : {}),
                };
                content[activityKey] = videoContent;
              }));
            }
            break;
          }
          case 'scene-igniter':
            if (sceneChainMode) break; // already generated sequentially above
            generators.push(generateSceneIgniter(customTopic, diff, sourceCtx, studentCount).then((r) => { content[activityKey] = r; }));
            break;
          case 'final-answer':
            generators.push(generateFinalAnswer(customTopic, diff, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'mic-drop':
            generators.push(generateMicDrop(customTopic, diff, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'lightning-round':
            generators.push(generateLightningRound(customTopic, diff, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'opinion-shift':
            // Static reflection scaffold — no AI call.
            content[activityKey] = generateOpinionShift(customTopic);
            break;
          case 'mission-selector':
            generators.push(generateMissionSelectorContent(customTopic, diff, goal).then((r) => { content[activityKey] = r; }));
            break;
          case 'character-cards':
            generators.push(generateCharacterCards(customTopic, diff, missionContext, sourceCtx, grounding).then((r) => { content[activityKey] = r; }));
            break;
          case 'imposter':
            generators.push(generateImposter(customTopic, diff, sourceCtx, grounding).then((r) => { content[activityKey] = r; }));
            break;
          case 'password':
            generators.push(generatePassword(customTopic, diff, sourceCtx, grounding).then((r) => { content[activityKey] = r; }));
            break;
          case 'bluff-definition':
            generators.push(generateBluffDefinition(customTopic, diff, sourceCtx, grounding).then((r) => { content[activityKey] = r; }));
            break;
          case 'taboo-sprint':
            generators.push(generateTabooSprint(customTopic, diff, sourceCtx, grounding).then((r) => { content[activityKey] = r; }));
            break;
          case 'grammar-check-in':
            generators.push(generateGrammarCheckIn(customTopic, diff, grammarTarget, skipCache).then((r) => { content[activityKey] = r; }));
            break;
          case 'grammar-proof':
            generators.push(generateGrammarProof(customTopic, diff, grammarTarget ?? 'grammar', skipCache).then((r) => { content[activityKey] = r; }));
            break;
          case 'grammar-clarify':
            generators.push(generateGrammarClarify(customTopic, diff, grammarTarget ?? 'grammar', sourceCtx, skipCache).then((r) => { content[activityKey] = r; }));
            break;
          case 'vocab-micro':
            generators.push(generateVocabMicro(customTopic, diff, sourceCtx).then((r) => { content[activityKey] = r; }));
            break;
          case 'final-word':
            generators.push(generateFinalWord(customTopic, diff, sourceCtx, grounding).then((r) => { content[activityKey] = r; }));
            break;
          case 'in-your-words':
            if (vocabBlitzMode) break; // already built from Vocab Radar words above
            generators.push(Promise.resolve().then(() => { content[activityKey] = { activityKey: 'in-your-words', topicContext: customTopic, words: [] }; }));
            break;
          case 'conversation-rounds':
            if (sceneChainMode) break; // already generated sequentially above
            generators.push(generateConversationRounds(customTopic, diff, undefined, sourceCtx, taskRoleplay).then((r) => { content[activityKey] = r; }));
            break;
          case 'trip-hotel':
            // Travel-arc roleplay stage: ConversationRounds task-roleplay grounded on its own
            // per-stage source. (Getting There, Attractions, and the Meal are data-seeded from
            // real anchors and injected at launch — not generated here.)
            generators.push(generateConversationRounds(customTopic, diff, undefined, sourceCtx, true).then((r) => { content[activityKey] = r; }));
            break;
          case 'cabin-mystery':
            // V1 is a static hand-authored case. No AI generation required.
            generators.push(Promise.resolve().then(() => {
              content[activityKey] = { ...switchedSuitcase, topicContext: customTopic };
            }));
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
            if (vocabBlitzMode) break; // already generated sequentially above
            // Vocab spine (Stage 3): drill the SAME words the Language Toolkit taught. The hard
            // rounds use these as targetWords; falls back to topic-picked terms when no source vocab.
            generators.push(generateVocabSprint(customTopic, diff, sourceVocab.length > 0 ? sourceVocab.map((v) => v.term) : undefined, sourceCtx).then((r) => { gameContent[gameKey] = r; }));
            break;
          case 'grammar-boss':
            generators.push(generateGrammarBoss(customTopic, diff).then((r) => { gameContent[gameKey] = r; }));
            break;
          case 'word-chain':
            generators.push(generateWordChain(customTopic, diff, sourceCtx).then((r) => { gameContent[gameKey] = r; }));
            break;
          case 'synonym-showdown':
            // Vocab spine (Stage 3): bias the target word toward the taught vocab when present.
            generators.push(generateSynonymShowdown(customTopic, diff, sourceCtx, sourceVocab.length > 0 ? sourceVocab.map((v) => v.term) : undefined).then((r) => { gameContent[gameKey] = r; }));
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
            generators.push(generateConnections(customTopic, diff, sourceCtx).then((r) => { gameContent[gameKey] = r; }));
            break;
          case 'story-sprint':
            if (sceneChainMode) break; // already generated sequentially above
            generators.push(generateStorySprint(customTopic, diff, undefined, sourceCtx).then((r) => { gameContent[gameKey] = r; }));
            break;
          default:
            console.warn(`Unknown game: ${gameKey}`);
        }
      }
    }

    const results = await Promise.allSettled(generators);

    // Count failures for degraded flag
    const failedCount = results.filter((r) => r.status === 'rejected').length;
    if (failedCount > 0) {
      console.warn(`Lesson plan: ${failedCount}/${results.length} generators failed`);
      for (const r of results) {
        if (r.status === 'rejected') console.error('Generator failure:', r.reason);
      }
    }

    const succeededCount = results.length - failedCount;
    // Some cases (e.g. language-toolkit from cached sourceVocab) populate content synchronously
    // without pushing to generators[]. Count those as successes too.
    const hasDirectContent = Object.keys(content).length > 0 || Object.keys(gameContent).length > 0;
    const response: LessonPlanGenerateResponse = {
      success: succeededCount > 0 || hasDirectContent,
      content,
      gameContent,
      ...(failedCount > 0 && { degraded: true, failedCount }),
      ...(sourceVocab.length > 0 && needsSourceVocab ? { sourceVocab } : {}),
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Lesson plan generation error:', error);
    return NextResponse.json(
      { success: false, content: {}, error: error instanceof Error ? error.message : 'Failed to generate lesson plan' } as LessonPlanGenerateResponse,
      { status: 500 }
    );
  }
}
