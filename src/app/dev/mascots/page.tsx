import { notFound } from 'next/navigation';
import { MascotGallery } from './gallery';

// Dev-only preview of the class mascot parts (404 outside development unless NEXT_PUBLIC_DEV_ROUTES=1).
export const dynamic = 'force-dynamic';

export default function MascotsPage() {
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_DEV_ROUTES !== '1') notFound();
  return <MascotGallery />;
}
