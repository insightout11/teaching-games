import { afterEach, describe, expect, it, vi } from 'vitest';
import { pickRandomStudent, type StudentPickerHistory } from './student-picker';
import { useSessionStore } from '@/stores/session-store';
import type { Student } from '@/lib/supabase/types';

afterEach(() => {
  vi.restoreAllMocks();
  useSessionStore.getState().reset();
});

describe('random student picking', () => {
  it.each([2, 3, 12])('gives all %i students a turn before repeating, including cycle boundaries', size => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    const ids = Array.from({ length: size }, (_, i) => String(i));
    let history: StudentPickerHistory = { pickedIds: [], lastPickedId: null };
    const picks: string[] = [];
    for (let i = 0; i < size * 20; i++) {
      const result = pickRandomStudent(ids, history);
      expect(result.studentId).not.toBe(history.lastPickedId);
      picks.push(result.studentId!);
      history = result.history;
    }
    for (let i = 0; i < picks.length; i += size) {
      expect(new Set(picks.slice(i, i + size)).size).toBe(size);
    }
  });

  it('handles empty and single-student classes', () => {
    const history = { pickedIds: ['a'], lastPickedId: 'a' };
    expect(pickRandomStudent([], history).studentId).toBeNull();
    expect(pickRandomStudent(['a'], history).studentId).toBe('a');
  });

  it('preserves turns through roster reorderings and student arrivals/departures', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const first = pickRandomStudent(['a', 'b', 'departed'], { pickedIds: [], lastPickedId: null });
    const second = pickRandomStudent(['b', 'a', 'new'], first.history);
    expect(second.studentId).toBe('b');
    const third = pickRandomStudent(['new', 'b', 'a'], second.history);
    expect(third.studentId).toBe('new');
  });

  it('uses randomness to choose the next student', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const history = { pickedIds: [], lastPickedId: null };
    expect(pickRandomStudent(['a', 'b', 'c'], history).studentId).toBe('a');
    random.mockReturnValue(0.999);
    expect(pickRandomStudent(['a', 'b', 'c'], history).studentId).toBe('c');
  });
});

describe('session picker integration', () => {
  const students = ['a', 'b', 'c'].map(id => ({ id, name: id })) as Student[];

  it.each(['fair', 'random'] as const)('%s mode balances turns and avoids consecutive repeats', mode => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    const store = useSessionStore.getState();
    store.initSession('session', 'class', students);
    store.setPickerMode(mode);
    let previous: string | null = null;
    for (let cycle = 0; cycle < 10; cycle++) {
      const picks = students.map(() => {
        const id = store.pickStudent();
        expect(id).not.toBe(previous);
        previous = id;
        return id;
      });
      expect(new Set(picks).size).toBe(3);
    }
    expect(useSessionStore.getState().callCounts).toEqual({ a: 10, b: 10, c: 10 });
  });

  it('fair mode ignores departed students and treats missing counts as zero', () => {
    useSessionStore.getState().initSession('session', 'class', students);
    useSessionStore.setState({ callCounts: { a: 5, b: 5, departed: 0 } });
    expect(useSessionStore.getState().pickStudent()).toBe('c');
    expect(() => useSessionStore.getState().pickStudent()).not.toThrow();
  });

  it('starts a fresh random cycle for a new session', () => {
    const store = useSessionStore.getState();
    store.initSession('first', 'class', students);
    store.setPickerMode('random');
    store.pickStudent();
    store.initSession('second', 'class', students);
    expect(useSessionStore.getState().randomPickerHistory).toEqual({ pickedIds: [], lastPickedId: null });
  });
});
