'use client';

import dynamicImport from 'next/dynamic';

const MapLooksGallery = dynamicImport(() => import('@/components/world-flight/map-looks-gallery').then((m) => m.MapLooksGallery), { ssr: false });

// Dev-only: the map's looks (Quiz, Explore, Journey globe) side by side.
export default function MapLooksPage() {
  if (process.env.NODE_ENV === 'production') return null;
  return <MapLooksGallery />;
}
