import Link from 'next/link';
import type { LandingContent, FAQItem } from '@/lib/content-landing';
import type { GamePlugin } from '@/games/types';
import { OutcomeStrip } from './OutcomeStrip';
import { HowItWorks } from './HowItWorks';
import { FAQSection } from './FAQSection';
import { RelatedCards } from './RelatedCards';

interface GameDetailLayoutProps {
  content: LandingContent;
  plugin: GamePlugin;
  relatedContent: Record<string, LandingContent>;
  relatedPlugins: Record<string, GamePlugin>;
}

export function GameDetailLayout({
  content,
  plugin,
  relatedContent,
  relatedPlugins,
}: GameDetailLayoutProps) {
  // JSON-LD for SoftwareApplication + FAQPage
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: plugin.name,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description: content.headline,
      },
      {
        '@type': 'FAQPage',
        mainEntity: content.faq.map((item: FAQItem) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  };

  const categoryLabel =
    plugin.category === 'vocabulary'
      ? 'Vocabulary'
      : plugin.category === 'grammar-writing'
      ? 'Grammar & Writing'
      : 'Logic & Puzzles';

  const categorySlug =
    plugin.category === 'vocabulary'
      ? 'vocabulary'
      : plugin.category === 'grammar-writing'
      ? 'grammar'
      : 'logic';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <nav className="mb-4 text-sm text-gray-500">
            <Link href="/classroom-games" className="hover:underline">
              Classroom Games
            </Link>{' '}
            /{' '}
            <Link href={`/classroom-games/${categorySlug}`} className="hover:underline">
              {categoryLabel}
            </Link>{' '}
            / <span className="text-gray-900">{plugin.name}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {plugin.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
              >
                {skill}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{content.headline}</h1>

          {content.problemStatement && (
            <p className="mt-4 text-lg text-gray-600 max-w-3xl">{content.problemStatement}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-500">
            {content.estimatedTime && (
              <span>⏱ {content.estimatedTime}</span>
            )}
            {content.groupSize && (
              <span>👥 {content.groupSize}</span>
            )}
            <span>📱 Works on any device</span>
          </div>

          <div className="mt-8">
            <Link
              href="/login"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition"
            >
              Run this game free →
            </Link>
          </div>
        </div>
      </section>

      {/* Outcome strip */}
      <OutcomeStrip outcomes={content.outcomes} />

      {/* How it works */}
      <HowItWorks steps={content.howItWorks} />

      {/* FAQ */}
      <FAQSection items={content.faq} />

      {/* CTA */}
      <section className="bg-blue-600 py-12 text-center text-white">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-bold">Ready to try {plugin.name}?</h2>
          <p className="mt-2 text-blue-100">
            Free to use. No student accounts needed. Start in under a minute.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 hover:bg-blue-50 transition"
          >
            Get started free →
          </Link>
        </div>
      </section>

      {/* Related */}
      {content.related.length > 0 && (
        <RelatedCards
          slugs={content.related}
          type="game"
          contentMap={relatedContent}
          pluginMap={relatedPlugins}
        />
      )}

      {/* Related Worksheets */}
      {content.relatedWorksheets && content.relatedWorksheets.length > 0 && (
        <section className="py-8">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-lg font-semibold text-gray-900">Related worksheets</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {content.relatedWorksheets.map((path) => (
                <Link
                  key={path}
                  href={`/worksheets/${path}`}
                  className="rounded-full border border-gray-200 px-4 py-1.5 text-sm text-gray-700 hover:border-blue-400 hover:text-blue-600 transition"
                >
                  {path.split('/').pop()?.replace(/-/g, ' ')}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
