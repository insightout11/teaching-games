import { NextRequest, NextResponse } from 'next/server';
import { generateMissionSelectorContent } from '@/lib/generate-mission-selector';
import type { Difficulty } from '@/lib/difficulty';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { topic: string; difficulty: Difficulty; goal?: string };
    const { topic, difficulty, goal } = body;

    if (!topic || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields: topic, difficulty' }, { status: 400 });
    }

    const content = await generateMissionSelectorContent(topic, difficulty, goal);
    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error('Mission selector generation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
