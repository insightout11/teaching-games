import type { Metadata } from 'next';
import { BrandStingDevClient } from '@/components/ui/brand-sting-dev-client';

// Preview of the signature cloud-reveal sting. Temporarily viewable on the
// deployed build (owner reviews on deploy, not a local dev server) — noindex +
// unlinked so it isn't a public surface. Re-gate to dev-only, or wire the sting
// into a session bookend, once the look is approved.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function BrandStingDevPage() {
  return <BrandStingDevClient />;
}
