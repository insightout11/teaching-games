import { notFound } from 'next/navigation';
import { WorldFlightHero } from '@/components/discovery/world-flight-hero/world-flight-hero';

// Dev-only preview of the World Flight home hero ("Globe + the Window"), at desktop and
// mobile widths (the hero switches layout on measured container width). 404 in prod.
export const dynamic = 'force-static';

export default function WorldFlightHeroDevPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }
  return (
    <div className="min-h-screen space-y-10 bg-[#060b16] p-6 md:p-10">
      <div className="mx-auto max-w-[1500px]">
        <p className="font-instrument mb-4 text-[11px] uppercase tracking-[0.26em] text-cyan-300/70">
          Desktop
        </p>
        <WorldFlightHero />
      </div>

      <div>
        <p className="font-instrument mb-4 text-[11px] uppercase tracking-[0.26em] text-amber-300/70">
          Mobile · option C (globe + postcard up top, copy below) · ~390px
        </p>
        <div className="mx-auto w-[390px] max-w-full">
          <WorldFlightHero />
        </div>
      </div>
    </div>
  );
}
