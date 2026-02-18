import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty, Topic } from '@/stores/session-store';
import { TargetTone } from '@/games/tone-transformer/types';

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) level. Use very simple, short sentences (5-8 words).',
  'Easy': 'Easy (A2) level. Use simple sentences with basic vocabulary.',
  'Intermediate': 'Intermediate (B1/B2) level. Use common sentence structures.',
  'Advanced': 'Advanced (C1) level. Use complex, nuanced sentences.',
  'Expert': 'Expert (C2/Native) level. Use sophisticated, idiomatic language.'
};

// Get a random target tone different from the current one
function getContrastingTone(currentTone: string): TargetTone {
  const tones = Object.values(TargetTone);
  const currentLower = currentTone.toLowerCase();

  // Filter out tones that are similar to the current one
  const contrastingTones = tones.filter(t => {
    if (currentLower.includes('formal') && t === TargetTone.Formal) return false;
    if (currentLower.includes('casual') && t === TargetTone.Casual) return false;
    if (currentLower.includes('professional') && t === TargetTone.Professional) return false;
    if (currentLower.includes('friendly') && t === TargetTone.Friendly) return false;
    if (currentLower.includes('academic') && t === TargetTone.Academic) return false;
    return true;
  });

  return contrastingTones[Math.floor(Math.random() * contrastingTones.length)];
}

const schema: AISchema = {
  type: 'object',
  properties: {
    originalSentence: { type: 'string' },
    currentTone: { type: 'string' },
    context: { type: 'string' }
  },
  required: ['originalSentence', 'currentTone', 'context']
};

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty } = await request.json() as {
      topic: Topic;
      difficulty: Difficulty;
    };

    const prompt = `Generate a sentence for a tone transformation exercise at ${difficultyPrompts[difficulty]}
Topic: ${topic}.

Create:
1. A natural sentence with a clear tone (casual, formal, friendly, etc.)
2. Label what tone the sentence currently has
3. A brief context explaining when/where this sentence might be used (max 10 words)

The sentence should be something that could realistically need tone adjustment in real life - like an email, message, request, or statement.

Requirements:
- Sentence should be appropriate for ${difficulty} level learners
- The tone should be clear and identifiable
- Choose varied tones (don't always use casual)`;

    const data = await generateJSON<{ originalSentence: string; currentTone: string; context: string }>(prompt, schema, { taskClass: 'content-generation' });
    const targetTone = getContrastingTone(data.currentTone);

    return NextResponse.json({
      originalSentence: data.originalSentence,
      currentTone: data.currentTone,
      targetTone,
      context: data.context
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}
