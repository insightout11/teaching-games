import type { Metadata } from 'next';
import Link from 'next/link';
import { MonitorPlay } from 'lucide-react';
import { getGamesGrouped, GAME_CATEGORY_INFO } from '@/games/registry';
import { HubPage } from '@/components/landing/HubPage';
import { GAME_CATEGORY_SLUGS, getGameContent } from '@/lib/content-landing';

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
      plugins: (grouped[registryKey as keyof typeof grouped] ?? []).filter((plugin) =>
        getGameContent(plugin.key)
      ),
    };
  });

  return (
    <>
      <HubPage
        type="game"
        categories={categories}
        crossLinkHref="/classroom-activities"
        crossLinkLabel="Looking for discussion activities? Browse classroom activities →"
      />

      {/* No-devices promo — projector-only games for classrooms without student devices */}
      <section className="border-t border-lc-border bg-lc-surface py-10">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-cyan-300/25 bg-lc-card p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <MonitorPlay className="mt-0.5 h-6 w-6 shrink-0 text-cyan-300" aria-hidden />
              <div>
                <h2 className="font-semibold text-lc-text">No student devices in your classroom?</h2>
                <p className="mt-1 text-sm text-lc-text2">
                  10 of these games run entirely from a projector or smart TV — students answer
                  out loud, you run the shared screen.
                </p>
              </div>
            </div>
            <Link
              href="/classroom-games/no-devices"
              className="shrink-0 rounded-lg bg-lc-blue px-4 py-2 text-sm font-semibold text-[#070B14] transition-colors hover:bg-lc-blue-hover"
            >
              See device-free games
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
