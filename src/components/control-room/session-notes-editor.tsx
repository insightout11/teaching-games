'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface SessionNotesEditorProps {
  sessionId: string;
  teacherId: string;
  initialContent: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

export function SessionNotesEditor({ sessionId, teacherId, initialContent }: SessionNotesEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  function handleChange(value: string) {
    setContent(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus('saving');
    debounceRef.current = setTimeout(async () => {
      await supabase.from('session_notes').upsert(
        {
          session_id: sessionId,
          teacher_id: teacherId,
          content: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id,teacher_id' }
      );
      setSaveStatus('saved');
    }, 800);
  }

  return (
    <div className="bg-lc-card rounded-2xl border border-lc-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lc-text">Session Notes</h2>
        {saveStatus === 'saving' && <span className="text-xs text-lc-text3">Saving…</span>}
        {saveStatus === 'saved' && <span className="text-xs text-lc-text3">Saved</span>}
      </div>
      <textarea
        className="w-full h-40 bg-lc-surface border border-lc-border rounded-xl px-4 py-3 text-sm text-lc-text placeholder:text-lc-text3 resize-none focus:outline-none focus:ring-2 focus:ring-lc-blue/50"
        placeholder="Add notes about this session…"
        value={content}
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  );
}
