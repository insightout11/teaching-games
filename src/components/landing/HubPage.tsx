import Link from 'next/link';
import type { GamePlugin } from '@/games/types';
import type { ActivityPlugin } from '@/activities/types';

interface GameHubPageProps {
  type: 'game';
  categories: { slug: string; name: string; description: string; plugins: GamePlugin[] }[];
  crossLinkHref: string;
  crossLinkLabel: string;
}

interface ActivityHubPageProps {
  type: 'activity';
  categories: { slug: string; name: string; description: string; plugins: ActivityPlugin[] }[];
  crossLinkHref: string;
  crossLinkLabel: string;
}

type HubPageProps = GameHubPageProps | ActivityHubPageProps;

export function HubPage({ type, categories, crossLinkHref, crossLinkLabel }: HubPageProps) {
  const basePath = type === 'game' ? '/classroom-games' : '/classroom-activities';
  const isGame = type === 'game';

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
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <h1 className="text-4xl font-bold text-gray-900">
            {isGame
              ? 'Classroom Games for ESL Teachers'
              : 'Classroom Activities for ESL Teachers'}
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl">
            {isGame
              ? 'AI-powered games that generate fresh content every session. No preparation. No repeat content. Just engaged students practising real English skills.'
              : 'Discussion and speaking activities that get every student talking. AI generates on-topic content so any lesson topic becomes an instant activity.'}
          </p>
          <div className="mt-8">
            <Link
              href="/login"
              className={`inline-block rounded-lg px-6 py-3 font-semibold text-white transition ${
                isGame ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              Try free with Google →
            </Link>
          </div>
        </div>
      </section>

      {/* Category sections */}
      {categories.map((cat) => (
        <section key={cat.slug} className="py-10 odd:bg-white even:bg-gray-50">
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{cat.name}</h2>
                <p className="mt-1 text-gray-600">{cat.description}</p>
              </div>
              <Link
                href={`${basePath}/${cat.slug}`}
                className="shrink-0 text-sm text-blue-600 hover:underline"
              >
                View all →
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cat.plugins.slice(0, 3).map((plugin) => (
                <Link
                  key={plugin.key}
                  href={`${basePath}/${plugin.key}`}
                  className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-400 hover:shadow"
                >
                  <h3 className="font-semibold text-gray-900">{plugin.name}</h3>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">{plugin.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {plugin.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
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

      {/* Cross-link */}
      <section className="py-10 border-t border-gray-100">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-gray-600">
            <Link href={crossLinkHref} className="text-blue-600 hover:underline">
              {crossLinkLabel}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
