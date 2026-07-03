import { getFeaturedRoute, getFeaturedPreset } from '@/lib/discovery-shelves';
import { MarketingRouteStrip } from '@/components/homepage/MarketingRouteStrip';

/** Read-only product-visual band for SEO hub + detail pages — the same Captain's Flight
 * route shown on /showcase, reused so these front-door pages show real product, not
 * generic icon grids. Always derives stages from getFeaturedRoute(); never hardcoded. */
export function ProductVisualHero() {
  const route = getFeaturedRoute();
  const preset = getFeaturedPreset();
  if (route.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-[#0b1c38]/85 to-[#060f1f]/90 p-6 sm:p-8">
      <span className="font-instrument inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-cyan-300/90">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
        Inside a LessonCaptain lesson
      </span>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-lc-text2">
        {preset?.description ??
          'Every LessonCaptain lesson runs stage by stage, warm-up to wrap-up — this is what a full class looks like.'}
      </p>
      <div className="mt-6">
        <MarketingRouteStrip route={route} />
      </div>
    </div>
  );
}
