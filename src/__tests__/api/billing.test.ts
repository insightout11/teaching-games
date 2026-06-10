import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock('@/lib/auth-credits', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}));

// Flexible supabase service mock. Each from('teachers') call returns a chain
// whose terminal methods are driven by the queues below.
const singleResults: Array<{ data: unknown; error: unknown }> = [];
const maybeSingleResults: Array<{ data: unknown; error: unknown }> = [];
let updateResult: { error: unknown } = { error: null };
const updateCalls: Array<{ values: Record<string, unknown>; eqArgs: [string, string] }> = [];

function makeChain() {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(singleResults.shift() ?? { data: null, error: null })),
    maybeSingle: vi.fn(() => Promise.resolve(maybeSingleResults.shift() ?? { data: null, error: null })),
    update: vi.fn((values: Record<string, unknown>) => ({
      eq: vi.fn((col: string, val: string) => {
        updateCalls.push({ values, eqArgs: [col, val] });
        return Promise.resolve(updateResult);
      }),
    })),
  };
  return chain;
}

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ from: vi.fn(() => makeChain()) }),
}));

const mockCheckoutCreate = vi.fn();
const mockPortalCreate = vi.fn();
const mockConstructEvent = vi.fn();

vi.mock('@/lib/billing/stripe', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/billing/stripe')>();
  return {
    ...actual,
    getStripe: () => ({
      checkout: { sessions: { create: mockCheckoutCreate } },
      billingPortal: { sessions: { create: mockPortalCreate } },
      webhooks: { constructEvent: mockConstructEvent },
    }),
  };
});

import { POST as checkoutPOST } from '@/app/api/billing/checkout/route';
import { POST as webhookPOST } from '@/app/api/billing/webhook/route';
import { POST as portalPOST } from '@/app/api/billing/portal/route';
import { mapStripeStatus } from '@/lib/billing/stripe';

// ── Helpers ──────────────────────────────────────────────────────────────────

const TEACHER = { id: 'teacher-1', email: 't@example.com', credits: 0, isPro: false, isDeveloper: false };

function authed() {
  mockRequireAuth.mockResolvedValue({ teacher: TEACHER, error: null });
}

function unauthed() {
  mockRequireAuth.mockResolvedValue({
    teacher: null,
    error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
  });
}

function jsonRequest(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  singleResults.length = 0;
  maybeSingleResults.length = 0;
  updateCalls.length = 0;
  updateResult = { error: null };
  vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'false');
  vi.stubEnv('STRIPE_PRICE_YEARLY', 'price_yearly_test');
  vi.stubEnv('STRIPE_PRICE_MONTHLY', 'price_monthly_test');
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
});

// ── mapStripeStatus ──────────────────────────────────────────────────────────

describe('mapStripeStatus', () => {
  it('keeps access for active, trialing, and past_due', () => {
    expect(mapStripeStatus('active')).toBe('active');
    expect(mapStripeStatus('trialing')).toBe('active');
    expect(mapStripeStatus('past_due')).toBe('active');
  });

  it('revokes access for canceled, unpaid, and incomplete_expired', () => {
    expect(mapStripeStatus('canceled')).toBe('cancelled');
    expect(mapStripeStatus('unpaid')).toBe('cancelled');
    expect(mapStripeStatus('incomplete_expired')).toBe('cancelled');
  });

  it('leaves entitlement untouched for incomplete and paused', () => {
    expect(mapStripeStatus('incomplete')).toBeNull();
    expect(mapStripeStatus('paused')).toBeNull();
  });
});

// ── POST /api/billing/checkout ───────────────────────────────────────────────

