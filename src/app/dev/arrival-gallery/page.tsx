import { notFound } from 'next/navigation';
import { ArrivalSceneGallery } from '@/components/world-flight/arrival-scene/gallery/arrival-scene-gallery';

// Dev-only preview of the composable arrival-scene library. Returns 404 in any
// non-development environment so it never ships as a public route — UNLESS the
// NEXT_PUBLIC_DEV_ROUTES=1 escape hatch is set (used to review the gallery on a
// deploy, then removed to re-lock). `force-dynamic` (not force-static) so the
// page survives hot-reload during live editing — a static dev route orphans its
// JS chunks on every save.
export const dynamic = 'force-dynamic';

export default function ArrivalGalleryPage() {
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_DEV_ROUTES !== '1') {
    notFound();
  }
  return <ArrivalSceneGallery />;
}
