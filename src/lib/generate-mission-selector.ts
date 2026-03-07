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
  curiosity: `Generate 6 open discussion mission questions about the topic.
These should invite personal opinions and exploration.
Examples for "travel": "Is traveling alone a good idea?", "What makes a trip unforgettable?", "Should everyone experience living abroad?"`,
  skill: `Generate 6 specific language task missions. These should be concrete language challenges.
Examples for "travel": "Use a conditional sentence about travel plans", "Describe a travel experience using three adjectives", "Write a sentence comparing two destinations"`,
  performance: `Generate 6 production task missions — speaking or presentation challenges.
Examples for "travel": "Speak for 60 seconds about your best trip", "Convince someone to visit your favourite place", "Tell a short story about a travel problem you solved"`,
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
