import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SceneIgniterScene } from '@/activities/types';

const ai = vi.hoisted(() => vi.fn());
vi.mock('@/lib/ai', () => ({ generateJSON: ai }));
vi.mock('@/lib/ai/concurrency', () => ({ bulkSemaphore: { run: <T>(fn: () => T) => fn() } }));
vi.mock('@/lib/content-cache', () => ({ getCachedContent: vi.fn().mockResolvedValue(null), storeCachedContent: vi.fn().mockResolvedValue(null), groundingVariant: vi.fn() }));
vi.mock('@/lib/auth-credits', () => ({ requireAuthForGeneration: vi.fn().mockResolvedValue({ error: null }),
  requireAuth: vi.fn().mockResolvedValue({ teacher: { id: 'teacher' }, error: null }), checkAndRecordAiUsage: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/mcq-verify', () => ({ verifyMultipleChoice: vi.fn(async (questions: unknown[]) => questions.map(() => ({ ok: true }))), describeVerdict: vi.fn() }));

import { POST as lesson } from '@/app/api/lesson-plan/generate/route';
import { POST as quiz } from '@/app/api/flash-quiz/generate/route';
import { POST as sprint } from '@/app/api/vocab-sprint/generate/route';

function request(body: Record<string, unknown>): Parameters<typeof lesson>[0] {
  return new Request('http://localhost/api/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) as Parameters<typeof lesson>[0];
}
const word = { word: 'elephant', partOfSpeech: 'noun', definition: 'A large animal.', picture: 'African elephant animal' };
beforeEach(() => { ai.mockReset(); });

describe('picture metadata in existing generation calls', () => {
  it('requests a subject phrase in the existing quiz call, with reveal-only instructions', async () => {
    ai.mockResolvedValue({ questions: Array.from({ length: 10 }, () => ({ question: 'What is the capital of France?', options: ['Paris', 'London', 'Rome', 'Madrid'], correctIndex: 0, explanation: 'Paris is the capital.', picture: ' France  country map ' })) });
    const data = await (await quiz(request({ topic: 'Places', difficulty: 'Easy' }))).json();
    expect(ai).toHaveBeenCalledTimes(1);
    const [prompt, schema] = ai.mock.calls[0];
    expect(prompt).toContain('NEVER selected from the correct option');
    expect(prompt).toContain('AFTER the answer reveal');
    expect(schema.properties.questions.items.required).toContain('picture');
    expect(data.questions[0].picture).toBe('France country map');
  });
  it('keeps concrete and abstract vocabulary decisions from the same Radar generation', async () => {
    ai.mockResolvedValue({ words: [word, { word: 'honesty', definition: 'Telling the truth.', picture: '' }] });
    const data = await (await lesson(request({ customTopic: 'Unbanked zoo story', difficulty: 'Easy', activities: ['vocab-radar'] }))).json();
    expect(ai).toHaveBeenCalledTimes(1);
    expect(ai.mock.calls[0][0]).toContain('abstract meanings');
    expect(data.content['vocab-radar'].words.map((item: { picture: string }) => item.picture)).toEqual(['African elephant animal', '']);
  });
  it('preserves Source Vocab pictures in the Toolkit and derived Radar cards', async () => {
    ai.mockResolvedValue({ items: [{ term: 'elephant', meaning: 'A large animal.', example: 'The elephant walked.', prompt: 'Describe it.', picture: word.picture },
      { term: 'although', meaning: 'Despite something.', example: 'Although it rained, we walked.', prompt: 'Use it.', picture: '' }] });
    const data = await (await lesson(request({ customTopic: 'Unbanked zoo story', difficulty: 'Easy', activities: ['language-toolkit', 'vocab-radar'], needsSourceVocab: true }))).json();
    expect(ai).toHaveBeenCalledTimes(1);
    expect(data.content['language-toolkit'].items[0].picture).toBe(word.picture);
    expect(data.content['vocab-radar'].words[0].picture).toBe(word.picture);
    expect(data.content['language-toolkit'].items[1].picture).toBe('');
  });
  it('adds a concrete target picture to Vocab Micro without an extra call', async () => {
    ai.mockResolvedValue({ sentence: 'The ___ has a trunk.', options: ['elephant', 'cat', 'dog', 'fish'], correctIndex: 0, word: 'elephant', explanation: 'An elephant has a trunk.', picture: word.picture });
    const data = await (await lesson(request({ customTopic: 'Unbanked zoo story', difficulty: 'Easy', activities: ['vocab-micro'] }))).json();
    expect(ai).toHaveBeenCalledTimes(1);
    expect(data.content['vocab-micro'].picture).toBe(word.picture);
  });
  it('removes pictures from easy/medium Sprint prompts and retains concrete hard targets', async () => {
    ai.mockResolvedValue(['easy', 'medium', 'hard'].map(level => ({ sentence: 'The animal walked.', weakWord: 'animal', hint: 'It is big.', level, targetWord: level === 'hard' ? 'elephant' : '', picture: word.picture })));
    const standalone = await (await sprint(request({ topic: 'Unbanked zoo story', difficulty: 'Easy', tone: 'Neutral' }))).json();
    expect(standalone.sentences.map((item: { picture: string }) => item.picture)).toEqual(['', '', word.picture]);
    expect(ai).toHaveBeenCalledTimes(1);
    ai.mockClear();
    const generated = await (await lesson(request({ customTopic: 'Unbanked zoo story', difficulty: 'Easy', activities: [], games: ['vocab-sprint'] }))).json();
    expect(generated.gameContent['vocab-sprint'].sentences.map((item: { picture: string }) => item.picture)).toEqual(['', '', word.picture]);
    expect(ai).toHaveBeenCalledTimes(1);
  });
  it('requests private concrete-card metadata for Taboo and Hot Seat in their existing call', async () => {
    ai.mockResolvedValue({ rounds: [{ word: 'elephant', description: 'A large animal.', forbiddenWords: ['trunk', 'big', 'ears', 'grey'], picture: word.picture }] });
    for (const activity of ['taboo-sprint', 'hot-seat']) {
      ai.mockClear();
      const data = await (await lesson(request({ customTopic: 'Unbanked zoo story', difficulty: 'Easy', activities: [activity] }))).json();
      const cards = data.content[activity].rounds ?? data.content[activity].cards;
      expect(cards[0].picture).toBe(word.picture);
      expect(ai).toHaveBeenCalledTimes(1);
      expect(ai.mock.calls[0][0]).toContain('private clue-giver card');
    }
  });
});

describe('generated larger scenes', () => {
  it.each([5, 6, 7, 8])('requests and retains all %i speaking characters', async count => {
    ai.mockImplementation(async (prompt: string) => {
      const n = Number(prompt.match(/scene with (\d+) characters/)?.[1]);
      const ids = 'ABCDEFGH'.slice(0, n).split('');
      return { title: 'At the station', context: 'The class arrives.', genre: 'comedy',
        cast: ids.map(id => ({ id, name: `Person ${id}`, role: 'traveller', want: 'Get home' })),
        lines: Array.from({ length: n * 3 }, (_, i) => ({ lineIndex: i + 1, character: `Person ${ids[i % n]}`, text: `Actual dialogue ${i}` })),
        improvPrompt: 'The train stops.', improvScript: Array.from({ length: n * 2 }, (_, i) => ({ character: ids[i % n], text: 'I need ___.' })),
      };
    });
    const data = await (await lesson(request({ customTopic: 'Unbanked station story', difficulty: 'Easy', activities: ['scene-igniter'], studentCount: count }))).json();
    const scene = data.content['scene-igniter'].scenes[0] as SceneIgniterScene;
    expect(scene.cast).toHaveLength(count); expect(scene.lines).toHaveLength(count * 3);
    expect(new Set(scene.lines.map(line => line.character)).size).toBe(count);
    expect(scene.lines[0].text).toBe('Actual dialogue 0');
    expect(ai).toHaveBeenCalledTimes(4); // Existing four scene calls, not extra picture calls.
  });
  it('keeps all eight parts even when an unusable script needs the fallback', async () => {
    ai.mockResolvedValue({ title: 'Empty', lines: [], cast: [], improvScript: [] });
    const data = await (await lesson(request({ customTopic: 'Unbanked station story', difficulty: 'Easy', activities: ['scene-igniter'], studentCount: 16 }))).json();
    data.content['scene-igniter'].scenes.forEach((scene: SceneIgniterScene) => {
      expect(scene.cast).toHaveLength(8);
      expect(new Set(scene.lines.map(line => line.character)).size).toBe(8);
    });
  });
});
