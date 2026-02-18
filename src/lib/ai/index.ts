import { reliableGenerateJSON } from './reliability';
import type { AISchema, GenerateJSONOptions } from './types';

export type { AISchema, AISchemaType, GenerateJSONOptions } from './types';
export type { TaskClass } from './routing';

export async function generateJSON<T>(
  prompt: string,
  schema: AISchema,
  options?: GenerateJSONOptions,
): Promise<T> {
  return reliableGenerateJSON<T>(prompt, schema, options || {});
}
