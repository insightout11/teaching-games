import type { Metadata } from 'next';
import { getGamesGrouped, GAME_CATEGORY_INFO } from '@/games/registry';
import { HubPage } from '@/components/landing/HubPage';
import { GAME_CATEGORY_SLUGS } from '@/lib/content-landing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lessoncaptain.com';

export function generateMetadata(): Metadata {
  return {
    title: 'Classroom Games for ESL Teachers — LessonCaptain',
    description:
      'AI-powered ESL classroom games with live leaderboards. Vocabulary, grammar, and logic games that generate fresh content every session. Free to try.',
    alternates: { canonical: `${SITE_URL}/classroom-games` },
    openGraph: {
      title: 'Classroom Games for ESL Teachers — LessonCaptain',
      description:
        'AI-powered ESL classroom games with live leaderboards. Vocabulary, grammar, and logic games that generate fresh content every session. Free to try.',
    },
    ...(process.env.LANDING_PAGES_NOINDEX ? { robots: 'noindex,nofollow' } : {}),
  };
}

export default function ClassroomGamesHub() {
  const grouped = getGamesGrouped();

  const categories = (
    Object.entries(GAME_CATEGORY_SLUGS) as [keyof typeof GAME_CATEGORY_SLUGS, string][]
  ).map(([registryKey, displaySlug]) => {
    const info = GAME_CATEGORY_INFO[registryKey as keyof typeof GAME_CATEGORY_INFO];
    return {
      slug: displaySlug,
      name: info.name,
      description: info.description,
      plugins: grouped[registryKey as keyof typeof grouped] ?? [],
    };
  });

  return (
    <HubPage
      type="game"
      categories={categories}
      crossLinkHref="/classroom-activities"
      crossLinkLabel="Looking for discussion activities? Browse classroom activities →"
    />
  );
}
