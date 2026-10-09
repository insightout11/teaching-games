'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FLAP_FONT } from '@/components/ui/split-flap';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Baby, Settings2 } from 'lucide-react';
import { DIFFICULTIES, type Difficulty } from '@/lib/difficulty';
import { TONES, type Tone } from '@/stores/session-store';

export function ClassDefaultsCard({
  classId,
  initialDifficulty,
  initialTone,
  initialStudentDeviceMode,
  initialJunior = false,
}: {
  classId: string;
  initialDifficulty: string | null;
  initialTone: string | null;
  initialStudentDeviceMode?: 'devices' | 'shared-screen';
  initialJunior?: boolean;
}) {
  const [difficulty, setDifficulty] = useState(initialDifficulty ?? '');
  const [tone, setTone] = useState(initialTone ?? '');
  const [studentDeviceMode, setStudentDeviceMode] = useState(initialStudentDeviceMode ?? 'devices');
  const [junior, setJunior] = useState(initialJunior);
  const supabase = createClient();

  const updatePreset = async (patch: { default_difficulty?: string | null; default_tone?: string | null; student_device_mode?: string; junior?: boolean }) => {
    await supabase.from('classes').update(patch).eq('id', classId);
  };

  return (
    <Card className="border-white/[0.07] bg-[#0a121e]/85 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Settings2 className="w-4 h-4 text-lc-text3 shrink-0" />
        <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>Settings</h2>
      </div>
      <p className="text-xs text-lc-text3 mb-3">Used when starting a new session for this class.</p>
      <div className="space-y-2">
        <Select
          value={difficulty}
          onChange={(e) => {
            const value = e.target.value || null;
            setDifficulty(e.target.value);
            updatePreset({ default_difficulty: value });
          }}
          inputSize="compact"
          className="w-full"
          title="Default difficulty"
        >
          <option value="">Level: not set</option>
          {DIFFICULTIES.map((d: Difficulty) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
        <Select
          value={tone}
          onChange={(e) => {
            const value = e.target.value || null;
            setTone(e.target.value);
            updatePreset({ default_tone: value });
          }}
          inputSize="compact"
          className="w-full"
          title="Default tone"
        >
          <option value="">Tone: not set</option>
          {TONES.map((t: Tone) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <div>
          <Select
            value={studentDeviceMode}
            onChange={(e) => {
              const value = e.target.value as 'devices' | 'shared-screen';
              setStudentDeviceMode(value);
              updatePreset({ student_device_mode: value });
            }}
            inputSize="compact"
            className="w-full"
            title="How students answer"
          >
            <option value="devices">Students answer on their own devices</option>
            <option value="shared-screen">One shared screen — students answer out loud</option>
          </Select>
          <p className="mt-1 text-[11px] text-lc-text3">
            {studentDeviceMode === 'shared-screen'
              ? "We'll flag games that need student devices when you launch with this class."
              : 'Used to warn you before launching a game that needs student devices.'}
          </p>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-lc-border p-3">
          <input
            type="checkbox"
            checked={junior}
            onChange={(e) => {
              setJunior(e.target.checked);
              updatePreset({ junior: e.target.checked });
            }}
            className="mt-0.5 h-4 w-4 accent-amber-400"
          />
          <span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-lc-text">
              <Baby className="h-4 w-4 text-lc-text3" aria-hidden /> Junior class (about ages 5–9)
            </span>
            <span className="mt-0.5 block text-[11px] text-lc-text3">
              Picture answers on phones and no rankings, for kids who don&apos;t read much yet.
            </span>
          </span>
        </label>
      </div>
    </Card>
  );
}
