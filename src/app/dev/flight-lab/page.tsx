import { notFound } from 'next/navigation';
import dynamicImport from 'next/dynamic';

const FlightLab = dynamicImport(() => import('@/components/live-room/flight/flight-lab').then((m) => m.FlightLab), { ssr: false });

// Dev-only: iterate on the Live Room windscreen flight (cockpit + side cameras).
// 404 outside development unless NEXT_PUBLIC_DEV_ROUTES=1.
export const dynamic = 'force-dynamic';

export default function FlightLabPage() {
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_DEV_ROUTES !== '1') notFound();
  return <FlightLab />;
}
