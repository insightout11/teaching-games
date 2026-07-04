export interface SeoFaq {
  q: string;
  a: string;
}

export function buildSeoHubJsonLd({
  name,
  description,
  url,
  faqs,
}: {
  name: string;
  description: string | null | undefined;
  url: string;
  faqs: SeoFaq[];
}) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name,
        description,
        url,
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
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
}

export function SeoFaqSection({ faqs }: { faqs: SeoFaq[] }) {
  return (
    <section className="border-y border-lc-border bg-lc-surface/70 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
          Common questions
        </p>
        <h2 className="mt-3 text-3xl font-bold text-lc-text">FAQ</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-xl border border-lc-border bg-lc-card p-5">
              <h3 className="font-semibold text-lc-text">{faq.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-lc-text3">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
