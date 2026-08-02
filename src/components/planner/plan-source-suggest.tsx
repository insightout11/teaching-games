'use client';

import { useMemo, useState } from 'react';
import { usePlannerStore } from '@/stores/planner-store';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import { useTeacherProfile } from '@/hooks/use-teacher-profile';
import { recommendSources, type LibraryRecommendation } from '@/lib/source-library';
import type { SourceMaterial } from '@/types/source-material';
import { CheckCircle2, FileText, Film, Sparkles } from 'lucide-react';

type ExtractResponse = SourceMaterial & { error?: string };

function toMaterial(data: ExtractResponse): SourceMaterial {
  return {
    sourceType: data.sourceType,
    title: data.title,
    summary: data.summary,
    ...(data.sourceKey ? { sourceKey: data.sourceKey } : {}),
    ...(data.duration ? { duration: data.duration } : {}),
    ...(data.rawText ? { rawText: data.rawText } : {}),
    ...(data.briefingText ? { briefingText: data.briefingText } : {}),
    ...(data.briefingMode ? { briefingMode: data.briefingMode } : {}),
    ...(data.wordCount ? { wordCount: data.wordCount } : {}),
  };
}

/**
 * Step 2 (plan screen): once the topic is known, offer to ground the lesson in a
 * matching library source (Find) or a generated reading (Make). Optional — the
 * lesson already has a topic-based briefing if the teacher ignores this.
 */
export function PlanSourceSuggest() {
  const { topic, difficulty, sourceMaterial, applySourceBriefing } = usePlannerStore();
  const { isPro, credits, loading: tierLoading } = useTeacherTier();
  const { profile } = useTeacherProfile();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedTopic = topic.trim();
  const allowKids = profile.age === 'kids';
  const suggestions = useMemo(
    () => (trimmedTopic.length >= 3 ? recommendSources(trimmedTopic, { limit: 2, level: difficulty, allowKids }) : []),
    [trimmedTopic, difficulty, allowKids],
  );

  if (tierLoading || trimmedTopic.length < 3) return null;

  // Already sourced — show the source, allow removing it.
  if (sourceMaterial) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/5 px-3 py-2.5">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
        <span className="min-w-0 flex-1 truncate text-sm text-lc-text">
          Built from <span className="font-medium">{sourceMaterial.title}</span>
        </span>
        <button
          onClick={() => applySourceBriefing(null)}
          className="shrink-0 text-xs font-semibold text-lc-text3 hover:text-lc-blue transition-colors"
        >
          Remove
        </button>
      </div>
    );
  }

  if (!isPro && credits <= 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-lc-border bg-lc-surface px-3 py-2.5">
        <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
        <span className="flex-1 text-sm text-lc-text2">Build this lesson from a video or reading</span>
        <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400">Pro</span>
      </div>
    );
  }

  async function attachLibrary(item: LibraryRecommendation) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/source/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: item.sourceType, payload: item.id }),
      });
      const data = (await res.json()) as ExtractResponse;
      if (!res.ok) {
        setError(data.error ?? 'Could not attach that source.');
        return;
      }
      applySourceBriefing(toMaterial(data));
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function generateReading() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/source/generate-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: trimmedTopic, difficulty }),
      });
      const data = (await res.json()) as ExtractResponse;
      if (!res.ok) {
        setError(data.error ?? 'Could not generate a reading.');
        return;
      }
      applySourceBriefing(toMaterial(data));
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-lc-blue/25 bg-lc-blue/5 p-3">
      <p className="text-sm font-semibold text-lc-text2">
        Add a source to this lesson? <span className="font-normal text-lc-text3">optional — a video or reading on your topic</span>
      </p>

      {suggestions.map((s) => (
        <div key={`${s.sourceType}-${s.id}`} className="flex items-center gap-2 rounded-md bg-lc-bg/70 px-2.5 py-2">
          <span className="flex shrink-0 items-center gap-1 rounded bg-lc-text3/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-lc-text3">
            {s.kind === 'video' ? <Film className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            {s.kind === 'video' ? 'Video' : 'Reading'}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-lc-text">{s.title}</span>
          <button
            onClick={() => attachLibrary(s)}
            disabled={busy}
            className="shrink-0 rounded-md border border-lc-blue/40 bg-lc-blue/10 px-2.5 py-1 text-xs font-semibold text-lc-blue hover:bg-lc-blue/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Use
          </button>
        </div>
      ))}

      <button
        onClick={generateReading}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-lc-border bg-lc-surface px-3 py-2 text-xs font-semibold text-lc-text2 hover:border-lc-blue/40 hover:text-lc-text transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {busy ? 'Working…' : 'Generate a reading'}
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
