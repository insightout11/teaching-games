import { describe, expect, it } from 'vitest';
import { isSubmissionInLiveLanes } from '@/lib/cockpit-live-lanes';
import type { SideChannelItem } from '@/lib/side-channel';
import type { StudentSubmission } from '@/lib/supabase/types';

const NOW = Date.parse('2026-08-08T11:00:00.000Z');

function submission(overrides: Partial<StudentSubmission> = {}): StudentSubmission {
  return {
    id: 'sub-1',
    session_id: 'session-1',
    client_id: 'client-1',
    display_name: 'Doug',
    team: null,
    submission_type: 'text',
    content: 'Desert terrain',
    status: 'pending',
    error_message: null,
    game_key: 'radar-fix',
    created_at: '2026-08-08T10:55:00.000Z',
    published_to_class: false,
    published_at: null,
    answered_at: null,
    ai_feedback: null,
    ai_score: null,
    ...overrides,
  };
}

const sideChannel: SideChannelItem = {
  id: 'radio-1',
  kind: 'write',
  title: 'Quick write',
  prompt: 'Which clue helped?',
  createdAt: '2026-08-08T10:45:00.000Z',
  expiresAt: '2026-08-08T11:45:00.000Z',
};

describe('cockpit live-lane filtering', () => {
  it('includes recent submissions for the active main activity', () => {
    expect(isSubmissionInLiveLanes(submission(), { currentGameKey: 'radar-fix', now: NOW })).toBe(true);
  });

  it('moves old or different-activity submissions to history', () => {
    expect(isSubmissionInLiveLanes(
      submission({ created_at: '2026-08-08T09:00:00.000Z' }),
      { currentGameKey: 'radar-fix', now: NOW },
    )).toBe(false);
    expect(isSubmissionInLiveLanes(
      submission({ game_key: 'prediction-round' }),
      { currentGameKey: 'radar-fix', now: NOW },
    )).toBe(false);
  });

  it('includes only Crew Radio responses created for the current prompt', () => {
    expect(isSubmissionInLiveLanes(
      submission({ game_key: 'crew-radio', created_at: '2026-08-08T10:50:00.000Z' }),
      { sideChannel, now: NOW },
    )).toBe(true);
    expect(isSubmissionInLiveLanes(
      submission({ game_key: 'crew-radio', created_at: '2026-08-08T10:30:00.000Z' }),
      { sideChannel, now: NOW },
    )).toBe(false);
    expect(isSubmissionInLiveLanes(
      submission({ game_key: 'crew-radio', created_at: '2026-08-08T10:50:00.000Z' }),
      { sideChannel: null, now: NOW },
    )).toBe(false);
  });
});
