import { getProviderName, getProviderApiKey } from './config';
import { GeminiProvider } from './providers/gemini';
import { OpenAIProvider } from './providers/openai';
import { GroqProvider } from './providers/groq';
import type { AIProvider, AISchema, GenerateJSONOptions } from './types';

export type { AISchema, AISchemaType, GenerateJSONOptions } from './types';

let cachedProvider: AIProvider | null = null;
let cachedProviderName: string | null = null;

function getProvider(): AIProvider {
  const name = getProviderName();
  const key = getProviderApiKey(name);

  if (cachedProvider && cachedProviderName === `${name}:${key}`) {
    return cachedProvider;
  }

  if (!key) {
    throw new Error(`API key not configured for provider: ${name}`);
  }

  switch (name) {
    case 'openai':
      cachedProvider = new OpenAIProvider(key);
      break;
    case 'groq':
      cachedProvider = new GroqProvider(key);
      break;
    default:
      cachedProvider = new GeminiProvider(key);
      break;
  }

  cachedProviderName = `${name}:${key}`;
  return cachedProvider;
}

export async function generateJSON<T>(
  prompt: string,
  schema: AISchema,
  options?: GenerateJSONOptions,
): Promise<T> {
  const provider = getProvider();
  return provider.generateJSON<T>(prompt, schema, options);
}
