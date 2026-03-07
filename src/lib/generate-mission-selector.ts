import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { getCachedContent, storeCachedContent } from './content-cache';
import { difficultyDescriptions } from '@/lib/difficulty';
import type { Difficulty } from '@/lib/difficulty';
import type { MissionSelectorContent } from '@/activities/types';

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
  curiosity: `Generate 6 personal opinion questions a student will answer at lesson end.
Each question should be:
- Answerable in 2-3 sentences with a clear personal position
- Revisitable after the lesson's activities (the student should have something new to say)
- Grounded in everyday experience, not abstract or philosophical
Examples for "travel": "Would you rather travel alone or with a group — and why?", "What's one place you'd love to visit and why does it appeal to you?", "Do you think it's better to plan a trip carefully or go with the flow?"
AVOID: broad philosophical debates ("Is travel important?"), yes/no questions with no follow-up, questions that can't be answered from personal experience.
PREFER: "Would you rather…", "What would you do if…", "Do you think… and why?"`,
  skill: `Generate 6 short language-use challenges a student will complete at lesson end.
Each must be achievable in 1-2 sentences using a specific grammar structure or vocabulary target.
Examples for "travel": "Write one sentence comparing two destinations using 'whereas'", "Describe your ideal trip using exactly 3 adjectives", "Use 'although' to describe a travel experience"
AVOID open discussion. PREFER concrete tasks: Use X to..., Write one sentence with..., Describe Y using...`,
  performance: `Generate 6 specific speaking or writing challenges a student will perform at lesson end.
Each must be finite and completable in under 90 seconds.
Examples for "travel": "Recommend one destination in exactly 3 sentences", "Tell a 60-second story about a real or imagined trip", "Convince a reluctant friend to try solo travel"
AVOID vague prompts. PREFER actionable tasks: Recommend, Convince, Describe, Tell the story of...`,
};

export async function generateMissionSelectorContent(
  topic: string,
  difficulty: Difficulty,
  goal?: string,
): Promise<MissionSelectorContent> {
  const missionType = getMissionType(goal);

  const cached = await getCachedContent('mission-selector', topic, difficulty, [], missionType, 1);
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
- Write exactly 6 missions
- Each must be a complete sentence or clear task (max 15 words)
- Must be relevant to the topic
- Appropriate for the difficulty level
- No duplicates

Return JSON with a "questions" array of exactly 6 strings.`;

  const data = await generateJSON<{ questions: string[] }>(aiPrompt, schema);
  const questions = (Array.isArray(data.questions) ? data.questions : []).slice(0, 6);

  const content: MissionSelectorContent = { activityKey: 'mission-selector', topicContext: topic, questions };

  void storeCachedContent('mission-selector', topic, difficulty, { questions }, 1, missionType);

  return content;
}
