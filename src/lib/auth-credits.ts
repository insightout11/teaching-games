import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export interface AuthedTeacher {
  id: string;
  email: string;
  credits: number;
  isPro: boolean;
  isDeveloper: boolean;
}

interface AuthResult {
  teacher: AuthedTeacher | null;
  error: NextResponse | null;
}

/**
 * Authenticate the current user and check generation entitlement.
 *
 * Entitlement priority (first match wins):
 *   1. is_developer = true   → unlimited, all modules
 *   2. subscription_status = 'active'   → Pro
 *   3. promo_expires_at > NOW()          → Pro (marketing Test Flight)
 *   4. generation_credits > 0            → onboarding credit; will consume 1 after generation
 *   5. session grace (sessionId + Standard modules only) → free for in-session Standard use
 *   6. else → 402 CREDITS_EXHAUSTED
 *
 * @param options.sessionId   - Active session ID from the client; enables grace mode for Standard modules
 * @param options.requestHasProModules - True if the request includes any Pro-gated module keys
 */
export async function requireAuthWithCredits(options?: {
  sessionId?: string;
  requestHasProModules?: boolean;
}): Promise<AuthResult> {
  // ── 1. Basic auth ──────────────────────────────────────────────────────
  const basicAuth = await requireAuth();
  if (basicAuth.error || !basicAuth.teacher) return basicAuth;
  const teacher = basicAuth.teacher;

  // ── 2. Get entitlement info from DB ───────────────────────────────────
  const service = createServiceClient();
  const { data: rows, error: rpcError } = await service.rpc('get_teacher_credits', {
    teacher_id: teacher.id,
  });

  if (rpcError || !rows || rows.length === 0) {
    console.error('get_teacher_credits RPC error:', rpcError);
    // Fail open: let the request through rather than blocking a teacher mid-lesson
    return {
      teacher: { ...teacher, credits: 0, isPro: false, isDeveloper: false },
      error: null,
    };
  }

  const info = rows[0] as {
    credits: number;
    is_verified: boolean;
    is_pro: boolean;
    is_developer: boolean;
    generations: number;
  };

  const enriched: AuthedTeacher = {
    ...teacher,
    credits: info.credits,
    isPro: info.is_pro,
    isDeveloper: info.is_developer,
  };

  // ── 3. Developer → unlimited ──────────────────────────────────────────
  if (info.is_developer) {
    return { teacher: enriched, error: null };
  }

  // ── 4. Pro (subscription or active promo) → unlimited ─────────────────
  if (info.is_pro) {
    return { teacher: enriched, error: null };
  }

  // ── 5. Onboarding credits → allow (caller consumes after generation) ──
  if (info.credits > 0) {
    return { teacher: enriched, error: null };
  }

  // ── 6. Session grace for Standard-only in-session requests ────────────
  //    Grace mode: teacher is mid-lesson with a valid active session.
  //    Standard modules continue freely; Pro modules still require isPro/credits.
  if (options?.sessionId && !options?.requestHasProModules) {
    const { data: sessionRow } = await service
      .from('sessions')
      .select('id, classes!inner(teacher_id)')
      .eq('id', options.sessionId)
      .eq('status', 'active')
      .single();

    const classesData = sessionRow?.classes as { teacher_id: string }[] | { teacher_id: string } | null;
    const sessionTeacherId = Array.isArray(classesData)
      ? classesData[0]?.teacher_id
      : classesData?.teacher_id;
    if (sessionRow && sessionTeacherId === teacher.id) {
      return { teacher: enriched, error: null };
    }
  }

  // ── 7. No access ──────────────────────────────────────────────────────
  return {
    teacher: null,
    error: NextResponse.json(
      { error: 'Credits exhausted. Upgrade to Pro for unlimited generation.', code: 'CREDITS_EXHAUSTED' },
      { status: 402 }
    ),
  };
}

/**
 * Auth check for generation routes.
 * Credits are NOT checked here — credits are consumed when a session is created.
 * If the request includes Pro modules, the teacher must be Pro or Developer.
 * Standard module requests pass with auth only.
 */
export async function requireAuthForGeneration(options?: {
  requestHasProModules?: boolean;
}): Promise<AuthResult> {
  const basicAuth = await requireAuth();
  if (basicAuth.error || !basicAuth.teacher) return basicAuth;
  const teacher = basicAuth.teacher;

  // Standard modules: auth only — no credit or tier check
  if (!options?.requestHasProModules) {
    return { teacher, error: null };
  }

  // Pro modules: must be Pro tier or Developer
  const service = createServiceClient();
  const { data: rows, error: rpcError } = await service.rpc('get_teacher_credits', {
    teacher_id: teacher.id,
  });

  if (rpcError || !rows || rows.length === 0) {
    // Fail open: don't block a teacher mid-lesson due to an RPC error
    console.error('requireAuthForGeneration RPC error:', rpcError);
    return { teacher: { ...teacher, credits: 0, isPro: false, isDeveloper: false }, error: null };
  }

  const info = rows[0] as {
    credits: number;
    is_verified: boolean;
    is_pro: boolean;
    is_developer: boolean;
    generations: number;
  };

  const enriched: AuthedTeacher = {
    ...teacher,
    credits: info.credits,
    isPro: info.is_pro,
    isDeveloper: info.is_developer,
  };

  if (info.is_developer || info.is_pro) {
    return { teacher: enriched, error: null };
  }

  return {
    teacher: null,
    error: NextResponse.json(
      { error: 'Pro subscription required for this module.', code: 'PRO_REQUIRED' },
      { status: 403 }
    ),
  };
}

/**
 * Auth-only check (no credit requirement).
 * Use for routes that never consume credits (e.g. per-round game generation, submissions).
 */
export async function requireAuth(): Promise<AuthResult> {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return {
      teacher: { id: 'mock-teacher', email: 'mock@test.com', credits: 999, isPro: true, isDeveloper: true },
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
    teacher: { id: user.id, email: user.email ?? '', credits: 0, isPro: false, isDeveloper: false },
    error: null,
  };
}

/**
 * Decrement one generation credit after a successful Pro-tier content generation.
 * No-op for Pro/developer teachers (the RPC handles the subscription_status guard).
 */
export async function consumeCredit(teacherId: string): Promise<void> {
  try {
    const service = createServiceClient();
    const { data: newCredits, error } = await service.rpc('use_generation_credit', {
      teacher_id: teacherId,
    });

    if (error) {
      console.error('consumeCredit RPC error:', error);
    } else if (newCredits === -1) {
      console.warn('consumeCredit: teacher not found', teacherId);
    }
  } catch (err) {
    // Non-fatal: generation already succeeded; log and continue
    console.error('consumeCredit unexpected error:', err);
  }
}
