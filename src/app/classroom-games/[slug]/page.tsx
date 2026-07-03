import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAllGameSlugs,
  getGameContent,
  GAME_CATEGORY_DISPLAY_SLUGS,
  GAME_CATEGORY_SLUG_TO_KEY,
} from '@/lib/content-landing';
import { getGame, getGamesByCategory, GAME_CATEGORY_INFO } from '@/games/registry';
import { GameDetailLayout } from '@/components/landing/GameDetailLayout';
import { CategoryPage } from '@/components/landing/CategoryPage';
import type { LandingContent } from '@/lib/content-landing';
import type { GamePlugin } from '@/games/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lessoncaptain.com';

export function generateStaticParams() {
  // All game detail slugs + all category display slugs
  const gameSlugs = getAllGameSlugs().map((slug) => ({ slug }));
  const categorySlugs = Array.from(GAME_CATEGORY_DISPLAY_SLUGS).map((slug) => ({ slug }));
  return [...gameSlugs, ...categorySlugs];
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const { slug } = params;
  const noindex = process.env.LANDING_PAGES_NOINDEX
    ? { robots: 'noindex,nofollow' }
    : {};

  // Category page metadata
  if (GAME_CATEGORY_DISPLAY_SLUGS.has(slug)) {
    const registryKey = GAME_CATEGORY_SLUG_TO_KEY[slug];
    const info = GAME_CATEGORY_INFO[registryKey as keyof typeof GAME_CATEGORY_INFO];
    return {
      title: `${info.name} Games for ESL Classes — LessonCaptain`,
      description: `Browse ${info.name.toLowerCase()} classroom games for ESL teachers. AI-generated content, live leaderboards, free to try.`,
      alternates: { canonical: `${SITE_URL}/classroom-games/${slug}` },
      openGraph: {
        title: `${info.name} Games for ESL Classes — LessonCaptain`,
        description: `Browse ${info.name.toLowerCase()} classroom games for ESL teachers. AI-generated content, live leaderboards, free to try.`,
      },
      ...noindex,
    };
  }

  // Detail page metadata
  const content = getGameContent(slug);
  const plugin = getGame(slug);
  if (!content || !plugin) {
    return { title: 'Not Found' };
  }

  const title = `${plugin.name}: ${content.headline} — LessonCaptain`.slice(0, 70);
  const description = plugin.description.slice(0, 155);

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/classroom-games/${slug}` },
    openGraph: {
      title,
      description,
      images: [`${SITE_URL}/classroom-games/${slug}/opengraph-image`],
    },
    ...noindex,
  };
}

export default function ClassroomGameSlugPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // ── Category page ─────────────────────────────────────────────
  if (GAME_CATEGORY_DISPLAY_SLUGS.has(slug)) {
    const registryKey = GAME_CATEGORY_SLUG_TO_KEY[slug];
    const info = GAME_CATEGORY_INFO[registryKey as keyof typeof GAME_CATEGORY_INFO];
    const plugins = getGamesByCategory(
      registryKey as Parameters<typeof getGamesByCategory>[0]
    ).filter((plugin) => getGameContent(plugin.key));
    const contentMap: Record<string, LandingContent> = {};
    for (const p of plugins) {
      const c = getGameContent(p.key);
      if (c) contentMap[p.key] = c;
    }

    return (
      <CategoryPage
        type="game"
        categoryKey={slug}
        categoryName={info.name}
        plugins={plugins}
        contentMap={contentMap}
        crossLinkHref="/classroom-activities"
        crossLinkLabel="Looking for activities? Browse classroom activities →"
      />
    );
  }

  // ── Detail page ───────────────────────────────────────────────
  const content = getGameContent(slug);
  const plugin = getGame(slug);
  if (!content || !plugin) notFound();

  // Build related content/plugin maps
  const relatedContent: Record<string, LandingContent> = {};
  const relatedPlugins: Record<string, GamePlugin> = {};
  for (const relSlug of content.related) {
    const rc = getGameContent(relSlug);
    const rp = getGame(relSlug);
    if (rc) relatedContent[relSlug] = rc;
    if (rp) relatedPlugins[relSlug] = rp;
  }

  return (
    <GameDetailLayout
      content={content}
      plugin={plugin}
      relatedContent={relatedContent}
      relatedPlugins={relatedPlugins}
    />
  );
}
