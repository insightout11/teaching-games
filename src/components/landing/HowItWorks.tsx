interface HowItWorksProps {
  steps: string[];
}

export function HowItWorks({ steps }: HowItWorksProps) {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-2xl font-bold text-lc-text">How it works</h2>
        <ol className="mt-6 space-y-4">
          {steps.map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-4 rounded-xl border border-lc-border bg-lc-card p-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lc-blue text-sm font-bold text-[#070B14]">
                {i + 1}
              </span>
              <p className="pt-0.5 text-sm leading-relaxed text-lc-text2">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
