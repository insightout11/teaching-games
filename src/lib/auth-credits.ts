import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export interface AuthedTeacher {
  id: string;
  email: string;
  credits: number;
  isPro: boolean;
}

interface AuthResult {
  teacher: AuthedTeacher | null;
  error: NextResponse | null;
}

/**
 * Authenticate the current user and check generation credits.
 * Returns teacher info if OK, or a NextResponse error to return immediately.
 *
 * Usage in route handlers:
 *   const { teacher, error } = await requireAuthWithCredits();
 *   if (error) return error;
 */
export async function requireAuthWithCredits(): Promise<AuthResult> {
  // Skip auth in mock mode
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return {
      teacher: { id: 'mock-teacher', email: 'mock@test.com', credits: 999, isPro: false },
      error: null,
    };
  }

  const supabase = createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      teacher: null,
      error: NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      ),
    };
  }

  // Fetch teacher credit info using service client (bypasses RLS)
  const service = createServiceClient();
  const { data: teacher, error: teacherError } = await service
    .from('teachers')
    .select('generation_credits, subscription_status')
    .eq('id', user.id)
    .single();

  if (teacherError || !teacher) {
    return {
      teacher: null,
      error: NextResponse.json(
        { error: 'Teacher profile not found', code: 'TEACHER_NOT_FOUND' },
        { status: 404 }
      ),
    };
  }

  const isPro = teacher.subscription_status === 'active';
  const credits = teacher.generation_credits as number;

  if (!isPro && credits <= 0) {
    return {
      teacher: null,
      error: NextResponse.json(
        { error: 'No generation credits remaining', code: 'CREDITS_EXHAUSTED', credits: 0 },
        { status: 402 }
      ),
    };
  }

  return {
    teacher: { id: user.id, email: user.email ?? '', credits, isPro },
    error: null,
  };
}

/**
 * Auth-only check (no credit requirement).
 * Use for routes that don't consume credits.
 */
export async function requireAuth(): Promise<AuthResult> {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return {
      teacher: { id: 'mock-teacher', email: 'mock@test.com', credits: 999, isPro: false },
      error: null,
    };
  }

  const supabase = createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      teacher: null,
      error: NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      ),
    };
  }

  return {
    teacher: { id: user.id, email: user.email ?? '', credits: 0, isPro: false },
    error: null,
  };
}

/**
 * Decrement one generation credit after successful content generation.
 * Pro users are not decremented. Call AFTER successful generation.
 */
export async function useCredit(teacherId: string): Promise<void> {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') return;

  const service = createServiceClient();
  await service.rpc('use_generation_credit', { teacher_id: teacherId });
}
