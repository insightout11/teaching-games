'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Armchair, Camera, CircleHelp, Plane, Smartphone, X } from 'lucide-react';
import { CrewAvatar } from '@/components/ui/crew-avatar';
import { MascotFigure } from '@/components/ui/mascot-figure';
import type { MascotLook } from '@/lib/mascot';
import { hasSeenOnboarding, markOnboardingSeen, onboardingStepsFor, type OnboardingVisual } from '@/lib/student-onboarding';

/**
 * First-time student onboarding on the phone: swipeable cards, skippable, once per device (the steps live in
 * src/lib/student-onboarding.ts). Afterwards a small "How it works" link brings them back.
 */
export function StudentOnboarding({ name, seed, mascot, hasShelf }: { name: string; seed: string | null; mascot: { name: string; look: MascotLook } | null; hasShelf: boolean }) {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  // after the student's own boarding animation (about 6 s), not on top of it
  useEffect(() => {
    if (hasSeenOnboarding()) return;
    const t = window.setTimeout(() => setOpen(true), 6500);
    return () => window.clearTimeout(t);
  }, []);
  const steps = onboardingStepsFor({ name, mascotName: mascot?.name ?? null, hasShelf });
  const step = steps[Math.min(i, steps.length - 1)];
  const ctx = { name, mascotName: mascot?.name ?? null, hasShelf };
  const close = () => { markOnboardingSeen(); setOpen(false); setI(0); };

  const visual = (v: OnboardingVisual) => {
    switch (v) {
      case 'avatar': return <CrewAvatar seed={seed ?? name} name={name} size={110} expression="grin" />;
      case 'seat': return (
        <div className="grid grid-cols-[1fr_1fr_10px_1fr_1fr] gap-1.5">
          {[0, 1, -1, 2, 3, 4, 5, -2, 6, 7].map((k) => (k < 0 ? <span key={k} /> : (
            <div key={k} className={`grid h-10 w-10 place-items-center rounded-[8px_8px_4px_4px] border ${k === 5 ? 'border-cyan-300 bg-cyan-400/20' : 'border-white/15 bg-white/5'}`}>
              {k === 5 ? <CrewAvatar seed={seed ?? name} name={name} size={30} /> : k === 4 || k === 1 ? <CrewAvatar seed={`friend-${k}`} name="friend" size={30} /> : <Armchair className="h-4 w-4 text-white/30" />}
            </div>
          )))}
        </div>
      );
      case 'phone': return <Smartphone className="h-20 w-20 text-cyan-300" strokeWidth={1.4} />;
      case 'dots': return <div className="flex gap-3">{[0, 1, 2].map((k) => <motion.span key={k} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15 * k }} className="h-8 w-8 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.6)]" />)}</div>;
      case 'selfie': return <div className="flex items-end gap-2"><CrewAvatar seed={seed ?? name} name={name} size={80} expression="wow" /><Camera className="mb-4 h-10 w-10 text-amber-300" /></div>;
      case 'mascot': return mascot ? <MascotFigure look={mascot.look} size={120} title={mascot.name} /> : null;
      // eslint-disable-next-line @next/next/no-img-element
      case 'souvenir': return <div className="flex gap-2">{['camel', 'teapot', 'koala'].map((s) => <img key={s} src={`/stickers/${s}.webp`} alt="" className="h-14 w-14 rounded-xl bg-white/90 p-1" />)}</div>;
      default: return <Plane className="h-20 w-20 -rotate-12 text-amber-300" strokeWidth={1.4} />;
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mb-3 flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80">
        <CircleHelp className="h-3.5 w-3.5" /> How it works
      </button>
    );
  }
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 p-5 backdrop-blur">
      <div className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-[#0e1626] p-6 text-center text-white shadow-2xl">
        <button type="button" onClick={close} className="absolute right-3 top-3 flex items-center gap-1 text-xs text-white/50 hover:text-white">Skip <X className="h-3.5 w-3.5" /></button>
        <AnimatePresence mode="wait">
          <motion.div key={step.id} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} className="flex flex-col items-center gap-4 pt-4">
            <div className="grid h-32 place-items-center">{visual(step.visual)}</div>
            <p className="font-display text-2xl">{step.title(ctx)}</p>
            <p className="text-sm text-white/75">{step.text(ctx)}</p>
          </motion.div>
        </AnimatePresence>
        <div className="mt-5 flex items-center justify-center gap-1.5">
          {steps.map((s, k) => <span key={s.id} className={`h-1.5 rounded-full ${k === i ? 'w-5 bg-amber-300' : 'w-1.5 bg-white/25'}`} />)}
        </div>
        <div className="mt-4 flex gap-2">
          {i > 0 && <button type="button" onClick={() => setI(i - 1)} className="flex-1 rounded-xl border border-white/15 py-2.5 text-sm">Back</button>}
          <button type="button" onClick={() => (i + 1 < steps.length ? setI(i + 1) : close())} className="flex-1 rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-slate-950">{i + 1 < steps.length ? 'Next' : "Let's fly!"}</button>
        </div>
      </div>
    </div>
  );
}
