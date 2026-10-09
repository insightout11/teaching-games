import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({}) }));
import { buildPreparedLesson } from './prepared-lesson';

describe('buildPreparedLesson', () => {
  it('builds a Speak lesson plan with its flight', () => {
    const l = buildPreparedLesson({ type: 'speak', topic: 'Ordering food', level: 'Easy' });
    expect(l.title).toBe('Speak · Ordering food');
    expect(l.payload?.flightPresetId).toBe('speak-60');
    expect(l.payload?.customTopic).toBe('Ordering food');
    expect(l.payload?.slots.length).toBeGreaterThan(0);
  });
  it('free talk carries only the room focus', () => {
    const l = buildPreparedLesson({ type: 'free', topic: "Last lesson's words", level: 'Easy', focusText: 'Review these words: a, b, c.' });
    expect(l.payload).toBeUndefined();
    expect(l.focus).toEqual({ title: "Last lesson's words", text: 'Review these words: a, b, c.' });
  });
  it('uses the teacher\'s own text as lesson material', () => {
    const l = buildPreparedLesson({ type: 'reading', topic: 'A story', level: 'Easy', ownText: { title: 'My story', text: 'Once upon a time '.repeat(10) } });
    expect(l.payload?.sourceMaterial?.title).toBe('My story');
    expect(l.materialTitle).toBe('My story');
  });
});
