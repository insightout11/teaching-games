import { notFound } from 'next/navigation';
import { HomeHero } from '@/components/homepage/HomeHero';
import { TopicSection } from '@/components/homepage/TopicSection';
import { WorldFlightSection } from '@/components/homepage/WorldFlightSection';
import { ChangeCourseSection, ClosingSection, FlightsSection, PhonesSection, QuestionsSection, TeacherSection } from '@/components/homepage/LowerSections';
import { PricingSection } from '@/components/homepage/PricingSection';

// Dev-only: the public home page's sections without the signed-in redirect (local mock mode is always signed in).
export default function HomePreview() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <div className="theme-Midnight min-h-screen bg-lc-bg">
      <HomeHero /><TopicSection /><WorldFlightSection /><ChangeCourseSection /><PhonesSection /><FlightsSection /><TeacherSection /><PricingSection /><QuestionsSection /><ClosingSection />
    </div>
  );
}
