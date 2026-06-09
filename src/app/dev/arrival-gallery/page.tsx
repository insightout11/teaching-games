import { notFound } from 'next/navigation';
import { ArrivalSceneGallery } from '@/components/world-flight/arrival-scene/gallery/arrival-scene-gallery';

// Dev-only preview of the composable arrival-scene library. Returns 404 in any
// non-development environment so it never ships as a public route.
export const dynamic = 'force-static';

export default function ArrivalGalleryPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }
  return <ArrivalSceneGallery />;
}
