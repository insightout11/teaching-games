'use client';

import { useState } from 'react';
import { usePlannerStore } from '@/stores/planner-store';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import { VideoLibraryModal } from './video-library-modal';
import { TextLibraryModal } from './text-library-modal';
import type { SourceMaterial } from '@/types/source-material';

type Tab = 'video' | 'text' | 'upload';

const TABS: { key: Tab; label: string }[] = [
  { key: 'video',  label: 'Video'  },
  { key: 'text',   label: 'Text'   },
  { key: 'upload', label: 'Upload' },
];

const UPLOAD_ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

function formatDuration(secs: number) {
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

export function SourceInputPanel() {
  const { sourceMaterial, setSourceMaterial, setTopic } = usePlannerStore();
  const { isPro, loading: tierLoading } = useTeacherTier();

  const [activeTab, setActiveTab] = useState<Tab>('video');
  const [videoPayload, setVideoPayload] = useState('');
  const [textPayload, setTextPayload] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTedModal, setShowTedModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

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
          setError('YouTube extraction is not enabled. Use Video Library or paste text directly.');
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
        ...(data.slides ? { slides: data.slides } : {}),
      };
      setSourceMaterial(material);
      setTopic(data.title);
      setVideoPayload('');
      setTextPayload('');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  function handleFileSelect(file: File) {
    setError(null);
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10 MB.');
      return;
    }
    if (!UPLOAD_ALLOWED.includes(file.type)) {
      setError('Unsupported file type. Please upload a PDF or image (JPG, PNG, WebP).');
      return;
    }
    setUploadFile(file);
  }

  async function processUpload() {
    if (!uploadFile) return;
    setProcessing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      const res = await fetch('/api/source/extract-document', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to process file');
        return;
      }
      const material: SourceMaterial = {
        sourceType: data.sourceType,
        title: data.title,
        summary: data.summary,
      };
      setSourceMaterial(material);
      setTopic(data.title);
      setUploadFile(null);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  function handleRemove() {
    setSourceMaterial(null);
    setError(null);
    setVideoPayload('');
    setTextPayload('');
    setUploadFile(null);
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
        <div className="px-4 py-3 border-b border-lc-border">
          <p className="text-xs font-semibold text-lc-text2 uppercase tracking-wide">Source material <span className="ml-1 rounded-full bg-lc-text3/10 px-1.5 py-0.5 text-lc-text3 normal-case font-normal tracking-normal">optional</span></p>
          <p className="text-xs text-lc-text3 mt-0.5">Ground all activities in a video, article, or your own materials.</p>
        </div>

        <div className="px-4 pb-4 pt-3 space-y-3">
          {sourceMaterial ? (
            /* Active source summary */
            <div className="space-y-2">
              <div className="rounded-lg bg-lc-bg border border-lc-blue/30 p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-lc-blue uppercase tracking-wide mb-0.5">Source active</p>
                    <p className="text-sm font-medium text-lc-text">{sourceMaterial.title}</p>
                    {sourceMaterial.duration && (
                      <p className="text-xs text-lc-text3">{formatDuration(sourceMaterial.duration)} · {sourceMaterial.sourceType}</p>
                    )}
                    <p className="text-xs text-lc-text3 leading-relaxed line-clamp-3 mt-1">{sourceMaterial.summary}</p>
                  </div>
                </div>
              </div>
              <button onClick={handleRemove} className="text-xs text-lc-text3 hover:text-red-400 transition-colors">
                Remove source
              </button>
            </div>
          ) : (
            /* Input form */
            <div className="space-y-3">
              {/* 3-tab switcher */}
              <div className="flex gap-1 rounded-lg bg-lc-bg p-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setError(null); setUploadFile(null); }}
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

              {/* Video: curated library + YouTube */}
              {activeTab === 'video' && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowTedModal(true)}
                    className="w-full rounded-lg border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    Browse Video Library →
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-lc-border" />
                    <span className="text-xs text-lc-text3">or paste a YouTube URL</span>
                    <div className="flex-1 h-px bg-lc-border" />
                  </div>
                  <input
                    type="text"
                    value={videoPayload}
                    onChange={(e) => { setVideoPayload(e.target.value); setError(null); }}
                    placeholder="https://youtube.com/watch?v=…"
                    className="w-full rounded-lg border border-lc-border bg-lc-bg px-3 py-2 text-sm text-lc-text placeholder-lc-text3 focus:border-lc-blue focus:ring-1 focus:ring-lc-blue-glow"
                  />
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  {videoPayload.trim() && (
                    <button
                      onClick={() => process('youtube', videoPayload)}
                      disabled={processing}
                      className="w-full rounded-lg bg-lc-blue py-2 text-sm font-semibold text-white hover:bg-lc-blue-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing…' : 'Process Video'}
                    </button>
                  )}
                </div>
              )}

              {/* Text: curated library + paste */}
              {activeTab === 'text' && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowTextModal(true)}
                    className="w-full rounded-lg border border-amber-500/30 bg-amber-500/10 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors"
                  >
                    Browse Text Library →
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-lc-border" />
                    <span className="text-xs text-lc-text3">or paste your own text</span>
                    <div className="flex-1 h-px bg-lc-border" />
                  </div>
                  <textarea
                    value={textPayload}
                    onChange={(e) => { setTextPayload(e.target.value); setError(null); }}
                    placeholder="Paste article text, lesson notes, lyrics, or any content (min 50 characters)…"
                    rows={4}
                    className="w-full rounded-lg border border-lc-border bg-lc-bg px-3 py-2 text-sm text-lc-text placeholder-lc-text3 focus:border-lc-blue focus:ring-1 focus:ring-lc-blue-glow resize-none"
                  />
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <button
                    onClick={() => process('text', textPayload)}
                    disabled={processing || textPayload.trim().length < 50}
                    className="w-full rounded-lg bg-lc-blue py-2 text-sm font-semibold text-white hover:bg-lc-blue-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing…' : 'Process Text'}
                  </button>
                </div>
              )}

              {/* Upload: PDF or image */}
              {activeTab === 'upload' && (
                <div className="space-y-2">
                  {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                  <div
                    className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                      uploadFile
                        ? 'border-lc-blue/50 bg-lc-blue/5'
                        : 'border-lc-border hover:border-lc-blue/40 cursor-pointer'
                    }`}
                    onClick={() => !uploadFile && document.getElementById('doc-upload')?.click()}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('doc-upload')?.click(); }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f) handleFileSelect(f);
                    }}
                  >
                    <input
                      id="doc-upload"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileSelect(f);
                        e.target.value = '';
                      }}
                    />
                    {uploadFile ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-lc-text">{uploadFile.name}</p>
                        <p className="text-xs text-lc-text3">{(uploadFile.size / 1024).toFixed(0)} KB</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); setUploadFile(null); setError(null); }}
                          className="text-xs text-lc-text3 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm text-lc-text2">Drop a file here or click to browse</p>
                        <p className="text-xs text-lc-text3">PDF, JPG, PNG, WebP — max 10 MB</p>
                      </div>
                    )}
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <button
                    onClick={processUpload}
                    disabled={processing || !uploadFile}
                    className="w-full rounded-lg bg-lc-blue py-2 text-sm font-semibold text-white hover:bg-lc-blue-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Extracting content…' : 'Extract Content'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
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
