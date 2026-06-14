import { notFound } from 'next/navigation';
import { ArrivalSceneGallery } from '@/components/world-flight/arrival-scene/gallery/arrival-scene-gallery';

// Dev-only preview of the composable arrival-scene library. Returns 404 in any
// non-development environment so it never ships as a public route.
// `force-dynamic` (not force-static) so the page survives hot-reload during
// live editing — a static dev route orphans its JS chunks on every save.
export const dynamic = 'force-dynamic';

export default function ArrivalGalleryPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }
  return <ArrivalSceneGallery />;
}
