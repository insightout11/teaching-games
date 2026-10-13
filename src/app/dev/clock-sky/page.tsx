import { notFound } from 'next/navigation';
import { ClockSky } from '@/components/ui/clock-sky';

// Dev-only: the signed-in sky at each time of day, behind a sample of the departures board's type and colours.
// Open with ?sky=morning | day | sunset | night.
export default function ClockSkyDevPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <div className="theme-Midnight relative min-h-screen bg-lc-bg text-lc-text">
      <ClockSky />
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-16">
        <p className="font-instrument text-xs font-semibold uppercase tracking-[0.22em] text-lc-blue">Good evening, Captain</p>
        <h1 className="font-game mt-2 text-5xl">Ready for <span className="text-lc-amber">departure.</span></h1>
        <div className="mt-8 rounded-2xl border border-lc-border bg-[#070B14]/85 p-5">
          <p className="font-instrument text-sm uppercase tracking-[0.3em] text-lc-amber">Departures</p>
          {['The Explorers', 'Best Class', 'Thursday Class'].map((name) => (
            <div key={name} className="mt-3 flex items-center justify-between border-t border-lc-border pt-3">
              <span className="font-instrument uppercase tracking-wider">{name}</span>
              <span className="text-xs text-lc-text3">last: Oct 9 · Teamwork</span>
              <span className="rounded-lg bg-lc-blue px-3 py-1.5 text-sm font-semibold text-[#070B14]">Board</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-lc-text3">Small grey text directly on the sky, to check it stays readable.</p>
      </div>
    </div>
  );
}
