import { describe, expect, it } from 'vitest';
import { decideBetaLink } from '@/lib/beta/linkage';

const application = {
  id: 'application',
  email_normalized: 'teacher@example.com',
  status: 'applied',
  teacher_id: null,
  signed_up_at: null,
};

describe('beta OAuth linkage', () => {
  it('links matching normalized emails and sets signed-up state once', () => {
    const result = decideBetaLink(application, { id: 'teacher', email: ' Teacher@Example.com ' });
    expect(result.kind).toBe('link');
    if (result.kind === 'link') {
      expect(result.update).toMatchObject({ teacher_id: 'teacher', status: 'signed_up' });
      expect(result.update.signed_up_at).toEqual(expect.any(String));
    }
  });

  it('does not link a mismatched email', () => {
    expect(decideBetaLink(application, { id: 'teacher', email: 'other@example.com' })).toEqual({ kind: 'mismatch' });
  });

  it('is idempotent and never downgrades advanced lifecycle state', () => {
    const result = decideBetaLink({ ...application, status: 'activated', teacher_id: 'teacher', signed_up_at: '2026-08-01T00:00:00Z' }, { id: 'teacher', email: 'teacher@example.com' });
    expect(result).toEqual({ kind: 'link', update: { teacher_id: 'teacher' } });
  });

  it('ignores missing applications and records already linked elsewhere', () => {
    expect(decideBetaLink(null, { id: 'teacher', email: 'teacher@example.com' })).toEqual({ kind: 'ignore' });
    expect(decideBetaLink({ ...application, teacher_id: 'another' }, { id: 'teacher', email: 'teacher@example.com' })).toEqual({ kind: 'ignore' });
  });
});
