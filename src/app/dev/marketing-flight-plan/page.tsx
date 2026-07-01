import { notFound } from 'next/navigation';
import { MarketingFlightPlan } from '@/components/homepage/marketing-flight-plan';
import { CAPTAINS_FLIGHT_STEPS } from '@/lib/marketing/captains-flight-steps';

// Dev-only review gallery for the marketing flight plan (the isolated copy). Renders
// the same panel the homepage hero uses, at a few widths + plane positions, so the
// card-overlap fix and plane behaviour can be judged without deploying. 404 in prod.
export const dynamic = 'force-static';

const LAST = CAPTAINS_FLIGHT_STEPS.length - 1;

function Panel({
  label,
  activeIndex,
  width,
}: {
  label: string;
  activeIndex: number;
  width: string;
}) {
  return (
    <div>
      <p className="font-instrument mb-2 text-[11px] uppercase tracking-[0.22em] text-cyan-300/70">{label}</p>
      <div className={`${width} overflow-hidden rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-[#0b1c38]/80 to-[#060f1f]/85 px-4 py-5 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)] sm:px-7 sm:py-6`}>
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-lc-blue" />
            <span className="text-sm font-semibold text-lc-text">Captain&apos;s Flight</span>
          </div>
          <span className="font-instrument text-[11px] uppercase tracking-[0.2em] text-lc-text3">≈ 60 min · whole class</span>
        </div>
        <p className="mb-4 text-sm text-lc-text2">
          A complete lesson, start to finish — warm-up to wrap-up, sequenced for you and run live.
        </p>
        <MarketingFlightPlan
          steps={CAPTAINS_FLIGHT_STEPS}
          height={300}
          mode="runtime"
          activeIndex={activeIndex}
          forceEmphasis
          growOnNarrow
        />
      </div>
    </div>
  );
}

export default function MarketingFlightPlanGalleryPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }
  return (
    <div className="min-h-screen space-y-10 bg-[#060b16] p-6 md:p-10">
      <div>
        <h1 className="text-lg font-bold text-lc-text">Marketing flight plan — review gallery</h1>
        <p className="mt-1 text-sm text-lc-text3">
          Stage cards now spread EVENLY across the width (pips between them) so each has room —
          no truncation / mid-word breaks. Below ~1000px it switches to the arc + legend.
        </p>
      </div>

      <div className="space-y-10">
        <p className="font-instrument text-[11px] uppercase tracking-[0.22em] text-emerald-300/70">
          Wide → cards (evenly spread)
        </p>
        <div className="mx-auto max-w-[1400px]">
          <Panel label="Full screen · ~1400px" activeIndex={LAST} width="w-full" />
        </div>
        <div className="mx-auto max-w-[1120px] space-y-10">
          <Panel label="Laptop · ~1120px · landed" activeIndex={LAST} width="w-full" />
          <Panel label="Laptop · ~1120px · parked at takeoff" activeIndex={0} width="w-full" />
        </div>
      </div>

      <div className="space-y-8">
        <p className="font-instrument text-[11px] uppercase tracking-[0.22em] text-amber-300/70">
          Narrow → legend (arc + stage names below)
        </p>
        <div className="mx-auto max-w-[900px]">
          <Panel label="Small laptop / tablet · ~900px" activeIndex={LAST} width="w-full" />
        </div>
        <div className="mx-auto max-w-[380px]">
          <Panel label="Mobile · ~380px" activeIndex={LAST} width="w-full" />
        </div>
      </div>
    </div>
  );
}
