import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Difficulty descriptions for AI prompts
const difficultyDescriptions: Record<Difficulty, string> = {
  'Beginner': 'A1 level - Use very simple vocabulary and short sentences. Focus on basic concepts.',
  'Easy': 'A2 level - Use simple but functional vocabulary. Keep sentences straightforward.',
  'Intermediate': 'B1/B2 level - Use natural vocabulary and moderate complexity. Include some idioms.',
  'Advanced': 'C1 level - Use sophisticated vocabulary and complex sentence structures.',
  'Expert': 'C2/Native level - Use nuanced, academic language with subtle distinctions.',
};

// Generate content for Would You Rather activity
async function generateWouldYouRather(topic: string, difficulty: Difficulty): Promise<WouldYouRatherContent> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          dilemmas: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                optionA: { type: SchemaType.STRING },
                optionB: { type: SchemaType.STRING },
                discussionPrompt: { type: SchemaType.STRING },
              },
              required: ['id', 'optionA', 'optionB', 'discussionPrompt'],
            },
          },
          potentialFollowUps: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                dilemmaId: { type: SchemaType.STRING },
                questions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              },
              required: ['dilemmaId', 'questions'],
            },
          },
        },
        required: ['dilemmas', 'potentialFollowUps'],
      },
    },
  });

  const prompt = `Generate 5 "Would You Rather?" dilemmas for an ESL classroom.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Each dilemma needs two options (both appealing OR both unappealing), a discussion prompt, and 3 follow-up questions.
Return JSON with 'dilemmas' array and 'potentialFollowUps' array (each with dilemmaId and questions).`;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());

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

// Generate content for Hot Take Arena
async function generateHotTakeArena(topic: string, difficulty: Difficulty): Promise<HotTakeArenaContent> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          statement: { type: SchemaType.STRING },
          proArguments: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          conArguments: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          devilsAdvocate: {
            type: SchemaType.OBJECT,
            properties: {
              proChallenges: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              conChallenges: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            },
            required: ['proChallenges', 'conChallenges'],
          },
          vocabularyHighlights: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ['statement', 'proArguments', 'conArguments', 'devilsAdvocate', 'vocabularyHighlights'],
      },
    },
  });

  const prompt = `Generate a debate topic for ESL "Hot Take Arena".
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Create a provocative statement, 3-4 pro/con arguments, 3 devil's advocate challenges per side, and 5-8 vocabulary words.`;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());

  return { activityKey: 'hot-take-arena', topicContext: topic, ...parsed };
}

// Generate content for Two Truths & A Fabrication
async function generateTwoTruths(topic: string, difficulty: Difficulty): Promise<TwoTruthsContent> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          rounds: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                statements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                fabricationIndex: { type: SchemaType.NUMBER },
                explanation: { type: SchemaType.STRING },
                difficulty: { type: SchemaType.STRING },
              },
              required: ['id', 'statements', 'fabricationIndex', 'explanation', 'difficulty'],
            },
          },
        },
        required: ['rounds'],
      },
    },
  });

  const prompt = `Generate 5 rounds of "Two Truths & A Fabrication" for ESL class.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Each round: 3 statements (2 true, 1 false about the topic), fabricationIndex (0-2), explanation why it's false.
Mix difficulty levels (easy/medium/hard).`;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());

  return { activityKey: 'two-truths', topicContext: topic, rounds: parsed.rounds };
}

// Generate content for Rank It!
async function generateRankIt(topic: string, difficulty: Difficulty): Promise<RankItContent> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          challenges: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                prompt: { type: SchemaType.STRING },
                items: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      id: { type: SchemaType.STRING },
                      name: { type: SchemaType.STRING },
                      hiddenFact: { type: SchemaType.STRING },
                    },
                    required: ['id', 'name', 'hiddenFact'],
                  },
                },
                revealFacts: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              },
              required: ['id', 'prompt', 'items', 'revealFacts'],
            },
          },
        },
        required: ['challenges'],
      },
    },
  });

  const prompt = `Generate 3 "Rank It!" challenges for ESL class.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Each challenge: a ranking prompt, 4-5 items with hidden facts that might change minds.
Example: "Rank these animals by survival ability" with surprising facts about each.`;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());

  return { activityKey: 'rank-it', topicContext: topic, challenges: parsed.challenges };
}

