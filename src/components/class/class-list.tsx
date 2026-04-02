'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Class } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import Link from 'next/link';
import { Plane } from 'lucide-react';
import { DIFFICULTIES, type Difficulty } from '@/lib/difficulty';
import { TONES, type Tone } from '@/stores/session-store';

function ClassCard({ cls }: { cls: Class }) {
  const [difficulty, setDifficulty] = useState<string>(cls.default_difficulty ?? '');
  const [tone, setTone] = useState<string>(cls.default_tone ?? '');
  const supabase = createClient();

  const updatePreset = async (patch: { default_difficulty?: string | null; default_tone?: string | null }) => {
    await supabase.from('classes').update(patch).eq('id', cls.id);
  };

  const handleDifficultyChange = (value: string) => {
    const newVal = value || null;
    setDifficulty(value);
    updatePreset({ default_difficulty: newVal });
  };

  const handleToneChange = (value: string) => {
    const newVal = value || null;
    setTone(value);
    updatePreset({ default_tone: newVal });
  };

  return (
    <div className="relative">
      <Link href={`/classes/${cls.id}`} className="block">
        <div className="panel-card p-6 cursor-pointer group overflow-hidden">
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
          {/* Plane icon — upper right */}
          <div className="absolute top-4 right-5 opacity-10 group-hover:opacity-20 transition-opacity">
            <Plane className="w-12 h-12 text-lc-blue -rotate-12" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lc-text group-hover:text-lc-blue transition-colors">
              {cls.name}
            </h3>
          </div>
          <p className="text-sm text-lc-text3 mt-2">
            Created {new Date(cls.created_at).toLocaleDateString()}
          </p>
          <div className="mt-4 h-16" />
        </div>
      </Link>

      {/* Preset dropdowns — outside Link so they don't trigger navigation */}
      <div className="absolute bottom-14 left-4 flex gap-2 z-10">
        <select
          value={difficulty}
          onChange={(e) => handleDifficultyChange(e.target.value)}
          className="bg-lc-surface border border-lc-border rounded-lg px-2 py-1 text-xs text-lc-text cursor-pointer outline-none focus:ring-1 focus:ring-lc-blue/40"
          title="Default difficulty"
        >
          <option value="">Level</option>
          {DIFFICULTIES.map((d: Difficulty) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={tone}
          onChange={(e) => handleToneChange(e.target.value)}
          className="bg-lc-surface border border-lc-border rounded-lg px-2 py-1 text-xs text-lc-text cursor-pointer outline-none focus:ring-1 focus:ring-lc-blue/40"
          title="Default tone"
        >
          <option value="">Tone</option>
          {TONES.map((t: Tone) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <Link
        href={`/classes/${cls.id}/control-room`}
        className="absolute bottom-4 right-4 text-xs font-semibold text-lc-blue hover:text-lc-blue-hover px-3 py-1.5 rounded-lg border border-lc-blue/30 hover:border-lc-blue/60 bg-lc-surface transition-colors z-10"
      >
        Control Room →
      </Link>
    </div>
  );
}

export function ClassList({ initialClasses }: { initialClasses: Class[] }) {
  const [classes, setClasses] = useState(initialClasses);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

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
          <p className="text-lg">Your hangar is empty.</p>
          <p className="text-sm mt-1">Create your first class to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <ClassCard key={cls.id} cls={cls} />
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Class">
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Class name"
            className="w-full px-4 py-2 bg-lc-surface border border-lc-border rounded-xl text-lc-text focus:outline-none focus:ring-2 focus:ring-lc-blue-glow focus:border-lc-blue"
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
