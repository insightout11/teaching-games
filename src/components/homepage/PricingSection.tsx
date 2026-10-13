import Link from 'next/link';

// Pricing as two paper boarding passes (owner-approved mockup, Oct 2026): cream paper on the night page, a real
// tear-off stub with a perforation and die-cut notches, large readable type. Free is a plan, not a campaign.

const FARES = [
  {
    id: 'free',
    label: 'Test Flight · free, for good',
    price: '$0',
    per: '',
    alt: '',
    items: ['4 full lessons every month', 'The live room and all 40+ games and activities', 'World Flight for all your classes'],
    cta: 'Start a Test Flight',
    href: '/login',
    pro: false,
  },
  {
    id: 'pro',
    label: 'Pro · for weekly teaching',
    price: '$9',
    per: ' a month',
    alt: 'or $79 a year',
    items: ['Unlimited lessons', 'Courses and your own books', 'Class notes and reports'],
    cta: 'Go Pro',
    href: '/pro',
    pro: true,
  },
];

function Notch({ className }: { className: string }) {
  return <span aria-hidden className={`absolute h-[22px] w-[22px] rounded-full bg-[#070B14] ${className}`} />;
}

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-20 border-t border-lc-border px-5 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="font-instrument text-[13px] font-semibold uppercase tracking-[0.14em] text-lc-amber">Pricing</p>
        <h2 className="font-game mt-3 text-3xl leading-tight text-lc-text sm:text-[2.75rem]">Students never pay. Start free.</h2>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {FARES.map((f) => (
            <div key={f.id} className="grid overflow-hidden rounded-2xl bg-[#f4efe3] text-[#1b2233] shadow-[0_24px_60px_rgba(0,0,0,.45)] sm:grid-cols-[minmax(0,1fr)_190px]">
              <div className="flex min-w-0 flex-col gap-2 p-6">
                <p className="font-instrument text-[13px] font-semibold uppercase tracking-[0.12em] text-[#4b566b]">{f.label}</p>
                <p className="font-game text-[3.25rem] leading-none">
                  {f.price}
                  {f.per && <span className="text-xl">{f.per}</span>}
                </p>
                {f.alt && <p className="text-[17px] text-[#4b566b]">{f.alt}</p>}
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[17px]">
                  {f.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              {/* The tear-off stub: perforation, die-cut notches, barcode, and the one thing to do. */}
              <div className="relative flex items-center justify-center gap-4 border-t-[3px] border-dashed border-[#1b2233]/30 px-4 py-5 sm:flex-col sm:border-l-[3px] sm:border-t-0">
                <Notch className="-left-[11px] -top-[12px] sm:-left-[12px] sm:-top-[11px]" />
                <Notch className="-right-[11px] -top-[12px] sm:-bottom-[11px] sm:-left-[12px] sm:right-auto sm:top-auto" />
                <div aria-hidden className="hidden h-10 w-[84px] sm:block" style={{ background: 'repeating-linear-gradient(90deg,#1b2233 0 3px,transparent 3px 5px,#1b2233 5px 6px,transparent 6px 10px)' }} />
                <Link
                  href={f.href}
                  className={`inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl px-3 text-center text-base font-semibold leading-tight transition hover:brightness-105 ${f.pro ? 'bg-gradient-to-r from-amber-300 to-orange-400 text-[#1a1204]' : 'bg-[#1b2233] text-[#f4efe3]'}`}
                >
                  {f.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[15px] text-lc-text2">No card needed to start.</p>
      </div>
    </section>
  );
}
