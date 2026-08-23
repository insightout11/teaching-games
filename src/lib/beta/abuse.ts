import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';

export const BETA_BODY_MAX_BYTES = 24 * 1024;
export function getBetaAbuseSalt(): string | null {
  const configured = process.env.PUBLIC_DEMO_IP_SALT?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === 'production' ? null : 'local-beta-development-only';
}
export function hashBetaClientIp(request: NextRequest, salt: string): string {
  const forwarded = request.headers.get('x-forwarded-for') ?? '';
  const ip = forwarded.split(',')[0].trim()
    || request.headers.get('x-real-ip')?.trim()
    || 'unknown';
  return createHash('sha256').update(`${ip}:${salt}`).digest('hex');
}

export function requestBodyTooLarge(request: NextRequest): boolean {
  const value = request.headers.get('content-length');
  if (!value) return false;
  const length = Number(value);
  return Number.isFinite(length) && length > BETA_BODY_MAX_BYTES;
}
