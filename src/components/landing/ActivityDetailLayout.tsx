import Link from 'next/link';
import type { LandingContent, FAQItem } from '@/lib/content-landing';
import type { ActivityPlugin } from '@/activities/types';
import { OutcomeStrip } from './OutcomeStrip';
import { HowItWorks } from './HowItWorks';
import { FAQSection } from './FAQSection';
import { RelatedCards } from './RelatedCards';

interface ActivityDetailLayoutProps {
  content: LandingContent;
  plugin: ActivityPlugin;
  relatedContent: Record<string, LandingContent>;
  relatedPlugins: Record<string, ActivityPlugin>;
}

export function ActivityDetailLayout({
  content,
  plugin,
  relatedContent,
  relatedPlugins,
}: ActivityDetailLayoutProps) {
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
    plugin.category === 'icebreaker'
      ? 'Icebreakers'
      : plugin.category === 'learning'
      ? 'Learning'
      : plugin.category === 'practice'
      ? 'Practice'
      : 'Debate';

  const categorySlug =
    plugin.category === 'icebreaker'
      ? 'icebreakers'
      : plugin.category;

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
            <Link href="/classroom-activities" className="hover:underline">
              Classroom Activities
            </Link>{' '}
            /{' '}
            <Link href={`/classroom-activities/${categorySlug}`} className="hover:underline">
              {categoryLabel}
            </Link>{' '}
            / <span className="text-gray-900">{plugin.name}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {plugin.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
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
              className="inline-block rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 transition"
            >
              Run this activity free →
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
      <section className="bg-emerald-600 py-12 text-center text-white">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-bold">Ready to try {plugin.name}?</h2>
          <p className="mt-2 text-emerald-100">
            Free to use. No student accounts needed. Start in under a minute.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-emerald-600 hover:bg-emerald-50 transition"
          >
            Get started free →
          </Link>
        </div>
      </section>

      {/* Related */}
      {content.related.length > 0 && (
        <RelatedCards
          slugs={content.related}
          type="activity"
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
                  className="rounded-full border border-gray-200 px-4 py-1.5 text-sm text-gray-700 hover:border-emerald-400 hover:text-emerald-600 transition"
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
