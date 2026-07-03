import { CheckCircle2 } from 'lucide-react';

interface OutcomeStripProps {
  outcomes: string[];
}

export function OutcomeStrip({ outcomes }: OutcomeStripProps) {
  const displayed = outcomes.slice(0, 3);
  return (
    <section className="border-y border-lc-border bg-lc-surface py-10">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {displayed.map((outcome, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-lc-border bg-lc-card p-4"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lc-success" aria-hidden />
              <p className="text-sm leading-relaxed text-lc-text">{outcome}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
