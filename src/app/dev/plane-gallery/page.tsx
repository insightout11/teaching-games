import { notFound } from 'next/navigation';
import { AirfieldScene } from '@/components/ui/airfield-scene';
import { ClassPlaneSprite } from '@/components/ui/class-plane-sprite';
import { HangarScene } from '@/components/ui/hangar-scene';
import { RunwayPlaneScene } from '@/components/ui/runway-plane-scene';
import { getPlaneAsset } from '@/lib/plane-progression';

export const dynamic = 'force-dynamic';

const PLANE_KEY = 'starter-biplane';

export default function PlaneGalleryPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  const plane = getPlaneAsset(PLANE_KEY);

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/70">Development QA</p>
        <h1 className="mt-2 text-3xl font-bold">{plane.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
          Runtime-scale verification for every authored aircraft view. The persisted starter key intentionally resolves
          to the Wayfarer assets.
        </p>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <PreviewCard title="Side profile - parked">
            <div className="flex min-h-64 items-end justify-center border-b-2 border-dashed border-white/25 pb-2">
              <ClassPlaneSprite planeKey={PLANE_KEY} size="xl" variant="parked" />
            </div>
          </PreviewCard>

          <PreviewCard title="Front three-quarter - runway">
            <div className="flex min-h-64 items-end justify-center">
              <RunwayPlaneScene planeKey={PLANE_KEY} planeSize="xl" frontFacing frontVariant="3q" />
            </div>
          </PreviewCard>

          <PreviewCard title="True front - runway">
            <div className="flex min-h-64 items-end justify-center">
              <RunwayPlaneScene planeKey={PLANE_KEY} planeSize="xl" frontFacing frontVariant="headon" />
            </div>
          </PreviewCard>

          <PreviewCard title="Side profile - hangar">
            <div className="flex min-h-64 items-end justify-center overflow-hidden">
              <HangarScene planeKey={PLANE_KEY} />
            </div>
          </PreviewCard>
        </section>

        <section className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-[#030813]">
          <div className="border-b border-white/10 px-5 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-100/80">Front three-quarter - airfield</h2>
          </div>
          <div className="relative h-[520px]">
            <AirfieldScene planeKey={PLANE_KEY} className="absolute inset-0" />
          </div>
        </section>
      </div>
    </main>
  );
}

function PreviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.035]">
      <h2 className="border-b border-white/10 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-cyan-100/80">
        {title}
      </h2>
      <div className="p-5">{children}</div>
    </article>
  );
}
