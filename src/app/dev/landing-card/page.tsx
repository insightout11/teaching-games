import { notFound } from 'next/navigation';
import { LandingCardMockup } from './mockup';

// Dev-only: the landing card as a vintage travel poster (mockup for Matt's approval; not used in classes).
export const dynamic = 'force-dynamic';

export default function LandingCardPage() {
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_DEV_ROUTES !== '1') notFound();
  return <LandingCardMockup />;
}
