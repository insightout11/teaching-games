import { describe, expect, it } from 'vitest';
import { resolveArrivalMetricDisplay } from './end-session-metrics';

const staleBrowserMetrics = {
  responders: 1,
  rosterTotal: 5,
  totalResponses: 0,
  overallAccuracy: null,
  bestStreak: 0,
};

describe('end-session arrival metrics', () => {
  it('displays pending metrics until the end-session result arrives', () => {
    expect(resolveArrivalMetricDisplay({
      ...staleBrowserMetrics,
      pending: true,
    })).toEqual({ aboard: '…', responses: '…', accuracy: '…', bestStreak: '…' });
  });

  it('lets authoritative API metrics override stale browser totals', () => {
    expect(resolveArrivalMetricDisplay({
      ...staleBrowserMetrics,
      pending: false,
      authoritative: {
        meaningfulParticipantCount: 1,
        participantCount: 1,
        responseCount: 4,
        accuracyRate: 0.75,
        bestStreak: 3,
      },
    })).toEqual({ aboard: '1/1', responses: 4, accuracy: '75%', bestStreak: 3 });
  });
});
