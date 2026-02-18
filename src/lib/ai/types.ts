export type AISchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';

export interface AISchema {
  type: AISchemaType;
  properties?: Record<string, AISchema>;
  items?: AISchema;
  required?: string[];
  enum?: string[];
  description?: string;
}

export interface GenerateJSONOptions {
  temperature?: number;
  taskClass?: import('./routing').TaskClass;
  model?: string;
  signal?: AbortSignal;
  _route?: string;
}

export interface AIProvider {
  generateJSON<T>(prompt: string, schema: AISchema, options?: GenerateJSONOptions): Promise<T>;
}
