import { notFound } from 'next/navigation';
import { ArrivalSweep } from './sweep';

// Dev-only: every destination's landed scene with the new arrival look, side by side, for checking collisions.
export const dynamic = 'force-dynamic';

export default function ArrivalSweepPage() {
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_DEV_ROUTES !== '1') notFound();
  return <ArrivalSweep />;
}
