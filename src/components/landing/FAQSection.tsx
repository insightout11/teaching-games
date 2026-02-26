import type { FAQItem } from '@/lib/content-landing';

interface FAQSectionProps {
  items: FAQItem[];
}

export function FAQSection({ items }: FAQSectionProps) {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-2xl font-bold text-gray-900">Frequently asked questions</h2>
        <dl className="mt-6 space-y-6 divide-y divide-gray-100">
          {items.map((item, i) => (
            <div key={i} className="pt-6 first:pt-0">
              <dt className="font-semibold text-gray-900">{item.q}</dt>
              <dd className="mt-2 text-gray-600">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