describe('POST /api/billing/checkout', () => {
  it('returns 401 when unauthenticated', async () => {
    unauthed();
    const res = await checkoutPOST(jsonRequest('http://localhost/api/billing/checkout', { plan: 'yearly' }) as never);
    expect(res.status).toBe(401);
  });

  it('returns 400 for an invalid plan', async () => {
    authed();
    const res = await checkoutPOST(jsonRequest('http://localhost/api/billing/checkout', { plan: 'lifetime' }) as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 ALREADY_SUBSCRIBED when teacher is already active', async () => {
    authed();
    singleResults.push({ data: { subscription_status: 'active', stripe_customer_id: 'cus_1' }, error: null });
    const res = await checkoutPOST(jsonRequest('http://localhost/api/billing/checkout', { plan: 'yearly' }) as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe('ALREADY_SUBSCRIBED');
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it('returns 500 when the price id env is missing', async () => {
    authed();
    vi.stubEnv('STRIPE_PRICE_YEARLY', '');
    const res = await checkoutPOST(jsonRequest('http://localhost/api/billing/checkout', { plan: 'yearly' }) as never);
    expect(res.status).toBe(500);
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it('creates a checkout session tagged with the teacher id and returns its url', async () => {
    authed();
    singleResults.push({ data: { subscription_status: 'free', stripe_customer_id: null }, error: null });
    mockCheckoutCreate.mockResolvedValue({ id: 'cs_1', url: 'https://checkout.stripe.com/cs_1' });

    const res = await checkoutPOST(jsonRequest('http://localhost/api/billing/checkout', { plan: 'yearly' }) as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe('https://checkout.stripe.com/cs_1');

    const args = mockCheckoutCreate.mock.calls[0][0];
    expect(args.mode).toBe('subscription');
    expect(args.client_reference_id).toBe('teacher-1');
    expect(args.subscription_data.metadata.teacher_id).toBe('teacher-1');
    expect(args.line_items).toEqual([{ price: 'price_yearly_test', quantity: 1 }]);
    expect(args.customer_email).toBe('t@example.com');
  });

  it('reuses the stored Stripe customer when one exists', async () => {
    authed();
    singleResults.push({ data: { subscription_status: 'cancelled', stripe_customer_id: 'cus_42' }, error: null });
    mockCheckoutCreate.mockResolvedValue({ id: 'cs_2', url: 'https://checkout.stripe.com/cs_2' });

    const res = await checkoutPOST(jsonRequest('http://localhost/api/billing/checkout', { plan: 'monthly' }) as never);
    expect(res.status).toBe(200);
    const args = mockCheckoutCreate.mock.calls[0][0];
    expect(args.customer).toBe('cus_42');
    expect(args.customer_email).toBeUndefined();
  });
});

// ── POST /api/billing/webhook ────────────────────────────────────────────────

function webhookRequest(body = '{}', signature: string | null = 'sig_test') {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (signature) headers['stripe-signature'] = signature;
  return new Request('http://localhost/api/billing/webhook', { method: 'POST', headers, body });
}

describe('POST /api/billing/webhook', () => {
  it('returns 400 when the signature header is missing', async () => {
    const res = await webhookPOST(webhookRequest('{}', null) as never);
    expect(res.status).toBe(400);
    expect(mockConstructEvent).not.toHaveBeenCalled();
  });

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('bad signature');
    });
    const res = await webhookPOST(webhookRequest() as never);
    expect(res.status).toBe(400);
    expect(updateCalls.length).toBe(0);
  });

  it('activates the teacher on checkout.session.completed', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          mode: 'subscription',
          client_reference_id: 'teacher-1',
          customer: 'cus_1',
          subscription: 'sub_1',
        },
      },
    });

    const res = await webhookPOST(webhookRequest() as never);
    expect(res.status).toBe(200);
    expect(updateCalls.length).toBe(1);
    expect(updateCalls[0].values.subscription_status).toBe('active');
    expect(updateCalls[0].values.stripe_customer_id).toBe('cus_1');
    expect(updateCalls[0].values.stripe_subscription_id).toBe('sub_1');
    expect(updateCalls[0].eqArgs).toEqual(['id', 'teacher-1']);
  });

  it('returns 500 (so Stripe retries) when activation fails to persist', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: { id: 'cs_1', mode: 'subscription', client_reference_id: 'teacher-1', customer: 'cus_1', subscription: 'sub_1' },
      },
    });
    updateResult = { error: { message: 'db down' } };

    const res = await webhookPOST(webhookRequest() as never);
    expect(res.status).toBe(500);
  });

  it('cancels the teacher on customer.subscription.deleted', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: { id: 'sub_1', status: 'canceled', customer: 'cus_1', metadata: { teacher_id: 'teacher-1' } },
      },
    });
    // findTeacherForSubscription → metadata lookup hit
    maybeSingleResults.push({ data: { id: 'teacher-1', stripe_subscription_id: 'sub_1' }, error: null });

    const res = await webhookPOST(webhookRequest() as never);
    expect(res.status).toBe(200);
    expect(updateCalls.length).toBe(1);
    expect(updateCalls[0].values.subscription_status).toBe('cancelled');
    expect(updateCalls[0].eqArgs).toEqual(['id', 'teacher-1']);
  });

  it('keeps access on customer.subscription.updated with past_due', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: { id: 'sub_1', status: 'past_due', customer: 'cus_1', metadata: { teacher_id: 'teacher-1' } },
      },
    });
    maybeSingleResults.push({ data: { id: 'teacher-1', stripe_subscription_id: 'sub_1' }, error: null });

    const res = await webhookPOST(webhookRequest() as never);
    expect(res.status).toBe(200);
    expect(updateCalls.length).toBe(1);
    expect(updateCalls[0].values.subscription_status).toBe('active');
  });

  it('ignores stale events from a superseded subscription', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: { id: 'sub_old', status: 'canceled', customer: 'cus_1', metadata: { teacher_id: 'teacher-1' } },
      },
    });
    // Teacher row now points at the NEW subscription
    maybeSingleResults.push({ data: { id: 'teacher-1', stripe_subscription_id: 'sub_new' }, error: null });

    const res = await webhookPOST(webhookRequest() as never);
    expect(res.status).toBe(200);
    expect(updateCalls.length).toBe(0);
  });

  it('acknowledges subscriptions that match no teacher', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_x', status: 'active', customer: 'cus_x', metadata: {} } },
    });
    // metadata lookup skipped (no teacher_id), sub + customer lookups miss
    maybeSingleResults.push({ data: null, error: null }, { data: null, error: null });

    const res = await webhookPOST(webhookRequest() as never);
    expect(res.status).toBe(200);
    expect(updateCalls.length).toBe(0);
  });
});

// ── POST /api/billing/portal ─────────────────────────────────────────────────

describe('POST /api/billing/portal', () => {
  it('returns 401 when unauthenticated', async () => {
    unauthed();
    const res = await portalPOST(new Request('http://localhost/api/billing/portal', { method: 'POST' }) as never);
    expect(res.status).toBe(401);
  });

  it('returns 400 NO_STRIPE_CUSTOMER when no customer id is stored', async () => {
    authed();
    singleResults.push({ data: { stripe_customer_id: null }, error: null });
    const res = await portalPOST(new Request('http://localhost/api/billing/portal', { method: 'POST' }) as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe('NO_STRIPE_CUSTOMER');
  });

  it('returns the portal url for a subscribed teacher', async () => {
    authed();
    singleResults.push({ data: { stripe_customer_id: 'cus_42' }, error: null });
    mockPortalCreate.mockResolvedValue({ url: 'https://billing.stripe.com/p_1' });

    const res = await portalPOST(new Request('http://localhost/api/billing/portal', { method: 'POST' }) as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe('https://billing.stripe.com/p_1');
    expect(mockPortalCreate.mock.calls[0][0].customer).toBe('cus_42');
  });
});
