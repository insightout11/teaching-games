'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, GraduationCap, X } from 'lucide-react';
import type { ClassType } from '@/lib/class-profile';

/** What the room tells the coach (each becomes true once the teacher has done it). */
export interface TestFlightSignals {
  boarded: boolean;
  topic: boolean;
  whereNext: boolean;
  picture: boolean;
  picked: boolean;
  tookOff: boolean;
  launched: boolean;
  finished: boolean;
  planOpened: boolean;
  planStarted: boolean;
}

interface Step { signal: keyof TestFlightSignals; text: string }

/** At most 5 steps per class type: one control and one sentence each. */
export const TEST_FLIGHT_STEPS: Record<ClassType | 'none', Step[]> = {
  'free-talk': [
    { signal: 'boarded', text: 'Tap the + seat in the Cabin and board Mia. She has no device.' },
    { signal: 'topic', text: 'Type a topic in the bar at the top, like “volcanoes”, and press Enter.' },
    { signal: 'whereNext', text: 'Under the topic, tap one of the “Where next?” ideas.' },
    { signal: 'picture', text: 'Open Sources (private window) and click a free picture to show it.' },
    { signal: 'picked', text: 'Press “Pick a student” in the Cabin.' },
  ],
  conversation: [
    { signal: 'boarded', text: 'Tap the + seat in the Cabin and board Mia. She has no device.' },
    { signal: 'tookOff', text: 'Press “Take off” on the boarding screen.' },
    { signal: 'topic', text: 'Type a topic in the bar at the top and press Enter.' },
    { signal: 'picked', text: 'Press “Pick a student” in the Cabin.' },
    { signal: 'launched', text: 'Launch an activity from the bar at the bottom.' },
  ],
  'game-time': [
    { signal: 'boarded', text: 'Tap the + seat in the Cabin and board Mia. She has no device.' },
    { signal: 'launched', text: 'Launch a game from the bar at the bottom.' },
    { signal: 'finished', text: 'Play a round, then go back to the room when it ends.' },
  ],
  structured: [
    { signal: 'boarded', text: 'Tap the + seat in the Cabin and board Mia. She has no device.' },
    { signal: 'planOpened', text: 'Open a flight plan (Launch a flight, at the bottom right).' },
    { signal: 'planStarted', text: 'Choose a plan and start it.' },
  ],
  none: [
    { signal: 'boarded', text: 'Tap the + seat in the Cabin and board Mia. She has no device.' },
    { signal: 'topic', text: 'Type a topic in the bar at the top and press Enter.' },
    { signal: 'picked', text: 'Press “Pick a student” in the Cabin.' },
    { signal: 'launched', text: 'Launch an activity from the bar at the bottom.' },
  ],
};

/**
 * The guided test flight: a small card at the bottom of the room, one step at a time. Each step waits until the
 * teacher has tried it. Pretend students have no device, so nothing is needed but this screen.
 */
export function TestFlightCoach({ type, signals, onEnd }: { type: ClassType | undefined; signals: TestFlightSignals; onEnd: (finished: boolean) => void }) {
  const steps = useMemo(() => TEST_FLIGHT_STEPS[type ?? 'none'], [type]);
  // Steps done in order: a later signal doesn't skip an earlier step.
  const [index, setIndex] = useState(0);
  useEffect(() => {
    let i = index;
    while (i < steps.length && signals[steps[i].signal]) i += 1;
    if (i !== index) setIndex(i);
  }, [signals, steps, index]);
  const done = index >= steps.length;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="pointer-events-auto fixed bottom-24 left-1/2 z-[72] w-[min(560px,92vw)] -translate-x-1/2 rounded-2xl border border-sky-300/50 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-md"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200">
          <GraduationCap className="h-3.5 w-3.5" /> Test flight · {done ? 'done' : `step ${index + 1} of ${steps.length}`}
        </span>
        <button type="button" onClick={() => onEnd(done)} aria-label="End the test flight" className="flex items-center gap-1 text-xs text-white/50 hover:text-white">
          {done ? 'Close' : 'Skip'} <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {done ? (
        <p className="text-base">
          That&apos;s the room. Real students join with the QR code; anyone without a device gets a seat from the + seat.
          You can replay this from the <b>?</b> button.
        </p>
      ) : (
        <p className="text-base leading-snug">{steps[index].text}</p>
      )}
      <div className="mt-3 flex gap-1.5">
        {steps.map((s, i) => (
          <span key={s.signal} className={`flex h-5 flex-1 items-center justify-center rounded-full text-[10px] ${i < index ? 'bg-emerald-300/80 text-slate-950' : i === index ? 'bg-sky-300/40' : 'bg-white/10'}`}>
            {i < index ? <Check className="h-3 w-3" /> : i + 1}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