// Generate content for Fact Detective
async function generateFactDetective(topic: string, difficulty: Difficulty): Promise<FactDetectiveContent> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          claims: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                statement: { type: SchemaType.STRING },
                isTrue: { type: SchemaType.BOOLEAN },
                explanation: { type: SchemaType.STRING },
                vocabulary: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                difficulty: { type: SchemaType.STRING },
              },
              required: ['id', 'statement', 'isTrue', 'explanation', 'vocabulary', 'difficulty'],
            },
          },
        },
        required: ['claims'],
      },
    },
  });

  const prompt = `Generate 6 fact/myth claims for "Fact Detective" ESL activity.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Mix of true facts and plausible myths. Include explanation and 2-3 vocabulary words per claim.
Make claims progressively harder to guess.`;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());

  return { activityKey: 'fact-detective', topicContext: topic, claims: parsed.claims };
}

// Generate content for Expert Panel
async function generateExpertPanel(topic: string, difficulty: Difficulty): Promise<ExpertPanelContent> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          roles: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                title: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                expertise: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                suggestedVocabulary: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              },
              required: ['id', 'title', 'description', 'expertise', 'suggestedVocabulary'],
            },
          },
          starterQuestions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                targetRoleId: { type: SchemaType.STRING },
                question: { type: SchemaType.STRING },
                followUpHints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              },
              required: ['id', 'targetRoleId', 'question', 'followUpHints'],
            },
          },
        },
        required: ['roles', 'starterQuestions'],
      },
    },
  });

  const prompt = `Generate an "Expert Panel" activity for ESL class.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Create 4 expert roles related to the topic (e.g., scientist, historian, economist, activist).
Each role: title, description, expertise areas, suggested vocabulary.
Create 6 starter questions (mix of roles targeted), each with follow-up hints.`;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());

  return { activityKey: 'expert-panel', topicContext: topic, roles: parsed.roles, starterQuestions: parsed.starterQuestions };
}

// Generate content for Scenario Simulator
async function generateScenarioSimulator(topic: string, difficulty: Difficulty): Promise<ScenarioSimulatorContent> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          scenario: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              context: { type: SchemaType.STRING },
              objective: { type: SchemaType.STRING },
            },
            required: ['title', 'context', 'objective'],
          },
          roles: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                name: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                goals: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              },
              required: ['id', 'name', 'description', 'goals'],
            },
          },
          initialSituation: { type: SchemaType.STRING },
          branchingPoints: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                situation: { type: SchemaType.STRING },
                choices: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      id: { type: SchemaType.STRING },
                      action: { type: SchemaType.STRING },
                      consequence: { type: SchemaType.STRING },
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
      },
    },
  });

  const prompt = `Generate a "Scenario Simulator" for ESL class.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Create an engaging scenario with:
- Title, context, and objective
- 3-4 roles with different goals
- Initial situation
- 4 branching points with 2-3 choices each, showing consequences`;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());

  return { activityKey: 'scenario-simulator', topicContext: topic, ...parsed };
}

// Generate content for Interview Lab
async function generateInterviewLab(topic: string, difficulty: Difficulty): Promise<InterviewLabContent> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          character: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              role: { type: SchemaType.STRING },
              background: { type: SchemaType.STRING },
              personality: { type: SchemaType.STRING },
              expertise: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            },
            required: ['name', 'role', 'background', 'personality', 'expertise'],
          },
          context: { type: SchemaType.STRING },
          sampleQuestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          registers: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ['character', 'context', 'sampleQuestions', 'registers'],
      },
    },
  });

  const prompt = `Generate an "Interview Lab" character for ESL class.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Create an interesting character to interview:
- Name, role, background, personality
- Expertise areas
- Interview context
- 5 sample questions students could ask
- Registers: ['formal', 'casual']`;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());

  return { activityKey: 'interview-lab', topicContext: topic, ...parsed };
}

// Generate content for Problem Solvers
async function generateProblemSolvers(topic: string, difficulty: Difficulty): Promise<ProblemSolversContent> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          problem: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              resources: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              successCriteria: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            },
            required: ['title', 'description', 'resources', 'successCriteria'],
          },
          constraints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          complications: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                trigger: { type: SchemaType.STRING },
                complication: { type: SchemaType.STRING },
                hints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              },
              required: ['id', 'trigger', 'complication', 'hints'],
            },
          },
        },
        required: ['problem', 'constraints', 'complications'],
      },
    },
  });

  const prompt = `Generate a "Problem Solvers" challenge for ESL class.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Create:
- Problem with title, description, 5-6 available resources, success criteria
- 3-4 constraints
- 3 complications that force adaptation (with hints)

Example: "Design a city for 10 million people with no cars"`;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());

  return { activityKey: 'problem-solvers', topicContext: topic, ...parsed };
}

// ============================================
// Game Generators
// ============================================

