import { EMAIL_PATTERN, VALIDATION } from '@/lib/config/rate-limits';
import { sanitizeBetaAttribution } from '@/lib/beta/attribution';

export const BETA_APPLICATION_COOKIE = 'lc-beta-application';
export const BETA_PROGRAM = 'founding-captains';

export const TEACHING_FORMATS = ['online'] as const;
export const LEARNER_LEVELS = [
  'beginner',
  'elementary',
  'pre-intermediate',
  'intermediate',
  'upper-intermediate',
  'advanced',
  'mixed',
] as const;

type TeachingFormat = (typeof TEACHING_FORMATS)[number];
type Attribution = {
  landing_path: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

export type ValidBetaApplication = Attribution & {
  email: string;
  email_normalized: string;
  first_name: string;
  teaching_format: TeachingFormat;
  learner_levels: string[];
  learner_age_band: string | null;
  typical_class_size: string | null;
  teaching_platform: string | null;
  biggest_challenge: string | null;
  contact_consent: true;
  program: typeof BETA_PROGRAM;
};

type ParseResult =
  | { ok: true; honeypot: true }
  | { ok: true; honeypot: false; value: ValidBetaApplication }
  | { ok: false; error: string };

const LIMITS = {
  firstName: 80,
  selection: 80,
  challenge: 1000,
  learnerLevels: 7,
} as const;

function optionalString(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length <= max ? trimmed : undefined;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isUuid(value: string | null): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

export function parseBetaApplication(body: unknown): ParseResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Invalid request' };
  }

  const input = body as Record<string, unknown>;
  const website = optionalString(input.website, 200);
  if (website === undefined) return { ok: false, error: 'Invalid request' };
  if (website) return { ok: true, honeypot: true };

  const email = typeof input.email === 'string' ? input.email.trim() : '';
  const emailNormalized = normalizeEmail(email);
  if (!email || email.length > VALIDATION.EMAIL_MAX || !EMAIL_PATTERN.test(emailNormalized)) {
    return { ok: false, error: 'Enter a valid email address' };
  }

  const firstName = optionalString(input.firstName, LIMITS.firstName);
  if (!firstName) return { ok: false, error: 'Enter your first name' };

  if (typeof input.teachingFormat !== 'string' || !TEACHING_FORMATS.includes(input.teachingFormat as TeachingFormat)) {
    return { ok: false, error: 'Choose a teaching format' };
  }

  if (!Array.isArray(input.learnerLevels) || input.learnerLevels.length < 1 || input.learnerLevels.length > LIMITS.learnerLevels) {
    return { ok: false, error: 'Choose at least one learner level' };
  }
  if (!input.learnerLevels.every((level) => typeof level === 'string' && LEARNER_LEVELS.includes(level as (typeof LEARNER_LEVELS)[number]))) {
    return { ok: false, error: 'Choose valid learner levels' };
  }
  const learnerLevels = Array.from(new Set(input.learnerLevels as string[]));

  if (input.contactConsent !== true) {
    return { ok: false, error: 'Contact consent is required' };
  }

  const learnerAgeBand = optionalString(input.learnerAgeBand, LIMITS.selection);
  const typicalClassSize = optionalString(input.typicalClassSize, LIMITS.selection);
  const teachingPlatform = optionalString(input.teachingPlatform, LIMITS.selection);
  const biggestChallenge = optionalString(input.biggestChallenge, LIMITS.challenge);
  if ([learnerAgeBand, typicalClassSize, teachingPlatform, biggestChallenge].includes(undefined)) {
    return { ok: false, error: 'One or more fields are too long' };
  }

  const attribution = sanitizeBetaAttribution(input.attribution);

  return {
    ok: true,
    honeypot: false,
    value: {
      email,
      email_normalized: emailNormalized,
      first_name: firstName,
      teaching_format: input.teachingFormat as TeachingFormat,
      learner_levels: learnerLevels,
      learner_age_band: learnerAgeBand ?? null,
      typical_class_size: typicalClassSize ?? null,
      teaching_platform: teachingPlatform ?? null,
      biggest_challenge: biggestChallenge ?? null,
      contact_consent: true,
      program: BETA_PROGRAM,
      landing_path: attribution.landingPath,
      referrer: attribution.referrer,
      utm_source: attribution.utmSource,
      utm_medium: attribution.utmMedium,
      utm_campaign: attribution.utmCampaign,
      utm_content: attribution.utmContent,
      utm_term: attribution.utmTerm,
    },
  };
}
