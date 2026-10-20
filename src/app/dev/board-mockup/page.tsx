'use client';

import dynamicImport from 'next/dynamic';

const BoardMockup = dynamicImport(() => import('@/components/session/board-mockup').then((m) => m.BoardMockup), { ssr: false });

// Dev-only: the Class Board redesign as a still mockup for the owner.
export default function BoardMockupPage() {
  if (process.env.NODE_ENV === 'production') return null;
  return <BoardMockup />;
}
