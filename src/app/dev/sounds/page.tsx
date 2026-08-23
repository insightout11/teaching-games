import { notFound } from 'next/navigation';
import { SoundsDevClient } from '@/components/ui/sounds-dev-client';

// Audio tuning board. Unlike the other /dev routes this must survive a DEPLOY —
// levels are reviewed on Vercel previews, not a local dev server — so it stays
// reachable in development and on preview builds, and 404s only in production.
export const dynamic = 'force-dynamic';

export default function SoundsDevPage() {
  const isProduction =
    process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production';
  if (isProduction) {
    notFound();
  }
  return <SoundsDevClient />;
}
