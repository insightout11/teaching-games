import { describe, expect, it } from 'vitest';
import { isVisibleSubmission, mergeSubmissionEvent, normalizeSubmissions } from '@/hooks/use-submissions-feed';
import type { StudentSubmission } from '@/lib/supabase/types';

function submission(overrides: Partial<StudentSubmission> = {}): StudentSubmission {
  return {
    id: 'sub-1',
    session_id: 'session-1',
    client_id: 'client-1',
    display_name: 'Doug',
    team: null,
    submission_type: 'text',
    content: 'Because it works.',
    status: 'pending',
    error_message: null,
    game_key: 'crew-radio',
    created_at: '2026-08-08T10:00:00.000Z',
    published_to_class: false,
    published_at: null,
    answered_at: null,
    ai_feedback: null,
    ai_score: null,
    ...overrides,
  };
}

describe('cockpit submissions reconciliation helpers', () => {
  it('uses identical visibility rules for initial and realtime data', () => {
    const visible = submission();
    const excludedStatus = submission({ id: 'sub-2', status: 'rejected' });
    const excludedGame = submission({ id: 'sub-3', game_key: 'cabin-mystery' });

    expect(isVisibleSubmission(visible, null)).toBe(true);
    expect(normalizeSubmissions([visible, excludedStatus, excludedGame])).toEqual([visible]);
    expect(mergeSubmissionEvent([], excludedStatus)).toEqual([]);
    expect(mergeSubmissionEvent([], excludedGame)).toEqual([]);
  });

  it('deduplicates realtime and reconciliation races and keeps newest first', () => {
    const older = submission({ id: 'older', created_at: '2026-08-08T09:00:00.000Z' });
    const newer = submission({ id: 'newer', created_at: '2026-08-08T11:00:00.000Z' });
    const afterRealtime = mergeSubmissionEvent([older], newer);

    expect(normalizeSubmissions([...afterRealtime, newer, older]).map((item) => item.id)).toEqual(['newer', 'older']);
  });

  it('removes an item when an update makes it invisible', () => {
    const pending = submission();
    const rejected = submission({ status: 'rejected' });

    expect(mergeSubmissionEvent([pending], rejected)).toEqual([]);
  });

  it('applies the active game filter to initial rows and events', () => {
    const crewRadio = submission();
    const other = submission({ id: 'sub-2', game_key: 'opinion-pulse' });

    expect(normalizeSubmissions([crewRadio, other], 'crew-radio')).toEqual([crewRadio]);
    expect(mergeSubmissionEvent([], other, 'crew-radio')).toEqual([]);
  });
});
