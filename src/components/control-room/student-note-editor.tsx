'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface StudentNoteEditorProps {
  sessionId: string;
  studentId: string;
  classId: string;
  teacherId: string;
  initialNote: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

export function StudentNoteEditor({ sessionId, studentId, classId, teacherId, initialNote }: StudentNoteEditorProps) {
  const [note, setNote] = useState(initialNote);
  const [expanded, setExpanded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  function handleChange(value: string) {
    setNote(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus('saving');
    debounceRef.current = setTimeout(async () => {
      await supabase.from('student_session_notes').upsert(
        {
          session_id: sessionId,
          student_id: studentId,
          class_id: classId,
          teacher_id: teacherId,
          note: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id,student_id' }
      );
      setSaveStatus('saved');
    }, 800);
  }

  if (!expanded) {
    return (
      <div className="pl-10 mt-1">
        {note.trim() ? (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-lc-text3 hover:text-lc-text transition-colors text-left line-clamp-1 max-w-xs"
          >
            <span className="text-lc-text3/50 mr-1">Note:</span>{note}
          </button>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-lc-text3/50 hover:text-lc-text3 transition-colors"
          >
            + Add private note
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pl-10 mt-2">
      <div className="relative">
        <textarea
          autoFocus
          className="w-full bg-lc-surface border border-lc-border rounded-lg px-3 py-2 text-xs text-lc-text placeholder:text-lc-text3 resize-none focus:outline-none focus:ring-1 focus:ring-lc-blue/50 h-16"
          placeholder="Private note for your future planning…"
          value={note}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => { if (!note.trim()) setExpanded(false); }}
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-lc-text3/50">Only you can see this</span>
          <span className="text-[10px] text-lc-text3">
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
