'use client';

import { useState } from 'react';
import { usePlannerStore } from '@/stores/planner-store';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import { VideoLibraryModal } from './video-library-modal';
import { TextLibraryModal } from './text-library-modal';
import type { SourceBriefingMode, SourceBriefingOption, SourceMaterial } from '@/types/source-material';

type Tab = 'video' | 'text' | 'upload';
type SourceExtractResponse = SourceMaterial & {
  error?: string;
  code?: string;
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'video',  label: 'Video'  },
  { key: 'text',   label: 'Text'   },
  { key: 'upload', label: 'Upload' },
];

const UPLOAD_ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const BRIEFING_MODE_LABEL: Record<SourceBriefingMode, string> = {
  exact: 'Original passage',
  excerpt: 'Short section',
  adapted: 'Adapted reading',
  generated: 'Generated reading',
};

function formatDuration(secs: number) {
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function countWords(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function estimateReadMinutes(wordCount: number) {
  if (wordCount <= 0) return 0;
  return Math.max(1, Math.ceil(wordCount / 140));
}

function getSourcePreview(material: SourceMaterial) {
  return material.briefingText ?? material.rawText ?? material.summary;
}

function getBriefingOptionLabel(option: SourceBriefingOption) {
  if (option.id === 'recommended') return 'Recommended student reading';
  if (option.id === 'source-excerpt') return 'Original source passage';
  if (option.label === 'Recommended briefing') return 'Recommended student reading';
  if (option.label === 'Closest source excerpt') return 'Original source passage';
  return option.label;
}

function getBriefingOptionBadge(option: SourceBriefingOption) {
  if (option.id === 'recommended') return 'Best for class';
  if (option.id === 'source-excerpt') return 'Original passage';
  return BRIEFING_MODE_LABEL[option.mode];
}

function getBriefingOptionTypeBadge(option: SourceBriefingOption) {
  if (option.id === 'recommended') return BRIEFING_MODE_LABEL[option.mode];
  if (option.id === 'source-excerpt') return null;
  return null;
}

function getBriefingOptionExplanation(option: SourceBriefingOption) {
  if (option.id === 'source-excerpt') {
    return 'Original wording from the upload. Choose this if you want students to read the source more directly.';
  }

  if (option.id === 'recommended') {
    if (option.mode === 'exact') {
      return 'Best classroom choice. Uses the original uploaded wording with cleanup only.';
    }
    if (option.mode === 'excerpt') {
      return 'Best classroom choice. A selected section from the original upload, shortened for the briefing.';
    }
    if (option.mode === 'adapted') {
      return 'Best classroom choice. Rewritten for student readability while staying grounded in the upload.';
    }
    return 'Best classroom choice. Generated from the uploaded source details when no clean passage was available.';
  }

  if (option.mode === 'excerpt' || option.mode === 'exact') {
    return 'A shorter original section from the uploaded source.';
  }
  if (option.mode === 'adapted') {
    return 'Adapted for student readability while preserving the source content.';
  }
  return 'Generated from the uploaded source details.';
}

function withGeneratedOption(material: SourceMaterial): SourceBriefingOption[] {
  const existing = Array.isArray(material.briefingOptions)
    ? material.briefingOptions.filter((option) => option.text?.trim().length > 0)
    : [];
  if (existing.length > 0) return existing;

  const text = getSourcePreview(material);
  return [{
    id: 'recommended',
    label: 'Recommended student reading',
    description: 'Best fit for a short class briefing.',
    text,
    mode: material.briefingMode ?? 'adapted',
    wordCount: countWords(text),
  }];
}

function buildSourceMaterial(data: SourceExtractResponse): SourceMaterial {
  return {
    sourceType: data.sourceType,
    sourceKey: data.sourceKey,
    title: data.title,
    summary: data.summary,
    duration: data.duration,
    ...(data.rawText ? { rawText: data.rawText } : {}),
    ...(data.briefingText ? { briefingText: data.briefingText } : {}),
    ...(data.briefingMode ? { briefingMode: data.briefingMode } : {}),
    ...(data.briefingOptions ? { briefingOptions: data.briefingOptions } : {}),
    ...(data.sourceText ? { sourceText: data.sourceText } : {}),
    ...(data.documentKind ? { documentKind: data.documentKind } : {}),
    ...(data.wordCount ? { wordCount: data.wordCount } : {}),
    ...(data.slides ? { slides: data.slides } : {}),
  };
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
  const [pendingSource, setPendingSource] = useState<SourceMaterial | null>(null);
  const [selectedBriefingOptionId, setSelectedBriefingOptionId] = useState<string | null>(null);
  const [briefingDraft, setBriefingDraft] = useState('');

  const activeSourcePreview = sourceMaterial ? getSourcePreview(sourceMaterial) : '';
  const activeSourceWordCount = countWords(activeSourcePreview);
  const briefingDraftWordCount = countWords(briefingDraft);

  function startBriefingReview(material: SourceMaterial) {
    const briefingOptions = withGeneratedOption(material);
    const firstOption = briefingOptions[0];
    setPendingSource({
      ...material,
      briefingOptions,
      briefingText: firstOption.text,
      rawText: firstOption.text,
      briefingMode: firstOption.mode,
    });
    setSelectedBriefingOptionId(firstOption.id);
    setBriefingDraft(firstOption.text);
  }

  function applyBriefingOption(option: SourceBriefingOption) {
    setSelectedBriefingOptionId(option.id);
    setBriefingDraft(option.text);
  }

  function confirmPendingSource() {
    if (!pendingSource) return;
    const finalText = briefingDraft.trim();
    if (finalText.length < 50) {
      setError('Briefing text is too short. Keep at least a short passage for students.');
      return;
    }
    const selectedOption = pendingSource.briefingOptions?.find((option) => option.id === selectedBriefingOptionId);
    const material: SourceMaterial = {
      ...pendingSource,
      briefingText: finalText,
      rawText: finalText,
      briefingMode: selectedOption?.mode ?? pendingSource.briefingMode ?? 'adapted',
      wordCount: countWords(finalText),
    };
    setSourceMaterial(material);
    setTopic(material.title);
    setPendingSource(null);
    setSelectedBriefingOptionId(null);
    setBriefingDraft('');
    setUploadFile(null);
    setError(null);
  }

  function cancelPendingSource() {
    setPendingSource(null);
    setSelectedBriefingOptionId(null);
    setBriefingDraft('');
    setError(null);
  }

  async function process(type: string, value: string) {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/source/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload: value }),
      });
      const data = await res.json() as SourceExtractResponse;
      if (!res.ok) {
        if (data.code === 'NOT_CONFIGURED') {
          setError('YouTube extraction is not enabled. Use Video Library or paste text directly.');
        } else {
          setError(data.error ?? 'Failed to process source');
        }
        return;
      }
      const material = buildSourceMaterial(data);
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
      const data = await res.json() as SourceExtractResponse;
      if (!res.ok) {
        setError(data.error ?? 'Failed to process file');
        return;
      }
      startBriefingReview(buildSourceMaterial(data));
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
    cancelPendingSource();
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
          {pendingSource ? (
            <div className="space-y-4">
              <div className="border-b border-lc-border pb-3">
                <p className="text-xs font-semibold text-lc-blue uppercase tracking-wide">Review Captain&apos;s Briefing</p>
                <p className="mt-1 text-base font-semibold text-lc-text">{pendingSource.title}</p>
                <p className="mt-1 text-xs text-lc-text3 leading-relaxed">
                  Choose the reading version students will see, then edit the final text if needed.
                </p>
              </div>

              <div className="ml-3 space-y-2 border-l border-lc-blue/20 pl-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-lc-text2">Reading options</p>
                <div className="grid gap-2">
                  {(pendingSource.briefingOptions ?? []).map((option) => {
                    const selected = selectedBriefingOptionId === option.id;
                    const words = option.wordCount ?? countWords(option.text);
                    const typeBadge = getBriefingOptionTypeBadge(option);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => applyBriefingOption(option)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          selected
                            ? 'border-lc-blue bg-lc-blue/10 shadow-[inset_3px_0_0_rgba(59,130,246,0.9)]'
                            : 'border-lc-border/80 bg-lc-bg/70 hover:border-lc-blue/40 hover:bg-lc-bg'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-lc-text">{getBriefingOptionLabel(option)}</p>
                            <p className="mt-1 text-xs text-lc-text2 leading-relaxed">{getBriefingOptionExplanation(option)}</p>
                            {option.description && (
                              <p className="mt-1 text-xs text-lc-text3">{option.description}</p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="rounded-full bg-lc-blue/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-lc-blue">
                              {getBriefingOptionBadge(option)}
                            </span>
                            {typeBadge && (
                              <span className="rounded-full bg-lc-text3/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-lc-text3">
                                {typeBadge}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-lc-text3">
                          {words} words - ~{estimateReadMinutes(words)} min read
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 border-t border-lc-border pt-3">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="briefing-review-text" className="text-xs font-semibold uppercase tracking-wide text-lc-text2">
                    Briefing text
                  </label>
                  <span className="text-xs text-lc-text3">
                    {briefingDraftWordCount} words - ~{estimateReadMinutes(briefingDraftWordCount)} min
                  </span>
                </div>
                <textarea
                  id="briefing-review-text"
                  value={briefingDraft}
                  onChange={(e) => setBriefingDraft(e.target.value)}
                  rows={8}
                  className="w-full resize-y rounded-lg border border-lc-border bg-lc-bg px-3 py-2 text-sm leading-relaxed text-lc-text placeholder-lc-text3 focus:border-lc-blue focus:ring-1 focus:ring-lc-blue-glow"
                />
                <p className="text-xs text-lc-blue leading-relaxed">
                  This text will be used for the reader, vocabulary, checks, and discussion prompts.
                </p>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="sticky bottom-0 -mx-4 -mb-4 flex items-center justify-between gap-2 border-t border-lc-border bg-lc-surface/95 px-4 py-3 backdrop-blur">
                <button
                  type="button"
                  onClick={cancelPendingSource}
                  className="rounded-lg border border-lc-border px-3 py-2 text-xs font-semibold text-lc-text2 hover:bg-lc-bg transition-colors"
                >
                  Back to upload
                </button>
                <button
                  type="button"
                  onClick={confirmPendingSource}
                  disabled={briefingDraft.trim().length < 50}
                  className="rounded-lg bg-lc-blue px-4 py-2 text-xs font-semibold text-white hover:bg-lc-blue-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Use this briefing
                </button>
              </div>
            </div>
          ) : sourceMaterial ? (
            /* Active source summary */
            <div className="space-y-2">
              <div className="rounded-lg bg-lc-bg border border-lc-blue/30 p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-lc-blue uppercase tracking-wide mb-0.5">Source active</p>
                    <p className="text-sm font-medium text-lc-text">{sourceMaterial.title}</p>
                    {sourceMaterial.duration && (
                      <p className="text-xs text-lc-text3">{formatDuration(sourceMaterial.duration)} - {sourceMaterial.sourceType}</p>
                    )}
                    {sourceMaterial.briefingMode && (
                      <p className="text-xs text-lc-text3">
                        Captain&apos;s Briefing: {BRIEFING_MODE_LABEL[sourceMaterial.briefingMode]} - {activeSourceWordCount} words
                      </p>
                    )}
                    <p className="text-xs text-lc-text3 leading-relaxed line-clamp-3 mt-1">{activeSourcePreview}</p>
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
