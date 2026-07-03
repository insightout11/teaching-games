import type { MetadataRoute } from 'next';
import { getAllGameSlugs, getAllActivitySlugs, GAME_CATEGORY_DISPLAY_SLUGS, ACTIVITY_CATEGORY_DISPLAY_SLUGS } from '@/lib/content-landing';
import { getRegistry } from '@/lib/worksheets';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lessoncaptain.com';
const SITE_NOINDEX = process.env.SITE_NOINDEX === '1';
const LANDING_NOINDEX = !!process.env.LANDING_PAGES_NOINDEX;

export default function sitemap(): MetadataRoute.Sitemap {
  // Global noindex: return empty sitemap
  if (SITE_NOINDEX) return [];

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // ── Static pages ──────────────────────────────────────────────
  entries.push({ url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'monthly', priority: 1.0 });
  entries.push({ url: `${SITE_URL}/video-lesson`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 });
  entries.push({ url: `${SITE_URL}/showcase`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 });
  entries.push({ url: `${SITE_URL}/pro`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 });

  // ── Classroom Games ──────────────────────────────────────────
  if (!LANDING_NOINDEX) {
    entries.push({
      url: `${SITE_URL}/classroom-games`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    entries.push({
      url: `${SITE_URL}/classroom-games/no-devices`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    });

    // Game category pages
    for (const slug of Array.from(GAME_CATEGORY_DISPLAY_SLUGS)) {
      entries.push({
        url: `${SITE_URL}/classroom-games/${slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    // Game detail pages
    for (const slug of getAllGameSlugs()) {
      entries.push({
        url: `${SITE_URL}/classroom-games/${slug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }

    // ── Classroom Activities ───────────────────────────────────
    entries.push({
      url: `${SITE_URL}/classroom-activities`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    // Activity category pages
    for (const slug of Array.from(ACTIVITY_CATEGORY_DISPLAY_SLUGS)) {
      entries.push({
        url: `${SITE_URL}/classroom-activities/${slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    // Activity detail pages
    for (const slug of getAllActivitySlugs()) {
      entries.push({
        url: `${SITE_URL}/classroom-activities/${slug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  }

  // ── Worksheets (separate NOINDEX gate) ───────────────────────
  if (!process.env.WORKSHEETS_NOINDEX) {
    entries.push({
      url: `${SITE_URL}/worksheets`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    try {
      const registry = getRegistry();
      const clusters = Array.from(new Set(registry.items.map((i) => i.cluster)));
      for (const cluster of clusters) {
        entries.push({
          url: `${SITE_URL}/worksheets/${cluster}`,
          lastModified: now,
          changeFrequency: 'monthly',
          priority: 0.7,
        });
      }
    } catch {
      // Registry may not exist in all environments
    }
  }

  return entries;
}
