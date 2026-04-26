'use client';

import { useState } from 'react';
import { usePlannerStore } from '@/stores/planner-store';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import { VideoLibraryModal } from './video-library-modal';
import { TextLibraryModal } from './text-library-modal';
import type { SourceMaterial } from '@/types/source-material';

type Tab = 'ted' | 'youtube' | 'reading' | 'text';

const TABS: { key: Tab; label: string }[] = [
  { key: 'ted',     label: 'Video Library' },
  { key: 'youtube', label: 'YouTube'        },
  { key: 'reading', label: 'Text Library'   },
  { key: 'text',    label: 'Text / Notes'   },
];

function formatDuration(secs: number) {
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

export function SourceInputPanel() {
  const { sourceMaterial, setSourceMaterial, setTopic } = usePlannerStore();
  const { isPro, loading: tierLoading } = useTeacherTier();

  const [open, setOpen] = useState(!!sourceMaterial);
  const [activeTab, setActiveTab] = useState<Tab>('ted');
  const [payload, setPayload] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTedModal, setShowTedModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);

  async function process(type: string, value: string) {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/source/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'NOT_CONFIGURED') {
          setError('YouTube extraction is not enabled. Use TED Library or paste text directly.');
        } else {
          setError(data.error ?? 'Failed to process source');
        }
        return;
      }
      const material: SourceMaterial = {
        sourceType: data.sourceType,
        sourceKey: data.sourceKey,
        title: data.title,
        summary: data.summary,
        duration: data.duration,
        ...(data.rawText ? { rawText: data.rawText } : {}),
      };
      setSourceMaterial(material);
      setTopic(data.title);
      setPayload('');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  function handleRemove() {
    setSourceMaterial(null);
    setError(null);
    setPayload('');
  }

  if (tierLoading) return null;

  if (!isPro) {
    return (
      <div className="rounded-xl border border-lc-border bg-lc-surface p-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎬</span>
          <div>
            <p className="text-sm font-semibold text-lc-text">Source-Based Lessons</p>
            <p className="text-xs text-lc-text3">Ground your lesson in a TED talk, YouTube video, or custom text. Pro feature.</p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400">Pro</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-lc-border bg-lc-surface">
        {/* Header toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-lc-text2 hover:text-lc-text transition-colors"
        >
          <span className="text-base">🎬</span>
          <span>{sourceMaterial ? `Source: ${sourceMaterial.title}` : '+ Add source material'}</span>
          {sourceMaterial && (
            <span className="ml-1 rounded-full bg-lc-blue/15 px-2 py-0.5 text-xs font-semibold text-lc-blue">Active</span>
          )}
          <span className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {open && (
          <div className="border-t border-lc-border px-4 pb-4 pt-3 space-y-3">
            {sourceMaterial ? (
              /* Summary preview */
              <div className="space-y-3">
                <div className="rounded-lg bg-lc-bg border border-lc-border p-3 space-y-1">
                  <p className="text-xs font-semibold text-lc-text2 uppercase tracking-wide">Source Summary</p>
                  <p className="text-sm font-medium text-lc-text">{sourceMaterial.title}</p>
                  {sourceMaterial.duration && (
                    <p className="text-xs text-lc-text3">
                      {formatDuration(sourceMaterial.duration)} • {sourceMaterial.sourceType}
                    </p>
                  )}
                  <p className="text-xs text-lc-text3 leading-relaxed line-clamp-4 mt-1">{sourceMaterial.summary}</p>
                </div>
                <button onClick={handleRemove} className="text-xs text-lc-text3 hover:text-red-400 transition-colors">
                  Remove source
                </button>
              </div>
            ) : (
              /* Input form */
              <div className="space-y-3">
                {/* Tab switcher */}
                <div className="flex gap-1 rounded-lg bg-lc-bg p-1">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => { setActiveTab(tab.key); setError(null); }}
                      className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                        activeTab === tab.key
                          ? 'bg-lc-card text-lc-text shadow-sm'
                          : 'text-lc-text3 hover:text-lc-text2'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Video Library */}
                {activeTab === 'ted' && (
                  <div className="space-y-2">
                    <p className="text-xs text-lc-text3">
                      Browse curated TED talks with built-in transcripts and auto-generated comprehension checkpoints.
                    </p>
                    <button
                      onClick={() => setShowTedModal(true)}
                      className="w-full rounded-lg border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Open Video Library →
                    </button>
                  </div>
                )}

                {/* Text Library */}
                {activeTab === 'reading' && (
                  <div className="space-y-2">
                    <p className="text-xs text-lc-text3">
                      Browse classic stories and VOA Learning English articles — ready to use with Read Aloud.
                    </p>
                    <button
                      onClick={() => setShowTextModal(true)}
                      className="w-full rounded-lg border border-amber-500/30 bg-amber-500/10 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors"
                    >
                      Open Text Library →
                    </button>
                  </div>
                )}

                {/* YouTube */}
                {activeTab === 'youtube' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={payload}
                      onChange={(e) => { setPayload(e.target.value); setError(null); }}
                      placeholder="Paste a YouTube URL or video ID…"
                      className="w-full rounded-lg border border-lc-border bg-lc-bg px-3 py-2 text-sm text-lc-text placeholder-lc-text3 focus:border-lc-blue focus:ring-1 focus:ring-lc-blue-glow"
                    />
                    {error && <p className="text-xs text-red-400">{error}</p>}
                    <button
                      onClick={() => process('youtube', payload)}
                      disabled={processing || !payload.trim()}
                      className="w-full rounded-lg bg-lc-blue py-2 text-sm font-semibold text-white hover:bg-lc-blue-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing…' : 'Process Source'}
                    </button>
                  </div>
                )}

                {/* Text / Notes */}
                {activeTab === 'text' && (
                  <div className="space-y-2">
                    <textarea
                      value={payload}
                      onChange={(e) => { setPayload(e.target.value); setError(null); }}
                      placeholder="Paste article text, lesson notes, lyrics, or any content (min 50 characters)…"
                      rows={5}
                      className="w-full rounded-lg border border-lc-border bg-lc-bg px-3 py-2 text-sm text-lc-text placeholder-lc-text3 focus:border-lc-blue focus:ring-1 focus:ring-lc-blue-glow resize-none"
                    />
                    {error && <p className="text-xs text-red-400">{error}</p>}
                    <button
                      onClick={() => process('text', payload)}
                      disabled={processing || payload.trim().length < 50}
                      className="w-full rounded-lg bg-lc-blue py-2 text-sm font-semibold text-white hover:bg-lc-blue-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing…' : 'Process Source'}
                    </button>
                    <p className="text-xs text-lc-text3">AI will summarise the content and ground all lesson activities in it.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showTedModal && (
        <VideoLibraryModal
          onSelect={(talkId, source) => {
            setShowTedModal(false);
            process(source, talkId);
          }}
          onClose={() => setShowTedModal(false)}
        />
      )}
      {showTextModal && (
        <TextLibraryModal
          onSelect={(entryId, source) => {
            setShowTextModal(false);
            process(source, entryId);
          }}
          onClose={() => setShowTextModal(false)}
        />
      )}
    </>
  );
}
