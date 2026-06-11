import { GoogleGenerativeAI, SchemaType as GeminiSchemaType } from '@google/generative-ai';
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
    const model = this.genAI.getGenerativeModel({
      model: options?.model || 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: convertSchema(schema),
        ...(options?.temperature !== undefined && { temperature: options.temperature }),
      },
    });

    const requestOptions = options?.signal ? { signal: options.signal } : undefined;
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }, requestOptions);
    const text = result.response.text();
    return JSON.parse(text) as T;
  }
}
