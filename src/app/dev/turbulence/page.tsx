import { notFound } from 'next/navigation';
import { TurbulenceDevClient } from '@/components/session/turbulence-dev-client';

// Dev-only preview of the micro-event turbulence beat. 404s outside development
// so it never ships publicly. force-dynamic so hot-reload doesn't orphan chunks.
export const dynamic = 'force-dynamic';

export default function TurbulenceDevPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }
  return <TurbulenceDevClient />;
}
