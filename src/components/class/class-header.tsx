'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { MoreVertical, Plane, Trash2 } from 'lucide-react';
import type { Class } from '@/lib/supabase/types';
import { SessionStarter } from '@/components/class/session-starter';

function ClassMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg text-lc-text3 hover:text-lc-text hover:bg-lc-surface transition-colors"
        aria-label="Class options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-lc-border bg-lc-card shadow-lg z-20 py-1">
            <button
              onClick={() => { setOpen(false); onDelete(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-lc-danger hover:bg-lc-danger/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete class
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function ClassHeader({ cls, studentCount }: { cls: Class; studentCount: number }) {
  const [name, setName] = useState(cls.name);
  const [editing, setEditing] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setName(cls.name); return; }
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
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Plane className="w-4 h-4 text-lc-blue shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-widest text-lc-blue">Class</span>
        </div>
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
            className="text-2xl font-bold bg-transparent border-b-2 border-lc-blue text-lc-text focus:outline-none w-full"
          />
        ) : (
          <h1
            className="text-2xl font-bold text-lc-text cursor-text hover:text-lc-blue transition-colors"
            onClick={() => setEditing(true)}
            title="Click to rename"
          >
            {name}
          </h1>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm text-lc-text3">{studentCount} crew member{studentCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <SessionStarter classId={cls.id} studentCount={studentCount} />
        <ClassMenu onDelete={handleDelete} />
      </div>
    </div>
  );
}
