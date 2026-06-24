'use client';

import { useMemo, useState } from 'react';
import { usePlannerStore } from '@/stores/planner-store';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import { VideoLibraryModal } from './video-library-modal';
import { TextLibraryModal } from './text-library-modal';
import { CheckCircle2, Compass, FileText, Film, Library, Link2, Sparkles, UploadCloud, X } from 'lucide-react';
import type { SourceBriefingMode, SourceBriefingOption, SourceMaterial } from '@/types/source-material';
import { recommendSources, type LibraryRecommendation } from '@/lib/source-library';

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

const TAB_HELPER: Record<Tab, string> = {
  video: 'Use a curated classroom video or paste a YouTube link.',
  text: 'Choose a reading or paste your own source text.',
  upload: 'Upload a PDF or image and choose the student reading.',
};

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
  if (option.id === 'original-full') return 'Full original reading';
  if (option.id === 'recommended') return 'Recommended student reading';
  if (option.id === 'source-excerpt') return 'Original source passage';
  if (option.label === 'Recommended briefing') return 'Recommended student reading';
  if (option.label === 'Closest source excerpt') return 'Original source passage';
  return option.label;
}

function getBriefingOptionBadge(option: SourceBriefingOption) {
  if (option.id === 'original-full') return 'Original passage';
  if (option.id === 'recommended') return 'Best for class';
  if (option.id === 'source-excerpt') return 'Original passage';
  return BRIEFING_MODE_LABEL[option.mode];
}

function getBriefingOptionTypeBadge(option: SourceBriefingOption) {
  if (option.id === 'recommended') return BRIEFING_MODE_LABEL[option.mode];
  if (option.id === 'original-full') return null;
  if (option.id === 'source-excerpt') return null;
  return null;
}

function getBriefingOptionExplanation(option: SourceBriefingOption) {
  if (option.id === 'original-full') {
    return 'Original wording from the upload. It may be longer or less polished, but it has not been adapted.';
  }

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

function SourceProcessingNotice({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-lc-blue/30 bg-lc-blue/10 p-3">
      <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-lc-blue/30 border-t-lc-blue" />
      <div>
        <p className="text-sm font-semibold text-lc-text">{label}</p>
        <p className="text-xs text-lc-text3">Reading the source and preparing lesson-ready material.</p>
      </div>
    </div>
  );
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
    ...(data.originalText ? { originalText: data.originalText } : {}),
    ...(data.documentKind ? { documentKind: data.documentKind } : {}),
    ...(data.wordCount ? { wordCount: data.wordCount } : {}),
    ...(data.slides ? { slides: data.slides } : {}),
  };
}

