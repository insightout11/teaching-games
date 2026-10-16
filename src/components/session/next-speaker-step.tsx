'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { KitButton, KitLabel } from '@/components/session/widget-kit';
import { useSessionStore } from '@/stores/session-store';
import { pickNextSpeaker } from '@/lib/next-speaker';
import type { Student } from '@/lib/supabase/types';

interface NextSpeakerStepProps {
  /** The speaking task, shown in large type. Never include answers or typed content. */
  task: string;
  /** Students present in the lesson. Only these are ever named. */
  students: Student[];
  /** Preferred first speaker (for example the student who solved a group). */
  preferredStudentId?: string | null;
  /** Called once for each name shown, so the activity can count participation. */
  onSpoke?: (student: Student) => void;
  /** Back to the activity. */
  onDone: () => void;
}

/**
 * Shared "Next speaker" step — one shared window moment for every activity.
 * The speaking task in large type, one student's name large, and two buttons:
 * Next speaker (another name, same task) and Done (back to the activity).
 * No typing, no phone step: parents clear the phone input while this shows.
 * Never shows anything a student typed.
 */
export function NextSpeakerStep({ task, students, preferredStudentId, onSpoke, onDone }: NextSpeakerStepProps) {
  const callCounts = useSessionStore((s) => s.callCounts);
  const [alreadyNamed, setAlreadyNamed] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const spokeRef = useRef<Record<string, boolean>>({});
  const onSpokeRef = useRef(onSpoke);
  onSpokeRef.current = onSpoke;

  const presentIds: string[] = [];
  for (let i = 0; i < students.length; i++) {
    presentIds.push(students[i].id);
  }

  // First speaker on mount.
  useEffect(() => {
    if (presentIds.length === 0) return;
    const first = pickNextSpeaker(presentIds, useSessionStore.getState().callCounts, [], preferredStudentId ?? null);
    if (first) {
      setCurrentId(first);
      setAlreadyNamed([first]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Each name shown counts as that student taking part.
  useEffect(() => {
    if (!currentId || spokeRef.current[currentId]) return;
    spokeRef.current[currentId] = true;
    for (let i = 0; i < students.length; i++) {
      if (students[i].id === currentId) {
        onSpokeRef.current?.(students[i]);
        break;
      }
    }
  }, [currentId, students]);

  const current = (() => {
    for (let i = 0; i < students.length; i++) {
      if (students[i].id === currentId) return students[i];
    }
    return null;
  })();

  const nextSpeaker = () => {
    const next = pickNextSpeaker(presentIds, callCounts, alreadyNamed, null);
    if (!next) return;
    setCurrentId(next);
    // A reset cycle returns an id already in the list: start the cycle again.
    if (alreadyNamed.indexOf(next) !== -1) {
      setAlreadyNamed([next]);
    } else {
      setAlreadyNamed(alreadyNamed.concat([next]));
    }
  };

  if (presentIds.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-6 text-center text-white">
        <KitLabel>Next speaker</KitLabel>
        <p className="font-display text-4xl">{task}</p>
        <div className="flex justify-center">
          <KitButton tone="emerald" solid onClick={onDone} icon={<Check className="h-4 w-4" />}>Done</KitButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-4 text-center text-white">
      <KitLabel>Next speaker</KitLabel>
      <p className="font-display text-4xl leading-snug" style={{ textWrap: 'balance' }}>{task}</p>
      <p className="font-display text-6xl">{current ? current.name : '—'}</p>
      <p className="text-sm text-white/55">Say it out loud, one at a time.</p>
      <div className="flex justify-center gap-2">
        <KitButton onClick={nextSpeaker} icon={<ArrowRight className="h-4 w-4" />}>Next speaker</KitButton>
        <KitButton tone="emerald" solid onClick={onDone} icon={<Check className="h-4 w-4" />}>Done</KitButton>
      </div>
    </div>
  );
}
