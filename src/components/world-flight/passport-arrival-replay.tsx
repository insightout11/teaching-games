'use client';

import { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { DestinationArrivalScene } from './arrival-scene/destination-arrival-scene';
import { ARRIVAL_DURATION_MS, arrivalTimeline } from './arrival-scene/cinematic-motion';

export function PassportArrivalReplay({
  destinationId,
  planeKey,
  onClose,
}: {
  destinationId: string;
  planeKey: string;
  onClose: () => void;
}) {
  const destination = WORLD_DESTINATIONS.find((candidate) => candidate.id === destinationId);
  const [replayKey, setReplayKey] = useState(0);
  const [timelineProgress, setTimelineProgress] = useState(0);

  useEffect(() => {
    const startedAt = performance.now();
    let frameId = 0;
    const animate = (now: number) => {
      const nextProgress = Math.min((now - startedAt) / ARRIVAL_DURATION_MS, 1);
      setTimelineProgress(nextProgress);
      if (nextProgress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [replayKey]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!destination) return null;
  const frame = arrivalTimeline(timelineProgress);

  return (
    <div className="fixed inset-0 z-[80] bg-[#04101c]" role="dialog" aria-modal="true" aria-label={`Replay arrival in ${destination.city}`}>
      <DestinationArrivalScene
        destinationId={destination.id}
        scene={destination.scene}
        phase={frame.phase}
        progress={frame.progress}
        planeKey={planeKey}
        motion="animated"
        fit="slice"
        className="h-full w-full"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 bg-gradient-to-b from-black/75 to-transparent px-5 py-5">
        <div>
          <p className="font-instrument text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100/75">Passport replay</p>
          <h2 className="font-display mt-1 text-3xl text-white">Arriving in {destination.city}</h2>
          <p className="mt-1 text-sm text-white/65">{destination.country} - {destination.primaryAirport}</p>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReplayKey((value) => value + 1)}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-white/25 bg-black/45 px-3 text-xs font-semibold text-white transition-colors hover:border-white/50 hover:bg-black/65"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Replay
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close arrival replay"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-white/25 bg-black/45 text-white transition-colors hover:border-white/50 hover:bg-black/65"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
      <div className="absolute inset-x-5 bottom-5 h-1 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-cyan-300 transition-[width] duration-75" style={{ width: `${timelineProgress * 100}%` }} />
      </div>
    </div>
  );
}
