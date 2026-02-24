'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface FreezeContentProps {
  sessionId: string;
}

export function FreezeContent({ sessionId }: FreezeContentProps) {
  const [frozen, setFrozen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadFrozenState() {
      const { data } = await supabase
        .from('sessions')
        .select('frozen')
        .eq('id', sessionId)
        .single();
      if (data) setFrozen(data.frozen);
    }
    loadFrozenState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleToggle = async () => {
    const newFrozen = !frozen;
    setFrozen(newFrozen); // optimistic
    setIsUpdating(true);

    await supabase
      .from('sessions')
      .update({ frozen: newFrozen })
      .eq('id', sessionId);

    setIsUpdating(false);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full transition-colors ${frozen ? 'bg-orange-400' : 'bg-green-400'}`} />
        <span className="text-xs text-slate-400">
          {frozen ? 'Input frozen' : 'Input active'}
        </span>
      </div>

      <button
        onClick={handleToggle}
        disabled={isUpdating}
        className={`w-full py-3 rounded-xl font-game text-sm transition-all border disabled:opacity-50 ${
          frozen
            ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
            : 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30'
        }`}
      >
        {frozen ? 'UNFREEZE INPUT' : 'FREEZE INPUT'}
      </button>

      <p className="text-xs text-slate-500 text-center leading-relaxed">
        {frozen
          ? 'Students see a paused message'
          : 'Students can submit answers'}
      </p>
    </div>
  );
}
