'use client';

import dynamicImport from 'next/dynamic';

const QuizLookMockup = dynamicImport(() => import('@/components/session/quiz-look-mockup').then((m) => m.QuizLookMockup), { ssr: false });

// Dev-only: the flight-themed quiz look as a mockup for the owner.
export default function QuizLookPage() {
  if (process.env.NODE_ENV === 'production') return null;
  return <QuizLookMockup />;
}
