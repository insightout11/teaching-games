import { notFound } from 'next/navigation';
import { PalettePreview } from './preview';

// Dev-only: today's bright UI colours next to the proposed travel-poster tones (404 outside development).
export const dynamic = 'force-dynamic';

export default function PalettePage() {
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_DEV_ROUTES !== '1') notFound();
  return <PalettePreview />;
}
