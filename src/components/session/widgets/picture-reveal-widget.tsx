'use client';

import { useEffect, useState } from 'react';
import { Eye, Pause, Play, RotateCcw } from 'lucide-react';
import { useRoom } from '@/stores/live-room-store';
import { KitButton, KitChip, KitInput, KitLabel, KitReadout, KitSection } from '../widget-kit';

/**
 * Picture reveal: a picture starts heavily blurred and sharpens step by step
 * (or on its own) while the class guesses what it is. Pictures come from the
 * room's cargo (found with Sources) or a pasted image link.
 */
const STEPS = 8;
const MAX_BLUR = 34;

export function PictureRevealContent({ sessionId }: { sessionId: string }) {
  const { material } = useRoom(sessionId);
  const images = material.filter((m) => m.kind === 'image' && m.imageUrl);
  const [url, setUrl] = useState('');
  const [answer, setAnswer] = useState('');
  const [picked, setPicked] = useState<{ src: string; title: string } | null>(null);
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (!auto || step >= STEPS) return;
    const t = window.setTimeout(() => setStep((s) => Math.min(STEPS, s + 1)), 4000);
    return () => window.clearTimeout(t);
  }, [auto, step]);

  const start = (src: string, title: string) => {
    setPicked({ src, title });
    setStep(0);
    setAuto(false);
    setShowAnswer(false);
  };

  if (!picked) {
    return (
      <div className="space-y-3 p-3">
        <KitSection label="Pick a picture">
          {images.length ? (
            <div className="grid grid-cols-3 gap-1.5">
              {images.slice(0, 9).map((m) => (
                <button key={m.id} type="button" onClick={() => start(m.imageUrl as string, m.title)} className="overflow-hidden rounded-lg border border-white/10 hover:border-amber-300/60" title={m.title}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.imageUrl as string} alt="" className="aspect-square w-full object-cover" draggable={false} />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/50">Images you find with Sources land in cargo and show up here.</p>
          )}
        </KitSection>
        <KitSection label="Or paste an image link">
          <KitInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/picture.jpg" />
          <KitInput value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="What is it? (the answer, optional)" />
          <KitButton tone="amber" solid className="w-full" disabled={!/^https?:\/\//.test(url.trim())} onClick={() => start(url.trim(), answer.trim())}>
            Start
          </KitButton>
        </KitSection>
      </div>
    );
  }

  const blur = Math.round(MAX_BLUR * (1 - step / STEPS));
  return (
    <div className="space-y-3 p-3">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={picked.src}
          alt=""
          draggable={false}
          className="aspect-video w-full object-cover transition-[filter] duration-700"
          style={{ filter: `blur(${blur}px) saturate(${0.6 + (step / STEPS) * 0.4})`, transform: 'scale(1.08)' }}
        />
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/80">
          {step >= STEPS ? 'Fully revealed' : `Clue ${step + 1} of ${STEPS + 1}`}
        </span>
      </div>
      <KitLabel className="text-center">What do you think it is?</KitLabel>
      <div className="flex flex-wrap gap-1.5">
        <KitButton tone="amber" solid className="flex-1" disabled={step >= STEPS} icon={<Eye className="h-3.5 w-3.5" />} onClick={() => setStep((s) => Math.min(STEPS, s + 1))}>
          Reveal more
        </KitButton>
        <KitChip on={auto} tone="amber" onClick={() => setAuto((a) => !a)}>
          <span className="flex items-center gap-1">{auto ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />} Auto</span>
        </KitChip>
        <KitButton onClick={() => setStep(STEPS)}>Show all</KitButton>
      </div>
      {picked.title && (
        showAnswer
          ? <KitReadout className="text-center">{picked.title}</KitReadout>
          : <KitButton tone="emerald" className="w-full" onClick={() => { setShowAnswer(true); setStep(STEPS); }}>Show the answer</KitButton>
      )}
      <button type="button" onClick={() => setPicked(null)} className="flex items-center gap-1 text-xs text-white/50 hover:text-white">
        <RotateCcw className="h-3 w-3" /> Another picture
      </button>
    </div>
  );
}
