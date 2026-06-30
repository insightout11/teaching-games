import { notFound } from 'next/navigation';
import { WorldFlightHero } from '@/components/discovery/world-flight-hero/world-flight-hero';

// Dev-only preview of the World Flight home hero ("Globe + the Window"):
//   /dev/world-flight-hero
// 404 in any non-development environment.
export const dynamic = 'force-static';

export default function WorldFlightHeroDevPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }
  return (
    <div className="min-h-screen bg-[#060b16] p-6 md:p-10">
      <div className="mx-auto max-w-[1500px]">
        <p className="font-instrument mb-4 text-[11px] uppercase tracking-[0.26em] text-cyan-300/70">
          Dev preview · World Flight hero
        </p>
        <WorldFlightHero />
      </div>
    </div>
  );
}
