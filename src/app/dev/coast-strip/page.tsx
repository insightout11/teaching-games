'use client';

import dynamicImport from 'next/dynamic';

const CoastStripGallery = dynamicImport(() => import('@/components/live-room/flight/coast-strip-gallery').then((m) => m.CoastStripGallery), { ssr: false });

// Dev-only: the whole-route coast strip, flown along a real route.
export default function CoastStripPage() {
  if (process.env.NODE_ENV === 'production') return null;
  return <CoastStripGallery />;
}
