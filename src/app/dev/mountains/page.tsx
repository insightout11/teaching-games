'use client';

import dynamicImport from 'next/dynamic';

const MountainGallery = dynamicImport(() => import('@/components/live-room/flight/mountain-gallery').then((m) => m.MountainGallery), { ssr: false });

// Dev-only: the cockpit's mountains by day, dusk and night in three kinds of range (?style=old shows the old peaks).
export default function MountainsPage() {
  if (process.env.NODE_ENV === 'production') return null;
  return <MountainGallery />;
}