// Generate content for Vocab Sprint
async function generateVocabSprint(topic: string, difficulty: Difficulty): Promise<VocabSprintGeneratedContent> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            sentence: { type: SchemaType.STRING },
            weakWord: { type: SchemaType.STRING },
            hint: { type: SchemaType.STRING },
          },
          required: ['sentence', 'weakWord', 'hint'],
        },
      },
    },
  });

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

  const result = await model.generateContent(prompt);
  const sentences = JSON.parse(result.response.text());

  return { gameKey: 'vocab-sprint', sentences };
}

// Generate content for Grammar Boss
async function generateGrammarBoss(topic: string, difficulty: Difficulty): Promise<GrammarBossGeneratedContent> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          task: { type: SchemaType.STRING },
          exampleSentence: { type: SchemaType.STRING },
        },
        required: ['task', 'exampleSentence'],
      },
    },
  });

  const grammarTargets = ['tense', 'conditional', 'passive', 'relative clause', 'reported speech'];
  const randomTarget = grammarTargets[Math.floor(Math.random() * grammarTargets.length)];

  const prompt = `Generate a short speaking challenge for an English learner at ${difficultyDescriptions[difficulty]}
Topic: ${topic}.
Target Grammar: ${randomTarget}.

Provide:
1. A concise, engaging speaking task (1-2 sentences) that naturally requires the target grammar.
2. A perfect example sentence using the target grammar correctly.`;

  const result = await model.generateContent(prompt);
  const data = JSON.parse(result.response.text());

  return { gameKey: 'grammar-boss', task: data.task, exampleSentence: data.exampleSentence };
}

// Generate content for Word Chain
async function generateWordChain(topic: string, difficulty: Difficulty): Promise<WordChainGeneratedContent> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          startingWord: { type: SchemaType.STRING },
          hint: { type: SchemaType.STRING },
        },
        required: ['startingWord', 'hint'],
      },
    },
  });

  const prompt = `Generate a starting word for a word association chain game at ${difficultyDescriptions[difficulty]}
Topic: ${topic}.

Choose a starting word that:
1. Has MANY possible associations (at least 10+ related concepts)
2. Is appropriate for the difficulty level
3. Relates to the topic
4. Is a concrete noun or common concept (easier to associate)

Also provide a short hint about the type of associations expected (max 8 words).`;

  const result = await model.generateContent(prompt);
  const data = JSON.parse(result.response.text());

  return { gameKey: 'word-chain', startingWord: data.startingWord, hint: data.hint };
}

// Generate content for Synonym Showdown
async function generateSynonymShowdown(topic: string, difficulty: Difficulty): Promise<SynonymShowdownGeneratedContent> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          targetWord: { type: SchemaType.STRING },
          contextSentence: { type: SchemaType.STRING },
          hint: { type: SchemaType.STRING },
        },
        required: ['targetWord', 'contextSentence', 'hint'],
      },
      temperature: 1.2,
    },
  });

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

  const result = await model.generateContent(prompt);
  const data = JSON.parse(result.response.text());

  return { gameKey: 'synonym-showdown', targetWord: data.targetWord, contextSentence: data.contextSentence, hint: data.hint };
}

// Generate content for Error Hunter
async function generateErrorHunter(topic: string, difficulty: Difficulty): Promise<ErrorHunterGeneratedContent> {
  const difficultyConfig: Record<Difficulty, { errors: number; description: string }> = {
    'Beginner': { errors: 2, description: 'Beginner (A1) level. Use very simple sentences with obvious spelling/grammar errors.' },
    'Easy': { errors: 3, description: 'Easy (A2) level. Use simple sentences with basic grammar errors.' },
    'Intermediate': { errors: 4, description: 'Intermediate (B1/B2) level. Use standard sentences with grammar and word choice errors.' },
    'Advanced': { errors: 4, description: 'Advanced (C1) level. Use complex sentences with subtle grammar errors.' },
    'Expert': { errors: 5, description: 'Expert (C2/Native) level. Use sophisticated sentences with nuanced errors.' },
  };

  const config = difficultyConfig[difficulty];

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          paragraph: { type: SchemaType.STRING },
          errorCount: { type: SchemaType.INTEGER },
          errors: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                position: { type: SchemaType.INTEGER },
                word: { type: SchemaType.STRING },
                errorType: { type: SchemaType.STRING },
                correction: { type: SchemaType.STRING },
              },
              required: ['position', 'word', 'errorType', 'correction'],
            },
          },
        },
        required: ['paragraph', 'errorCount', 'errors'],
      },
    },
  });

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

  const result = await model.generateContent(prompt);
  const data = JSON.parse(result.response.text());

  return { gameKey: 'error-hunter', paragraph: data.paragraph, errorCount: data.errorCount, _errors: data.errors };
}

