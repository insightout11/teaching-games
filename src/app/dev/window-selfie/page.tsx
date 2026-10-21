'use client';

import dynamicImport from 'next/dynamic';

const WindowSelfieGallery = dynamicImport(() => import('@/components/live-room/flight/window-selfie-gallery').then((m) => m.WindowSelfieGallery), { ssr: false });

// Dev-only: the window selfie design for phones (side view from the passenger seat).
export default function WindowSelfiePage() {
  if (process.env.NODE_ENV === 'production') return null;
  return <WindowSelfieGallery />;
}
