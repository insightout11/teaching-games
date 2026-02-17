import OpenAI from 'openai';
import type { AIProvider, AISchema, GenerateJSONOptions } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertSchema(schema: AISchema): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = { type: schema.type };

  if (schema.properties) {
    result.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, value]) => [key, convertSchema(value)])
    );
    // OpenAI requires additionalProperties: false for strict mode
    result.additionalProperties = false;
  }

  if (schema.items) result.items = convertSchema(schema.items);
  if (schema.required) result.required = schema.required;
  if (schema.enum) result.enum = schema.enum;
  if (schema.description) result.description = schema.description;

  return result;
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateJSON<T>(prompt: string, schema: AISchema, options?: GenerateJSONOptions): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature ?? 1.0,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'response',
          strict: true,
          schema: convertSchema(schema),
        },
      },
    });

    const text = response.choices[0]?.message?.content || '{}';
    return JSON.parse(text) as T;
  }
}
