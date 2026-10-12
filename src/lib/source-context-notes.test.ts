import { describe, expect, it } from 'vitest';
import { buildSourceContext } from '@/lib/source-context';

describe('teaching notes in the source context', () => {
  const base = { sourceType: 'text' as const, title: 'Hello, Moon', summary: 'The Moon has craters.', rawText: 'The Moon has craters. A crater is a big round hole.' };

  it('gives activities the prepared words, questions and talk prompts', () => {
    const ctx = buildSourceContext({
      ...base,
      teachingNotes: {
        words: [{ word: 'crater', meaning: 'a big round hole' }],
        questions: [{ q: 'What is on the Moon?', a: 'craters' }],
        talk: ['Would you like to walk on the Moon? Why?'],
      },
    });
    expect(ctx).toContain('crater = a big round hole');
    expect(ctx).toContain('"What is on the Moon?" (answer: craters)');
    expect(ctx).toContain('"Would you like to walk on the Moon? Why?"');
  });

  it('adds nothing when a source has no notes', () => {
    expect(buildSourceContext(base)).not.toContain('Teaching notes');
  });
});

describe('a typed topic (background notes only)', () => {
  it('tells activities the class has read nothing, and never to say "the text"', () => {
    const ctx = buildSourceContext({ sourceType: 'text', title: 'Yummy Food', summary: 'Honey never spoils.', rawText: 'Honey never spoils.\n- Bread is made from flour.', backgroundOnly: true });
    expect(ctx).toContain('Background notes on the topic "Yummy Food"');
    expect(ctx).toContain('The class has NOT read or watched anything');
    expect(ctx).not.toContain('ground ALL content ONLY in this source text');
  });

  it('still treats real pasted text as the text', () => {
    const ctx = buildSourceContext({ sourceType: 'text', title: 'A Fair First Job', summary: 'Maya wants a job.', rawText: 'Maya wants a job.' });
    expect(ctx).toContain('ground ALL content ONLY in this source text');
  });
});
