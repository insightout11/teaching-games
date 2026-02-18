import OpenAI from 'openai';
import type { AIProvider, AISchema, GenerateJSONOptions } from '../types';

export class GroqProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  async generateJSON<T>(prompt: string, schema: AISchema, options?: GenerateJSONOptions): Promise<T> {
    const schemaDescription = JSON.stringify(schema, null, 2);

    const response = await this.client.chat.completions.create(
      {
        model: options?.model || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You must respond with valid JSON matching this schema:\n${schemaDescription}\nRespond ONLY with the JSON, no other text.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: options?.temperature ?? 1.0,
        response_format: { type: 'json_object' },
      },
      options?.signal ? { signal: options.signal } : undefined,
    );

    const text = response.choices[0]?.message?.content || '{}';
    return JSON.parse(text) as T;
  }
}
