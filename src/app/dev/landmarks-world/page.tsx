'use client';

import dynamicImport from 'next/dynamic';

const LandmarkWorldGallery = dynamicImport(() => import('@/components/live-room/flight/landmark-world-gallery').then((m) => m.LandmarkWorldGallery), { ssr: false });

// Dev-only: landmarks standing in the passing scenery, by day, dusk and night (?one=fuji&tod=dusk flies past one).
export default function LandmarksWorldPage() {
  if (process.env.NODE_ENV === 'production') return null;
  return <LandmarkWorldGallery />;
}
