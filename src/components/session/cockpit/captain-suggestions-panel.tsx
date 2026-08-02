'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  Star,
} from 'lucide-react';
import type { CaptainSuggestion, CaptainSuggestionKind } from '@/lib/captain-suggestions';
import { SPOTLIGHT_TAGS, SPOTLIGHT_TAG_META, type SpotlightTag } from '@/lib/spotlight';

interface CaptainSuggestionsPanelProps {
  sessionId: string;
  /** True when nothing is on student devices — downtime. Pro accounts auto-load a pack. */
  standby?: boolean;
  onSpotlightSent?: (studentName: string, text: string) => void;
}

interface SuggestionsResponse {
  suggestions?: CaptainSuggestion[];
  source?: 'ai' | 'fallback';
  warning?: string;
  error?: string;
  code?: string;
}

type ActionState = 'sending' | 'sent';

const KIND_META: Record<CaptainSuggestionKind, {
  label: string;
  action: string;
  icon: typeof Star;
  accent: string;
}> = {
  spotlight: {
    label: 'Spotlight',
    action: 'Spotlight',
    icon: Star,
    accent: 'text-amber-300 border-amber-400/25 bg-amber-500/10',
  },
  question: {
    label: 'Question',
    action: 'Send to class',
    icon: MessageSquare,
    accent: 'text-cyan-300 border-cyan-400/25 bg-cyan-500/10',
  },
  poll: {
    label: 'Poll',
    action: 'Send to class',
    icon: BarChart3,
    accent: 'text-emerald-300 border-emerald-400/25 bg-emerald-500/10',
  },
};

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data?.error === 'string' ? data.error : 'Request failed';
    const error = new Error(message) as Error & { code?: string };
    error.code = typeof data?.code === 'string' ? data.code : undefined;
    throw error;
  }

  return data as T;
}

