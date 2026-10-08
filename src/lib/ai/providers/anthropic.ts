import type Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, AISchema, GenerateJSONOptions } from '../types';
import { getAnthropicModel } from '../config';

/**
 * Claude through the Anthropic API (structured outputs). Used first for the writing that has to be right for
 * children: levelled retellings, reading packs, topic briefings (task class 'writing'). Other providers stay as
 * fallbacks, so a missing key or an outage never stops a lesson.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertSchema(schema: AISchema): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = { type: schema.type };
  if (schema.properties) {
    result.properties = Object.fromEntries(Object.entries(schema.properties).map(([k, v]) => [k, convertSchema(v)]));
    // Structured outputs need closed objects.
    result.additionalProperties = false;
  }
  if (schema.items) result.items = convertSchema(schema.items);
  if (schema.required) result.required = schema.required;
  if (schema.enum) result.enum = schema.enum;
  if (schema.description) result.description = schema.description;
  return result;
}

export class AnthropicProvider implements AIProvider {
  private client: Promise<Anthropic>;

  constructor(apiKey: string) {
    // Loaded on first use, so routes that never call Claude never load the SDK.
    this.client = import('@anthropic-ai/sdk').then(({ default: AnthropicClient }) => new AnthropicClient({ apiKey }));
  }

  async generateJSON<T>(prompt: string, schema: AISchema, options?: GenerateJSONOptions): Promise<T> {
    const client = await this.client;
    // No temperature: current Claude models reject non-default sampling values.
    const response = await client.messages.create(
      {
        model: options?.model || getAnthropicModel(),
        max_tokens: 16000,
        // Short, well-specified writing tasks: low effort keeps them fast and cheap.
        output_config: { effort: 'low', format: { type: 'json_schema', schema: convertSchema(schema) } },
        messages: [{ role: 'user', content: prompt }],
      },
      options?.signal ? { signal: options.signal } : undefined,
    );
    if (response.stop_reason === 'refusal') {
      // Treated as a bad request so the router moves straight to the next provider (no retry on Claude).
      throw Object.assign(new Error('Claude declined this request (refusal)'), { status: 400 });
    }
    if (response.stop_reason === 'max_tokens') throw new Error('Claude response was cut off (max_tokens)');
    const text = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? '{}';
    return JSON.parse(text) as T;
  }
}
