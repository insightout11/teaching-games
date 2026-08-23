import { describe, expect, it } from 'vitest';
import { resolveClassLaunchListState } from './class-launch-list-state';

const base = {
  authChecked: true,
  isAuthenticated: true,
  classesLoading: false,
  classesError: null,
  classCount: 0,
  hasActiveSession: false,
};

describe('resolveClassLaunchListState', () => {
  it('does not report empty while authentication or classes are still loading', () => {
    expect(resolveClassLaunchListState({ ...base, authChecked: false })).toBe('loading');
    expect(resolveClassLaunchListState({ ...base, classesLoading: true })).toBe('loading');
  });

  it('does not report empty when the class query failed', () => {
    expect(resolveClassLaunchListState({ ...base, classesError: 'Could not load classes' })).toBe('error');
  });

  it('explains the active-session-only case without claiming no classes exist', () => {
    expect(resolveClassLaunchListState({ ...base, hasActiveSession: true })).toBe('active-only');
  });

  it('reports ready when eligible classes exist', () => {
    expect(resolveClassLaunchListState({ ...base, classCount: 3 })).toBe('ready');
  });
});
