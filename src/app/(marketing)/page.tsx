import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { HeroSection } from '@/components/homepage/HeroSection';
import { HowItWorksSection } from '@/components/homepage/HowItWorksSection';
import { CoreValueSection } from '@/components/homepage/CoreValueSection';
import { PresetsSection } from '@/components/homepage/PresetsSection';
import { ProductDetailStrip } from '@/components/homepage/ProductDetailStrip';
import { SourceBasedSection } from '@/components/homepage/SourceBasedSection';
import { TestFlightSection } from '@/components/homepage/TestFlightSection';
import { TrustSection } from '@/components/homepage/TrustSection';

export const metadata: Metadata = {
  title: 'LessonCaptain — Run ESL Lessons Alongside Zoom',
  description:
    'Plan a structured lesson, screen-share the teacher view, and let students join from any browser. Games, activities, and live participation for online ESL teachers.',
};

export default async function HomePage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/home');
  }

  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <CoreValueSection />
      <PresetsSection />
      <ProductDetailStrip />
      <SourceBasedSection />
      <TestFlightSection />
      <TrustSection />
    </>
  );
}
