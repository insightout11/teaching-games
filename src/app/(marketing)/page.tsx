import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { HomeHero } from '@/components/homepage/HomeHero';
import { HomeFlightRoute } from '@/components/homepage/HomeFlightRoute';
import { TopicSection } from '@/components/homepage/TopicSection';
import { WorldFlightSection } from '@/components/homepage/WorldFlightSection';
import { ChangeCourseSection, ClosingSection, FlightsSection, PhonesSection, QuestionsSection, TeacherSection } from '@/components/homepage/LowerSections';
import { PricingSection } from '@/components/homepage/PricingSection';

export const metadata: Metadata = {
  title: 'LessonCaptain: every lesson is a flight',
  description:
    'A live English lesson on one shared screen. Your class talks, plays and votes, then lands in a new city. Share on any video call or project in class; students join free from any phone.',
};

export default async function HomePage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/home');
  }

  // Oct 2026 home page (docs/landing-page-brief.md): the room first, then a topic the visitor operates, then World
  // Flight. The earlier sections (HeroSection, HowItWorks, TwoScreens, LiveRoom, ProductDetailStrip, SourceBased,
  // Trust, TestFlight) are no longer mounted here.
  return (
    <>
      <HomeFlightRoute />
      <HomeHero />
      <TopicSection />
      <WorldFlightSection />
      <ChangeCourseSection />
      <PhonesSection />
      <FlightsSection />
      <TeacherSection />
      <PricingSection />
      <QuestionsSection />
      <ClosingSection />
    </>
  );
}
