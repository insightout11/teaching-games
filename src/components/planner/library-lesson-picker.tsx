'use client';

import { useMemo, useState } from 'react';
import { BookOpen, Headphones } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import type { FlightPlanPreset } from '@/lib/flight-plan-presets';
import { listeningClipsFor } from '@/lib/listening-pack';
import { getLibrarySourceMaterial, listBookLessons, listLibraryEntriesWithListeningPack } from '@/lib/library-source-material';
import type { SourceMaterial, SourceType } from '@/types/source-material';

// Listening and Reading fly on library material with prepared packs: a listening clip, or a book
// lesson. Same lists as the Live Room picker (flight-plan-panel.tsx).

interface Props {
  preset: FlightPlanPreset;
  difficulty: string;
  onConfirm: (source: SourceMaterial, topic: string) => void;
  onCancel: () => void;
}

export function LibraryLessonPicker({ preset, difficulty, onConfirm, onCancel }: Props) {
  const listening = preset.id === 'listening-60';
  const clips = useMemo(() => (listening ? listeningClipsFor(listLibraryEntriesWithListeningPack(), difficulty) : []), [listening, difficulty]);
  const books = useMemo(() => (listening ? [] : listBookLessons()), [listening]);
  const [picked, setPicked] = useState('');

  const confirm = () => {
    if (listening) {
      const clip = clips.find((c) => c.id === picked);
      const source = clip ? getLibrarySourceMaterial({ kind: 'library', sourceType: clip.sourceType as SourceType, id: clip.id, title: clip.title }) : null;
      if (clip && source) onConfirm(source, clip.title);
      return;
    }
    const book = books.find((b) => b.id === picked);
    const source = book ? getLibrarySourceMaterial({ kind: 'library', sourceType: 'books' as SourceType, id: book.id, title: book.title }) : null;
    if (book && source) onConfirm(source, `${book.book}: ${book.title}`);
  };

  const row = (id: string, icon: React.ReactNode, title: string, meta: string) => (
    <button key={id} type="button" onClick={() => setPicked(id)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all ${picked === id ? 'border-lc-blue/50 bg-lc-blue/10 text-lc-text' : 'border-lc-border bg-lc-surface text-lc-text2 hover:border-lc-blue/30 hover:text-lc-text'}`}>
      {icon}
      <span className="min-w-0 flex-1 truncate">{title}</span>
      <span className="shrink-0 text-xs text-lc-text3">{meta}</span>
    </button>
  );

  return (
    <Modal open title={preset.name} onClose={onCancel}>
      <p className="-mt-2 mb-4 text-sm text-lc-text2">{preset.description}</p>
      <p className="mb-2 text-sm font-medium text-lc-text2">{listening ? `Choose a listening clip (${difficulty}, nearest level first)` : 'Choose a book lesson'}</p>
      <div className="grid max-h-80 gap-1.5 overflow-y-auto pr-1">
        {listening
          ? clips.map((c) => row(c.id, <Headphones className="h-4 w-4 shrink-0 text-lc-blue" />, c.title, `${c.cefr} · ${c.minutes} min`))
          : books.map((b) => row(b.id, <BookOpen className="h-4 w-4 shrink-0 text-lc-blue" />, `${b.book} · ${b.order}. ${b.title}`, b.ageBand))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-lc-text3 hover:text-lc-text">Cancel</button>
        <button type="button" disabled={!picked} onClick={confirm} className="rounded-lg bg-lc-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Use this {listening ? 'clip' : 'lesson'}</button>
      </div>
    </Modal>
  );
}
