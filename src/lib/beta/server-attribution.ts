import { sanitizeBetaAttribution, type BetaAttribution } from '@/lib/beta/attribution';

export type StoredBetaAttribution = {
  landing_path?: unknown;
  referrer?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_content?: unknown;
  utm_term?: unknown;
};

export function betaAttributionFromRow(row: StoredBetaAttribution): BetaAttribution {
  return sanitizeBetaAttribution({
    landingPath: row.landing_path,
    referrer: row.referrer,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    utmContent: row.utm_content,
    utmTerm: row.utm_term,
  });
}
