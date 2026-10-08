import { describe, expect, it } from 'vitest';
import { TASK_CLASS_CONFIG } from '@/lib/ai/routing';
import { getAnthropicModel, getProviderApiKey } from '@/lib/ai/config';
import { convertSchema } from '@/lib/ai/providers/anthropic';

describe('Claude for writing', () => {
  it('routes writing to Claude first, with Gemini and OpenAI as fallbacks', () => {
    expect(TASK_CLASS_CONFIG.writing.providers).toEqual(['anthropic', 'gemini', 'openai']);
    // Everything else keeps its existing providers.
    expect(TASK_CLASS_CONFIG['content-generation'].providers).not.toContain('anthropic');
  });

  it('uses Claude Haiku 5.5 unless ANTHROPIC_MODEL says otherwise', () => {
    const before = process.env.ANTHROPIC_MODEL;
    delete process.env.ANTHROPIC_MODEL;
    expect(getAnthropicModel()).toBe('claude-haiku-5-5');
    process.env.ANTHROPIC_MODEL = 'claude-sonnet-5-5';
    expect(getAnthropicModel()).toBe('claude-sonnet-5-5');
    if (before === undefined) delete process.env.ANTHROPIC_MODEL; else process.env.ANTHROPIC_MODEL = before;
  });

  it('reads the key from ANTHROPIC_API_KEY (no key = provider skipped)', () => {
    const before = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    expect(getProviderApiKey('anthropic')).toBe('');
    if (before !== undefined) process.env.ANTHROPIC_API_KEY = before;
  });

  it('turns our schemas into closed JSON Schema objects for structured outputs', () => {
    const out = convertSchema({
      type: 'object',
      properties: { text: { type: 'string' }, words: { type: 'array', items: { type: 'object', properties: { word: { type: 'string' } }, required: ['word'] } } },
      required: ['text'],
    });
    expect(out).toEqual({
      type: 'object',
      additionalProperties: false,
      required: ['text'],
      properties: {
        text: { type: 'string' },
        words: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['word'], properties: { word: { type: 'string' } } } },
      },
    });
  });
});
