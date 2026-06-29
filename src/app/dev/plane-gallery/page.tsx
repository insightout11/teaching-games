import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { AirfieldScene } from '@/components/ui/airfield-scene';
import { ClassPlaneSprite } from '@/components/ui/class-plane-sprite';
import { HangarScene } from '@/components/ui/hangar-scene';
import { RunwayPlaneScene } from '@/components/ui/runway-plane-scene';
import { getPlaneAsset, PLANE_TIERS } from '@/lib/plane-progression';

export const dynamic = 'force-dynamic';

export default function PlaneGalleryPage({ searchParams }: { searchParams?: { plane?: string } }) {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  const plane = getPlaneAsset(searchParams?.plane);
  const planeKey = plane.key;

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/70">Development QA</p>
        <h1 className="mt-2 text-3xl font-bold">{plane.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
          Runtime-scale verification for every authored aircraft view. Use this page to check the hangar, runway,
          front-facing, and full airfield layouts before shipping a plane asset.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
          <a className="rounded border border-cyan-300/30 px-3 py-2 text-cyan-100 hover:bg-cyan-300/10" href={`/dev/lobby?city=recife&tod=night&weather=rain&plane=${planeKey}`}>
            Lobby: Recife rain
          </a>
          <a className="rounded border border-cyan-300/30 px-3 py-2 text-cyan-100 hover:bg-cyan-300/10" href={`/dev/arrival-scene?city=toronto&phase=touchdown&progress=0.72&motion=static&tod=dusk&plane=${planeKey}`}>
            Arrival: Toronto touchdown
          </a>
        </div>

        <section className="mt-6 rounded-xl border border-white/10 bg-white/[0.035] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-100/80">Plane Picker</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-5">
            {PLANE_TIERS.map((tier) => (
              <div key={tier.tier} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/60">
                  Tier {tier.tier} · {tier.rangeKm.toLocaleString()} km
                </p>
                <p className="mt-1 text-sm font-semibold text-white">{tier.label}</p>
                <div className="mt-3 flex flex-col gap-2">
                  {tier.choices.map((choice) => (
                    <a
                      key={choice.key}
                      href={`/dev/plane-gallery?plane=${choice.key}`}
                      className={`rounded border px-3 py-2 text-xs font-semibold transition ${
                        choice.key === planeKey
                          ? 'border-cyan-300 bg-cyan-300/15 text-cyan-50'
                          : 'border-white/10 text-slate-300 hover:border-cyan-300/40 hover:text-cyan-100'
                      }`}
                    >
                      {choice.name}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <PreviewCard title="Side profile - parked">
            <div className="flex min-h-64 items-end justify-center border-b-2 border-dashed border-white/25 pb-2">
              <ClassPlaneSprite planeKey={planeKey} size="xl" variant="parked" />
            </div>
          </PreviewCard>

          <PreviewCard title="Front three-quarter - runway">
            <div className="flex min-h-64 items-end justify-center">
              <RunwayPlaneScene planeKey={planeKey} planeSize="xl" frontFacing frontVariant="3q" />
            </div>
          </PreviewCard>

          <PreviewCard title="True front - runway">
            <div className="flex min-h-64 items-end justify-center">
              <RunwayPlaneScene planeKey={planeKey} planeSize="xl" frontFacing frontVariant="headon" />
            </div>
          </PreviewCard>

          <PreviewCard title="Side profile - hangar">
            <div className="flex min-h-64 items-end justify-center overflow-hidden">
              <HangarScene planeKey={planeKey} />
            </div>
          </PreviewCard>
        </section>

        <section className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-[#030813]">
          <div className="border-b border-white/10 px-5 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-100/80">Front three-quarter - airfield</h2>
          </div>
          <div className="relative h-[520px]">
            <AirfieldScene planeKey={planeKey} className="absolute inset-0" />
          </div>
        </section>
      </div>
    </main>
  );
}

function PreviewCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.035]">
      <h2 className="border-b border-white/10 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-cyan-100/80">
        {title}
      </h2>
      <div className="p-5">{children}</div>
    </article>
  );
}
