import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(path.join(process.cwd(), 'supabase/migrations/055_beta_program.sql'), 'utf8');

describe('beta abuse RPC migration contract', () => {
  it('enforces online-only applications and enables RLS on both beta tables', () => {
    expect(migration).toContain("check (teaching_format = 'online')");
    expect(migration).toContain('alter table public.beta_applications enable row level security');
    expect(migration).toContain('alter table public.beta_application_attempts enable row level security');
    expect(migration).not.toMatch(/create\s+policy\s+.*beta_/i);
  });

  it('serializes the purge, limit checks, and insert in one transaction-scoped RPC', () => {
    expect(migration).toContain('create or replace function public.claim_beta_application_attempt');
    expect(migration).toContain("pg_advisory_xact_lock(hashtextextended('beta-application-attempts-global', 0))");
    expect(migration).toContain("attempted_at < v_now - interval '30 days'");
    expect(migration).toContain("attempted_at >= v_now - interval '1 hour'");
    expect(migration).toContain('if v_ip_count >= 10');
    expect(migration).toContain("attempted_at >= v_now - interval '1 day'");
    expect(migration).toContain('if v_global_count >= 500');
    expect(migration).toContain('insert into public.beta_application_attempts');
  });

  it('keeps browser roles from executing the service-role RPC', () => {
    expect(migration).toContain('revoke all on function public.claim_beta_application_attempt(text) from anon');
    expect(migration).toContain('revoke all on function public.claim_beta_application_attempt(text) from authenticated');
    expect(migration).toContain('grant execute on function public.claim_beta_application_attempt(text) to service_role');
  });
});
