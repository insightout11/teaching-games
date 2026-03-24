import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { getCachedContent, storeCachedContent } from './content-cache';
import { difficultyDescriptions } from '@/lib/difficulty';
import type { Difficulty } from '@/lib/difficulty';
import type { MissionSelectorContent } from '@/activities/types';
import { missionSelectorFallback } from './fallback-content';

type MissionType = 'curiosity' | 'skill' | 'performance';

const GOAL_TO_MISSION_TYPE: Record<string, MissionType> = {
  'discussion-debate': 'curiosity',
  'critical-thinking': 'curiosity',
  'collaboration': 'curiosity',
  'vocabulary-building': 'skill',
  'grammar-reinforcement': 'skill',
  'exam-prep': 'skill',
  'speaking-fluency': 'performance',
  'confidence-building': 'performance',
  'creativity': 'performance',
};

function getMissionType(goal?: string): MissionType {
  if (!goal) return 'curiosity';
  return GOAL_TO_MISSION_TYPE[goal] ?? 'curiosity';
}

const TYPE_INSTRUCTIONS: Record<MissionType, string> = {
  curiosity: `Generate 3 personal opinion or challenge questions a student will answer at lesson end.
Each question should be:
- Answerable in 2-3 sentences with a clear personal position
- Revisitable after the lesson's activities (the student should have something new to say)
- Framed as a scenario, challenge, or opinion task — NOT a worksheet question
Examples for "travel": "Would you rather travel alone or with a group — and why?", "You just won a free trip anywhere. Where do you go and why?", "Your friend says travelling is a waste of money. How do you respond?"
AVOID: broad philosophical debates ("Is travel important?"), yes/no questions with no follow-up, anything that reads like a test or worksheet.
PREFER: "Would you rather…", "What would you do if…", "Your friend says… How do you respond?"`,
  skill: `Generate 3 scenario-based challenges that naturally require a specific grammar structure or vocabulary target.
Each must be achievable in 1-2 sentences. The grammar target must be IMPLICIT — the scenario naturally requires the target structure.
NEVER use teacher language like "Write a sentence using X", "Use X to describe Y", or "Describe Y using…".
Examples for "travel": "You forgot something important on a beach trip. What should you have brought?", "Which is more relaxing: swimming or lying in the sun? Compare them.", "A friend missed the last flight. What happened and what would you have done?"
AVOID: grammar drills, worksheet instructions ("Use 'although' to…"), anything starting with "Write", "Use", or "Describe…using…".
PREFER: mini-scenarios that force the target structure: "What would have happened if…", "Compare X and Y", "You just discovered that…"`,
  performance: `Generate 3 scenario-based speaking or writing challenges a student will perform at lesson end.
Each must be finite and completable in under 90 seconds. Frame as a scenario or challenge, not an instruction.
Examples for "travel": "A tourist asks you for the best restaurant in town. Convince them to go there.", "You're a travel agent. Sell a holiday to a difficult customer in 3 sentences.", "Your friend had a terrible hotel experience. Tell them about yours — was it better or worse?"
AVOID: vague or generic prompts, anything that reads like an assignment ("Write about…", "Describe…").
PREFER: role-play scenarios, mini-challenges, persuasion tasks: "Convince…", "You're a… and you need to…", "Tell the story of…"`,
};

export async function generateMissionSelectorContent(
  topic: string,
  difficulty: Difficulty,
  goal?: string,
): Promise<MissionSelectorContent> {
  const missionType = getMissionType(goal);

  const cached = await getCachedContent('mission-selector', topic, difficulty, [], missionType, 2);
  if (cached) {
    const c = cached.content_json as { questions: string[] };
    return { activityKey: 'mission-selector', topicContext: topic, questions: c.questions ?? [] };
  }

  const schema: AISchema = {
    type: 'object',
    properties: {
      questions: { type: 'array', items: { type: 'string' } },
    },
    required: ['questions'],
  };

  const aiPrompt = `You are generating personal mission questions for an ESL lesson on: ${topic}
Difficulty level: ${difficultyDescriptions[difficulty]}

${TYPE_INSTRUCTIONS[missionType]}

Rules:
- Write exactly 3 missions
- Each must be a complete sentence or clear task (max 15 words)
- Must be relevant to the topic
- Appropriate for the difficulty level
- No duplicates
- Mission prompts must NEVER read like grammar exercises or worksheet instructions
- Frame every mission as a scenario, challenge, or opinion task

Return JSON with a "questions" array of exactly 3 strings.`;

  try {
    const data = await generateJSON<{ questions: string[] }>(aiPrompt, schema);
    const questions = (Array.isArray(data.questions) ? data.questions : []).slice(0, 3);

    const content: MissionSelectorContent = { activityKey: 'mission-selector', topicContext: topic, questions };

    void storeCachedContent('mission-selector', topic, difficulty, { questions }, 2, missionType);

    return content;
  } catch {
    return missionSelectorFallback(topic);
  }
}
