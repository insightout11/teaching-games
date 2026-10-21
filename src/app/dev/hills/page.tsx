'use client';

import dynamicImport from 'next/dynamic';

const HillsGallery = dynamicImport(() => import('@/components/live-room/flight/hills-gallery').then((m) => m.HillsGallery), { ssr: false });

// Dev-only: hills in the colour of their ground, by day and night.
export default function HillsPage() {
  if (process.env.NODE_ENV === 'production') return null;
  return <HillsGallery />;
}
