import { describe, expect, it } from 'vitest';
import { recordSubmissionConfirmation } from './submission-confirmation';

describe('recordSubmissionConfirmation', () => {
  it('increments the flight log once for a successful prompt submission', () => {
    const keys = new Set<string>();
    expect(recordSubmissionConfirmation(keys, 'prompt-1', 0)).toEqual({
      newlyConfirmed: true,
      responseCount: 1,
    });
  });

  it('deduplicates a retry without removing the existing confirmation', () => {
    const keys = new Set(['prompt-1']);
    expect(recordSubmissionConfirmation(keys, 'prompt-1', 1)).toEqual({
      newlyConfirmed: false,
      responseCount: 1,
    });
    expect(keys.has('prompt-1')).toBe(true);
  });

  it('counts the next prompt independently', () => {
    const keys = new Set(['prompt-1']);
    expect(recordSubmissionConfirmation(keys, 'prompt-2', 1).responseCount).toBe(2);
  });
});
