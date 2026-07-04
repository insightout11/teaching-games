import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { ComparisonPageData } from '@/lib/marketing/comparison-pages';
import { ProductVisualHero } from '@/components/landing/ProductVisualHero';
import { SeoFaqSection } from '@/components/marketing/SeoFaqSection';

export function ComparisonPage({ page }: { page: ComparisonPageData }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: page.h1,
        description: page.description,
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-lc-blue">
                ESL software comparison
              </p>
              <h1 className="mt-3 text-4xl font-bold leading-tight text-lc-text sm:text-5xl">
                {page.h1}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-lc-text2">
                {page.heroCopy}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={page.slug === 'ai-esl-lesson-plan-generator' ? '/video-lesson' : '/login'}
                  className="inline-flex items-center gap-2 rounded-lg bg-lc-blue px-5 py-3 font-semibold text-[#070B14] transition-colors hover:bg-lc-blue-hover"
                >
                  {page.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/showcase"
                  className="inline-flex items-center rounded-lg border border-lc-border px-5 py-3 font-semibold text-lc-text2 transition-colors hover:border-cyan-300/50 hover:text-lc-text"
                >
                  Browse the product
                </Link>
              </div>
            </div>
            <ProductVisualHero />
          </div>
        </div>
      </section>

      <section className="border-y border-lc-border bg-lc-surface/70 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-lc-text">
            LessonCaptain vs {page.competitor}
          </h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-lc-border bg-lc-card">
            {page.rows.map((row) => (
              <div key={row.label} className="grid gap-0 border-b border-lc-border last:border-b-0 md:grid-cols-[0.75fr_1fr_1fr]">
                <div className="bg-lc-surface/60 p-4 font-semibold text-lc-text">{row.label}</div>
                <div className="p-4 text-sm leading-relaxed text-lc-text2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cyan-300">
                    LessonCaptain
                  </span>
                  {row.lessonCaptain}
                </div>
                <div className="border-t border-lc-border p-4 text-sm leading-relaxed text-lc-text3 md:border-l md:border-t-0">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-lc-text3">
                    {page.competitor}
                  </span>
                  {row.alternative}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="text-2xl font-bold text-lc-text">Best fit</h2>
            <ul className="mt-5 space-y-3">
              {page.bestFor.map((item) => (
                <li key={item} className="flex gap-3 text-lc-text2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lc-blue" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-lc-card p-6">
            <h2 className="text-xl font-bold text-lc-text">Verdict</h2>
            <p className="mt-3 leading-relaxed text-lc-text2">{page.verdict}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {page.related.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-lc-border px-3 py-1.5 text-sm text-lc-text2 transition-colors hover:border-cyan-300/50 hover:text-cyan-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-lc-border bg-lc-surface/70 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
            ESL use cases
          </p>
          <h2 className="mt-3 text-3xl font-bold text-lc-text">
            Where LessonCaptain fits in an English lesson
          </h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {page.useCases.map((useCase) => (
              <div key={useCase.title} className="rounded-xl border border-lc-border bg-lc-card p-6">
                <h3 className="text-xl font-bold text-lc-text">{useCase.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-lc-text3">{useCase.copy}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {useCase.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center gap-1.5 rounded-full border border-lc-border px-3 py-1.5 text-sm text-lc-text2 transition-colors hover:border-cyan-300/50 hover:text-cyan-300"
                    >
                      {link.label}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-cyan-300/20 bg-lc-card p-6">
            <h2 className="text-2xl font-bold text-lc-text">Choose LessonCaptain when...</h2>
            <ul className="mt-5 space-y-3">
              {page.decisionGuide.chooseLessonCaptain.map((item) => (
                <li key={item} className="flex gap-3 text-lc-text2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lc-blue" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-lc-border bg-lc-card p-6">
            <h2 className="text-2xl font-bold text-lc-text">
              {`Choose ${page.competitor} when...`}
            </h2>
            <ul className="mt-5 space-y-3">
              {page.decisionGuide.chooseAlternative.map((item) => (
                <li key={item} className="flex gap-3 text-lc-text2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lc-text3" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <SeoFaqSection faqs={page.faqs} />
    </>
  );
}
