import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Record<string, string> = {
  INVITE_NOT_FOUND: 'This invite code does not exist.',
  INVITE_EXPIRED: 'This invite code has expired.',
  INVITE_ALREADY_USED: 'This invite code has already been used.',
  ALREADY_REDEEMED: 'You have already redeemed an invite code.',
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = body?.code;

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return NextResponse.json({ error: 'code is required' }, { status: 400 });
  }

  const { teacher, error: authError } = await requireAuth();
  if (authError) return authError;

  const service = createServiceClient();

  const { data: creditsGranted, error: rpcError } = await service.rpc('redeem_invite_code', {
    p_teacher_id: teacher!.id,
    p_code: code.trim().toUpperCase(),
  });

  if (rpcError) {
    // Map named exceptions from the RPC to friendly HTTP errors
    const knownCode = Object.keys(ERROR_MESSAGES).find((k) =>
      rpcError.message?.includes(k)
    );
    if (knownCode) {
      return NextResponse.json(
        { error: ERROR_MESSAGES[knownCode], code: knownCode },
        { status: 422 }
      );
    }
    console.error('redeem_invite_code RPC error:', rpcError);
    return NextResponse.json({ error: 'Failed to redeem invite code.' }, { status: 500 });
  }

  return NextResponse.json({ creditsGranted });
}
