import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  scoreAllHeuristic,
  FINAL_ANSWER_WEIGHTS,
  MIC_DROP_WEIGHTS,
  LIGHTNING_ROUND_WEIGHTS,
  DEFAULT_WEIGHTS,
} from '@/lib/landing-scorer';
import type { LandingResponse, LandingScore, ScorerWeights } from '@/lib/landing-scorer';

interface ScoreRequest {
  activityKey: 'final-answer' | 'mic-drop' | 'lightning-round';
  prompt: string;
  targetKeywords: string[];
  labelCandidates: string[];
  responses: LandingResponse[];
  weights?: ScorerWeights;
}

interface ScoreResponse {
  scores: LandingScore[];
  source: 'ai' | 'heuristic';
}

function getDefaultWeights(activityKey: string): ScorerWeights {
  if (activityKey === 'final-answer') return FINAL_ANSWER_WEIGHTS;
  if (activityKey === 'mic-drop') return MIC_DROP_WEIGHTS;
  if (activityKey === 'lightning-round') return LIGHTNING_ROUND_WEIGHTS;
  return DEFAULT_WEIGHTS;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify teacher authentication
  const supabase = createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ScoreRequest;
  try {
    body = (await request.json()) as ScoreRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { activityKey, prompt, targetKeywords, labelCandidates, responses } = body;
  const weights = body.weights ?? getDefaultWeights(activityKey);

  if (!prompt || !Array.isArray(responses) || responses.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const count = responses.length;

  const shortAnswerMode = activityKey === 'lightning-round';

  // < 2 responses: heuristic only, no labels (single response = Spotlight, no highlight bonus)
  if (count < 2) {
    return NextResponse.json({
      scores: scoreAllHeuristic(responses, { prompt, targetKeywords, labelCandidates: [], weights, shortAnswerMode }),
      source: 'heuristic',
    } satisfies ScoreResponse);
  }

  // Determine effective label candidates based on count
  const effectiveLabels = count <= 3 ? labelCandidates.slice(0, 1) : labelCandidates;

  const w = weights;
  const activityGuidance = activityKey === 'lightning-round'
    ? 'This is a quick recall activity. Answers may be a single word, short phrase, or brief sentence. Do NOT penalise short answers — a single correct word scores the same as a full sentence.'
    : activityKey === 'mic-drop'
      ? 'This is an expressive statement activity. Short, punchy, or rhetorical responses are valid and should score well. Do not require length or lesson vocabulary.'
      : 'This is a lesson consolidation activity. Conceptual responses that reflect understanding should score highly even without keyword matches.';

  const aiPrompt = `ESL teacher assistant scoring student written responses.

Activity: ${activityKey}
${activityGuidance}

Prompt given to students: "${prompt}"
Target vocabulary (bonus reference — NOT required for a good score): ${targetKeywords.length > 0 ? targetKeywords.join(', ') : 'none'}

SCORING PHILOSOPHY:
- Reward understanding, relevance to the prompt, and clarity of thought.
- Vocabulary usage is a BONUS signal only. Do not penalise students for omitting target words.
- Synonyms, paraphrases, and conceptual responses count as correct.
- A clear, on-topic answer with no target vocabulary can score 80–90.

Student responses:
${responses.map((r, i) => `[${i + 1}] clientId="${r.clientId}": ${r.text}`).join('\n')}

Score EACH response (0.0–1.0):
- relevance: Does it address the prompt and show lesson understanding? (dominant factor)
- targetLanguage: Does it naturally use any target keywords or closely related vocabulary? (bonus only — a 0.0 here should NOT prevent a high finalScore)
- completeness: Is the response a coherent, clear thought? (a single word that directly answers the prompt scores 0.8)
- effort: Does it show genuine engagement?${shortAnswerMode ? ' (any non-empty response = 1.0)' : ''}
- finalScore: integer 0–100 = round(relevance*${w.relevance * 100} + targetLanguage*${w.targetLanguage * 100} + completeness*${w.completeness * 100} + effort*${w.effort * 100})
- reasonTags: array from: used_target_vocab, clear_complete_answer, detailed_response, on_topic, creative_language
${effectiveLabels.length > 0 ? `- suggestedLabel: assign ONE label from [${effectiveLabels.join(', ')}] to the best response for that label. Prioritise idea strength and relevance — NOT vocabulary density.
  RULES: each label goes to a DIFFERENT student. Do not assign more than one label to the same clientId unless there are fewer unique students than labels.` : '- suggestedLabel: omit this field'}

Return JSON: { "scores": [...] } — one entry per clientId, same order as input. Each entry must include: clientId, relevance, targetLanguage, completeness, effort, finalScore, reasonTags.`;

  const schema: AISchema = {
    type: 'object',
    properties: {
      scores: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            clientId: { type: 'string' },
            relevance: { type: 'number' },
            targetLanguage: { type: 'number' },
            completeness: { type: 'number' },
            effort: { type: 'number' },
            finalScore: { type: 'integer' },
            reasonTags: { type: 'array', items: { type: 'string' } },
            suggestedLabel: { type: 'string' },
          },
          required: ['clientId', 'relevance', 'targetLanguage', 'completeness', 'effort', 'finalScore', 'reasonTags'],
        },
      },
    },
    required: ['scores'],
  };

  try {
    const parsed = await generateJSON<{ scores: LandingScore[] }>(aiPrompt, schema, {
      taskClass: 'activity-facilitation',
    });

    const isValid =
      Array.isArray(parsed.scores) &&
      parsed.scores.length === responses.length &&
      parsed.scores.every((s, i) => s.clientId === responses[i].clientId);

    if (!isValid) throw new Error('AI score response shape mismatch');

    return NextResponse.json({ scores: parsed.scores, source: 'ai' } satisfies ScoreResponse);
  } catch (err) {
    console.error('Landing score AI error, falling back to heuristic:', err);
    return NextResponse.json({
      scores: scoreAllHeuristic(responses, { prompt, targetKeywords, labelCandidates: [], weights, shortAnswerMode }),
      source: 'heuristic',
    } satisfies ScoreResponse);
  }
}