export function CaptainSuggestionsPanel({ sessionId, standby = false, onSpotlightSent }: CaptainSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<CaptainSuggestion[]>([]);
  const [source, setSource] = useState<'ai' | 'fallback' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<Record<string, ActionState | undefined>>({});
  // Teacher can flip the AI-proposed spotlight tag before sending (one tap, chips).
  const [tagOverrides, setTagOverrides] = useState<Record<string, SpotlightTag>>({});
  const wasStandbyRef = useRef(false);

  const loadSuggestions = useCallback(async (auto = false) => {
    setIsLoading(true);
    if (!auto) setError(null);

    try {
      const data = await postJSON<SuggestionsResponse>('/api/session/captain-suggestions', { sessionId, auto });
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      setSource(data.source ?? null);
      setActionState({});
      setTagOverrides({});
      if (data.warning) setError(data.warning);
    } catch (err) {
      // Auto packs are Pro-only; free accounts just keep the manual button.
      const code = (err as Error & { code?: string }).code;
      if (!(auto && code === 'PRO_REQUIRED')) {
        setError(err instanceof Error ? err.message : 'Could not load suggestions');
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Standby pack: when student devices go quiet, pre-generate one suggestion set
  // so the cards are already warm when the teacher looks. Once per standby entry.
  useEffect(() => {
    if (standby && !wasStandbyRef.current) {
      wasStandbyRef.current = true;
      void loadSuggestions(true);
    }
    if (!standby) {
      wasStandbyRef.current = false;
    }
  }, [standby, loadSuggestions]);

  const launchSuggestion = useCallback(async (suggestion: CaptainSuggestion) => {
    setError(null);
    setActionState((prev) => ({ ...prev, [suggestion.id]: 'sending' }));

    try {
      if (suggestion.kind === 'spotlight') {
        if (!suggestion.sourceSubmissionId || !suggestion.sourceText) {
          throw new Error('This spotlight no longer has a source submission');
        }

        const result = await postJSON<{ shownName?: string; text?: string }>('/api/session/spotlight', {
          sessionId,
          submissionId: suggestion.sourceSubmissionId,
          studentName: suggestion.sourceStudentName ?? 'Student',
          text: suggestion.sourceText,
          label: 'Captain\'s Pick',
          tag: tagOverrides[suggestion.id] ?? suggestion.tag,
          highlight: suggestion.highlight,
        });
        onSpotlightSent?.(result.shownName ?? suggestion.sourceStudentName ?? 'Student', result.text ?? suggestion.sourceText);
      }

      // Questions and polls go to Crew Radio — the side panel on student
      // devices — so they never interrupt the main task.
      if (suggestion.kind === 'question') {
        await postJSON('/api/session/side-channel', {
          sessionId,
          item: {
            kind: 'write',
            title: suggestion.title || 'Quick write',
            prompt: suggestion.prompt,
            maxLength: 280,
          },
        });
      }

      if (suggestion.kind === 'poll') {
        await postJSON('/api/session/side-channel', {
          sessionId,
          item: {
            kind: 'choice',
            title: suggestion.title || 'Class poll',
            prompt: suggestion.prompt,
            options: suggestion.options ?? [],
          },
        });
      }

      setActionState((prev) => ({ ...prev, [suggestion.id]: 'sent' }));
    } catch (err) {
      setActionState((prev) => {
        const next = { ...prev };
        delete next[suggestion.id];
        return next;
      });
      setError(err instanceof Error ? err.message : 'Could not launch suggestion');
    }
  }, [onSpotlightSent, sessionId, tagOverrides]);

  return (
    <div className="order-2 bg-[#0d1f35] rounded-2xl border border-violet-400/20 overflow-hidden shadow-[0_0_28px_rgba(168,85,247,0.07)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/8">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-300" aria-hidden="true" />
            <p className="text-xs text-violet-200/80 uppercase tracking-widest font-medium">Captain&apos;s Suggestions</p>
            {source && (
              <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                {source}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-white/35">Questions and polls appear in Crew Radio, the student side channel — never over the main activity.</p>
        </div>
        <button
          onClick={() => loadSuggestions()}
          disabled={isLoading}
          title="Get suggestions"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/10 text-violet-200 transition-colors hover:border-violet-300/45 hover:bg-violet-500/20 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only">Get suggestions</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 border-b border-red-400/10 bg-red-500/5 px-4 py-2 text-xs text-red-200/80">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {suggestions.length === 0 ? (
        <div className="px-4 py-5 text-center">
          <button
            onClick={() => loadSuggestions()}
            disabled={isLoading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 text-sm font-semibold text-violet-100 transition-colors hover:border-violet-300/45 hover:bg-violet-500/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
            Get suggestions
          </button>
        </div>
      ) : (
        <div className="divide-y divide-white/8">
          {suggestions.map((suggestion) => (
            <SuggestionRow
              key={suggestion.id}
              suggestion={suggestion}
              actionState={actionState[suggestion.id]}
              selectedTag={tagOverrides[suggestion.id] ?? suggestion.tag}
              onSelectTag={(tag) => setTagOverrides((prev) => ({ ...prev, [suggestion.id]: tag }))}
              onLaunch={launchSuggestion}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SuggestionRowProps {
  suggestion: CaptainSuggestion;
  actionState?: ActionState;
  selectedTag?: SpotlightTag;
  onSelectTag: (tag: SpotlightTag) => void;
  onLaunch: (suggestion: CaptainSuggestion) => void;
}

function SuggestionRow({ suggestion, actionState, selectedTag, onSelectTag, onLaunch }: SuggestionRowProps) {
  const meta = KIND_META[suggestion.kind];
  const Icon = meta.icon;
  const isSending = actionState === 'sending';
  const isSent = actionState === 'sent';
  const isDisabled =
    isSending ||
    isSent ||
    (suggestion.kind === 'poll' && (!suggestion.options || suggestion.options.length < 2)) ||
    (suggestion.kind === 'spotlight' && !suggestion.sourceSubmissionId);

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${meta.accent}`}>
              <Icon className="h-3 w-3" aria-hidden="true" />
              {meta.label}
            </span>
            <span className="text-sm font-semibold text-white">{suggestion.title}</span>
          </div>
          <p className="text-xs text-white/38 leading-snug">{suggestion.rationale}</p>
        </div>
        <button
          onClick={() => onLaunch(suggestion)}
          disabled={isDisabled}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/7 px-3 text-xs font-semibold text-white/70 transition-colors hover:bg-white/12 hover:text-white disabled:opacity-45"
        >
          {isSending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          {isSent && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />}
          {!isSending && !isSent && <Send className="h-3.5 w-3.5" aria-hidden="true" />}
          {isSent ? 'Sent' : meta.action}
        </button>
      </div>

      <p className="text-sm text-white/72 leading-snug">{truncate(suggestion.prompt, 130)}</p>

      {suggestion.kind === 'spotlight' && suggestion.sourceStudentName && (
        <p className="text-xs text-amber-200/60">
          {suggestion.sourceStudentName}: &quot;{truncate(suggestion.sourceText ?? '', 86)}&quot;
        </p>
      )}

      {/* Tag chips — the AI proposes one, the teacher can flip it before sending. */}
      {suggestion.kind === 'spotlight' && (
        <div className="flex flex-wrap gap-1.5">
          {SPOTLIGHT_TAGS.map((tag) => {
            const isSelected = tag === (selectedTag ?? 'idea');
            return (
              <button
                key={tag}
                onClick={() => onSelectTag(tag)}
                disabled={isSent || isSending}
                className={[
                  'min-h-8 rounded-full border px-2.5 text-[11px] font-semibold transition-colors disabled:opacity-45',
                  isSelected
                    ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                    : 'border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70',
                ].join(' ')}
              >
                {SPOTLIGHT_TAG_META[tag].label}
              </button>
            );
          })}
        </div>
      )}

      {suggestion.kind === 'poll' && suggestion.options && (
        <div className="flex flex-wrap gap-1.5">
          {suggestion.options.map((option) => (
            <span key={option} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/45">
              {option}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