// Generate content for Dialogue Detective
async function generateDialogueDetective(topic: string, difficulty: Difficulty): Promise<DialogueDetectiveGeneratedContent> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          speakerA_before: { type: SchemaType.STRING },
          speakerA_after: { type: SchemaType.STRING },
          context: { type: SchemaType.STRING },
          goal: { type: SchemaType.STRING },
        },
        required: ['speakerA_before', 'speakerA_after', 'context', 'goal'],
      },
    },
  });

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

  const result = await model.generateContent(prompt);
  const data = JSON.parse(result.response.text());

  return { gameKey: 'dialogue-detective', speakerA_before: data.speakerA_before, speakerA_after: data.speakerA_after, context: data.context, goal: data.goal };
}

// Generate content for Tone Transformer
async function generateToneTransformer(topic: string, difficulty: Difficulty): Promise<ToneTransformerGeneratedContent> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          originalSentence: { type: SchemaType.STRING },
          currentTone: { type: SchemaType.STRING },
          context: { type: SchemaType.STRING },
        },
        required: ['originalSentence', 'currentTone', 'context'],
      },
    },
  });

  const prompt = `Generate a sentence for a tone transformation exercise at ${difficultyDescriptions[difficulty]}
Topic: ${topic}.

Create:
1. A natural sentence with a clear tone (casual, formal, friendly, etc.)
2. Label what tone the sentence currently has
3. A brief context explaining when/where this sentence might be used (max 10 words)

The sentence should be appropriate for the difficulty level.`;

  const result = await model.generateContent(prompt);
  const data = JSON.parse(result.response.text());

  // Get a contrasting target tone
  const tones = Object.values(TargetTone) as string[];
  const currentLower = (data.currentTone as string).toLowerCase();
  const contrastingTones = tones.filter(t => !currentLower.includes(t.toLowerCase()));
  const targetTone = contrastingTones[Math.floor(Math.random() * contrastingTones.length)];

  return { gameKey: 'tone-transformer', originalSentence: data.originalSentence, currentTone: data.currentTone, targetTone, context: data.context };
}

// Generate content for Connection
async function generateConnection(topic: string, difficulty: Difficulty): Promise<ConnectionGeneratedContent> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          word1: { type: SchemaType.STRING },
          word2: { type: SchemaType.STRING },
          category: { type: SchemaType.STRING },
          hint: { type: SchemaType.STRING },
        },
        required: ['word1', 'word2', 'category', 'hint'],
      },
      temperature: 1.2,
    },
  });

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

  const result = await model.generateContent(prompt);
  const data = JSON.parse(result.response.text());

  return { gameKey: 'connection', word1: data.word1, word2: data.word2, category: data.category, hint: data.hint };
}

// Generate content for Connections (NYT-style 4x4 grid)
async function generateConnections(topic: string, difficulty: Difficulty): Promise<ConnectionsGeneratedContent> {
  const difficultyPrompts: Record<Difficulty, string> = {
    'Beginner': 'All 4 groups should have very obvious, straightforward connections. Use basic vocabulary.',
    'Easy': 'Groups should be clear with common vocabulary. Minimal red herrings.',
    'Intermediate': 'Mix of obvious and moderate difficulty connections. Include some red herrings.',
    'Advanced': 'Subtle connections that require thinking. Include deliberate red herrings.',
    'Expert': 'Include wordplay, puns, or double meanings. Multiple plausible groupings with one correct answer.'
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          groups: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                category: { type: SchemaType.STRING },
                words: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                difficulty: { type: SchemaType.STRING },
                color: { type: SchemaType.STRING }
              },
              required: ['category', 'words', 'difficulty', 'color']
            }
          }
        },
        required: ['groups']
      },
      temperature: 1.0,
    },
  });

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

  const result = await model.generateContent(prompt);
  const data = JSON.parse(result.response.text());

  // Ensure words are uppercase
  for (const group of data.groups) {
    group.words = group.words.map((w: string) => w.toUpperCase());
  }

  // Shuffle all words for the grid
  const allWords = data.groups.flatMap((g: { words: string[] }) => g.words);
  const shuffledWords = [...allWords].sort(() => Math.random() - 0.5);

  return { gameKey: 'connections', words: shuffledWords, groups: data.groups };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LessonPlanGenerateRequest;
    const { customTopic, difficulty, activities, games } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

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
