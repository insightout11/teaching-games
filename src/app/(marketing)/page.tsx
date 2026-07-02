import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { HeroSection } from '@/components/homepage/HeroSection';
import { HowItWorksSection } from '@/components/homepage/HowItWorksSection';
import { TwoScreensSection } from '@/components/homepage/TwoScreensSection';
import { WorldFlightSection } from '@/components/homepage/WorldFlightSection';
import { ProductDetailStrip } from '@/components/homepage/ProductDetailStrip';
import { SourceBasedSection } from '@/components/homepage/SourceBasedSection';
import { TestFlightSection } from '@/components/homepage/TestFlightSection';
import { TrustSection } from '@/components/homepage/TrustSection';
import { PricingSection } from '@/components/homepage/PricingSection';
import { EmailCaptureCard } from '@/components/marketing/EmailCaptureCard';

export const metadata: Metadata = {
  title: 'LessonCaptain — Live ESL Lessons While You Screen Share',
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
      <TwoScreensSection />
      <WorldFlightSection />
      <ProductDetailStrip />
      <SourceBasedSection />
      <TrustSection />
      <PricingSection />
      <TestFlightSection />
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-xl">
          <EmailCaptureCard source="homepage" />
        </div>
      </section>
    </>
  );
}
