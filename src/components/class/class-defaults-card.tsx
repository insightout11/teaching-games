'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Settings2 } from 'lucide-react';
import { DIFFICULTIES, type Difficulty } from '@/lib/difficulty';
import { TONES, type Tone } from '@/stores/session-store';

export function ClassDefaultsCard({
  classId,
  initialDifficulty,
  initialTone,
}: {
  classId: string;
  initialDifficulty: string | null;
  initialTone: string | null;
}) {
  const [difficulty, setDifficulty] = useState(initialDifficulty ?? '');
  const [tone, setTone] = useState(initialTone ?? '');
  const supabase = createClient();

  const updatePreset = async (patch: { default_difficulty?: string | null; default_tone?: string | null }) => {
    await supabase.from('classes').update(patch).eq('id', classId);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Settings2 className="w-4 h-4 text-lc-text3 shrink-0" />
        <h2 className="text-sm font-semibold text-lc-text">Defaults</h2>
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
      </div>
    </Card>
  );
}
