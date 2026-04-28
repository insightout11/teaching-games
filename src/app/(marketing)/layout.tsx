import { MarketingNav } from '@/components/homepage/MarketingNav';
import { MarketingFooter } from '@/components/homepage/MarketingFooter';
import { SkyBackground } from '@/components/ui/sky-background';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-lc-bg text-lc-text flex flex-col">
      <SkyBackground intensity="moderate" />
      <div className="relative z-10 flex flex-col flex-1">
        <MarketingNav />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
    </div>
  );
}
