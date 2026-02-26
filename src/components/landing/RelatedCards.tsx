import Link from 'next/link';
import type { LandingContent } from '@/lib/content-landing';
import type { GamePlugin } from '@/games/types';
import type { ActivityPlugin } from '@/activities/types';

interface RelatedCardsProps {
  slugs: string[];
  type: 'game' | 'activity';
  contentMap: Record<string, LandingContent>;
  pluginMap: Record<string, GamePlugin | ActivityPlugin>;
}

export function RelatedCards({ slugs, type, contentMap, pluginMap }: RelatedCardsProps) {
  const basePath = type === 'game' ? '/classroom-games' : '/classroom-activities';
  const displayed = slugs.slice(0, 4);

  return (
    <section className="py-10 bg-gray-50">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-2xl font-bold text-gray-900">You might also like</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((slug) => {
            const content = contentMap[slug];
            const plugin = pluginMap[slug];
            if (!content || !plugin) return null;
            return (
              <Link
                key={slug}
                href={`${basePath}/${slug}`}
                className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-400 hover:shadow"
              >
                <h3 className="font-semibold text-gray-900">{plugin.name}</h3>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{plugin.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
