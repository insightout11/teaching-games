import { describe, expect, it, beforeEach } from 'vitest';
import { createMockClient } from './client';
import { mockStore } from './data';
import type { Student, Session, ClassWorldFlightState, ClassWorldFlightLeg } from '@/lib/supabase/types';

describe('mock Supabase query builder', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it('supports an in filter and combines it with equality filters', async () => {
    const supabase = createMockClient();
    const result = await supabase
      .from<Student>('students')
      .select('*')
      .eq('class_id', 'class-1')
      .in('id', ['student-1', 'student-3']);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect((result.data as Student[]).map(student => student.id)).toEqual(['student-1', 'student-3']);
  });

  it('returns no rows when none of the values match', async () => {
    const supabase = createMockClient();
    const result = await supabase
      .from<Student>('students')
      .select('*')
      .in('class_id', ['missing-class']);

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it('serves representative World Flight state, session, and completed leg for the classes dashboard', async () => {
    const supabase = createMockClient();
    const [stateResult, sessionsResult, legsResult] = await Promise.all([
      supabase
        .from<ClassWorldFlightState>('class_world_flight_state')
        .select('class_id, current_destination_id, plane_tier')
        .in('class_id', ['class-1']),
      supabase
        .from<Session>('sessions')
        .select('id, class_id, status, ended_at')
        .in('class_id', ['class-1'])
        .eq('status', 'ended'),
      supabase
        .from<ClassWorldFlightLeg>('class_world_flight_legs')
        .select('class_id')
        .in('class_id', ['class-1'])
        .eq('status', 'completed'),
    ]);

    expect(stateResult.error).toBeNull();
    expect(stateResult.data).toHaveLength(1);
    expect((stateResult.data as ClassWorldFlightState[])[0].current_destination_id).toBe('bangkok');
    expect(sessionsResult.error).toBeNull();
    expect(sessionsResult.data).toHaveLength(1);
    expect((sessionsResult.data as Session[])[0].id).toBe('session-demo-flight');
    expect(legsResult.error).toBeNull();
    expect(legsResult.data).toHaveLength(1);
    expect((legsResult.data as ClassWorldFlightLeg[])[0].destination_id).toBe('bangkok');
  });
});
