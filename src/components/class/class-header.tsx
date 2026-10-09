'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Gauge, MoreVertical, PenLine, Trash2 } from 'lucide-react';
import type { Class } from '@/lib/supabase/types';
import { SessionStarter } from '@/components/class/session-starter';
import { FLAP_FONT, Flaps, FlapStyles } from '@/components/ui/split-flap';

function ClassMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
        aria-label="Class options"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-lc-border bg-lc-card py-1 shadow-lg">
            <button
              onClick={() => { setOpen(false); onDelete(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-lc-danger transition-colors hover:bg-lc-danger/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete class
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** The class's flight strip (Oct 2026): gate, name (click to rename), flight number, and the actions. */
export function ClassHeader({ cls, studentCount, gate, flight }: { cls: Class; studentCount: number; gate: string; flight: string }) {
  const [name, setName] = useState(cls.name);
  const [editing, setEditing] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setName(cls.name); setEditing(false); return; }
    if (trimmed !== cls.name) {
      await supabase.from('classes').update({ name: trimmed }).eq('id', cls.id);
      router.refresh();
    }
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this class? This cannot be undone.')) return;
    await supabase.from('classes').delete().eq('id', cls.id);
    router.push('/classes');
  };

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-[#1d2632] bg-[#05080d] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_50px_rgba(0,0,0,0.45)]">
      <FlapStyles />
      <Flaps text={gate} tone="amber" max={3} size="lg" />
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveName();
              if (e.key === 'Escape') { setName(cls.name); setEditing(false); }
            }}
            className="w-full border-b-2 border-cyan-300 bg-transparent text-2xl font-bold uppercase text-[#fff4dc] focus:outline-none"
            style={{ fontFamily: FLAP_FONT }}
            aria-label="Class name"
          />
        ) : (
          <h1
            className="cursor-text truncate text-2xl font-bold uppercase tracking-[0.03em] text-[#fff4dc] transition-colors hover:text-cyan-200"
            style={{ fontFamily: FLAP_FONT }}
            onClick={() => setEditing(true)}
            title="Click to rename"
          >
            {name}
          </h1>
        )}
        <p className="mt-1 flex items-center gap-2 text-[13px] text-white/50">
          {cls.junior && <span className="rounded bg-amber-300/15 px-1.5 py-px text-[10px] font-bold tracking-[0.12em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>JUNIOR</span>}
          <span style={{ fontFamily: FLAP_FONT }}>{flight}</span>
          <span>· {studentCount} student{studentCount === 1 ? '' : 's'}</span>
          {cls.default_difficulty && <span>· {cls.default_difficulty}</span>}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link href={`/classes/${cls.id}/control-room`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white">
          <Gauge className="h-3.5 w-3.5" />Control Room
        </Link>
        <Link href="/lesson-planner" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white">
          <PenLine className="h-3.5 w-3.5" />Plan a lesson
        </Link>
        <SessionStarter classId={cls.id} studentCount={studentCount} label="Board" />
        <ClassMenu onDelete={handleDelete} />
      </div>
    </div>
  );
}
