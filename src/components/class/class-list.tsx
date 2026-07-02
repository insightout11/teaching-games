'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Class } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import Link from 'next/link';
import { Globe2, Plane, Users } from 'lucide-react';
import { getDestinationById } from '@/data/world-flight/destinations';
import { getPlaneTier } from '@/lib/plane-progression';
import { SessionStarter } from '@/components/class/session-starter';

export interface ClassCardSummary {
  id: string;
  crewCount: number;
  flightCount: number;
  lastFlightAt: string | null;
  currentDestinationId: string | null;
  planeTier: number;
  stampCount: number;
}

function formatLastFlight(iso: string | null) {
  if (!iso) return 'no flights yet';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function ClassCard({ cls, summary }: { cls: Class; summary: ClassCardSummary }) {
  const destination = summary.currentDestinationId ? getDestinationById(summary.currentDestinationId) : null;
  const planeTierLabel = getPlaneTier(summary.planeTier).label;

  return (
    <div className="panel-card p-6 group overflow-hidden relative flex flex-col">
      <Link href={`/classes/${cls.id}`} className="block absolute inset-0" aria-label={cls.name} />

      {/* Flight arc background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]"
        preserveAspectRatio="none"
        viewBox="0 0 300 140"
        aria-hidden="true"
      >
        <path
          className="flight-arc-path"
          d="M 20,120 Q 140,50 280,18"
          fill="none"
          stroke="#4DA3FF"
          strokeWidth="1.5"
          strokeDasharray="5,7"
          pathLength="1"
        />
        <circle cx="20" cy="120" r="3" fill="#4DA3FF"/>
        <circle cx="280" cy="18" r="3" fill="#4DA3FF"/>
      </svg>
      <div className="absolute top-4 right-5 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        <Plane className="w-12 h-12 text-lc-blue -rotate-12" />
      </div>

      <div className="relative pointer-events-none">
        <h3 className="font-semibold text-lc-text group-hover:text-lc-blue transition-colors">
          {cls.name}
        </h3>
        <p className="text-sm text-lc-text3 mt-2 flex items-center gap-1.5 font-instrument">
          <Users className="w-3.5 h-3.5" />
          {summary.crewCount} crew · {summary.flightCount} flights · last: {formatLastFlight(summary.lastFlightAt)}
        </p>

        {destination && (
          <div className="mt-3 pt-3 border-t border-lc-border/60">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-lc-text3 mb-1">
              World Flight
            </p>
            <p className="text-sm text-lc-text2 flex items-center gap-1.5 font-instrument">
              <Globe2 className="w-3.5 h-3.5 text-lc-blue" />
              {destination.city} · {planeTierLabel} · {summary.stampCount} stamp{summary.stampCount === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>

      <div className="relative mt-5 flex items-center justify-between pointer-events-none">
        <span className="pointer-events-auto">
          <SessionStarter classId={cls.id} studentCount={summary.crewCount} size="compact" />
        </span>
        <Link
          href={`/classes/${cls.id}/control-room`}
          className="pointer-events-auto text-xs font-semibold text-lc-blue hover:text-lc-blue-hover px-3 py-1.5 rounded-lg border border-lc-blue/30 hover:border-lc-blue/60 bg-lc-surface transition-colors"
        >
          Control Room →
        </Link>
      </div>
    </div>
  );
}

export function ClassList({
  initialClasses,
  summaries,
}: {
  initialClasses: Class[];
  summaries: ClassCardSummary[];
}) {
  const [classes, setClasses] = useState(initialClasses);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const summaryByClass = new Map(summaries.map((s) => [s.id, s]));
  const emptySummary = (id: string): ClassCardSummary => ({
    id,
    crewCount: 0,
    flightCount: 0,
    lastFlightAt: null,
    currentDestinationId: null,
    planeTier: 0,
    stampCount: 0,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('classes')
      .insert({ name: name.trim(), teacher_id: user.id })
      .select()
      .single();

    if (data) {
      setClasses([data, ...classes]);
      setName('');
      setShowCreate(false);
    }
    setLoading(false);
  };

  return (
    <>
      <Button onClick={() => setShowCreate(true)} className="mb-6">
        + New Class
      </Button>

      {classes.length === 0 ? (
        <div className="text-center py-16 text-lc-text3">
          <Plane className="w-10 h-10 mx-auto mb-3 text-lc-text3/50 -rotate-12" />
          <p className="text-lg">Your hangar is empty.</p>
          <p className="text-sm mt-1">Create your first class to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              summary={summaryByClass.get(cls.id) ?? emptySummary(cls.id)}
            />
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Class">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Class name"
            inputSize="lg"
            className="py-2 focus:outline-none focus:ring-2 focus:ring-lc-blue-glow focus:border-lc-blue"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
