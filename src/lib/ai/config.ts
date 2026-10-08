export type ProviderName = 'gemini' | 'openai' | 'groq' | 'anthropic';

export function getProviderName(): ProviderName {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  if (provider === 'openai' || provider === 'groq') return provider;
  return 'gemini';
}

export function getProviderApiKey(provider: ProviderName): string {
  switch (provider) {
    case 'gemini':
      return process.env.GEMINI_API_KEY || '';
    case 'openai':
      return process.env.OPENAI_API_KEY || '';
    case 'groq':
      return process.env.GROQ_API_KEY || '';
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY || '';
  }
}

/**
 * Claude model for the 'writing' task class. Claude Haiku 5.5 (released Oct 7 2026): fast, $0.10 / $0.50 per
 * million tokens under 100k-token prompts. Env-overridable (ANTHROPIC_MODEL), e.g. claude-sonnet-5-5 for harder writing.
 */
export function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
}

// --- Model selection ---
//
// gemini-2.5-flash-lite / gemini-2.5-flash are scheduled for shutdown on
// 2026-10-16, so the defaults below are their 3.x successors. Both are env-
// overridable: the next forced retirement should be a config change, not a
// redeploy.
const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';
const DEFAULT_GEMINI_DOCUMENT_MODEL = 'gemini-3.1-flash-lite';

/** Model for the general structured-JSON path (all generateJSON calls). */
export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

/** Model for multimodal document/image extraction, which reads whole uploads. */
export function getGeminiDocumentModel(): string {
  return process.env.GEMINI_DOCUMENT_MODEL || DEFAULT_GEMINI_DOCUMENT_MODEL;
}

/**
 * Lowest thinking setting each model family accepts. We always want the floor:
 * these are short structured-JSON tasks where thinking buys nothing but latency.
 *
 * Gemini 3.x replaced 2.5's `thinkingBudget` with `thinkingLevel`, and sending
 * both in one request is a 400. Within 3.x the floor is not uniform either —
 * Flash-Lite accepts 'minimal', but gemini-3.8-flash rejects it outright with
 * "Thinking level MINIMAL is not supported for this model", so the heavier Flash
 * models floor at 'low'. Verified against the live API, not inferred.
 */
export function getThinkingConfig(model: string): Record<string, unknown> {
  if (model.startsWith('gemini-2.')) return { thinkingBudget: 0 };
  if (model.includes('flash-lite')) return { thinkingLevel: 'minimal' };
  return { thinkingLevel: 'low' };
}
