import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { LandingContent, FAQItem } from '@/lib/content-landing';
import type { ActivityPlugin } from '@/activities/types';
import type { GamePlugin } from '@/games/types';
import { OutcomeStrip } from './OutcomeStrip';
import { HowItWorks } from './HowItWorks';
import { FAQSection } from './FAQSection';
import { RelatedCards } from './RelatedCards';
import { ProductVisualHero } from './ProductVisualHero';
import { EmailCaptureCard } from '@/components/marketing/EmailCaptureCard';

interface ActivityDetailLayoutProps {
  content: LandingContent;
  plugin: ActivityPlugin;
  relatedContent: Record<string, LandingContent>;
  relatedPlugins: Record<string, ActivityPlugin>;
  crossTypeRelatedContent?: Record<string, LandingContent>;
  crossTypeRelatedPlugins?: Record<string, GamePlugin>;
}

export function ActivityDetailLayout({
  content,
  plugin,
  relatedContent,
  relatedPlugins,
  crossTypeRelatedContent,
  crossTypeRelatedPlugins,
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
      : plugin.category === 'debate'
      ? 'Debate'
      : 'Closing';

  const categorySlug =
    plugin.category === 'icebreaker'
      ? 'icebreakers'
      : plugin.category === 'closing'
      ? 'closing'
      : plugin.category;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-6">
          <nav className="mb-4 text-sm text-lc-text3">
            <Link href="/classroom-activities" className="hover:underline">
              Classroom Activities
            </Link>{' '}
            /{' '}
            <Link href={`/classroom-activities/${categorySlug}`} className="hover:underline">
              {categoryLabel}
            </Link>{' '}
            / <span className="text-lc-text">{plugin.name}</span>
          </nav>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {plugin.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300"
              >
                {skill}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-bold text-lc-text sm:text-4xl">{content.headline}</h1>

          {content.problemStatement && (
            <p className="mt-4 max-w-3xl text-lg text-lc-text2">{content.problemStatement}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-lc-text3">
            {content.estimatedTime && <span>{content.estimatedTime}</span>}
            {content.groupSize && <span>{content.groupSize}</span>}
            <span>Works on any device</span>
          </div>

          <div className="mt-8">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-[#03150f] transition-colors hover:bg-emerald-400"
            >
              Run this activity free
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="mt-12">
            <ProductVisualHero />
          </div>
        </div>
      </section>

      {/* Outcome strip */}
      <OutcomeStrip outcomes={content.outcomes} />

      {/* How it works */}
      <HowItWorks steps={content.howItWorks} />

      {/* FAQ */}
      <FAQSection items={content.faq} />

      {/* Email capture */}
      <section className="py-12">
        <div className="mx-auto max-w-2xl px-6">
          <EmailCaptureCard source="seo-activities" />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#0b1c38] to-[#060f1f] py-12 text-center">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-bold text-lc-text">Ready to try {plugin.name}?</h2>
          <p className="mt-2 text-lc-text2">
            Free teacher account — sign in with Google. No student accounts or setup required.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-[#03150f] transition-colors hover:bg-emerald-400"
          >
            Get started free
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
          crossTypeContentMap={crossTypeRelatedContent}
          crossTypePluginMap={crossTypeRelatedPlugins}
        />
      )}

      {/* Related Worksheets */}
      {content.relatedWorksheets && content.relatedWorksheets.length > 0 && (
        <section className="py-8">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-lg font-semibold text-lc-text">Related worksheets</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {content.relatedWorksheets.map((path) => (
                <Link
                  key={path}
                  href={`/worksheets/${path}`}
                  className="rounded-full border border-lc-border px-4 py-1.5 text-sm text-lc-text2 transition-colors hover:border-emerald-400/50 hover:text-emerald-300"
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
