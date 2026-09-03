export type ProviderName = 'gemini' | 'openai' | 'groq';

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
  }
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
 * Gemini 3.x replaced 2.5's `thinkingBudget` with `thinkingLevel`; sending both
 * in one request is a 400. 3.x Flash and Flash-Lite cannot disable thinking
 * outright, so 'minimal' is the floor — it preserves the latency win that the
 * budget-0 config was there for on 2.5.
 */
export function getThinkingConfig(model: string): Record<string, unknown> {
  return model.startsWith('gemini-2.')
    ? { thinkingBudget: 0 }
    : { thinkingLevel: 'minimal' };
}
