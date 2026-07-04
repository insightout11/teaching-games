'use client';

import { useCallback, useState, type ComponentType } from 'react';
import { RefreshCw } from 'lucide-react';
import type { Student } from '@/lib/supabase/types';

// Shared role assignment for the Travel arc's roleplay stops (Arrival, Getting There, Meal).
// One "service" role (officer / staff / waiter) + the rest as travellers/customers, assigned
// to the real students present. Adapts to class size; the teacher plays the service role solo.

export function useTravelRoles(students: Student[]) {
  const [serviceIdx, setServiceIdx] = useState(0);
  const service = students.length >= 2 ? students[serviceIdx % students.length] : null;
  const others = service ? students.filter((s) => s.id !== service.id) : students;
  const swap = useCallback(
    () => setServiceIdx((i) => (i + 1) % Math.max(students.length, 1)),
    [students.length],
  );
  return { service, others, swap, canSwap: students.length >= 2 };
}

const ACCENTS = {
  cyan: { border: 'border-cyan-300/20', bg: 'bg-cyan-500/[0.07]', label: 'text-cyan-300/80', name: 'text-cyan-100' },
  amber: { border: 'border-amber-300/20', bg: 'bg-amber-500/[0.07]', label: 'text-amber-300/80', name: 'text-amber-100' },
} as const;

export function TravelRoleBanner({
  service,
  others,
  serviceRole,
  otherRole,
  serviceHint,
  otherHint,
  ServiceIcon,
  OtherIcon,
  accent = 'cyan',
}: {
  service: Student | null;
  others: Student[];
  serviceRole: string;
  otherRole: string;
  serviceHint?: string;
  otherHint?: string;
  ServiceIcon: ComponentType<{ className?: string }>;
  OtherIcon: ComponentType<{ className?: string }>;
  accent?: 'cyan' | 'amber';
}) {
  const a = ACCENTS[accent];
  const serviceName = service ? service.name : 'The teacher (you)';
  const otherNames = others.length > 0 ? others.map((s) => s.name).join(', ') : 'the class';
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className={`rounded-2xl border ${a.border} ${a.bg} px-4 py-3`}>
        <p className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${a.label}`}><ServiceIcon className="h-3.5 w-3.5" />{serviceRole}</p>
        <p className={`mt-1 font-game text-lg ${a.name}`}>{serviceName}</p>
        {serviceHint && <p className="mt-0.5 text-xs text-slate-400">{serviceHint}</p>}
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"><OtherIcon className="h-3.5 w-3.5" />{otherRole}</p>
        <p className="mt-1 font-game text-lg text-white">{otherNames}</p>
        {otherHint && <p className="mt-0.5 text-xs text-slate-400">{otherHint}</p>}
      </div>
    </div>
  );
}

export function SwapRoleButton({ onClick, label = 'Swap roles' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 font-game text-sm text-white transition hover:bg-white/20">
      <RefreshCw className="h-4 w-4" />{label}
    </button>
  );
}
