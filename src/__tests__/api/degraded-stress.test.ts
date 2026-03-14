/**
 * Degraded-state stress test.
 * Verifies that ALL hardened endpoints return valid 200 responses
 * when AI completely fails, even under concurrent load.
 *
 * No secrets needed — all AI and cache calls are mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Shared mocks ───────────────────────────────────────────────

vi.mock('@/lib/ai', () => ({
  generateJSON: vi.fn().mockRejectedValue(new Error('All providers down')),
}));

vi.mock('@/lib/content-cache', () => ({
  getCachedContent: vi.fn().mockResolvedValue(null),
  storeCachedContent: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/auth-credits', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    teacher: { id: 'test', email: 'test@test.com', credits: 99, isPro: false },
    error: null,
  }),
}));

import { generateJSON } from '@/lib/ai';
import { getCachedContent } from '@/lib/content-cache';

// ─── Route imports ──────────────────────────────────────────────

import { POST as vocabSprint } from '@/app/api/vocab-sprint/generate/route';
import { POST as synonymShowdown } from '@/app/api/synonym-showdown/generate/route';
import { POST as sentenceScramble } from '@/app/api/sentence-scramble/generate/route';
import { POST as grammarBoss } from '@/app/api/grammar-boss/generate/route';
import { POST as errorHunter } from '@/app/api/error-hunter/generate/route';
import { POST as dialogueDetective } from '@/app/api/dialogue-detective/generate/route';
import { POST as connections } from '@/app/api/connections/generate/route';
import { POST as wordChain } from '@/app/api/word-chain/generate/route';
import { POST as gridRush } from '@/app/api/grid-rush/generate/route';
import { POST as storySprintStarter } from '@/app/api/story-sprint/starter/route';

// ─── Helpers ────────────────────────────────────────────────────

function makeReq(url: string, body: Record<string, unknown>) {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as never;
}

const TOPIC = 'Space Exploration';
const BASE_BODY = { topic: TOPIC, difficulty: 'Intermediate', tone: 'Neutral' };

interface EndpointSpec {
  name: string;
  handler: (req: never) => Promise<Response>;
  url: string;
  body: Record<string, unknown>;
  validate: (data: Record<string, unknown>) => void;
}

const endpoints: EndpointSpec[] = [
  {
    name: 'vocab-sprint',
    handler: vocabSprint,
    url: 'http://localhost/api/vocab-sprint/generate',
    body: { ...BASE_BODY },
    validate: (data) => {
      expect(Array.isArray(data.sentences)).toBe(true);
      expect((data.sentences as unknown[]).length).toBeGreaterThan(0);
      const first = (data.sentences as Array<{ sentence: string }>)[0];
      expect(first.sentence).toContain(TOPIC);
    },
  },
  {
    name: 'synonym-showdown',
    handler: synonymShowdown,
    url: 'http://localhost/api/synonym-showdown/generate',
    body: { ...BASE_BODY },
    validate: (data) => {
      expect(data.targetWord).toBeDefined();
      expect(data.contextSentence).toBeDefined();
      expect((data.contextSentence as string)).toContain(TOPIC);
    },
  },
  {
    name: 'sentence-scramble',
    handler: sentenceScramble,
    url: 'http://localhost/api/sentence-scramble/generate',
    body: { ...BASE_BODY },
    validate: (data) => {
      expect(Array.isArray(data.sentences)).toBe(true);
      expect((data.sentences as string[]).length).toBeGreaterThanOrEqual(5);
      expect((data.sentences as string[])[0]).toContain(TOPIC);
    },
  },
  {
    name: 'grammar-boss',
    handler: grammarBoss,
    url: 'http://localhost/api/grammar-boss/generate',
    body: { ...BASE_BODY, grammarTarget: 'present-perfect' },
    validate: (data) => {
      expect(data.task).toBeDefined();
      expect(data.exampleSentence).toBeDefined();
      expect((data.task as string)).toContain(TOPIC);
    },
  },
  {
    name: 'error-hunter',
    handler: errorHunter,
    url: 'http://localhost/api/error-hunter/generate',
    body: { ...BASE_BODY },
    validate: (data) => {
      expect(data.paragraph).toBeDefined();
      expect(data.errorCount).toBeDefined();
      expect(Array.isArray(data._errors)).toBe(true);
      expect((data.paragraph as string)).toContain(TOPIC);
    },
  },
  {
    name: 'dialogue-detective',
    handler: dialogueDetective,
    url: 'http://localhost/api/dialogue-detective/generate',
    body: { ...BASE_BODY },
    validate: (data) => {
      expect(data.speakerA_before).toBeDefined();
      expect(data.speakerA_after).toBeDefined();
      expect(data.context).toBeDefined();
      expect(data.goal).toBeDefined();
      expect((data.speakerA_before as string)).toContain(TOPIC);
    },
  },
  {
    name: 'connections',
    handler: connections,
    url: 'http://localhost/api/connections/generate',
    body: { ...BASE_BODY },
    validate: (data) => {
      expect(Array.isArray(data.words)).toBe(true);
      expect((data.words as string[]).length).toBe(16);
      expect(Array.isArray(data.groups)).toBe(true);
      expect((data.groups as unknown[]).length).toBe(4);
    },
  },
  {
    name: 'word-chain',
    handler: wordChain,
    url: 'http://localhost/api/word-chain/generate',
    body: { ...BASE_BODY },
    validate: (data) => {
      expect(data.startingWord).toBeDefined();
      expect(data.hint).toBeDefined();
      expect((data.hint as string)).toContain(TOPIC);
    },
  },
  {
    name: 'grid-rush',
    handler: gridRush,
    url: 'http://localhost/api/grid-rush/generate',
    body: { ...BASE_BODY },
    validate: (data) => {
      expect(data.grid).toBeDefined();
      const grid = data.grid as { letters: string[]; bonusLetter: string; bonusIndex: number; topicWords: string[] };
      expect(grid.letters).toHaveLength(9);
      expect(grid.bonusLetter).toBeDefined();
      expect(typeof grid.bonusIndex).toBe('number');
    },
  },
  {
    name: 'story-sprint/starter',
    handler: storySprintStarter,
    url: 'http://localhost/api/story-sprint/starter',
    body: { ...BASE_BODY },
    validate: (data) => {
      expect(data.starterSentence).toBeDefined();
      expect((data.starterSentence as string)).toContain(TOPIC);
    },
  },
];

// ─── Tests ──────────────────────────────────────────────────────

describe('Degraded-state stress: all endpoints under total AI failure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-arm the rejection for all calls
    vi.mocked(generateJSON).mockRejectedValue(new Error('All providers down'));
    vi.mocked(getCachedContent).mockResolvedValue(null);
  });

  // Individual endpoint validation
  for (const ep of endpoints) {
    it(`${ep.name}: returns 200 + degraded + valid content with topic`, async () => {
      const res = await ep.handler(makeReq(ep.url, ep.body));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.degraded).toBe(true);
      // grid-rush has no cache, so no cacheId field
      if (ep.name !== 'grid-rush') {
        expect(data.cacheId).toBeNull();
      }

      // Endpoint-specific shape validation
      ep.validate(data);
    });
  }

  // Concurrent stress: all 10 endpoints fail simultaneously
  it('all 10 endpoints return valid degraded responses when called concurrently', async () => {
    const results = await Promise.all(
      endpoints.map(async (ep) => {
        const res = await ep.handler(makeReq(ep.url, ep.body));
        const data = await res.json();
        return { name: ep.name, status: res.status, degraded: data.degraded, data };
      }),
    );

    // Every endpoint should be 200 + degraded
    for (const r of results) {
      expect(r.status).toBe(200);
      expect(r.degraded).toBe(true);
    }

    // No 500s at all
    const errors = results.filter((r) => r.status >= 500);
    expect(errors).toHaveLength(0);
  });

  // Burst: same endpoint hit 10 times concurrently
  it('vocab-sprint handles 10 concurrent failures without crash', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        vocabSprint(makeReq('http://localhost/api/vocab-sprint/generate', BASE_BODY))
          .then(async (res) => ({ status: res.status, data: await res.json() })),
      ),
    );

    for (const r of results) {
      expect(r.status).toBe(200);
      expect(r.data.degraded).toBe(true);
      expect(Array.isArray(r.data.sentences)).toBe(true);
    }
  });
});
