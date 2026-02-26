import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lessoncaptain.com';

export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_NOINDEX === '1') {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/classroom-games', '/classroom-activities', '/worksheets'],
        disallow: [
          '/api/',
          '/join/',
          '/classes/',
          '/sessions/',
          '/login',
          '/callback',
          '/lesson-planner',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
