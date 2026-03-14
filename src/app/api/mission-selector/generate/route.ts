import { NextRequest, NextResponse } from 'next/server';
import { generateMissionSelectorContent } from '@/lib/generate-mission-selector';
import type { Difficulty } from '@/lib/difficulty';
import { requireAuth } from '@/lib/auth-credits';
import { missionSelectorFallback } from '@/lib/fallback-content';

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const body = await request.json() as { topic: string; difficulty: Difficulty; goal?: string };
  const { topic, difficulty, goal } = body;

  if (!topic || !difficulty) {
    return NextResponse.json({ error: 'Missing required fields: topic, difficulty' }, { status: 400 });
  }

  try {
    const content = await generateMissionSelectorContent(topic, difficulty, goal);
    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error('Mission selector generation error:', error);
    return NextResponse.json({
      success: true,
      content: missionSelectorFallback(topic),
      degraded: true,
    });
  }
}
