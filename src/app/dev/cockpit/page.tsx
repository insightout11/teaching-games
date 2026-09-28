'use client';

import { notFound, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CockpitFixture } from '@/components/live-room/fixtures/cockpit-workspace';

// Dev-only: the agreed Live Room cockpit design (CC-08A) on synthetic data.
//   /dev/cockpit?story=<key>
function Story() {
  const story = useSearchParams().get('story') ?? undefined;
  return <CockpitFixture storyKey={story} />;
}

export default function CockpitDevPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return (
    <Suspense fallback={null}>
      <Story />
    </Suspense>
  );
}
