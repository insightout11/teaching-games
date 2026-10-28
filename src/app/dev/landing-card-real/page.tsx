'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { LandingCard } from '@/components/student/landing-card';

// Dev-only: the real phone landing card with sample data, at phone width (?city=tokyo&tod=night, ?postcard=off).
export default function LandingCardRealPage() {
  const [q, setQ] = useState<URLSearchParams | null>(null);
  useEffect(() => setQ(new URLSearchParams(window.location.search)), []);
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_DEV_ROUTES !== '1') notFound();
  if (!q) return <main className="min-h-screen bg-[#0b1220]" />;
  return (
    <main className="min-h-screen bg-[#0b1220] p-4">
      <div className="mx-auto w-[390px]">
        <LandingCard
          name="Mia"
          seat="12D"
          avatarSeed="mia"
          topic="Food around the world"
          results={{ totalPoints: 0, accuracy: null, bestStreak: 0, rank: null, totalParticipants: null }}
          words={[]}
          debriefUrl={null}
          shareCopied={false}
          onShare={() => {}}
          postcard={q.get('postcard') === 'off' ? null : { destinationId: q.get('city') ?? 'tokyo', timeOfDay: q.get('tod') ?? 'dusk' }}
        />
      </div>
    </main>
  );
}
