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