function LibrarySuggestions({
  topic,
  disabled,
  onUse,
}: {
  topic: string;
  disabled: boolean;
  onUse: (item: LibraryRecommendation) => void;
}) {
  const suggestions = useMemo(() => recommendSources(topic, { limit: 3 }), [topic]);
  if (suggestions.length === 0) return null;
  return (
    <div className="rounded-lg border border-lc-blue/25 bg-lc-blue/5 p-3 space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-lc-text2">
        <Compass className="h-3.5 w-3.5 text-lc-blue" />
        Suggested for &ldquo;{topic}&rdquo;
      </p>
      <div className="space-y-1.5">
        {suggestions.map((s) => (
          <div key={`${s.sourceType}-${s.id}`} className="flex items-center gap-2 rounded-md bg-lc-bg/70 px-2.5 py-2">
            <span className="shrink-0 rounded-full bg-lc-text3/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-lc-text3">
              {s.kind}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-lc-text">{s.title}</span>
            <button
              onClick={() => onUse(s)}
              disabled={disabled}
              className="shrink-0 rounded-md border border-lc-blue/40 bg-lc-blue/10 px-2.5 py-1 text-xs font-semibold text-lc-blue hover:bg-lc-blue/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Use
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SourceInputPanel() {
  const { sourceMaterial, setSourceMaterial, setTopic, topic, difficulty, addSupportingSource, removeSupportingSource } = usePlannerStore();
  const { isPro, loading: tierLoading } = useTeacherTier();

  // When true, the next committed source is attached as a SUPPORTING source on top
  // of the existing primary, instead of replacing it.
  const [addMode, setAddMode] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('video');
  const [videoPayload, setVideoPayload] = useState('');
  const [textPayload, setTextPayload] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTedModal, setShowTedModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [genTopic, setGenTopic] = useState('');
  const [pendingSource, setPendingSource] = useState<SourceMaterial | null>(null);
  const [selectedBriefingOptionId, setSelectedBriefingOptionId] = useState<string | null>(null);
  const [briefingDraft, setBriefingDraft] = useState('');

  const activeSourcePreview = sourceMaterial ? getSourcePreview(sourceMaterial) : '';
  const activeSourceWordCount = countWords(activeSourcePreview);
  const briefingDraftWordCount = countWords(briefingDraft);

  // Route a freshly extracted source: in addMode it becomes a supporting source
  // on top of the existing primary; otherwise it replaces the primary.
  function commitMaterial(material: SourceMaterial) {
    if (addMode && sourceMaterial) {
      addSupportingSource(material);
      setAddMode(false);
    } else {
      setSourceMaterial(material);
      setTopic(material.title);
    }
  }

  function startBriefingReview(material: SourceMaterial) {
    const briefingOptions = withGeneratedOption(material);
    const firstOption = briefingOptions[0];
    const reviewMaterial: SourceMaterial = {
      ...material,
      briefingOptions,
      briefingText: firstOption.text,
      rawText: firstOption.text,
      briefingMode: firstOption.mode,
      wordCount: countWords(firstOption.text),
    };
    setPendingSource(reviewMaterial);
    setSelectedBriefingOptionId(firstOption.id);
    setBriefingDraft(firstOption.text);
    // Commit the recommended reading immediately so the upload is a live source
    // (consistent with the video/text tabs). The review panel stays open to
    // refine the reading; "Use this briefing" / "Back to upload" update or clear it.
    setSourceMaterial(reviewMaterial);
    setTopic(reviewMaterial.title);
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
    // The source was auto-committed when review opened; "Back to upload" discards it.
    setSourceMaterial(null);
    setTopic('');
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
      commitMaterial(buildSourceMaterial(data));
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
      const m = buildSourceMaterial(data);
      if (addMode && sourceMaterial) {
        addSupportingSource(m);
        setAddMode(false);
        setUploadFile(null);
      } else {
        startBriefingReview(m);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  async function processGenerateReading() {
    const t = (genTopic.trim() || topic.trim());
    if (t.length < 3) {
      setError('Enter a topic to generate a reading.');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/source/generate-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: t, difficulty }),
      });
      const data = await res.json() as SourceExtractResponse;
      if (!res.ok) {
        setError(data.error ?? 'Failed to generate a reading');
        return;
      }
      setGenTopic('');
      const m = buildSourceMaterial(data);
      if (addMode && sourceMaterial) {
        addSupportingSource(m);
        setAddMode(false);
      } else {
        startBriefingReview(m);
      }
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
    setAddMode(false);
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
        <div className="border-b border-lc-border px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-lc-text2 uppercase tracking-wide">Source material</p>
              <p className="text-xs text-lc-text3 mt-0.5">Ground the briefing, vocabulary, checks, and discussion in one source.</p>
            </div>
            <span className="shrink-0 rounded-full bg-lc-text3/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-lc-text3">
              Optional
            </span>
          </div>
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
                {!(pendingSource.briefingOptions ?? []).some((option) => option.id === 'original-full') && (
                  <p className="text-xs text-lc-text3 leading-relaxed">
                    Full original text is shown when the upload has one clean reading passage under about 1,200 words. Longer or fragmented PDFs use excerpts instead.
                  </p>
                )}
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
          ) : (sourceMaterial && !addMode) ? (
            /* Active source summary */
            <div className="space-y-2">
              <div className="rounded-lg border border-emerald-400/25 bg-emerald-400/5 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 uppercase tracking-wide mb-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Source ready
                    </p>
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
                <p className="text-[11px] text-emerald-200/70">
                  This source will feed the briefing, vocabulary, checks, and discussion prompts.
                </p>
              </div>

              {/* Supporting sources (primary + supporting) */}
              {(sourceMaterial.supportingSources?.length ?? 0) > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-lc-text3">
                    Supporting sources — extra context, not the student briefing
                  </p>
                  {sourceMaterial.supportingSources!.map((s, i) => (
                    <div key={`${s.sourceType}-${i}`} className="flex items-center gap-2 rounded-md border border-lc-border bg-lc-bg/70 px-2.5 py-1.5">
                      <span className="shrink-0 rounded-full bg-lc-text3/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-lc-text3">{s.sourceType}</span>
                      <span className="min-w-0 flex-1 truncate text-xs text-lc-text2">{s.title}</span>
                      <button
                        onClick={() => removeSupportingSource(i)}
                        aria-label="Remove supporting source"
                        className="shrink-0 text-lc-text3 hover:text-red-400 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setAddMode(true); setError(null); }}
                  className="text-xs font-semibold text-lc-blue hover:text-lc-blue-hover transition-colors"
                >
                  + Add another source
                </button>
                <button onClick={handleRemove} className="text-xs font-semibold text-lc-text3 hover:text-lc-blue transition-colors">
                  Change source
                </button>
              </div>
            </div>
          ) : (
            /* Input form */
            <div className="space-y-3">
              {addMode && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-lc-blue/25 bg-lc-blue/5 px-3 py-2">
                  <p className="text-xs font-semibold text-lc-text2">
                    Add a supporting source — your main source stays the lesson spine.
                  </p>
                  <button
                    onClick={() => { setAddMode(false); setError(null); }}
                    className="shrink-0 text-xs font-semibold text-lc-text3 hover:text-lc-text transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Topic-matched library suggestions (Find) */}
              {topic.trim().length >= 3 && (
                <LibrarySuggestions
                  topic={topic.trim()}
                  disabled={processing}
                  onUse={(item) => process(item.sourceType, item.id)}
                />
              )}

              {/* 3-tab switcher */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-lc-text3">Choose source type</p>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-lc-bg p-1">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => { setActiveTab(tab.key); setError(null); setUploadFile(null); }}
                      className={`rounded-md px-2 py-2 text-xs font-semibold transition-all ${
                        activeTab === tab.key
                          ? 'bg-lc-card text-lc-text shadow-sm'
                          : 'text-lc-text3 hover:text-lc-text2'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        {tab.key === 'video' && <Film className="h-3.5 w-3.5" />}
                        {tab.key === 'text' && <FileText className="h-3.5 w-3.5" />}
                        {tab.key === 'upload' && <UploadCloud className="h-3.5 w-3.5" />}
                        {tab.label}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-lc-text3">{TAB_HELPER[activeTab]}</p>
              </div>

              {/* Video: curated library + YouTube */}
              {activeTab === 'video' && (
                <div className="space-y-3">
                  {processing && <SourceProcessingNotice label="Processing video source" />}
                  <button
                    onClick={() => setShowTedModal(true)}
                    disabled={processing}
                    className="group w-full rounded-lg border border-lc-blue/35 bg-lc-blue/10 p-3 text-left transition-colors hover:border-lc-blue/60 hover:bg-lc-blue/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-3">
                        <span className="rounded-lg bg-lc-blue/15 p-2 text-lc-blue">
                          <Library className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-lc-text">Browse Video Library</span>
                          <span className="mt-0.5 block text-xs text-lc-text3">Pick a pre-vetted classroom video.</span>
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-lc-blue transition-transform group-hover:translate-x-0.5">-&gt;</span>
                    </span>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-lc-border" />
                    <span className="text-xs text-lc-text3">or paste a YouTube URL</span>
                    <div className="flex-1 h-px bg-lc-border" />
                  </div>
                  <label className="flex items-center gap-2 rounded-lg border border-lc-border bg-lc-bg px-3 py-2 focus-within:border-lc-blue focus-within:ring-1 focus-within:ring-lc-blue-glow">
                    <Link2 className="h-4 w-4 shrink-0 text-lc-text3" />
                    <input
                      type="text"
                      value={videoPayload}
                      onChange={(e) => { setVideoPayload(e.target.value); setError(null); }}
                      disabled={processing}
                      placeholder="https://youtube.com/watch?v=..."
                      className="min-w-0 flex-1 bg-transparent text-sm text-lc-text placeholder-lc-text3 outline-none disabled:cursor-not-allowed"
                    />
                  </label>
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
                  {processing && <SourceProcessingNotice label="Processing text source" />}
                  <button
                    onClick={() => setShowTextModal(true)}
                    disabled={processing}
                    className="group w-full rounded-lg border border-lc-blue/35 bg-lc-blue/10 p-3 text-left transition-colors hover:border-lc-blue/60 hover:bg-lc-blue/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-3">
                        <span className="rounded-lg bg-lc-blue/15 p-2 text-lc-blue">
                          <Library className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-lc-text">Browse Text Library</span>
                          <span className="mt-0.5 block text-xs text-lc-text3">Choose a ready-to-use reading source.</span>
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-lc-blue transition-transform group-hover:translate-x-0.5">-&gt;</span>
                    </span>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-lc-border" />
                    <span className="text-xs text-lc-text3">or paste your own text</span>
                    <div className="flex-1 h-px bg-lc-border" />
                  </div>
                  <textarea
                    value={textPayload}
                    onChange={(e) => { setTextPayload(e.target.value); setError(null); }}
                    disabled={processing}
                    placeholder="Paste article text, lesson notes, lyrics, or any content (min 50 characters)…"
                    rows={4}
                    className="w-full rounded-lg border border-lc-border bg-lc-bg px-3 py-2 text-sm text-lc-text placeholder-lc-text3 focus:border-lc-blue focus:ring-1 focus:ring-lc-blue-glow resize-none disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <button
                    onClick={() => process('text', textPayload)}
                    disabled={processing || textPayload.trim().length < 50}
                    className="w-full rounded-lg bg-lc-blue py-2 text-sm font-semibold text-white hover:bg-lc-blue-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing…' : 'Process Text'}
                  </button>

                  {/* Generate a reading from a topic (no source needed) */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-lc-border" />
                    <span className="text-xs text-lc-text3">or generate a reading</span>
                    <div className="flex-1 h-px bg-lc-border" />
                  </div>
                  <label className="flex items-center gap-2 rounded-lg border border-lc-border bg-lc-bg px-3 py-2 focus-within:border-lc-blue focus-within:ring-1 focus-within:ring-lc-blue-glow">
                    <Sparkles className="h-4 w-4 shrink-0 text-lc-text3" />
                    <input
                      type="text"
                      value={genTopic}
                      onChange={(e) => { setGenTopic(e.target.value); setError(null); }}
                      disabled={processing}
                      placeholder={topic.trim() ? `Topic: ${topic.trim()}` : 'Topic for a new reading, e.g. space travel'}
                      className="min-w-0 flex-1 bg-transparent text-sm text-lc-text placeholder-lc-text3 outline-none disabled:cursor-not-allowed"
                    />
                  </label>
                  <button
                    onClick={processGenerateReading}
                    disabled={processing || (genTopic.trim().length < 3 && topic.trim().length < 3)}
                    className="w-full rounded-lg border border-lc-blue/40 bg-lc-blue/10 py-2 text-sm font-semibold text-lc-blue hover:bg-lc-blue/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Generating…' : `Generate a ${difficulty} reading`}
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
                    onClick={() => !processing && !uploadFile && document.getElementById('doc-upload')?.click()}
                    onKeyDown={(e) => { if (!processing && (e.key === 'Enter' || e.key === ' ')) document.getElementById('doc-upload')?.click(); }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (processing) return;
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
                          disabled={processing}
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
                  {processing && <SourceProcessingNotice label="Extracting source material" />}
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <button
                    onClick={processUpload}
                    disabled={processing || !uploadFile}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-lc-blue py-2 text-sm font-semibold text-white hover:bg-lc-blue-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {processing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                    {processing ? 'Extracting content...' : 'Extract Content'}
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
