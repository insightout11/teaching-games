'use client';

import { useEffect, useState } from 'react';
import { Compass, Gamepad2, Map, MessagesSquare, X, type LucideIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { FLAP_FONT } from '@/components/ui/split-flap';
import {
  CLASS_TYPES, defaultMinutes, deviceModeFor, readClassProfile,
  type AgeGroup, type ClassProfile, type ClassType, type SecondScreens, type TeachPlace,
} from '@/lib/class-profile';

const ICONS: Record<ClassType, LucideIcon> = { structured: Map, 'game-time': Gamepad2, conversation: MessagesSquare, 'free-talk': Compass };
const LENGTHS = [15, 20, 30, 45, 60, 75, 90, 120];

function Choice<T extends string>({ value, options, onChange, label }: { value: T | undefined; options: Array<[T, string]>; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 justify-self-start rounded-lg border border-white/10 bg-black/20 p-0.5">
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={`rounded-md px-2.5 py-1 text-xs ${value === v ? 'bg-amber-300 font-semibold text-[#1a1204]' : 'text-white/70 hover:text-white'}`}>
          {text}
        </button>
      ))}
    </div>
  );
}

/**
 * "What kind of class is it?" and the settings that go with it. A class with no type is asked once (skippable);
 * nothing in the room changes until a type is picked.
 */
export function ClassProfileSection({ classId, initialProfile, studentCount }: { classId: string; initialProfile: unknown; studentCount: number }) {
  const [profile, setProfile] = useState<ClassProfile>(() => readClassProfile(initialProfile));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [changingType, setChangingType] = useState(false);
  const skipKey = `lc-class-type-skipped-${classId}`;
  const [skipped, setSkipped] = useState(true);
  useEffect(() => { try { setSkipped(localStorage.getItem(skipKey) === '1'); } catch { setSkipped(false); } }, [skipKey]);

  const save = async (patch: Partial<ClassProfile>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    setError(null);
    if (isMockMode()) { setSaved(true); return; }
    const update: Record<string, unknown> = { class_profile: next };
    if (patch.screens) update.student_device_mode = deviceModeFor(patch.screens);
    const { error: err } = await createClient().from('classes').update(update).eq('id', classId);
    if (err) {
      setError(/class_profile/.test(err.message) ? 'Class types need a one-time database update (migration 067).' : 'Could not save. Please try again.');
      return;
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const pickType = (type: ClassType) => {
    void save({ type, minutes: profile.minutes ?? defaultMinutes(type) });
    setChangingType(false);
  };

  // Not set up yet: ask once, with a way to skip.
  if (!profile.type && skipped && !changingType) return null;
  const showCards = !profile.type || changingType;

  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#0a121e]/85 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>
          {showCards ? 'What kind of class is it?' : 'This class'}
        </h2>
        <span className="flex items-center gap-3 text-xs">
          {saved && <span className="text-emerald-300">Saved</span>}
          {!profile.type && (
            <button type="button" onClick={() => { try { localStorage.setItem(skipKey, '1'); } catch { /* storage blocked */ } setSkipped(true); }} className="flex items-center gap-1 text-white/50 hover:text-white">
              Not now <X className="h-3.5 w-3.5" />
            </button>
          )}
          {changingType && profile.type && <button type="button" onClick={() => setChangingType(false)} className="text-white/50 hover:text-white">Cancel</button>}
        </span>
      </div>

      {showCards ? (
        <>
          <p className="mb-3 text-sm text-white/60">The room opens set up for this kind of class. Every tool stays one tap away.</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {CLASS_TYPES.map((t) => {
              const Icon = ICONS[t.key];
              const on = profile.type === t.key;
              return (
                <button key={t.key} type="button" onClick={() => pickType(t.key)}
                  className={`flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-colors ${on ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-black/20 hover:border-amber-300/50'}`}>
                  <Icon className="h-5 w-5 text-amber-300" aria-hidden />
                  <span className="font-semibold text-white">{t.name}</span>
                  <span className="text-[13px] leading-snug text-white/70">{t.line}</span>
                  <span className="text-[11px] text-white/45">{t.example}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="space-y-3 text-sm text-white/80">
          <div className="flex flex-wrap items-center gap-2">
            {(() => { const t = CLASS_TYPES.find((c) => c.key === profile.type)!; const Icon = ICONS[t.key]; return (
              <span className="flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-1.5">
                <Icon className="h-4 w-4 text-amber-300" aria-hidden /> <b className="font-semibold text-white">{t.name}</b>
              </span>
            ); })()}
            <button type="button" onClick={() => setChangingType(true)} className="text-xs text-cyan-200/80 hover:text-cyan-100">Change</button>
          </div>
          <div className="grid gap-2 sm:grid-cols-[150px_1fr] sm:items-center">
            <span className="text-xs text-white/55">Students are</span>
            <Choice<AgeGroup> label="Age" value={profile.age} onChange={(age) => void save({ age })} options={[['kids', 'Kids'], ['teens', 'Teens'], ['adults', 'Adults']]} />
            <span className="text-xs text-white/55">Second screens</span>
            <Choice<SecondScreens> label="Second screens" value={profile.screens} onChange={(screens) => void save({ screens })} options={[['all', 'All of them'], ['some', 'Some'], ['none', 'None']]} />
            <span className="text-xs text-white/55">Where you teach</span>
            <Choice<TeachPlace> label="Where you teach" value={profile.place} onChange={(place) => void save({ place })} options={[['online', 'Online'], ['classroom', 'In a classroom']]} />
            <span className="text-xs text-white/55">{profile.type === 'game-time' ? 'Game minutes' : 'Usual lesson length'}</span>
            <select value={profile.minutes ?? defaultMinutes(profile.type)} onChange={(e) => void save({ minutes: Number(e.target.value) })} aria-label="Usual lesson length"
              className="w-28 justify-self-start rounded-lg border border-white/15 bg-slate-950/70 px-2 py-1 text-xs text-white">
              {LENGTHS.map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
            {profile.type === 'game-time' && (
              <>
                <span className="text-xs text-white/55">Game choice</span>
                <label className="flex items-center gap-2 text-xs text-white/75">
                  <input type="checkbox" checked={profile.gameVote === true} onChange={(e) => void save({ gameVote: e.target.checked || undefined })} className="h-4 w-4 accent-amber-400" />
                  Students vote on the game
                </label>
              </>
            )}
          </div>
          {studentCount === 1 && <p className="text-xs text-white/50">One student on the class list: the room works as a 1-on-1 lesson.</p>}
        </div>
      )}
      {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
    </section>
  );
}
