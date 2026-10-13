import { notFound } from 'next/navigation';
import { HomeHero } from '@/components/homepage/HomeHero';
import { HomeFlightRoute } from '@/components/homepage/HomeFlightRoute';
import { MarketingSkyDescent } from '@/components/homepage/MarketingSkyDescent';
import { TopicSection } from '@/components/homepage/TopicSection';
import { WorldFlightSection } from '@/components/homepage/WorldFlightSection';
import { ChangeCourseSection, ClosingSection, FlightsSection, PhonesSection, QuestionsSection, TeacherSection } from '@/components/homepage/LowerSections';
import { PricingSection } from '@/components/homepage/PricingSection';

// Dev-only: the public home page's sections without the signed-in redirect (local mock mode is always signed in).
export default function HomePreview() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <div className="theme-Midnight relative min-h-screen bg-lc-bg">
      <MarketingSkyDescent />
      <HomeFlightRoute />
      <div className="relative z-10"><HomeHero /><TopicSection /><WorldFlightSection /><ChangeCourseSection /><PhonesSection /><FlightsSection /><TeacherSection /><PricingSection /><QuestionsSection /><ClosingSection /></div>
    </div>
  );
}
