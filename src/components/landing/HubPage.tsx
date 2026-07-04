import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { GamePlugin } from '@/games/types';
import type { ActivityPlugin } from '@/activities/types';
import { ProductVisualHero } from './ProductVisualHero';
import { EmailCaptureCard } from '@/components/marketing/EmailCaptureCard';

interface GameHubPageProps {
  type: 'game';
  categories: { slug: string; name: string; description: string; plugins: GamePlugin[] }[];
  crossLinkHref: string;
  crossLinkLabel: string;
  guideLinks?: { label: string; href: string; description: string }[];
}

interface ActivityHubPageProps {
  type: 'activity';
  categories: { slug: string; name: string; description: string; plugins: ActivityPlugin[] }[];
  crossLinkHref: string;
  crossLinkLabel: string;
  guideLinks?: { label: string; href: string; description: string }[];
}

type HubPageProps = GameHubPageProps | ActivityHubPageProps;

export function HubPage({ type, categories, crossLinkHref, crossLinkLabel, guideLinks = [] }: HubPageProps) {
  const basePath = type === 'game' ? '/classroom-games' : '/classroom-activities';
  const isGame = type === 'game';
  const accent = isGame
    ? { text: 'text-cyan-300', border: 'hover:border-cyan-400/50', cta: 'bg-lc-blue text-[#070B14] hover:bg-lc-blue-hover' }
    : { text: 'text-emerald-300', border: 'hover:border-emerald-400/50', cta: 'bg-emerald-500 text-[#03150f] hover:bg-emerald-400' };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: isGame
      ? 'Classroom Games for ESL Teachers — LessonCaptain'
      : 'Classroom Activities for ESL Teachers — LessonCaptain',
    itemListElement: categories.flatMap((cat) =>
      cat.plugins.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        url: `${basePath}/${p.key}`,
      }))
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="py-14">
        <div className="mx-auto max-w-5xl px-6">
          <h1 className="text-4xl font-bold text-lc-text">
            {isGame
              ? 'Classroom Games for ESL Teachers'
              : 'Classroom Activities for ESL Teachers'}
          </h1>
          <p className="mt-4 max-w-3xl text-xl text-lc-text2">
            {isGame
              ? 'AI-powered games that generate fresh content every session. No preparation. No repeat content. Just engaged students practising real English skills.'
              : 'Discussion and speaking activities that get every student talking. AI generates on-topic content so any lesson topic becomes an instant activity.'}
          </p>
          <div className="mt-8">
            <Link
              href="/login"
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors ${accent.cta}`}
            >
              Try free with Google
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="mt-12">
            <ProductVisualHero />
          </div>
        </div>
      </section>

      {/* Category sections */}
      {categories.map((cat, ci) => (
        <section key={cat.slug} className={ci % 2 === 1 ? 'bg-lc-surface py-12' : 'py-12'}>
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-lc-text">{cat.name}</h2>
                <p className="mt-1 text-lc-text2">{cat.description}</p>
              </div>
              <Link
                href={`${basePath}/${cat.slug}`}
                className={`shrink-0 text-sm font-medium ${accent.text} hover:underline`}
              >
                View all &rarr;
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cat.plugins.slice(0, 3).map((plugin) => (
                <Link
                  key={plugin.key}
                  href={`${basePath}/${plugin.key}`}
                  className={`rounded-xl border border-lc-border bg-lc-card p-5 transition-colors ${accent.border}`}
                >
                  <h3 className="font-semibold text-lc-text">{plugin.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-lc-text3">{plugin.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {plugin.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-lc-border bg-lc-surface px-2 py-0.5 text-xs text-lc-text3"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Email capture */}
      <section className="py-12">
        <div className="mx-auto max-w-2xl px-6">
          <EmailCaptureCard source={isGame ? 'seo-games' : 'seo-activities'} />
        </div>
      </section>

      {guideLinks.length > 0 ? (
        <section className="border-t border-lc-border bg-lc-surface/70 py-12">
          <div className="mx-auto max-w-5xl px-6">
            <p className={`text-xs font-semibold uppercase tracking-widest ${accent.text}`}>
              Popular ESL guides
            </p>
            <h2 className="mt-3 text-2xl font-bold text-lc-text">
              Find the right activity faster
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {guideLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl border border-lc-border bg-lc-card p-5 transition-colors ${accent.border}`}
                >
                  <h3 className="font-semibold text-lc-text">{link.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-lc-text3">{link.description}</p>
                  <span className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold ${accent.text}`}>
                    Open guide
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Cross-link */}
      <section className="border-t border-lc-border py-10">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-lc-text2">
            <Link href={crossLinkHref} className={`${accent.text} hover:underline`}>
              {crossLinkLabel}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
