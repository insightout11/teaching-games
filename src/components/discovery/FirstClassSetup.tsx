'use client';

import { useState } from 'react';
import { Compass, Gamepad2, Map, MessagesSquare, type LucideIcon } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { CLASS_TYPES, defaultMinutes, type AgeGroup, type ClassType, type SecondScreens, type TeachPlace } from '@/lib/class-profile';
import { DIFFICULTIES, levelLabel, type Difficulty } from '@/lib/difficulty';

const ICONS: Record<ClassType, LucideIcon> = { structured: Map, 'game-time': Gamepad2, conversation: MessagesSquare, 'free-talk': Compass };

function Choice<T extends string>({ value, options, onChange, label }: { value: T | undefined; options: Array<[T, string]>; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-lg border border-white/10 bg-black/20 p-0.5">
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={`rounded-md px-2.5 py-1 text-xs ${value === v ? 'bg-amber-300 font-semibold text-[#1a1204]' : 'text-white/70 hover:text-white'}`}>
          {text}
        </button>
      ))}
    </div>
  );
}

/** Names pasted one per line or separated by commas. */
export const splitNames = (text: string) => Array.from(new Set(text.split(/[\n,;]+/).map((n) => n.trim()).filter(Boolean))).slice(0, 60);

/**
 * New teachers: "Set up your first class" (replaces the 5 questions about the teacher). Every class can be different,
 * so the questions are about one class. Skippable.
 */
export function FirstClassSetup({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (classId: string) => void }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState<AgeGroup | undefined>();
  const [level, setLevel] = useState<Difficulty | ''>('');
  const [junior, setJunior] = useState(false);
  const [type, setType] = useState<ClassType | undefined>();
  const [screens, setScreens] = useState<SecondScreens | undefined>();
  const [place, setPlace] = useState<TeachPlace | undefined>();
  const [names, setNames] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const students = splitNames(names);

  const save = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    const res = await fetch('/api/teacher/first-class', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, level: level || null, junior, students, profile: { type, age, screens, place, minutes: type ? defaultMinutes(type) : undefined } }),
    }).catch(() => null);
    const d = res?.ok ? await res.json().catch(() => null) as { classId?: string } | null : null;
    if (!d?.classId) { setSaving(false); setError('Could not create the class. Please try again.'); return; }
    onCreated(d.classId);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="max-h-[80vh] space-y-5 overflow-y-auto pr-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-instrument text-[11px] uppercase tracking-[0.22em] text-cyan-300/80">Set up your first class</p>
            <h2 className="mt-1 text-2xl font-bold text-lc-text">Tell us about one class</h2>
            <p className="mt-1 text-sm text-lc-text3">Every class can be different. The room opens set up for this one.</p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 text-[12px] text-lc-text3 hover:text-lc-text">Skip for now</button>
        </div>

        <label className="block space-y-1">
          <span className="text-xs text-lc-text2">Class name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Friday teens" autoFocus
            className="w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-white/35" />
        </label>

        <div className="grid gap-2 sm:grid-cols-[110px_1fr] sm:items-center">
          <span className="text-xs text-lc-text2">Students are</span>
          <Choice<AgeGroup> label="Age" value={age} onChange={setAge} options={[['kids', 'Kids'], ['teens', 'Teens'], ['adults', 'Adults']]} />
          <span className="text-xs text-lc-text2">Level</span>
          <select value={level} onChange={(e) => setLevel(e.target.value as Difficulty | '')} aria-label="Level"
            className="w-48 rounded-lg border border-white/15 bg-slate-950/70 px-2 py-1 text-xs text-white">
            <option value="">Not sure yet</option>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{levelLabel(d)}</option>)}
          </select>
          {age === 'kids' && (
            <>
              <span className="text-xs text-lc-text2">Young children?</span>
              <label className="flex items-center gap-2 text-xs text-white/75">
                <input type="checkbox" checked={junior} onChange={(e) => setJunior(e.target.checked)} className="h-4 w-4 accent-amber-400" />
                Junior class (about ages 5–9): pictures, no rankings
              </label>
            </>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs text-lc-text2">What kind of class is it?</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CLASS_TYPES.map((t) => {
              const Icon = ICONS[t.key];
              return (
                <button key={t.key} type="button" onClick={() => setType(t.key)}
                  className={`flex flex-col gap-1 rounded-xl border p-3 text-left ${type === t.key ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-black/20 hover:border-amber-300/50'}`}>
                  <span className="flex items-center gap-2 font-semibold text-white"><Icon className="h-4 w-4 text-amber-300" aria-hidden />{t.name}</span>
                  <span className="text-[13px] leading-snug text-white/70">{t.line}</span>
                  <span className="text-[11px] text-white/45">{t.example}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[110px_1fr] sm:items-center">
          <span className="text-xs text-lc-text2">Second screens</span>
          <Choice<SecondScreens> label="Second screens" value={screens} onChange={setScreens} options={[['all', 'All of them'], ['some', 'Some'], ['none', 'None']]} />
          <span className="text-xs text-lc-text2">Where you teach</span>
          <Choice<TeachPlace> label="Where you teach" value={place} onChange={setPlace} options={[['online', 'Online'], ['classroom', 'In a classroom']]} />
        </div>

        <label className="block space-y-1">
          <span className="text-xs text-lc-text2">Class list <span className="text-lc-text3">(optional)</span></span>
          <textarea value={names} onChange={(e) => setNames(e.target.value)} rows={3} placeholder={'Add names now so everyone gets a seat and an avatar.\nOne per line, or separated by commas. You can add them later.'}
            className="w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-white/35" />
          {students.length > 0 && <span className="text-[11px] text-lc-text3">{students.length} student{students.length === 1 ? '' : 's'}{students.length === 1 ? ' · the room works as a 1-on-1 lesson' : ''}</span>}
        </label>

        {error && <p className="text-xs text-rose-300">{error}</p>}
        <button type="button" onClick={() => void save()} disabled={!name.trim() || saving}
          className="w-full rounded-xl bg-amber-300 py-2.5 text-sm font-semibold text-[#1a1204] disabled:opacity-40">
          {saving ? 'Setting up…' : 'Set up the class'}
        </button>
      </div>
    </Modal>
  );
}
