import { CheckCircle } from 'lucide-react';

interface OutcomeStripProps {
  outcomes: string[];
}

export function OutcomeStrip({ outcomes }: OutcomeStripProps) {
  const displayed = outcomes.slice(0, 3);
  return (
    <section className="border-y border-gray-100 bg-gray-50 py-8">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {displayed.map((outcome, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <p className="text-sm text-gray-700">{outcome}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
