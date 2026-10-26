import { describe, expect, it } from 'vitest';
import { getQuickFireRoster } from '@/lib/quick-fire';
import { isParticipantCompatible } from '@/lib/participant-compatibility';

describe('Quick-fire flight roster', () => {
  it('can launch with four boarded students and no connected devices', () => {
    const boarded = ['Alex', 'Ben', 'Cora', 'Dee'].map((name, id) => ({ id: String(id), name }));
    const roster = getQuickFireRoster([], boarded);
    expect(roster).toEqual(boarded);
    expect(isParticipantCompatible({ minStudents: 2 }, roster.length)).toBe(true);
  });

  it('includes connected and deviceless students in the turn roster', () => {
    const connected = { id: '1', name: 'Alex' };
    const deviceless = { id: '2', name: 'Ben' };
    expect(getQuickFireRoster([connected], [deviceless])).toEqual([connected, deviceless]);
  });

  it('keeps one turn when a boarded student connects on multiple devices', () => {
    const student = { id: '1', name: 'Alex' };
    expect(getQuickFireRoster([student, student], [student])).toEqual([student]);
  });

  it('gives separate turns to different students with the same name', () => {
    const connected = { id: '1', name: 'Alex' };
    const deviceless = { id: '2', name: 'Alex' };
    expect(getQuickFireRoster([connected], [deviceless])).toEqual([connected, deviceless]);
  });
});
