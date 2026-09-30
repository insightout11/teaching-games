import { notFound } from 'next/navigation';
import { CrewGallery } from './gallery';

// Dev-only preview of the crew characters (404 outside development unless
// NEXT_PUBLIC_DEV_ROUTES=1).
export const dynamic = 'force-dynamic';

export default function CrewPage() {
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_DEV_ROUTES !== '1') {
    notFound();
  }
  return <CrewGallery />;
}
