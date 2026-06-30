'use client';

// The emotional differentiator: a class flies the world together, one leg per lesson.
// Reuses the shared World Flight home hero ("Globe + the Window") so the marketing
// page and the in-app /home show the exact same interactive showcase. On the public
// page the CTA points at sign-in (the live map requires auth).

import { WorldFlightHero } from '@/components/discovery/world-flight-hero/world-flight-hero';

export function WorldFlightSection() {
  return (
    <section className="border-t border-lc-border px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <WorldFlightHero ctaHref="/login" />
      </div>
    </section>
  );
}
