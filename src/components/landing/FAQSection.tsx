import type { FAQItem } from '@/lib/content-landing';

interface FAQSectionProps {
  items: FAQItem[];
}

export function FAQSection({ items }: FAQSectionProps) {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-2xl font-bold text-lc-text">Frequently asked questions</h2>
        <dl className="mt-6 divide-y divide-lc-border rounded-2xl border border-lc-border bg-lc-card px-6">
          {items.map((item, i) => (
            <div key={i} className="py-6">
              <dt className="font-semibold text-lc-text">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-lc-text2">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
