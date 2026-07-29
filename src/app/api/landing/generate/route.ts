import { NextRequest, NextResponse } from 'next/server';
import type { Difficulty } from '@/lib/difficulty';
import { getCachedContent, storeCachedContent, groundingVariant } from '@/lib/content-cache';
import type { FinalAnswerContent, MicDropContent, LightningRoundContent, OpinionShiftContent } from '@/activities/types';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import {
  finalAnswerFallback,
  micDropFallback,
  opinionShiftFallback,
  lightningRoundFallback,
} from '@/lib/fallback-content';
import {
  generateFinalAnswer,
  generateMicDrop,
  generateOpinionShift,
  generateLightningRound,
} from '@/lib/landing-generators';

export const maxDuration = 60;

type LandingActivityKey = 'final-answer' | 'mic-drop' | 'lightning-round' | 'opinion-shift';

export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const { activityKey, topic, difficulty, sourceKey, missionContext } = await request.json() as {
    activityKey: LandingActivityKey;
    topic: string;
    difficulty: Difficulty;
    // Grounding identity — keeps a grounded lesson's landing from serving (or being served)
    // an unrelated lesson's cached content of the same topic/difficulty.
    sourceKey?: string;
    missionContext?: string[];
  };

  const variant = groundingVariant(sourceKey, missionContext?.join(''));

  try {
    // 1. Cache check
    const cached = await getCachedContent(activityKey, topic, difficulty, [], variant);
    if (cached) {
      return NextResponse.json({ content: cached.content_json, cacheId: cached.id });
    }

    // Cache miss — this will hit the AI. Enforce the free-tier weekly cap.
    const limited = await checkAndRecordAiUsage(teacher);
    if (limited) return limited;

    // 2. Generate
    let content: FinalAnswerContent | MicDropContent | LightningRoundContent | OpinionShiftContent;
    if (activityKey === 'final-answer') {
      content = await generateFinalAnswer(topic, difficulty);
    } else if (activityKey === 'mic-drop') {
      content = await generateMicDrop(topic, difficulty);
    } else if (activityKey === 'opinion-shift') {
      content = generateOpinionShift(topic);
    } else {
      content = await generateLightningRound(topic, difficulty);
    }

    // 3. Store (fire-and-forget)
    const cacheId = await storeCachedContent(activityKey, topic, difficulty, content, 1, variant);

    return NextResponse.json({ content, cacheId });
  } catch (error) {
    console.error('Landing generate error:', error);
    try {
      const emergency = await getCachedContent(activityKey, topic, difficulty, [], variant);
      if (emergency) {
        return NextResponse.json({ content: emergency.content_json, cacheId: emergency.id, degraded: true });
      }
    } catch { /* cache also failed */ }
    // Topic-aware deterministic fallback per activity key
    const fallbacks: Record<LandingActivityKey, () => FinalAnswerContent | MicDropContent | LightningRoundContent | OpinionShiftContent> = {
      'final-answer': () => finalAnswerFallback(topic) as FinalAnswerContent,
      'mic-drop': () => micDropFallback(topic) as MicDropContent,
      'opinion-shift': () => opinionShiftFallback(topic) as OpinionShiftContent,
      'lightning-round': () => lightningRoundFallback(topic) as LightningRoundContent,
    };
    return NextResponse.json({
      content: fallbacks[activityKey](),
      cacheId: null,
      degraded: true,
    });
  }
}
