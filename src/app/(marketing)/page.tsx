import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { HeroSection } from '@/components/homepage/HeroSection';
import { HowItWorksSection } from '@/components/homepage/HowItWorksSection';
import { CoreValueSection } from '@/components/homepage/CoreValueSection';
import { PresetsSection } from '@/components/homepage/PresetsSection';
import { ProductDetailStrip } from '@/components/homepage/ProductDetailStrip';
import { TestFlightSection } from '@/components/homepage/TestFlightSection';
import { TrustSection } from '@/components/homepage/TrustSection';

export const metadata: Metadata = {
  title: 'LessonCaptain — Live Classroom Games for ESL Teachers',
  description:
    'Build structured lessons in minutes and run them live with games, activities, and real-time student engagement. Made for online ESL teachers.',
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
      <TestFlightSection />
      <TrustSection />
    </>
  );
}
