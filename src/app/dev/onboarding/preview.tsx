'use client';

import { StudentOnboarding } from '@/components/student/student-onboarding';

/** Phone-width preview; tap "How it works" to open the cards (they also open by themselves on a first visit). */
export function OnboardingPreview() {
  return (
    <main className="min-h-screen bg-[#0b1220] p-4">
      <div className="mx-auto max-w-[390px]">
        <StudentOnboarding name="Mai" seed="Mai" hasShelf mascot={{ name: 'Captain Crumbs', look: { body: 'robot', color: '#a78bfa', eyes: 'sleepy', head: 'horns', extra: 'jetpack' } }} />
      </div>
    </main>
  );
}
