'use client';

import { FirstClassSetup } from '@/components/discovery/FirstClassSetup';

// Dev-only preview of "Set up your first class" (Home needs a signed-in teacher's data). Saving needs the database.
export default function FirstClassPreview() {
  if (process.env.NODE_ENV === 'production') return null;
  return (
    <div className="theme-Midnight min-h-screen bg-lc-bg">
      <FirstClassSetup open onClose={() => {}} onCreated={() => {}} />
    </div>
  );
}
