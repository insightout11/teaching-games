'use client';

import dynamicImport from 'next/dynamic';

const TakeoffGallery = dynamicImport(() => import('@/components/live-room/flight/takeoff-gallery').then((m) => m.TakeoffGallery), { ssr: false });

// Dev-only: the real take-off (climb through the clouds, a landmark by the departure city).
export default function TakeoffPage() {
  if (process.env.NODE_ENV === 'production') return null;
  return <TakeoffGallery />;
}
