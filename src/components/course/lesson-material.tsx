'use client';

import { useState } from 'react';
import { FileText, Film, Loader2, Search, X } from 'lucide-react';
import type { Difficulty } from '@/lib/difficulty';
import type { CourseOutlineLesson } from '@/lib/course';
import type { SourceType } from '@/types/source-material';

type LibraryHit = { kind: 'video' | 'reading'; sourceType: SourceType; id: string; title: string; listening?: boolean };
export type MaterialLesson = Pick<CourseOutlineLesson, 'title' | 'topic' | 'suggestedSource' | 'ownMaterial'> & { _id: string };

const field = 'w-full rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2 text-sm text-lc-text placeholder:text-white/35 focus:border-cyan-300/60 focus:outline-none';

/** Material for one lesson: the library item, the teacher's own text, or a search to pick one. */
export function LessonMaterial({ lesson, level, junior, onChange }: { lesson: MaterialLesson; level: Difficulty; junior: boolean; onChange: (patch: Partial<MaterialLesson>) => void }) {
  const [mode, setMode] = useState<'idle' | 'search' | 'own'>('idle');
  const [q, setQ] = useState(lesson.topic);
  const [hits, setHits] = useState<LibraryHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [ownTitle, setOwnTitle] = useState(lesson.ownMaterial?.title ?? lesson.title);
  const [ownText, setOwnText] = useState(lesson.ownMaterial?.text ?? '');

  const search = async () => {
    setSearching(true);
    try {
      const res = await fetch(`/api/library/search?q=${encodeURIComponent(q)}&level=${encodeURIComponent(level)}${junior ? '&kids=1' : ''}`);
      const data = (await res.json().catch(() => ({ results: [] }))) as { results: LibraryHit[] };
      setHits(data.results ?? []);
    } finally {
      setSearching(false);
    }
  };

  if (mode === 'search') {
    return (
      <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="flex gap-2">
          <input id={`q-${lesson._id}`} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void search(); }} className={field} placeholder="Search the library" aria-label="Search the library" />
          <button type="button" onClick={() => void search()} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 text-sm font-semibold text-[#03202a]">{searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</button>
          <button type="button" onClick={() => setMode('idle')} aria-label="Close search" className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {hits && hits.length === 0 && <p className="text-xs text-white/50">Nothing found. Try another word, or use your own text.</p>}
        {hits && hits.length > 0 && (
          <ul className="space-y-1">
            {hits.map((h) => (
              <li key={`${h.sourceType}-${h.id}`}>
                <button type="button" onClick={() => { onChange({ suggestedSource: h, ownMaterial: null }); setMode('idle'); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-white/80 hover:bg-white/[0.06]">
                  {h.kind === 'video' ? <Film className="h-3.5 w-3.5 shrink-0 text-cyan-300" /> : <FileText className="h-3.5 w-3.5 shrink-0 text-cyan-300" />}
                  <span className="truncate">{h.title}</span>
                  {h.listening && <span className="ml-auto shrink-0 text-[10px] font-bold tracking-wider text-amber-300">LISTENING</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (mode === 'own') {
    return (
      <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
        <input id={`own-title-${lesson._id}`} value={ownTitle} onChange={(e) => setOwnTitle(e.target.value)} className={field} placeholder="Title" aria-label="Material title" />
        <textarea id={`own-text-${lesson._id}`} value={ownText} onChange={(e) => setOwnText(e.target.value)} rows={5} className={`${field} resize-y`} placeholder="Paste an article, a story or a chapter" aria-label="Material text" />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setMode('idle')} className="text-sm text-white/50 hover:text-white">Cancel</button>
          <button type="button" disabled={ownText.trim().length < 80} onClick={() => { onChange({ ownMaterial: { title: ownTitle.trim() || lesson.title, text: ownText.trim().slice(0, 20000) }, suggestedSource: null }); setMode('idle'); }} className="rounded-lg bg-cyan-400 px-3 py-1.5 text-sm font-semibold text-[#03202a] disabled:opacity-40">Use this text</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {lesson.ownMaterial ? (
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-amber-300/10 px-2 py-1 text-amber-200"><FileText className="h-3 w-3 shrink-0" /><span className="truncate">Your text: {lesson.ownMaterial.title}</span></span>
      ) : lesson.suggestedSource ? (
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-cyan-300/10 px-2 py-1 text-cyan-200">
          {lesson.suggestedSource.kind === 'video' ? <Film className="h-3 w-3 shrink-0" /> : <FileText className="h-3 w-3 shrink-0" />}
          <span className="truncate">{lesson.suggestedSource.title}</span>
        </span>
      ) : (
        <span className="text-white/45">No material: built from the topic</span>
      )}
      <button type="button" onClick={() => setMode('search')} className="font-semibold text-cyan-300 hover:text-cyan-200">Find in library</button>
      <button type="button" onClick={() => setMode('own')} className="font-semibold text-cyan-300 hover:text-cyan-200">Use my own text</button>
      {(lesson.suggestedSource || lesson.ownMaterial) && (
        <button type="button" onClick={() => onChange({ suggestedSource: null, ownMaterial: null })} className="text-white/45 hover:text-white">Remove</button>
      )}
    </div>
  );
}

