import { MarketingNav } from '@/components/homepage/MarketingNav';
import { MarketingFooter } from '@/components/homepage/MarketingFooter';
import { SkyBackground } from '@/components/ui/sky-background';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-lc-bg text-lc-text flex flex-col">
      <SkyBackground weatherState="climbing" intensity="moderate" />
      <div className="relative z-10 flex flex-col flex-1">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(7,11,20,0.55) 0%, rgba(7,11,20,0.35) 40%, rgba(7,11,20,0.15) 100%)' }}
        />
        <MarketingNav />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
    </div>
  );
}
