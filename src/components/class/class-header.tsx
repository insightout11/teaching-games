'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Plane } from 'lucide-react';
import type { Class } from '@/lib/supabase/types';
import { SessionStarter } from '@/components/class/session-starter';

export function ClassHeader({ cls, studentCount }: { cls: Class; studentCount: number }) {
  const [name, setName] = useState(cls.name);
  const [theme, setTheme] = useState(cls.theme);
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

  const toggleTheme = async () => {
    const next = theme === 'colorful' ? 'professional' : 'colorful';
    setTheme(next);
    await supabase.from('classes').update({ theme: next }).eq('id', cls.id);
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
          <span className="text-lc-border">·</span>
          <button
            onClick={toggleTheme}
            className="text-xs px-2.5 py-0.5 rounded-full bg-lc-blue/15 text-lc-blue hover:bg-lc-blue/25 transition-colors capitalize font-medium"
            title="Click to switch theme"
          >
            {theme}
          </button>
          <span className="text-lc-border">·</span>
          <button
            onClick={handleDelete}
            className="text-xs text-lc-text3 hover:text-lc-danger transition-colors"
          >
            Delete class
          </button>
        </div>
      </div>
      <div className="shrink-0">
        <SessionStarter classId={cls.id} studentCount={studentCount} />
      </div>
    </div>
  );
}
