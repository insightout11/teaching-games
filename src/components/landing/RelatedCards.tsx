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
  const hoverBorder = type === 'game' ? 'hover:border-cyan-400/50' : 'hover:border-emerald-400/50';
  const displayed = slugs.slice(0, 4);

  return (
    <section className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-2xl font-bold text-lc-text">You might also like</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((slug) => {
            const content = contentMap[slug];
            const plugin = pluginMap[slug];
            if (!content || !plugin) return null;
            return (
              <Link
                key={slug}
                href={`${basePath}/${slug}`}
                className={`rounded-xl border border-lc-border bg-lc-card p-5 transition-colors ${hoverBorder}`}
              >
                <h3 className="font-semibold text-lc-text">{plugin.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-lc-text3">{plugin.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
