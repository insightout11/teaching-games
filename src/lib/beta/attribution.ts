export const BETA_LANDING_PATH = '/beta';
export const UTM_MAX_LENGTH = 80;
const UTM_PATTERN = /^[a-z0-9._-]+$/;

export type BetaAttribution = {
  landingPath: typeof BETA_LANDING_PATH;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
};

export function sanitizeUtm(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > UTM_MAX_LENGTH || !UTM_PATTERN.test(normalized)) return null;
  return normalized;
}
export function sanitizeReferrer(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

export function sanitizeBetaAttribution(value: unknown): BetaAttribution {
  const input = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  return {
    landingPath: BETA_LANDING_PATH,
    referrer: sanitizeReferrer(input.referrer),
    utmSource: sanitizeUtm(input.utmSource),
    utmMedium: sanitizeUtm(input.utmMedium),
    utmCampaign: sanitizeUtm(input.utmCampaign),
    utmContent: sanitizeUtm(input.utmContent),
    utmTerm: sanitizeUtm(input.utmTerm),
  };
}

export function betaAnalyticsProperties(attribution: BetaAttribution) {
  return {
    program: 'founding-captains',
    landing_path: BETA_LANDING_PATH,
    utm_source: attribution.utmSource,
    utm_medium: attribution.utmMedium,
    utm_campaign: attribution.utmCampaign,
    utm_content: attribution.utmContent,
  };
}
