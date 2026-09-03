import { GoogleGenerativeAI, SchemaType as GeminiSchemaType } from '@google/generative-ai';
import type { GenerationConfig } from '@google/generative-ai';
import { getGeminiModel, getThinkingConfig } from '../config';
import type { AIProvider, AISchema, AISchemaType, GenerateJSONOptions } from '../types';

const schemaTypeMap: Record<AISchemaType, GeminiSchemaType> = {
  string: GeminiSchemaType.STRING,
  number: GeminiSchemaType.NUMBER,
  integer: GeminiSchemaType.INTEGER,
  boolean: GeminiSchemaType.BOOLEAN,
  array: GeminiSchemaType.ARRAY,
  object: GeminiSchemaType.OBJECT,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertSchema(schema: AISchema): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {
    type: schemaTypeMap[schema.type],
  };

  if (schema.properties) {
    result.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, value]) => [key, convertSchema(value)])
    );
  }

  if (schema.items) {
    result.items = convertSchema(schema.items);
  }

  if (schema.required) result.required = schema.required;
  if (schema.enum) result.enum = schema.enum;
  if (schema.description) result.description = schema.description;

  return result;
}

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateJSON<T>(prompt: string, schema: AISchema, options?: GenerateJSONOptions): Promise<T> {
    const modelId = options?.model || getGeminiModel();
    const model = this.genAI.getGenerativeModel({
      model: modelId,
      // Gemini enables "thinking" by default, which roughly 2-4x's latency on these
      // structured-output tasks for no quality gain. getThinkingConfig picks the
      // right knob for the model generation. thinkingConfig is forwarded by the SDK
      // but missing from its GenerationConfig type, hence the cast.
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: convertSchema(schema),
        thinkingConfig: getThinkingConfig(modelId),
        ...(options?.temperature !== undefined && { temperature: options.temperature }),
      } as GenerationConfig,
    });

    const requestOptions = options?.signal ? { signal: options.signal } : undefined;
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }, requestOptions);
    const text = result.response.text();
    return JSON.parse(text) as T;
  }
}
