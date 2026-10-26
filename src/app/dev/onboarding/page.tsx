import { notFound } from 'next/navigation';
import { OnboardingPreview } from './preview';

// Dev-only preview of the first-time student onboarding (404 outside development unless NEXT_PUBLIC_DEV_ROUTES=1).
export const dynamic = 'force-dynamic';

export default function OnboardingPage() {
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_DEV_ROUTES !== '1') notFound();
  return <OnboardingPreview />;
}
