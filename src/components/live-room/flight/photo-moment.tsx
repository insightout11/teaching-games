'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, MessageCircle, X } from 'lucide-react';

/**
 * Landmark Quest photo mode (Oct 2026, docs/photo-mode-plan.md): the camera moment on the shared screen (a viewfinder,
 * a soft flash) and then the photo as a print with its caption, and where to go next.
 */

/** Put the windscreen together into one picture: the sky's colours, then every canvas inside it (ground, mountains,
 *  landmarks, clouds, weather), at their places. Made in the browser: no service, no cost. */
export function composeWindscreen(root: HTMLElement, sky: { top: string; mid: string; bottom: string }): string | null {
  const box = root.getBoundingClientRect();
  if (box.width < 50 || box.height < 50) return null;
  const scale = Math.min(2, 1600 / box.width);
  const out = document.createElement('canvas');
  out.width = Math.round(box.width * scale);
  out.height = Math.round(box.height * scale);
  const g = out.getContext('2d');
  if (!g) return null;
  const grad = g.createLinearGradient(0, 0, 0, out.height);
  grad.addColorStop(0, sky.top); grad.addColorStop(0.52, sky.mid); grad.addColorStop(0.78, sky.bottom); grad.addColorStop(1, sky.bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, out.width, out.height);
  root.querySelectorAll('canvas').forEach((c) => {
    const r = c.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    try { g.drawImage(c, (r.left - box.left) * scale, (r.top - box.top) * scale, r.width * scale, r.height * scale); } catch { /* a canvas that cannot be read */ }
  });
  try { return out.toDataURL('image/jpeg', 0.88); } catch { return null; }
}

export function PhotoMoment({ image, caption, onTalk, onEveryone, onClose }: {
  image: string;
  caption: string;
  onTalk: () => void;
  onEveryone: () => void;
  onClose: () => void;
}) {
  // the camera first (a viewfinder, then a soft flash), then the print
  const [stage, setStage] = useState<'finder' | 'flash' | 'print'>('finder');
  useEffect(() => {
    const a = window.setTimeout(() => setStage('flash'), 550);
    const b = window.setTimeout(() => setStage('print'), 850);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, []);
  return (
    <div className="absolute inset-0 z-[13] flex items-center justify-center p-6">
      {stage === 'finder' && (
        <div aria-hidden className="pointer-events-none absolute inset-[8%]">
          {['left-0 top-0 border-l-2 border-t-2', 'right-0 top-0 border-r-2 border-t-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((c) => <span key={c} className={`absolute h-10 w-10 border-white/85 ${c}`} />)}
          <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70" />
        </div>
      )}
      {stage === 'flash' && <motion.div aria-hidden className="pointer-events-none absolute inset-0 bg-white" initial={{ opacity: 0.55 }} animate={{ opacity: 0 }} transition={{ duration: 0.35 }} />}
      {stage === 'print' && (
        <motion.div initial={{ opacity: 0, scale: 0.85, rotate: -5, y: 30 }} animate={{ opacity: 1, scale: 1, rotate: -1.5, y: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 20 }} className="w-[min(640px,80vw)] rounded-md bg-[#fbf8f1] p-3 pb-4 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={caption} className="aspect-[16/10] w-full rounded-sm object-cover" />
          <p className="mt-3 text-center font-display text-xl text-[#1b2233]">{caption}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={onTalk} className="flex items-center gap-1.5 rounded-full border border-[#1b2233]/25 px-3 py-1.5 text-sm text-[#1b2233] hover:bg-[#1b2233]/5"><MessageCircle className="h-4 w-4" /> Talk about it</button>
            <button type="button" onClick={onEveryone} className="flex items-center gap-1.5 rounded-full border border-[#1b2233]/25 px-3 py-1.5 text-sm text-[#1b2233] hover:bg-[#1b2233]/5"><ClipboardList className="h-4 w-4" /> Everyone answers</button>
            <button type="button" onClick={onClose} className="flex items-center gap-1.5 rounded-full bg-[#1b2233] px-3 py-1.5 text-sm text-[#fbf8f1] hover:bg-[#1b2233]/85"><X className="h-4 w-4" /> Close</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
