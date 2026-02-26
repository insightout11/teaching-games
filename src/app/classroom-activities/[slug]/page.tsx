import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAllActivitySlugs,
  getActivityContent,
  ACTIVITY_CATEGORY_DISPLAY_SLUGS,
  ACTIVITY_CATEGORY_SLUG_TO_KEY,
} from '@/lib/content-landing';
import { getActivity, getActivitiesByCategory, CATEGORY_INFO } from '@/activities/registry';
import { ActivityDetailLayout } from '@/components/landing/ActivityDetailLayout';
import { CategoryPage } from '@/components/landing/CategoryPage';
import type { LandingContent } from '@/lib/content-landing';
import type { ActivityPlugin } from '@/activities/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lessoncaptain.com';

export function generateStaticParams() {
  const activitySlugs = getAllActivitySlugs().map((slug) => ({ slug }));
  const categorySlugs = Array.from(ACTIVITY_CATEGORY_DISPLAY_SLUGS).map((slug) => ({ slug }));
  return [...activitySlugs, ...categorySlugs];
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const { slug } = params;
  const noindex = process.env.LANDING_PAGES_NOINDEX
    ? { robots: 'noindex,nofollow' }
    : {};

  // Category page metadata
  if (ACTIVITY_CATEGORY_DISPLAY_SLUGS.has(slug)) {
    const registryKey = ACTIVITY_CATEGORY_SLUG_TO_KEY[slug];
    const info = CATEGORY_INFO[registryKey as keyof typeof CATEGORY_INFO];
    return {
      title: `${info.name} for ESL Classes — LessonCaptain`,
      description: `Browse ${info.name.toLowerCase()} for ESL teachers. AI-generated content, no preparation needed, free to try.`,
      alternates: { canonical: `${SITE_URL}/classroom-activities/${slug}` },
      openGraph: {
        title: `${info.name} for ESL Classes — LessonCaptain`,
        description: `Browse ${info.name.toLowerCase()} for ESL teachers. AI-generated content, no preparation needed, free to try.`,
      },
      ...noindex,
    };
  }

  // Detail page metadata
  const content = getActivityContent(slug);
  const plugin = getActivity(slug);
  if (!content || !plugin) {
    return { title: 'Not Found' };
  }

  const title = `${plugin.name}: ${content.headline} — LessonCaptain`.slice(0, 70);
  const description = plugin.description.slice(0, 155);

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/classroom-activities/${slug}` },
    openGraph: {
      title,
      description,
      images: [`${SITE_URL}/classroom-activities/${slug}/opengraph-image`],
    },
    ...noindex,
  };
}

export default function ClassroomActivitySlugPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // ── Category page ─────────────────────────────────────────────
  if (ACTIVITY_CATEGORY_DISPLAY_SLUGS.has(slug)) {
    const registryKey = ACTIVITY_CATEGORY_SLUG_TO_KEY[slug];
    const info = CATEGORY_INFO[registryKey as keyof typeof CATEGORY_INFO];
    const plugins = getActivitiesByCategory(
      registryKey as Parameters<typeof getActivitiesByCategory>[0]
    );
    const contentMap: Record<string, LandingContent> = {};
    for (const p of plugins) {
      const c = getActivityContent(p.key);
      if (c) contentMap[p.key] = c;
    }

    return (
      <CategoryPage
        type="activity"
        categoryKey={slug}
        categoryName={info.name}
        plugins={plugins}
        contentMap={contentMap}
        crossLinkHref="/classroom-games"
        crossLinkLabel="Looking for scored games? Browse classroom games →"
      />
    );
  }

  // ── Detail page ───────────────────────────────────────────────
  const content = getActivityContent(slug);
  const plugin = getActivity(slug);
  if (!content || !plugin) notFound();

  // Build related content/plugin maps
  const relatedContent: Record<string, LandingContent> = {};
  const relatedPlugins: Record<string, ActivityPlugin> = {};
  for (const relSlug of content.related) {
    const rc = getActivityContent(relSlug);
    const rp = getActivity(relSlug);
    if (rc) relatedContent[relSlug] = rc;
    if (rp) relatedPlugins[relSlug] = rp;
  }

  return (
    <ActivityDetailLayout
      content={content}
      plugin={plugin}
      relatedContent={relatedContent}
      relatedPlugins={relatedPlugins}
    />
  );
}
