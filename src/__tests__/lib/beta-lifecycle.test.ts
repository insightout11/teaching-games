import { describe, expect, it } from 'vitest';
import {
  csvCell,
  laterCanonicalStatus,
  lifecycleDates,
  reportedLifecycleStatus,
  selectQualifyingLessons,
} from '@/lib/beta/lifecycle';

const classes = [
  { id: 'real', isDemo: false },
  { id: 'demo', isDemo: true },
];

describe('beta lifecycle reporting', () => {
  it('excludes demo, unfinished, and participant-free sessions', () => {
    const lessons = selectQualifyingLessons(classes, [
      { id: 'demo-session', classId: 'demo', status: 'ended', startedAt: '2026-08-01T09:00:00Z', endedAt: '2026-08-01T10:00:00Z' },
      { id: 'active', classId: 'real', status: 'active', startedAt: '2026-08-01T09:00:00Z', endedAt: null },
      { id: 'empty', classId: 'real', status: 'ended', startedAt: '2026-08-01T09:00:00Z', endedAt: '2026-08-01T10:00:00Z' },
    ], new Map([['demo-session', 3], ['empty', 0]]));
    expect(lessons).toEqual([]);
  });

  it('activates on one real lesson and deduplicates session rows', () => {
    const repeated = { id: 'one', classId: 'real', status: 'ended', startedAt: '2026-08-01T09:00:00Z', endedAt: '2026-08-01T10:00:00Z' };
    const lessons = selectQualifyingLessons(classes, [repeated, repeated], new Map([['one', 2]]));
    expect(lessons).toHaveLength(1);
    expect(lifecycleDates(lessons)).toMatchObject({ activatedAt: repeated.endedAt, retainedAt: null });
    expect(reportedLifecycleStatus('signed_up', lessons)).toBe('activated');
  });

  it('retains only after a second qualifying lesson on a later UTC date', () => {
    const sameDay = selectQualifyingLessons(classes, [
      { id: 'one', classId: 'real', status: 'ended', startedAt: '2026-08-01T08:00:00Z', endedAt: '2026-08-01T09:00:00Z' },
      { id: 'two', classId: 'real', status: 'ended', startedAt: '2026-08-01T10:00:00Z', endedAt: '2026-08-01T11:00:00Z' },
    ], new Map([['one', 1], ['two', 1]]));
    expect(lifecycleDates(sameDay).retainedAt).toBeNull();

    const later = selectQualifyingLessons(classes, [
      ...sameDay.map((lesson) => ({ id: lesson.sessionId, classId: 'real', status: 'ended', startedAt: lesson.occurredAt, endedAt: lesson.occurredAt })),
      { id: 'three', classId: 'real', status: 'ended', startedAt: '2026-08-02T09:00:00Z', endedAt: '2026-08-02T10:00:00Z' },
    ], new Map([['one', 1], ['two', 1], ['three', 3]]));
    expect(lifecycleDates(later).retainedAt).toBe('2026-08-02T10:00:00Z');
    expect(reportedLifecycleStatus('onboarded', later)).toBe('retained');
  });

  it('never moves a canonical status backward', () => {
    expect(laterCanonicalStatus('retained', 'activated')).toBe('retained');
  });

  it('escapes CSV commas, quotes, and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('a\nb')).toBe('"a\nb"');
  });

  it('neutralizes spreadsheet formulas including leading whitespace', () => {
    for (const value of ['=1+1', '+cmd', '-cmd', '@SUM(A1)', '\t=1', '\r=1', '  =1']) {
      expect(csvCell(value).replace(/^"|"$/g, '')).toContain("'");
    }
    expect(csvCell('-12.5')).toBe('-12.5');
    expect(csvCell('2026-08-13T10:00:00Z')).toBe('2026-08-13T10:00:00Z');
  });
});
