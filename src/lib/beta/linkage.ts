import { normalizeEmail } from '@/lib/beta/application';

export type BetaLinkApplication = {
  id: string;
  email_normalized: string;
  status: string;
  teacher_id: string | null;
  signed_up_at: string | null;
};

export type BetaLinkDecision =
  | { kind: 'mismatch' }
  | { kind: 'ignore' }
  | { kind: 'link'; update: Record<string, unknown> };

export function decideBetaLink(
  application: BetaLinkApplication | null,
  user: { id: string; email: string }
): BetaLinkDecision {
  if (!application) return { kind: 'ignore' };
  if (application.email_normalized !== normalizeEmail(user.email)) return { kind: 'mismatch' };
  if (application.teacher_id && application.teacher_id !== user.id) return { kind: 'ignore' };

  const update: Record<string, unknown> = { teacher_id: user.id };
  if (!application.signed_up_at) update.signed_up_at = new Date().toISOString();
  if (application.status === 'applied') update.status = 'signed_up';
  return { kind: 'link', update };
}
