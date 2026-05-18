import { MarketingNav } from '@/components/homepage/MarketingNav';
import { MarketingFooter } from '@/components/homepage/MarketingFooter';
import { SkyBackground } from '@/components/ui/sky-background';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-lc-bg text-lc-text flex flex-col">
      <SkyBackground weatherState="climbing" intensity="moderate" />
      {/* Veil sits above the sky (z-0) but below all page content (z-10).
          Fixed so it covers the full viewport without scrolling.
          This ensures the veil darkens the sky but never overlays text. */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: 5, background: 'linear-gradient(180deg, rgba(7,11,20,0.55) 0%, rgba(7,11,20,0.65) 40%, rgba(7,11,20,0.72) 100%)' }}
      />
      <div className="relative z-10 flex flex-col flex-1">
        <MarketingNav />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
    </div>
  );
}
