import { reliableGenerateJSON } from './reliability';
import type { AISchema, GenerateJSONOptions } from './types';
import { JUNIOR_LANGUAGE_RULE } from '@/lib/junior';
import { isJuniorRequest } from '@/lib/junior-request';

export type { AISchema, AISchemaType, GenerateJSONOptions } from './types';
export type { TaskClass } from './routing';

export async function generateJSON<T>(
  prompt: string,
  schema: AISchema,
  options?: GenerateJSONOptions,
): Promise<T> {
  // Junior classes: everything the AI writes is also written for young children. Checking passes ('evaluation')
  // judge what was written and are left alone.
  const junior = options?.taskClass !== 'evaluation' && (await isJuniorRequest());
  return reliableGenerateJSON<T>(junior ? `${prompt}${JUNIOR_LANGUAGE_RULE}` : prompt, schema, options || {});
}
