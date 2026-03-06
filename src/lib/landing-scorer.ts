// Pure heuristic scorer for landing-stage activities.
// No React deps — safe to import from both server routes and client components.

export interface LandingScore {
  clientId: string;
  relevance: number;        // 0-1
  targetLanguage: number;   // 0-1
  completeness: number;     // 0-1
  effort: number;           // 0-1
  finalScore: number;       // 0-100
  reasonTags: string[];     // 'used_target_vocab' | 'clear_complete_answer' | 'detailed_response' | 'on_topic'
  suggestedLabel?: string;  // assigned by AI only, never by heuristic
}

export interface LandingResponse { clientId: string; text: string; }

export interface ScorerWeights {
  relevance: number;
  targetLanguage: number;
  completeness: number;
  effort: number;
}

export interface ScorerContext {
  prompt: string;
  targetKeywords: string[];
  labelCandidates: string[];
  weights?: ScorerWeights;
  effortMaxWords?: number;
}

export const DEFAULT_WEIGHTS: ScorerWeights = {
  relevance: 0.40,
  targetLanguage: 0.35,
  completeness: 0.15,
  effort: 0.10,
};

export const FINAL_ANSWER_WEIGHTS: ScorerWeights = {
  relevance: 0.35,
  targetLanguage: 0.30,
  completeness: 0.25,
  effort: 0.10,
};

export const MIC_DROP_WEIGHTS: ScorerWeights = {
  relevance: 0.40,
  targetLanguage: 0.35,
  completeness: 0.10,
  effort: 0.15,
};

export const LIGHTNING_ROUND_WEIGHTS: ScorerWeights = {
  relevance: 0.45,
  targetLanguage: 0.35,
  completeness: 0.15,
  effort: 0.05,
};

const STOP_WORDS = new Set([
  'your', 'what', 'the', 'and', 'for', 'are', 'you', 'give', 'say', 'one',
  'best', 'most', 'this', 'that', 'with', 'about', 'have', 'will', 'from',
  'write', 'answer', 'sentence', 'think', 'today', 'topic',
]);

function scoreRelevance(text: string, targetKeywords: string[], prompt: string): number {
  const lower = text.toLowerCase();

  // Primary: count unique targetKeywords found in response
  const kwMatches = targetKeywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
  const kwScore = targetKeywords.length > 0
    ? Math.min(1, kwMatches / Math.max(1, targetKeywords.length * 0.4))
    : 0;

  // Weak backup: prompt content-word overlap (strip short/common words)
  const promptWords = prompt.toLowerCase().split(/\s+/).filter((w) => w.length > 4 && !STOP_WORDS.has(w));
  const promptMatches = promptWords.filter((w) => lower.includes(w)).length;
  const promptScore = promptWords.length > 0
    ? Math.min(1, promptMatches / Math.max(1, promptWords.length * 0.5))
    : 0;

  return kwScore * 0.8 + promptScore * 0.2;
}

export function scoreResponseHeuristic(response: LandingResponse, ctx: ScorerContext): LandingScore {
  const text = response.text;
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const weights = ctx.weights ?? DEFAULT_WEIGHTS;

  const relevance = scoreRelevance(lower, ctx.targetKeywords, ctx.prompt);

  const kwMatches = ctx.targetKeywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
  const targetLanguage = ctx.targetKeywords.length > 0
    ? Math.min(1, kwMatches / Math.max(1, ctx.targetKeywords.length * 0.5))
    : 0.5;

  const hasPunctuation = /[.!?]/.test(text);
  const completeness = (hasPunctuation && wordCount >= 4)
    ? Math.min(1, wordCount / 15)
    : Math.min(0.5, wordCount / 10);

  const effort = Math.min(1, wordCount / (ctx.effortMaxWords ?? 25));

  const finalScore = Math.round(
    (relevance * weights.relevance +
      targetLanguage * weights.targetLanguage +
      completeness * weights.completeness +
      effort * weights.effort) * 100
  );

  const reasonTags: string[] = [];
  if (kwMatches > 0) reasonTags.push('used_target_vocab');
  if (hasPunctuation && wordCount >= 4) reasonTags.push('clear_complete_answer');
  if (wordCount >= 10) reasonTags.push('detailed_response');
  if (relevance >= 0.5) reasonTags.push('on_topic');

  return { clientId: response.clientId, relevance, targetLanguage, completeness, effort, finalScore, reasonTags };
}

export function scoreAllHeuristic(responses: LandingResponse[], ctx: ScorerContext): LandingScore[] {
  return responses.map((r) => scoreResponseHeuristic(r, ctx));
}

// Maps lowest-scoring dimension to a human-readable improvement tip.
export function getImprovementTip(score: LandingScore): string {
  const dims = [
    { val: score.relevance,      tip: 'Focus more directly on the question.' },
    { val: score.targetLanguage, tip: 'Try using more lesson vocabulary.' },
    { val: score.completeness,   tip: 'Try to write a more complete sentence.' },
    { val: score.effort,         tip: 'Try expanding your idea with one more detail.' },
  ];
  const lowest = dims.reduce((a, b) => b.val < a.val ? b : a);
  return lowest.tip;
}

// Returns each scoring dimension as a display-ready row (raw 0–1 → display 0–10).
export function getDimensionBreakdown(score: LandingScore): Array<{ label: string; value: number }> {
  return [
    { label: 'Relevance',  value: Math.round(score.relevance      * 10) },
    { label: 'Vocabulary', value: Math.round(score.targetLanguage * 10) },
    { label: 'Clarity',    value: Math.round(score.completeness   * 10) },
    { label: 'Effort',     value: Math.round(score.effort         * 10) },
  ];
}

// Display score = sum of breakdown values (max 40). Used for "Score: X / 40" display.
export function getDisplayScore(score: LandingScore): number {
  return getDimensionBreakdown(score).reduce((sum, d) => sum + d.value, 0);
}
