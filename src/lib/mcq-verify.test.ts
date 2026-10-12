import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGenerateJSON = vi.fn();
vi.mock('@/lib/ai', () => ({ generateJSON: (...args: unknown[]) => mockGenerateJSON(...args) }));

import { describeVerdict, verifyMultipleChoice } from '@/lib/mcq-verify';

const q = { question: 'A rainbow has many different _____.', options: ['shapes', 'colors', 'sizes', 'places'], correctIndex: 1 };

describe('verifyMultipleChoice', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes a question when the blind check picks only the marked answer', async () => {
    mockGenerateJSON.mockResolvedValue({ answers: [{ number: 1, acceptable: [1] }] });
    expect(await verifyMultipleChoice([q])).toEqual([{ ok: true }]);
    // The marked answer is never shown to the checker.
    expect(String(mockGenerateJSON.mock.calls[0][0])).not.toMatch(/correct(Index)?\s*[:=]/i);
  });

  it('fails a question with several acceptable answers, a different answer, or none', async () => {
    mockGenerateJSON.mockResolvedValue({ answers: [{ number: 1, acceptable: [0, 1] }, { number: 2, acceptable: [3] }, { number: 3, acceptable: [] }] });
    const verdicts = await verifyMultipleChoice([q, q, q]);
    expect(verdicts.map((v) => (v.ok ? 'ok' : v.reason))).toEqual(['several', 'different', 'none']);
    expect(describeVerdict(q, verdicts[0])).toContain('several acceptable answers');
  });

  it('lets questions through when the check cannot run or is incomplete', async () => {
    mockGenerateJSON.mockRejectedValue(new Error('timeout'));
    expect(await verifyMultipleChoice([q, q])).toEqual([{ ok: true }, { ok: true }]);
    mockGenerateJSON.mockResolvedValue({ answers: [{ number: 1, acceptable: [0] }] });
    expect(await verifyMultipleChoice([q, q])).toEqual([{ ok: true }, { ok: true }]);
  });
});
