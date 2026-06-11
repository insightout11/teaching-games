import { MarketingNav } from '@/components/homepage/MarketingNav';
import { MarketingFooter } from '@/components/homepage/MarketingFooter';
import { MarketingSkyDescent } from '@/components/homepage/MarketingSkyDescent';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-lc-bg text-lc-text flex flex-col">
      {/* Full-bleed flight descent: high cruise at the top, airport landing at the bottom.
          Renders the sky, the apron glow, and the legibility veil (all fixed, below z-10). */}
      <MarketingSkyDescent />
      <div className="relative z-10 flex flex-col flex-1">
        <MarketingNav />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
    </div>
  );
}
