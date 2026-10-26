import { notFound } from 'next/navigation';
import { CityResearchPreview } from './preview';

// Dev-only preview of the phone's city vote (404 outside development unless NEXT_PUBLIC_DEV_ROUTES=1).
export const dynamic = 'force-dynamic';

export default function CityResearchPage() {
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_DEV_ROUTES !== '1') notFound();
  return <CityResearchPreview />;
}
