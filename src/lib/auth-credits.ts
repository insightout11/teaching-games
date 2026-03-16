import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

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
 * NOTE: Credit gating is disabled — behaves identically to requireAuth().
 * Re-enable once migration 013 is applied and the credit system is ready.
 */
export async function requireAuthWithCredits(): Promise<AuthResult> {
  return requireAuth();
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
 * No-op until credit system is enabled.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function consumeCredit(_teacherId: string): Promise<void> {
  // Credit deduction disabled — re-enable once migration 013 is applied.
}
