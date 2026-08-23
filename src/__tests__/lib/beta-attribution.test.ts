import { describe, expect, it } from 'vitest';
import { betaAnalyticsProperties, sanitizeBetaAttribution, sanitizeReferrer, sanitizeUtm } from '@/lib/beta/attribution';

describe('beta attribution sanitizer', () => {
  it('keeps campaign slugs and normalizes case', () => {
    expect(sanitizeUtm(' Reddit_Organic-v1.2 ')).toBe('reddit_organic-v1.2');
  });

  it('nulls email-bearing, token-like, malformed, and oversized UTMs', () => {
    expect(sanitizeUtm('teacher@example.com')).toBeNull();
    expect(sanitizeUtm('campaign/token')).toBeNull();
    expect(sanitizeUtm('x'.repeat(81))).toBeNull();
  });

  it('strips referrer credentials, query, and fragment', () => {
    expect(sanitizeReferrer('https://user:pass@example.com/post?q=teacher@example.com#token')).toBe('https://example.com/post');
    expect(sanitizeReferrer('not a url')).toBeNull();
    expect(sanitizeReferrer('javascript:alert(1)')).toBeNull();
  });

  it('forces the beta landing path and allow-lists analytics properties', () => {
    const attribution = sanitizeBetaAttribution({ landingPath: '/private', referrer: 'https://example.com/a?secret=1', utmSource: 'Reddit', utmTerm: 'teachers' });
    expect(attribution.landingPath).toBe('/beta');
    expect(attribution.referrer).toBe('https://example.com/a');
    expect(betaAnalyticsProperties(attribution)).toEqual({
      program: 'founding-captains', landing_path: '/beta', utm_source: 'reddit',
      utm_medium: null, utm_campaign: null, utm_content: null,
    });
  });
});
