'use client';

import { useEffect, useRef } from 'react';
import type { InputSpec } from '@/lib/input-spec';

// DemoSimulator drives a handful of fake students through the REAL student
// endpoints (/api/student/join + /api/student/submit) so a teacher evaluating
// alone experiences the authentic live loop — realtime feed, scoring,
// leaderboard — with no second device. It deliberately does NOT use any
// parallel fake-data path.

interface FakeStudent {
  clientId: string; // stable UUID per fake student
  name: string;
  studentId: string | null; // resolved after join
}

// Fixed UUIDs so re-joins from the same "device" dedupe in session_participants.
const FAKE_STUDENTS: FakeStudent[] = [
  { clientId: 'd3700001-0000-4000-8000-000000000001', name: 'Demo Mia', studentId: null },
  { clientId: 'd3700002-0000-4000-8000-000000000002', name: 'Demo Leo', studentId: null },
  { clientId: 'd3700003-0000-4000-8000-000000000003', name: 'Demo Ava', studentId: null },
  { clientId: 'd3700004-0000-4000-8000-000000000004', name: 'Demo Kai', studentId: null },
];

// Generic text answers used when an input has no options (text/textarea). Kept
// short and plausible; no AI calls. Vocab games get slightly richer words.
const TEXT_POOL: Record<string, string[]> = {
  'vocab-sprint': ['excellent', 'rapidly', 'enormous', 'consider', 'remarkable'],
  'synonym-showdown': ['huge', 'swift', 'bright', 'calm', 'eager'],
  'word-chain': ['ocean', 'travel', 'music', 'garden', 'energy'],
  default: ['I think so', 'Good point', 'It depends', 'Probably yes', 'Not sure'],
};

function pickText(gameKey: string | undefined): string {
  const pool = (gameKey && TEXT_POOL[gameKey]) || TEXT_POOL.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

// 70% bias to the first option (so a clear "winner" emerges), else random.
function pickBiased(options: string[]): string {
  if (options.length === 0) return 'Yes';
  if (options.length === 1) return options[0];
  if (Math.random() < 0.7) return options[0];
  return options[Math.floor(Math.random() * options.length)];
}

function plausibleContent(spec: InputSpec): string {
  switch (spec.type) {
    case 'binary': {
      const opts = spec.optionLabels?.length ? spec.optionLabels : spec.options ?? ['A', 'B'];
      return pickBiased(opts);
    }
    case 'choice':
      return pickBiased(spec.options ?? ['Yes', 'No']);
    case 'multi-select': {
      const opts = spec.options ?? [];
      const n = spec.selectCount ?? Math.min(2, opts.length);
      return JSON.stringify(opts.slice(0, n));
    }
    case 'sequence':
    case 'ranking':
      return JSON.stringify(spec.options ?? []);
    case 'confirm':
      return spec.buttonLabel ?? 'Ready';
    case 'text':
    case 'textarea':
      return pickText(spec.gameKey);
    default:
      // Unhandled exotic types — best-effort generic answer keeps the loop alive.
      return spec.options?.length ? pickBiased(spec.options) : pickText(spec.gameKey);
  }
}

// Signature identifying a distinct prompt so each is answered exactly once.
function specSignature(spec: InputSpec | null): string | null {
  if (!spec) return null;
  return `${spec.gameKey}::${spec.type}::${spec.prompt ?? ''}::${spec.startedAt ?? ''}`;
}

export function DemoSimulator({ sessionId }: { sessionId: string }) {
  const studentsRef = useRef<FakeStudent[]>(FAKE_STUDENTS.map((s) => ({ ...s })));
  const joinedRef = useRef(false);
  const handledSigRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    async function joinAll() {
      await Promise.all(
        studentsRef.current.map(async (student) => {
          try {
            const res = await fetch('/api/student/join', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId,
                newName: student.name,
                avatarSeed: 'teal',
                clientId: student.clientId,
              }),
            });
            if (res.ok) {
              const data = await res.json();
              student.studentId = data.studentId ?? null;
            }
          } catch {
            /* best-effort — a failed join just means one fewer demo student */
          }
        }),
      );
      joinedRef.current = true;
    }

    function submitFor(student: FakeStudent, spec: InputSpec) {
      const delay = 2000 + Math.random() * 4000; // 2–6s per student
      const t = setTimeout(async () => {
        if (cancelled) return;
        try {
          await fetch('/api/student/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              clientId: student.clientId,
              displayName: student.name,
              content: plausibleContent(spec),
              team: null,
              gameKey: spec.gameKey,
              inputType: spec.type,
              studentId: student.studentId,
              allowMultiple: spec.allowMultiple,
              reviewMode: spec.reviewMode,
            }),
          });
        } catch {
          /* best-effort */
        }
      }, delay);
      timeouts.push(t);
    }

    async function poll() {
      if (cancelled) return;
      try {
        if (!joinedRef.current) await joinAll();

        const res = await fetch(`/api/student/session?sessionId=${sessionId}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const spec = (data?.inputSpec ?? null) as InputSpec | null;
          const sig = specSignature(spec);
          // New, answerable prompt — schedule each student once.
          if (spec && sig && sig !== handledSigRef.current && spec.gameKey) {
            handledSigRef.current = sig;
            for (const student of studentsRef.current) submitFor(student, spec);
          }
        }
      } catch {
        /* ignore and retry next tick */
      }
    }

    void poll();
    const interval = setInterval(poll, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
      timeouts.forEach(clearTimeout);
    };
  }, [sessionId]);

  return null;
}
