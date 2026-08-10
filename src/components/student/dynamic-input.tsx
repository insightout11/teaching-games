'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ShieldHalf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { computeTimerState, type InputSpec } from '@/lib/input-spec';
import { ShuffleboardInput } from './shuffleboard-input';
import { GeoPointInput } from './geo-point-input';

interface DynamicInputProps {
  spec: InputSpec;
  onSubmit: (value: string) => Promise<void>;
  isSubmitting: boolean;
  submitStatus: 'idle' | 'success' | 'error' | 'rate_limited';
  waitSeconds: number;
  clientId?: string;
  displayName?: string;
  studentId?: string | null;
  /** Server clock minus local clock (ms), measured by the session poll. Feeds timed inputs. */
  clockOffsetMs?: number;
}

export function DynamicInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds, clientId, displayName, studentId, clockOffsetMs }: DynamicInputProps) {
  switch (spec.type) {
    case 'text':
      return <TextInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} clockOffsetMs={clockOffsetMs} />;
    case 'textarea':
      return <TextareaInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} clientId={clientId} clockOffsetMs={clockOffsetMs} />;
    case 'choice':
      if (spec.timerSeconds) {
        return <QuizChoiceInput
          key={`${spec.prompt ?? ''}::${(spec.options || []).join('|')}`}
          spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} clientId={clientId} studentId={studentId} clockOffsetMs={clockOffsetMs} />;
      }
      return <ChoiceInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} clientId={clientId} displayName={displayName} />;
    case 'binary':
      return <BinaryInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
    case 'multi-select':
      return <MultiSelectInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} clientId={clientId} />;
    case 'sequence':
      return <SequenceInput key={`${spec.prompt ?? ''}::${(spec.options || []).join('|')}`} spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} clockOffsetMs={clockOffsetMs} />;
    case 'ranking':
      return <RankingInput key={`${spec.prompt ?? ''}::${(spec.options || []).join('|')}`} spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
    case 'error-correction':
      return <ErrorCorrectionInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} clockOffsetMs={clockOffsetMs} />;
    case 'confirm':
      return <ConfirmInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} displayName={displayName} />;
    case 'read-aloud':
      return <ReadAloudInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} displayName={displayName} />;
    case 'shuffleboard':
      return <ShuffleboardInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} displayName={displayName} />;
    case 'geo-point':
      return <GeoPointInput key={spec.roundId ?? spec.prompt} spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} clientId={clientId} />;
    case 'board':
      return <BoardInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
    case 'cabin-question':
      return <CabinQuestionInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} displayName={displayName} />;
    case 'cabin-vote':
      return <CabinVoteInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} displayName={displayName} />;
    case 'cabin-culprit':
      return <CabinCulpritInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} displayName={displayName} />;
    default:
      return <TextInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
  }
}

function BoardInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds }: DynamicInputProps) {
  const categories = spec.boardCategories?.length
    ? spec.boardCategories
    : [{ key: 'idea', label: 'Idea' }];
  const zones = spec.boardZones?.length
    ? spec.boardZones
    : [{ key: 'main', label: 'Board' }];
  const [category, setCategory] = useState(spec.boardDefaultCategory ?? categories[0].key);
  const [zoneKey, setZoneKey] = useState(spec.boardDefaultZone ?? zones[0].key);
  const [value, setValue] = useState('');
  const maxLength = spec.maxLength ?? 280;

  const handleSubmit = useCallback(async () => {
    const content = value.trim();
    if (!content || isSubmitting || submitStatus === 'rate_limited') return;
    await onSubmit(JSON.stringify({ content, category, zoneKey }));
    setValue('');
  }, [category, isSubmitting, onSubmit, submitStatus, value, zoneKey]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-lc-text3">{spec.boardTitle ?? 'Class Board'}</p>
        {(spec.boardPrompt || spec.prompt) && (
          <p className="mt-1 text-base font-medium leading-snug text-cyan-300">{spec.boardPrompt ?? spec.prompt}</p>
        )}
      </div>

      {categories.length > 1 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-lc-text2">Type</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setCategory(option.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  category === option.key
                    ? 'border-cyan-400/60 bg-cyan-400/18 text-cyan-100'
                    : 'border-lc-border bg-lc-surface text-lc-text2 hover:text-lc-text'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {zones.length > 1 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-lc-text2">Board section</p>
          <div className="grid gap-2">
            {zones.map((zone) => (
              <button
                key={zone.key}
                type="button"
                onClick={() => setZoneKey(zone.key)}
                className={`rounded-xl border px-3 py-2 text-left transition ${
                  zoneKey === zone.key
                    ? 'border-emerald-400/55 bg-emerald-400/14 text-emerald-100'
                    : 'border-lc-border bg-lc-surface text-lc-text2 hover:text-lc-text'
                }`}
              >
                <span className="block text-sm font-semibold">{zone.label}</span>
                {zone.description ? <span className="mt-0.5 block text-xs opacity-70">{zone.description}</span> : null}
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value.slice(0, maxLength))}
        placeholder={spec.placeholder ?? 'Add your idea for the board...'}
        maxLength={maxLength}
        rows={4}
        className="w-full resize-none rounded-xl border border-lc-border bg-lc-surface px-4 py-3 text-lc-text placeholder:text-lc-text3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
      />
      <div className="flex items-center justify-between">
        <div>
          <SubmitStatus status={submitStatus} waitSeconds={waitSeconds} />
          <span className="ml-2 text-sm text-lc-text3">{value.length}/{maxLength}</span>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!value.trim() || isSubmitting || submitStatus === 'rate_limited'}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          {isSubmitting ? 'Sending...' : 'Add to Board'}
        </Button>
      </div>
    </div>
  );
}

// Common status display component
function SubmitStatus({ status, waitSeconds }: { status: 'idle' | 'success' | 'error' | 'rate_limited'; waitSeconds: number }) {
  if (status === 'idle') return null;
  return (
    <div className="text-sm mt-2">
      {status === 'success' && <span className="font-medium text-emerald-400">Response submitted ✓</span>}
      {status === 'error' && <span className="text-red-400">Signal failed</span>}
      {status === 'rate_limited' && <span className="text-yellow-400">Stand by {waitSeconds}s...</span>}
    </div>
  );
}

// Single line text input
function TextInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds, clockOffsetMs }: DynamicInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inFlightRef = useRef(false);
  const { timeLeft, isExpired, timerSeconds, answersOpen, opensIn } = useInputTimer(spec, false, clockOffsetMs);

  const handleSubmit = useCallback(async () => {
    if (inFlightRef.current || isExpired) return;
    const el = inputRef.current;
    if (!el) return;
    const word = el.value.trim();
    if (!word) return;

    inFlightRef.current = true;
    el.value = '';   // Clear DOM immediately — no React batching involved
    el.focus();      // Keep focus so next word goes straight into the box
    try {
      await onSubmit(word);
    } finally {
      inFlightRef.current = false;
    }
  }, [isExpired, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  if (timerSeconds > 0 && !answersOpen) {
    return <GetReadyGate spec={spec} opensIn={opensIn} />;
  }

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium">{spec.prompt}</p>
      )}
      {timerSeconds > 0 && <TimerBar timeLeft={timeLeft} timerSeconds={timerSeconds} />}
      <input
        ref={inputRef}
        type="text"
        defaultValue=""
        onKeyDown={handleKeyDown}
        placeholder={spec.placeholder || 'Type your answer...'}
        maxLength={spec.maxLength || 200}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="w-full px-4 py-3 bg-lc-surface border border-lc-border rounded-xl text-lc-text placeholder:text-lc-text3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
      />
      <div className="flex items-center justify-between">
        <SubmitStatus status={submitStatus} waitSeconds={waitSeconds} />
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || submitStatus === 'rate_limited' || isExpired}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

// Multi-line textarea input
function TextareaInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds, clientId, clockOffsetMs }: DynamicInputProps) {
  const prefill = (clientId && spec.prefillByClientId?.[clientId]) ?? '';
  const [value, setValue] = useState(prefill);
  const [showHint, setShowHint] = useState(false);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const { timeLeft, isExpired, timerSeconds, answersOpen, opensIn } = useInputTimer(spec, false, clockOffsetMs);

  const hasResources = (spec.resources?.length ?? 0) > 0;
  const resourcesRequired = hasResources && selectedResources.length === 0;

  const handleSubmit = useCallback(async () => {
    if (!value.trim() || isSubmitting || resourcesRequired || isExpired) return;
    // Encode as structured JSON when resources are involved so the API can extract resourcesUsed
    const payload = hasResources
      ? JSON.stringify({ choice: value.trim(), resourcesUsed: selectedResources })
      : value.trim();
    await onSubmit(payload);
    setValue('');
    setSelectedResources([]);
  }, [value, isSubmitting, hasResources, selectedResources, resourcesRequired, isExpired, onSubmit]);

  // Append a tapped phrase into the box (chipInsert scaffolding), respecting maxLength.
  const insertChip = useCallback((kw: string) => {
    const max = spec.maxLength || 1000;
    setValue((prev) => {
      const needsSpace = prev.length > 0 && !/\s$/.test(prev);
      const next = `${prev}${needsSpace ? ' ' : ''}${kw} `;
      return next.length > max ? next.slice(0, max) : next;
    });
  }, [spec.maxLength]);

  const hintContent = spec.hint?.content;
  const hasStructuredHint = hintContent && typeof hintContent === 'object';

  const myData = spec.perStudentData?.[clientId ?? ''] as
    { round1Words?: string[]; sentenceResult?: { score: number; feedback: string; wordsUsed: string[]; totalPoints: number } } | undefined;
  const myWords = myData?.round1Words;
  const sentenceResult = myData?.sentenceResult;

  // After evaluation: show feedback card instead of textarea
  if (sentenceResult) {
    const stars = Array.from({ length: 5 }, (_, i) => i < sentenceResult.score ? '★' : '☆').join('');
    return (
      <div className="space-y-4">
        <div className="bg-violet-500/10 border border-violet-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-amber-400 text-lg font-mono tracking-tight">{stars}</span>
            <div className="flex items-center gap-2">
              <span className="text-violet-300 font-black text-xl">{sentenceResult.score}/5</span>
              <span className="bg-violet-500/20 text-violet-300 rounded-full px-3 py-0.5 text-sm font-bold">+{sentenceResult.totalPoints}pt</span>
            </div>
          </div>
          {myWords && myWords.length > 0 && (
            <div>
              <p className="text-xs text-lc-text2 uppercase tracking-wider mb-1.5">Words used</p>
              <div className="flex flex-wrap gap-1.5">
                {myWords.map((w) => (
                  <span
                    key={w}
                    className={`px-2.5 py-1 rounded-full text-sm font-medium ${
                      sentenceResult.wordsUsed.includes(w)
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-lc-border text-lc-text3'
                    }`}
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="text-lc-text text-sm italic">{sentenceResult.feedback}</p>
          {sentenceResult.totalPoints === 0 && (
            <p className="text-red-400 text-xs">Needs 2+ of your words to earn points</p>
          )}
        </div>
      </div>
    );
  }

  if (timerSeconds > 0 && !answersOpen) {
    return <GetReadyGate spec={spec} opensIn={opensIn} />;
  }

  return (
    <div className="space-y-4">
      {spec.instruction && (
        <p className="text-sm text-lc-text2 mb-1">{spec.instruction}</p>
      )}
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium">{spec.prompt}</p>
      )}
      {timerSeconds > 0 && <TimerBar timeLeft={timeLeft} timerSeconds={timerSeconds} />}
      {myWords && myWords.length > 0 && (
        <div>
          <p className="text-xs text-lc-text2 uppercase tracking-wider mb-2">Your Round 1 words:</p>
          <div className="flex flex-wrap gap-1.5">
            {myWords.map((w) => (
              <span key={w} className="px-2.5 py-1 bg-lc-card text-lc-text rounded-full text-sm font-medium select-none">
                {w}
              </span>
            ))}
          </div>
        </div>
      )}
      {hasResources && (
        <div>
          <p className="text-xs text-lc-text2 uppercase tracking-wider mb-2">
            Tap a resource you used <span className="text-amber-400">*required</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {spec.resources!.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedResources((prev) =>
                  prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
                )}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedResources.includes(r)
                    ? 'bg-lime-500 text-white'
                    : 'bg-lc-surface border border-lc-border text-lc-text2 hover:bg-lc-card'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {selectedResources.length > 0 && (
            <p className="text-xs text-lime-400 mt-1">Using: {selectedResources.join(', ')}</p>
          )}
        </div>
      )}
      {hintContent && (
        <div>
          <button
            onClick={() => setShowHint(!showHint)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
              showHint ? 'bg-emerald-500/20 text-emerald-400' : 'bg-lc-surface text-lc-text2 hover:bg-lc-card'
            }`}
          >
            <svg className={`w-3 h-3 transition-transform ${showHint ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path d="M6 4l8 6-8 6V4z"/></svg>
            {showHint ? 'Hide Grammar Hint' : 'Show Grammar Hint'}
          </button>
          {showHint && (
            <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-sm">
              {spec.hint?.title && <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest">{spec.hint.title}</p>}
              {typeof hintContent === 'string' ? (
                <p className="text-emerald-200">{hintContent}</p>
              ) : hasStructuredHint && (
                <>
                  {hintContent.rule && <p className="text-emerald-200"><span className="font-semibold text-emerald-400">Structure:</span> {hintContent.rule}</p>}
                  {hintContent.example && <p className="text-emerald-200 italic"><span className="font-semibold text-emerald-400 not-italic">Example:</span> &quot;{hintContent.example}&quot;</p>}
                  {hintContent.mistakes && hintContent.mistakes.length > 0 && (
                    <div>
                      <span className="font-semibold text-emerald-400">Watch out:</span>
                      {hintContent.mistakes.map((m, i) => <p key={i} className="text-red-300/80 ml-2">{m}</p>)}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
      {/* Tap-to-build chips: labelled groups (starters / positions / connectors) when provided,
          otherwise a single flat set. Non-insert specs keep the read-only "Try to use" hints. */}
      {spec.chipInsert && spec.keywordGroups && spec.keywordGroups.length > 0 ? (
        <div className="space-y-2.5">
          <p className="text-xs opacity-50 uppercase tracking-widest">Tap to build your sentence</p>
          {spec.keywordGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="text-[10px] opacity-40 uppercase tracking-widest">{group.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.phrases.map((kw) => (
                  <button
                    key={`${group.label}-${kw}`}
                    type="button"
                    onClick={() => insertChip(kw)}
                    className="text-xs px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 hover:bg-teal-500/30 active:scale-95 transition-all"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {value.length > 0 && (
            <button type="button" onClick={() => setValue('')} className="text-xs opacity-50 hover:opacity-90 underline">
              Clear
            </button>
          )}
        </div>
      ) : spec.keywords && spec.keywords.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs opacity-50 uppercase tracking-widest">
            {spec.chipInsert ? 'Tap to build your sentence' : 'Try to use'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {spec.keywords.map((kw) =>
              spec.chipInsert ? (
                <button
                  key={kw}
                  type="button"
                  onClick={() => insertChip(kw)}
                  className="text-xs px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 hover:bg-teal-500/30 active:scale-95 transition-all"
                >
                  {kw}
                </button>
              ) : (
                <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">{kw}</span>
              ),
            )}
          </div>
          {spec.chipInsert && value.length > 0 && (
            <button
              type="button"
              onClick={() => setValue('')}
              className="text-xs opacity-50 hover:opacity-90 underline mt-1"
            >
              Clear
            </button>
          )}
        </div>
      ) : null}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={spec.placeholder || 'Type your answer...'}
        maxLength={spec.maxLength || 1000}
        rows={4}
        className="w-full px-4 py-3 bg-lc-surface border border-lc-border rounded-xl text-lc-text placeholder:text-lc-text3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
      />
      <div className="flex items-center justify-between">
        <div>
          <SubmitStatus status={submitStatus} waitSeconds={waitSeconds} />
          <span className="text-lc-text3 text-sm ml-2">{value.length}/{spec.maxLength || 1000}</span>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!value.trim() || isSubmitting || submitStatus === 'rate_limited' || resourcesRequired || isExpired}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
      {resourcesRequired && value.trim() && (
        <p className="text-xs text-amber-400">Select at least one resource above to submit.</p>
      )}
    </div>
  );
}

// ─── Shared timer primitives ──────────────────────────────────────────────────

const INPUT_GRACE_MS = 1500;

/**
 * Synced countdown timer for any timed input. startedAt/answersOpenAt are
 * server-stamped by the input-spec API; remaining time comes from the shared
 * computeTimerState (server clock + poll-measured offset), so the answer window
 * runs for timerSeconds AFTER answers open — the grace beat defers the countdown
 * instead of eating into it, and every device matches the teacher screen.
 */
function useInputTimer(spec: InputSpec, submitted = false, clockOffsetMs = 0) {
  const timerSeconds = spec.timerSeconds ?? 0;
  const { startedAt, answersOpenAt } = spec;

  const compute = useCallback(
    () => computeTimerState({ timerSeconds, startedAt, answersOpenAt }, clockOffsetMs),
    [timerSeconds, startedAt, answersOpenAt, clockOffsetMs],
  );

  const [{ timeLeft, opensIn }, setTick] = useState(compute);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (submitted || !timerSeconds) return;
    setTick(compute());
    // 250ms so the 3-2-1 answers-open beat lands on whole seconds without visible drift
    const interval = setInterval(() => setTick(compute()), 250);
    return () => clearInterval(interval);
  }, [submitted, timerSeconds, compute]);

  useEffect(() => {
    if (submitted || timeLeft > 0 || !timerSeconds) return;
    const grace = setTimeout(() => setIsExpired(true), INPUT_GRACE_MS);
    return () => clearTimeout(grace);
  }, [submitted, timeLeft, timerSeconds]);

  return { timeLeft, isExpired, timerSeconds, answersOpen: opensIn <= 0, opensIn };
}

/**
 * Pre-open gate for timed inputs: shows the prompt (reading time) and a 3-2-1
 * countdown until answersOpenAt, so delivery delay eats the grace window
 * instead of the answer window.
 */
function GetReadyGate({ spec, opensIn }: { spec: InputSpec; opensIn: number }) {
  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium leading-snug">{spec.prompt}</p>
      )}
      <div className="flex flex-col items-center gap-2 py-8">
        <p className="text-xs uppercase tracking-[0.22em] text-lc-text3">Get ready</p>
        <p key={opensIn} className="text-6xl font-black text-cyan-300 animate-pulse">{opensIn}</p>
        <p className="text-sm text-lc-text2">Answers open in a moment…</p>
      </div>
    </div>
  );
}

/** Visual countdown bar shown above inputs when a timer is active. */
function TimerBar({ timeLeft, timerSeconds }: { timeLeft: number; timerSeconds: number }) {
  const timerPct = timerSeconds > 0 ? (timeLeft / timerSeconds) * 100 : 0;
  const timerColor = timerPct > 50 ? 'bg-green-500' : timerPct > 25 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-lc-text2">
        <span>Time left</span>
        <span className={timeLeft <= 5 ? 'text-red-400 font-bold' : ''}>{timeLeft}s</span>
      </div>
      <div className="w-full h-2 bg-lc-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>
    </div>
  );
}

// Quiz-mode choice input: 2×2 grid, auto-submit, timer, locked state
const QUIZ_COLORS = [
  'bg-red-600 hover:bg-red-500 active:bg-red-700',
  'bg-blue-600 hover:bg-blue-500 active:bg-blue-700',
  'bg-amber-500 hover:bg-amber-400 active:bg-amber-600',
  'bg-green-600 hover:bg-green-500 active:bg-green-700',
];
const QUIZ_LABELS = ['A', 'B', 'C', 'D'];

function QuizChoiceInput({ spec, onSubmit, isSubmitting, submitStatus, clientId, studentId, clockOffsetMs }: DynamicInputProps) {
  const [submitted, setSubmitted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { timeLeft, isExpired, timerSeconds, answersOpen, opensIn } = useInputTimer(spec, submitted, clockOffsetMs);

  // Sector Strike team gating: only the active team answers; the defending team watches the board.
  const myTeam = studentId ? spec.sectorTeamByStudentId?.[studentId] : undefined;
  const isDefending =
    spec.sectorActiveTeam != null && myTeam != null && myTeam !== spec.sectorActiveTeam;

  // Per-student data from game
  const myData = (clientId ? spec.perStudentData?.[clientId] : undefined) as
    | { locked?: boolean; result?: 'correct' | 'incorrect'; pointsEarned?: number }
    | undefined;
  const isLocked = myData?.locked === true || submitted;
  const result = myData?.result;

  useEffect(() => {
    if (submitStatus === 'error') {
      setSubmitted(false);
      setSelectedIndex(null);
    }
  }, [submitStatus]);

  const handlePick = useCallback(async (index: number) => {
    if (isSubmitting || isLocked || isExpired || !answersOpen) return;
    setSelectedIndex(index);
    setSubmitted(true);
    await onSubmit(String(index));
  }, [isSubmitting, isLocked, isExpired, answersOpen, onSubmit]);

  // Defending team — no input, just a holding screen.
  if (isDefending) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <ShieldHalf className="w-12 h-12 text-sky-300" strokeWidth={1.5} />
        <p className="text-xl font-black text-sky-300">Defending</p>
        <p className="text-sm text-lc-text2 max-w-[16rem]">
          The other squadron is striking a sector. Watch the board — your turn is next.
        </p>
      </div>
    );
  }

  // Locked + result state
  if (isLocked && result) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        {result === 'correct' ? (
          <>
            <div className="text-4xl">✓</div>
            <p className="text-green-400 font-black text-xl">Correct!</p>
            {myData?.pointsEarned !== undefined && (
              <p className="text-yellow-400 font-bold text-lg">+{myData.pointsEarned} pts</p>
            )}
          </>
        ) : (
          <>
            <div className="text-4xl">✗</div>
            <p className="text-red-400 font-black text-xl">Wrong</p>
            <p className="text-lc-text2 text-sm">+0 pts</p>
          </>
        )}
      </div>
    );
  }

  // Locked but no result yet (waiting for reveal)
  if (isLocked) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="text-3xl">✓</div>
        <p className="text-green-400 font-bold text-lg">Vote submitted ✓</p>
        {selectedIndex !== null && (
          <p className="text-white font-semibold">
            {QUIZ_LABELS[selectedIndex]} — {spec.options?.[selectedIndex]}
          </p>
        )}
        <p className="text-lc-text2 text-sm">Waiting for others…</p>
      </div>
    );
  }

  // Pre-open: question is readable, answers unlock after the 3-2-1 beat
  if (!answersOpen) {
    return <GetReadyGate spec={spec} opensIn={opensIn} />;
  }

  // Active — show timer + answer grid
  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-base text-lc-text font-medium leading-snug">{spec.prompt}</p>
      )}
      <TimerBar timeLeft={timeLeft} timerSeconds={timerSeconds} />
      {/* 2×2 answer grid */}
      <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
        {(spec.options ?? []).slice(0, 4).map((option, i) => (
          <button
            key={i}
            onClick={() => handlePick(i)}
            disabled={isSubmitting || isExpired}
            className={`${QUIZ_COLORS[i]} min-h-16 touch-manipulation whitespace-normal break-words text-white rounded-xl p-4 text-left shadow-lg transition-all disabled:opacity-40 active:scale-95`}
          >
            <div className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">{QUIZ_LABELS[i]}</div>
            <div className="text-sm font-semibold leading-snug sm:text-base">{option}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Multiple choice (pick one)
function ChoiceInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds, displayName }: DynamicInputProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [writeInMode, setWriteInMode] = useState(false);
  const [writeInText, setWriteInText] = useState('');

  const submitValue = writeInMode ? writeInText.trim() : selected;
  const canSubmit = !!submitValue
    && !isSubmitting
    && submitStatus !== 'rate_limited'
    && submitStatus !== 'success';

  const handleSubmit = useCallback(async () => {
    if (!submitValue || isSubmitting) return;
    await onSubmit(submitValue);
  }, [submitValue, isSubmitting, onSubmit]);

  const isSpeaker =
    spec.gameKey === 'defend-it' &&
    displayName != null &&
    (spec.perStudentData?.[displayName] as { isSpeaker?: boolean } | undefined)?.isSpeaker === true;

  if (isSpeaker) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-4xl">🎤</p>
        <p className="text-xl font-black text-amber-400">You&apos;re speaking!</p>
        <p className="text-sm opacity-60">Your classmates are reacting live</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium">{spec.prompt}</p>
      )}
      {!writeInMode && (
        <div className="space-y-2">
          {spec.options?.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelected(option)}
              disabled={isSubmitting || submitStatus === 'success'}
              className={`w-full p-4 rounded-xl text-left transition-all ${
                selected === option
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-lc-surface text-lc-text hover:bg-lc-card'
              } disabled:opacity-50`}
            >
              {spec.optionLabels?.[index] ?? option}
            </button>
          ))}
          {spec.allowWriteIn && (
            <button
              onClick={() => { setSelected(null); setWriteInMode(true); }}
              disabled={isSubmitting || submitStatus === 'success'}
              className="w-full p-4 rounded-xl text-left transition-all bg-lc-surface text-lc-text2 hover:bg-lc-card border border-dashed border-lc-border disabled:opacity-50"
            >
              ✏️ Write your own…
            </button>
          )}
        </div>
      )}
      {writeInMode && (
        <div className="space-y-2">
          <textarea
            maxLength={100}
            value={writeInText}
            onChange={(e) => setWriteInText(e.target.value)}
            placeholder="Write your mission in a few words…"
            rows={3}
            autoFocus
            className="w-full px-4 py-3 bg-lc-surface border border-lc-border rounded-xl text-lc-text placeholder:text-lc-text3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-lc-text3 text-xs">{writeInText.length}/100</span>
            <button
              onClick={() => { setWriteInMode(false); setWriteInText(''); }}
              className="text-sm text-lc-text3 hover:text-lc-text"
            >
              ← Back
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <SubmitStatus status={submitStatus} waitSeconds={waitSeconds} />
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          {isSubmitting ? 'Submitting...' : submitStatus === 'success' ? 'Submitted' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

// Binary choice (A or B)
function BinaryInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds }: DynamicInputProps) {
  const labels = useMemo(() => spec.optionLabels || ['A', 'B'], [spec.optionLabels]);
  const options = spec.options || labels;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (submitStatus === 'error') setSelectedIndex(null);
  }, [submitStatus]);

  // Send the LABEL (A/B), not the full option text
  const handleChoice = useCallback(async (index: number) => {
    if (isSubmitting) return;
    setSelectedIndex(index);
    await onSubmit(labels[index]);
  }, [isSubmitting, onSubmit, labels]);

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium text-center">{spec.prompt}</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleChoice(index)}
            disabled={isSubmitting || submitStatus === 'rate_limited' || submitStatus === 'success'}
            className={`p-6 rounded-2xl border transition-all font-bold text-xl disabled:opacity-70 ${
              selectedIndex === index
                ? 'border-cyan-400 bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                : 'border-lc-border bg-lc-surface text-lc-text hover:border-cyan-500/50 hover:bg-lc-card'
            }`}
          >
            <div className="text-3xl mb-2">{labels[index]}</div>
            <div className="text-sm opacity-80">{option}</div>
          </button>
        ))}
      </div>
      <SubmitStatus status={submitStatus} waitSeconds={waitSeconds} />
    </div>
  );
}

// Multi-select (pick N from list)
function MultiSelectInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds, clientId }: DynamicInputProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const selectCount = spec.selectCount || 4;

  // Race mode per-student state (populated via perStudentData from the game)
  const raceData = useMemo(() => {
    if (!clientId || !spec.perStudentData?.[clientId]) return null;
    return spec.perStudentData[clientId] as { foundWords?: string[]; groupsFound?: number; livesRemaining?: number };
  }, [clientId, spec.perStudentData]);
  const foundWords = useMemo(() => new Set(raceData?.foundWords ?? []), [raceData]);

  const toggleOption = (option: string) => {
    if (foundWords.has(option)) return;
    const newSelected = new Set(selected);
    if (newSelected.has(option)) {
      newSelected.delete(option);
    } else if (newSelected.size < selectCount) {
      newSelected.add(option);
    }
    setSelected(newSelected);
  };

  const handleSubmit = useCallback(async () => {
    if (selected.size !== selectCount || isSubmitting) return;
    await onSubmit(JSON.stringify(Array.from(selected)));
    setSelected(new Set());
  }, [selected, selectCount, isSubmitting, onSubmit]);

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium">{spec.prompt}</p>
      )}
      {raceData && (
        <div className="flex gap-4 text-sm text-lc-text2">
          <span>{raceData.groupsFound ?? 0}/4 groups found</span>
          <span>{'❤️'.repeat(raceData.livesRemaining ?? 4)} {raceData.livesRemaining ?? 4} lives</span>
        </div>
      )}
      <p className="text-sm text-lc-text2">Select {selectCount} items ({selected.size}/{selectCount})</p>
      <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
        {spec.options?.map((option, index) => (
          <button
            key={index}
            onClick={() => toggleOption(option)}
            disabled={isSubmitting || foundWords.has(option)}
            className={`p-1.5 sm:p-2.5 rounded-xl text-xs sm:text-sm transition-all min-h-[3rem] flex items-center justify-center text-center leading-tight break-words overflow-hidden hyphens-auto ${
              foundWords.has(option)
                ? 'opacity-40 cursor-not-allowed line-through bg-lc-surface text-lc-text'
                : selected.has(option)
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-lc-surface text-lc-text hover:bg-lc-card'
            } disabled:opacity-50`}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <SubmitStatus status={submitStatus} waitSeconds={waitSeconds} />
        <Button
          onClick={handleSubmit}
          disabled={selected.size !== selectCount || isSubmitting || submitStatus === 'rate_limited'}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

// Sequence input (tap to build ordered list)
function SequenceInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds, clockOffsetMs }: DynamicInputProps) {
  const [sequence, setSequence] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<string[]>(spec.options || []);
  const { timeLeft, isExpired, timerSeconds, answersOpen, opensIn } = useInputTimer(spec, false, clockOffsetMs);

  const addToSequence = (item: string) => {
    setSequence([...sequence, item]);
    setRemaining(remaining.filter(r => r !== item));
  };

  const removeFromSequence = (index: number) => {
    const item = sequence[index];
    setRemaining([...remaining, item]);
    setSequence(sequence.filter((_, i) => i !== index));
  };

  const handleSubmit = useCallback(async () => {
    if (remaining.length > 0 || isSubmitting || isExpired) return;
    await onSubmit(JSON.stringify(sequence));
    setSequence([]);
    setRemaining(spec.options || []);
  }, [sequence, remaining.length, isSubmitting, isExpired, onSubmit, spec.options]);

  // Result feedback: game pushed correct/incorrect after evaluation
  if (spec.result) {
    const isCorrect = spec.result === 'correct';
    return (
      <div className={`flex flex-col items-center justify-center gap-4 py-10 rounded-2xl ${isCorrect ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
        <div className={`text-6xl font-black ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
          {isCorrect ? '✓' : '✗'}
        </div>
        <p className={`text-xl font-bold ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
          {isCorrect ? 'Correct!' : 'Not quite!'}
        </p>
      </div>
    );
  }

  if (timerSeconds > 0 && !answersOpen) {
    return <GetReadyGate spec={spec} opensIn={opensIn} />;
  }

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium">{spec.prompt}</p>
      )}
      {timerSeconds > 0 && <TimerBar timeLeft={timeLeft} timerSeconds={timerSeconds} />}

      {/* Built sequence */}
      <div className="min-h-[60px] p-3 bg-lc-surface rounded-xl border border-dashed border-lc-border">
        {sequence.length === 0 ? (
          <p className="text-lc-text3 text-sm">Tap words to build your sentence...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sequence.map((item, index) => (
              <button
                key={index}
                onClick={() => removeFromSequence(index)}
                className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Remaining words */}
      <div className="flex flex-wrap gap-2">
        {remaining.map((item, index) => (
          <button
            key={index}
            onClick={() => addToSequence(item)}
            disabled={isSubmitting}
            className="px-3 py-1.5 bg-lc-card text-lc-text rounded-lg hover:bg-lc-border transition-colors disabled:opacity-50"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <SubmitStatus status={submitStatus} waitSeconds={waitSeconds} />
        <Button
          onClick={handleSubmit}
          disabled={remaining.length > 0 || isSubmitting || isExpired || submitStatus === 'rate_limited'}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

// Error correction input (tap words to mark errors and type corrections)
function ErrorCorrectionInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds, clockOffsetMs }: DynamicInputProps) {
  const [corrections, setCorrections] = useState<Map<number, string>>(new Map());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [correctionText, setCorrectionText] = useState('');
  const { timeLeft, isExpired, timerSeconds, answersOpen, opensIn } = useInputTimer(spec, false, clockOffsetMs);

  const words = useMemo(() => spec.options || [], [spec.options]);

  const handleWordTap = (index: number) => {
    if (isSubmitting) return;

    if (corrections.has(index)) {
      // Remove existing correction
      const next = new Map(corrections);
      next.delete(index);
      setCorrections(next);
      if (editingIndex === index) {
        setEditingIndex(null);
        setCorrectionText('');
      }
    } else {
      // Open correction input for this word
      setEditingIndex(index);
      setCorrectionText('');
    }
  };

  const handleAddCorrection = () => {
    if (editingIndex === null || !correctionText.trim()) return;
    const next = new Map(corrections);
    next.set(editingIndex, correctionText.trim());
    setCorrections(next);
    setEditingIndex(null);
    setCorrectionText('');
  };

  const handleSubmit = useCallback(async () => {
    if (corrections.size === 0 || isSubmitting || isExpired) return;
    const payload = Array.from(corrections.entries()).map(([index, correction]) => ({
      position: index,
      original: words[index]?.replace(/[.,!?;:'"]/g, '') || '',
      correction,
    }));
    await onSubmit(JSON.stringify(payload));
    setCorrections(new Map());
    setEditingIndex(null);
    setCorrectionText('');
  }, [corrections, isSubmitting, isExpired, onSubmit, words]);

  if (timerSeconds > 0 && !answersOpen) {
    return <GetReadyGate spec={spec} opensIn={opensIn} />;
  }

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium">{spec.prompt}</p>
      )}
      {timerSeconds > 0 && <TimerBar timeLeft={timeLeft} timerSeconds={timerSeconds} />}

      {/* Word chips */}
      <div className="flex flex-wrap gap-1.5">
        {words.map((word, index) => {
          const hasCorrection = corrections.has(index);
          const isEditing = editingIndex === index;
          return (
            <button
              key={index}
              onClick={() => handleWordTap(index)}
              disabled={isSubmitting}
              className={`px-2 py-1 rounded-lg text-sm transition-all ${
                hasCorrection
                  ? 'bg-red-500/30 border border-red-500/50'
                  : isEditing
                  ? 'bg-yellow-500/30 border border-yellow-500/50 text-yellow-200'
                  : 'bg-lc-card hover:bg-lc-border border border-lc-border'
              } disabled:opacity-50`}
            >
              {hasCorrection ? (
                <>
                  <span className="line-through opacity-60">{word}</span>
                  <span className="ml-1 text-emerald-400 no-underline">{corrections.get(index)}</span>
                </>
              ) : (
                word
              )}
            </button>
          );
        })}
      </div>

      {/* Correction input for selected word */}
      {editingIndex !== null && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <p className="text-xs text-lc-text2 mb-1">
              Correct &quot;<span className="text-yellow-400">{words[editingIndex]}</span>&quot; to:
            </p>
            <input
              type="text"
              value={correctionText}
              onChange={(e) => setCorrectionText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCorrection()}
              placeholder="Type correction..."
              autoFocus
              className="w-full px-3 py-2 bg-lc-surface border border-yellow-500/50 rounded-xl text-lc-text placeholder:text-lc-text3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            />
          </div>
          <button
            onClick={handleAddCorrection}
            disabled={!correctionText.trim()}
            className="px-4 py-2 bg-yellow-500 text-black rounded-xl font-bold disabled:opacity-30"
          >
            Add
          </button>
        </div>
      )}

      <p className="text-sm text-lc-text2">{corrections.size} correction{corrections.size !== 1 ? 's' : ''} marked</p>

      <div className="flex items-center justify-between">
        <SubmitStatus status={submitStatus} waitSeconds={waitSeconds} />
        <Button
          onClick={handleSubmit}
          disabled={corrections.size === 0 || isSubmitting || isExpired || submitStatus === 'rate_limited'}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

// Confirm button — student taps once to confirm they've done something (spoken, read, etc.)
function ConfirmInput({ spec, onSubmit, isSubmitting, submitStatus, displayName }: DynamicInputProps) {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = useCallback(async () => {
    if (isSubmitting || confirmed) return;
    setConfirmed(true);
    await onSubmit('confirmed');
  }, [isSubmitting, confirmed, onSubmit]);

  // Cabin Mystery role card (briefing confirm)
  const cabinRoleCard = spec.gameKey === 'cabin-mystery' && displayName && spec.perStudentData
    ? (spec.perStudentData[displayName] as CabinRoleCardData | undefined)
    : undefined;

  // Look up character card for this student by display name
  const characterCard = displayName && spec.perStudentData
    ? (spec.perStudentData[displayName] as { name?: string; viewpoint?: string; speakingLine?: string } | undefined)
    : undefined;
  const hasCard = characterCard?.name && (characterCard?.viewpoint || characterCard?.speakingLine);

  // Look up imposter assignment for this student
  const imposterCard = spec.gameKey === 'imposter' && displayName && spec.perStudentData
    ? (spec.perStudentData[displayName] as { role: 'insider' | 'imposter'; word?: string; definition?: string } | undefined)
    : undefined;

  // Look up password assignment for this student
  const passwordCard = spec.gameKey === 'password' && displayName && spec.perStudentData
    ? (spec.perStudentData[displayName] as { role: 'speaker' | 'guesser'; word?: string } | undefined)
    : undefined;

  // Look up defend-it side assignment for this student
  const defendItCard = spec.gameKey === 'defend-it' && displayName && spec.perStudentData
    ? (spec.perStudentData[displayName] as { side?: 'DEFEND' | 'ATTACK' } | undefined)
    : undefined;

  if (spec.gameKey === 'cabin-mystery' && displayName && spec.perStudentData && !cabinRoleCard) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-2xl">✈️</p>
        <p className="text-sm font-semibold text-lc-text">Waiting for a role</p>
        <p className="text-sm text-lc-text2 max-w-xs">
          Roles haven&apos;t been assigned to you yet. Ask your teacher to assign you a character.
        </p>
      </div>
    );
  }

  if (cabinRoleCard) {
    return <CabinRoleCardView role={cabinRoleCard} onConfirm={handleConfirm} confirmed={confirmed || submitStatus === 'success'} isSubmitting={isSubmitting} buttonLabel={spec.buttonLabel} />;
  }

  return (
    <div className="space-y-6 text-center">
      {defendItCard?.side ? (
        <div className={`rounded-2xl p-6 space-y-3 ${
          defendItCard.side === 'DEFEND'
            ? 'bg-emerald-500/10 border border-emerald-500/30'
            : 'bg-rose-500/10 border border-rose-500/30'
        }`}>
          <p className={`text-xs uppercase tracking-widest font-semibold ${
            defendItCard.side === 'DEFEND' ? 'text-emerald-400/70' : 'text-rose-400/70'
          }`}>Your side</p>
          <p className={`text-3xl font-black ${
            defendItCard.side === 'DEFEND' ? 'text-emerald-300' : 'text-rose-300'
          }`}>{defendItCard.side === 'DEFEND' ? '🛡️ DEFEND' : '⚔️ ATTACK'}</p>
          <p className="text-sm opacity-60">
            {defendItCard.side === 'DEFEND'
              ? 'Argue FOR this statement when called on!'
              : 'Argue AGAINST this statement when called on!'}
          </p>
        </div>
      ) : passwordCard ? (
        passwordCard.role === 'speaker' ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 space-y-3">
            <p className="text-xs text-emerald-400/70 uppercase tracking-widest font-semibold">Your password</p>
            <p className="text-4xl font-bold text-emerald-300">{passwordCard.word}</p>
            <p className="text-sm opacity-60">Use it naturally in conversation — don&apos;t make it obvious!</p>
          </div>
        ) : (
          <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-6 space-y-3">
            <p className="text-xs text-sky-400/70 uppercase tracking-widest font-semibold">Listen carefully</p>
            <p className="text-4xl">👂</p>
            <p className="text-base opacity-70">What word did every speaker have in common?</p>
          </div>
        )
      ) : imposterCard ? (
        imposterCard.role === 'imposter' ? (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 space-y-3">
            <p className="text-xs text-rose-400/70 uppercase tracking-widest font-semibold">Your role</p>
            <p className="text-4xl font-bold text-rose-400">🕵️</p>
            <p className="text-2xl font-bold text-rose-300">YOU ARE THE IMPOSTER</p>
            <p className="text-base opacity-60">You don&apos;t know the word. Listen carefully and blend in!</p>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 space-y-3">
            <p className="text-xs text-emerald-400/70 uppercase tracking-widest font-semibold">Your secret word</p>
            <p className="text-4xl font-bold text-emerald-300">{imposterCard.word}</p>
            {imposterCard.definition && (
              <p className="text-sm opacity-70 leading-snug">{imposterCard.definition}</p>
            )}
            <p className="text-sm opacity-50">Give a clue without saying this word. Find the imposter!</p>
          </div>
        )
      ) : hasCard ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-3">
          <p className="text-xs text-amber-400/70 uppercase tracking-widest font-semibold">Your character</p>
          <p className="text-xl font-bold text-amber-400 leading-tight">{characterCard!.name}</p>
          {characterCard!.speakingLine ? (
            <>
              <p className="text-xs opacity-40 uppercase tracking-widest">Say this aloud</p>
              <p className="text-2xl font-bold text-white leading-snug">&ldquo;{characterCard!.speakingLine}&rdquo;</p>
            </>
          ) : (
            <p className="text-base text-white/90 leading-relaxed">{characterCard!.viewpoint}</p>
          )}
        </div>
      ) : spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium leading-snug">{spec.prompt}</p>
      )}
      {spec.keywordGroups && spec.keywordGroups.length > 0 ? (
        <div className="space-y-3 text-left">
          {spec.keywordGroups.map((group, gi) => {
            const chipClass = gi === 0 ? 'bg-teal-500/20 text-teal-300' : 'bg-violet-500/20 text-violet-300';
            const labelClass = gi === 0 ? 'text-teal-400' : 'text-violet-400';
            return (
              <div key={gi} className="space-y-1">
                <p className={`text-xs font-semibold uppercase tracking-widest text-center ${labelClass}`}>{group.label}</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {group.phrases.map((kw) => (
                    <span key={kw} className={`text-xs px-2 py-1 rounded-full ${chipClass}`}>{kw}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : spec.keywords && spec.keywords.length > 0 ? (
        <div className="space-y-1 text-left">
          <p className="text-xs opacity-50 uppercase tracking-widest text-center">Useful phrases</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {spec.keywords.map((kw) => (
              <span key={kw} className="text-xs px-2 py-1 rounded-full bg-teal-500/20 text-teal-300">{kw}</span>
            ))}
          </div>
        </div>
      ) : null}
      {confirmed || submitStatus === 'success' ? (
        <div className="py-4 space-y-2">
          <div className="text-4xl">✓</div>
          <p className="text-emerald-400 font-semibold">Done!</p>
        </div>
      ) : (
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="w-full py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '…' : (spec.buttonLabel ?? 'Confirm')}
        </button>
      )}
    </div>
  );
}

// Ranking input (drag to reorder)
function RankingInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds }: DynamicInputProps) {
  const [items, setItems] = useState<string[]>(spec.options || []);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);
    setItems(newItems);
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    await onSubmit(JSON.stringify(items));
    setItems(spec.options || []);
  }, [items, isSubmitting, onSubmit, spec.options]);

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium">{spec.prompt}</p>
      )}
      <p className="text-sm text-lc-text2">Tap ↑↓ to reorder — 1 is highest</p>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item}
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggedIndex !== null && draggedIndex !== index) {
                moveItem(draggedIndex, index);
              }
              setDraggedIndex(null);
            }}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-move transition-all ${
              draggedIndex === index
                ? 'bg-cyan-500/30 border border-cyan-500'
                : 'bg-lc-surface border border-lc-border hover:bg-lc-card'
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center bg-lc-card rounded-full text-sm font-bold">
              {index + 1}
            </span>
            <span className="text-lc-text">{item}</span>
            <div className="ml-auto flex gap-1">
              <button
                onClick={() => index > 0 && moveItem(index, index - 1)}
                disabled={index === 0}
                className="p-2 text-lc-text3 hover:text-lc-text disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => index < items.length - 1 && moveItem(index, index + 1)}
                disabled={index === items.length - 1}
                className="p-2 text-lc-text3 hover:text-lc-text disabled:opacity-30"
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <SubmitStatus status={submitStatus} waitSeconds={waitSeconds} />
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || submitStatus === 'rate_limited'}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

// ── Read Aloud ─────────────────────────────────────────────────────────────

function highlightVocabReadAloud(text: string, vocabWords: string[]): React.ReactNode {
  const clean = text.replace(/\*([^*]+)\*/g, '$1');
  if (!vocabWords.length) return clean;
  const escaped = vocabWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  const parts = clean.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part)
      ? <mark key={i} className="bg-emerald-500/30 text-emerald-200 rounded px-0.5 not-italic font-medium">{part}</mark>
      : part
  );
}

function ReadAloudInput({ spec, onSubmit, isSubmitting, displayName }: Pick<DynamicInputProps, 'spec' | 'onSubmit' | 'isSubmitting' | 'displayName'>) {
  const [done, setDone] = useState(false);
  const queue = spec.readAloudQueue ?? [];
  const active = queue.find((e) => e.status === 'active');
  // Match by displayName — the common identifier across student device and DB roster
  const isMyTurn = !!active && active.studentName === displayName;
  const myUpcoming = queue.find((e) => e.status === 'upcoming' && e.studentName === displayName);
  const currentSlideUrl = spec.currentSlideUrl;
  const vocabWords = spec.readAloudVocabWords ?? [];

  const handleDone = useCallback(async () => {
    if (done || isSubmitting) return;
    setDone(true);
    await onSubmit('done');
  }, [done, isSubmitting, onSubmit]);

  return (
    <div className="space-y-4">
      {currentSlideUrl && (
        <div className="rounded-2xl overflow-hidden bg-black/40 border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentSlideUrl}
            alt=""
            className="w-full object-contain max-h-52"
            onError={(e) => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = 'none'; }}
          />
        </div>
      )}
      {isMyTurn ? (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/40 p-5 space-y-4">
          <p className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Your turn to read</p>
          <p className="text-base leading-relaxed text-white">{highlightVocabReadAloud(active.text, vocabWords)}</p>
          <button
            onClick={handleDone}
            disabled={done || isSubmitting}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-3 transition-colors"
          >
            {done ? 'Done \u2713' : 'Done Reading'}
          </button>
        </div>
      ) : myUpcoming ? (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 space-y-2">
          <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold">Your paragraph is coming up</p>
          <p className="text-sm text-white/70 leading-relaxed line-clamp-3">{myUpcoming.text}</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <p className="text-sm text-white/50 text-center">
            {queue.every((e) => e.status === 'done') ? 'Reading complete!' : 'Listening\u2026'}
          </p>
        </div>
      )}
      <div className="space-y-1.5">
        {queue.slice(0, 6).map((entry) => (
          <div
            key={entry.index}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
              entry.status === 'active' ? 'bg-emerald-500/15 text-white' :
              entry.status === 'done'   ? 'opacity-30 text-white/60' :
              entry.studentName === displayName ? 'bg-amber-500/10 text-amber-300' :
              'text-white/50'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
              entry.status === 'active' ? 'bg-emerald-500 text-white' :
              entry.status === 'done'   ? 'bg-white/20 text-white/40' :
              entry.studentName === displayName ? 'bg-amber-500 text-black' :
              'bg-white/10 text-white/50'
            }`}>
              {entry.status === 'done' ? '\u2713' : entry.index + 1}
            </span>
            <span className="truncate">{entry.studentName}</span>
            {entry.status === 'active' && <span className="ml-auto text-emerald-400 text-xs">reading\u2026</span>}
          </div>
        ))}
        {queue.length > 6 && (
          <p className="text-xs text-white/30 text-center">+{queue.length - 6} more</p>
        )}
      </div>
    </div>
  );
}

// ── Cabin Mystery ─────────────────────────────────────────────────────────────

interface CabinRoleCardData {
  publicIdentity: string;
  alibi: string;
  privateSecret: string;
  clue: string;
  isCulprit: boolean;
  sentenceStems: string[];
  mustRevealTrigger: { condition: string; reveal: string };
  answerBank: {
    safeAnswer: string;
    locationAnswer: string;
    conditionalAnswers: Array<{ trigger: string; response: string; isRequired: boolean }>;
    deflectionLines: string[];
    improv: string;
  };
  goal: string;
  culpritContext?: string;
}

interface CabinQuestionStudentData {
  mySuspectId: string;
  myRole: CabinRoleCardData;
  suspects: Array<{ id: string; name: string; seatOrRole: string; playedBy?: string | null }>;
  availableByTarget: Record<string, Array<{ id: string; text: string }>>;
  isCurrentTarget: boolean;
  currentQuestionText: string | null;
  currentQuestionAskerName: string | null;
  roundNumber: 1 | 2;
}

function CabinRoleCardView({
  role,
  onConfirm,
  confirmed,
  isSubmitting,
  buttonLabel,
}: {
  role: CabinRoleCardData;
  onConfirm: () => void;
  confirmed: boolean;
  isSubmitting: boolean;
  buttonLabel?: string;
}) {
  return (
    <div className="space-y-4 text-left">
      {/* Public identity */}
      <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/30 p-4 space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">Your Character</p>
        <p className="text-sm text-white leading-relaxed">{role.publicIdentity}</p>
      </div>

      {/* Alibi */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Your Alibi</p>
        <p className="text-sm text-slate-200 leading-relaxed italic">&ldquo;{role.alibi}&rdquo;</p>
      </div>

      {/* Private secret */}
      <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-rose-400 font-semibold">
          Private Secret — Only you can see this
        </p>
        <p className="text-sm text-rose-200 leading-relaxed">{role.privateSecret}</p>
        {role.culpritContext && (
          <p className="text-xs text-rose-300/80 italic mt-1">{role.culpritContext}</p>
        )}
      </div>

      {/* Clue */}
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">Your Clue</p>
        <p className="text-sm text-amber-200 leading-relaxed">{role.clue}</p>
      </div>

      {/* Must-reveal trigger */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Must Reveal If…</p>
        <p className="text-xs text-slate-400 italic">{role.mustRevealTrigger.condition}</p>
        <p className="text-sm text-white">→ &ldquo;{role.mustRevealTrigger.reveal}&rdquo;</p>
      </div>

      {/* Sentence stems */}
      {role.sentenceStems.length > 0 && (
        <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-teal-400 font-semibold">Useful Phrases</p>
          {role.sentenceStems.map((stem, i) => (
            <p key={i} className="text-xs text-teal-200 italic">&ldquo;{stem}&rdquo;</p>
          ))}
        </div>
      )}

      {/* Goal */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Your Goal</p>
        <p className="text-sm text-slate-200">{role.goal}</p>
      </div>

      {/* Confirm button */}
      {confirmed ? (
        <div className="py-4 text-center space-y-1">
          <div className="text-3xl">✓</div>
          <p className="text-emerald-400 font-semibold text-sm">Card read — investigation begins soon</p>
        </div>
      ) : (
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold text-base shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '…' : (buttonLabel ?? 'I\'ve read my card')}
        </button>
      )}
    </div>
  );
}

function CabinAnswerRuleCard() {
  return (
    <div className="rounded-xl bg-sky-500/10 border border-sky-500/25 p-3 space-y-1 text-left">
      <p className="text-[10px] uppercase tracking-widest text-sky-300 font-semibold">Answer Rule</p>
      <p className="text-xs text-slate-200 leading-relaxed">
        Use only facts from your role card. If your card does not mention the answer, say
        <span className="font-semibold text-white"> &quot;I don&apos;t know&quot;</span> or
        <span className="font-semibold text-white"> &quot;I didn&apos;t see that.&quot;</span> You can phrase
        answers in your own words, but do not invent new facts.
      </p>
    </div>
  );
}

function CabinRoleReference({
  role,
  title = 'Role Card Reference',
}: {
  role: CabinRoleCardData;
  title?: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3 text-left">
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">{title}</p>

      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-semibold">Character</p>
        <p className="text-xs text-slate-200 leading-relaxed">{role.publicIdentity}</p>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Alibi</p>
        <p className="text-xs text-slate-300 leading-relaxed italic">&ldquo;{role.alibi}&rdquo;</p>
      </div>

      <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-3 space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-rose-300 font-semibold">Private Secret</p>
        <p className="text-xs text-rose-100 leading-relaxed">{role.privateSecret}</p>
        {role.culpritContext && (
          <p className="text-xs text-rose-200/80 italic">{role.culpritContext}</p>
        )}
      </div>

      <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold">Your Clue</p>
        <p className="text-xs text-amber-100 leading-relaxed">{role.clue}</p>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Must Reveal If Asked</p>
        <p className="text-xs text-slate-400 italic">{role.mustRevealTrigger.condition}</p>
        <p className="text-xs text-white leading-relaxed">&ldquo;{role.mustRevealTrigger.reveal}&rdquo;</p>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Goal</p>
        <p className="text-xs text-slate-200 leading-relaxed">{role.goal}</p>
      </div>
    </div>
  );
}

function CabinQuestionInput({ spec, onSubmit, isSubmitting, submitStatus, displayName }: DynamicInputProps) {
  const [step, setStep] = useState<'pick-target' | 'pick-question'>('pick-target');
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<{ id: string; text: string } | null>(null);

  const myData = displayName && spec.perStudentData
    ? (spec.perStudentData[displayName] as CabinQuestionStudentData | undefined)
    : undefined;

  const handleSubmit = useCallback(async () => {
    if (!selectedTarget || !selectedQuestion || isSubmitting) return;
    await onSubmit(JSON.stringify({
      targetSuspectId: selectedTarget,
      questionId: selectedQuestion.id,
      questionText: selectedQuestion.text,
    }));
  }, [selectedTarget, selectedQuestion, isSubmitting, onSubmit]);

  if (!myData) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-2xl">🔍</p>
        <p className="text-sm font-semibold text-lc-text">Investigation in progress</p>
        <p className="text-sm text-lc-text2 max-w-xs">
          You joined after roles were assigned. Ask your teacher to restart or reassign roles.
        </p>
      </div>
    );
  }

  // If this student's character is being questioned right now — show answer bank
  if (myData.isCurrentTarget) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-amber-500/15 border border-amber-500/40 p-4 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
            You are being questioned!
          </p>
          {myData.currentQuestionAskerName && (
            <p className="text-xs text-slate-400">
              <span className="text-slate-300 font-semibold">{myData.currentQuestionAskerName}</span> asks:
            </p>
          )}
          {myData.currentQuestionText && (
            <p className="text-base font-semibold text-white">&ldquo;{myData.currentQuestionText}&rdquo;</p>
          )}
        </div>

        <CabinAnswerRuleCard />

        {/* Answer bank */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Answer Options</p>
          <div className="space-y-2">
            <p className="text-xs text-slate-300">
              <span className="text-slate-500">Safe:</span> {myData.myRole.answerBank.safeAnswer}
            </p>
            <p className="text-xs text-slate-300">
              <span className="text-slate-500">Location:</span> {myData.myRole.answerBank.locationAnswer}
            </p>
            {myData.myRole.answerBank.conditionalAnswers.map((ca, i) => (
              <p key={i} className="text-xs text-slate-300">
                <span className="text-slate-500 italic">If {ca.trigger}:</span> {ca.response}
                {ca.isRequired && <span className="text-rose-400 ml-1">*must say</span>}
              </p>
            ))}
            {myData.myRole.answerBank.improv && (
              <p className="text-xs text-slate-300">
                <span className="text-slate-500">Improv:</span> {myData.myRole.answerBank.improv}
              </p>
            )}
          </div>
        </div>

        {myData.myRole.answerBank.deflectionLines.length > 0 && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Deflections</p>
            {myData.myRole.answerBank.deflectionLines.map((line, i) => (
              <p key={i} className="text-xs text-slate-300 italic">&ldquo;{line}&rdquo;</p>
            ))}
          </div>
        )}

        {myData.myRole.sentenceStems.length > 0 && (
          <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-3 space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-teal-400 font-semibold">Useful Phrases</p>
            {myData.myRole.sentenceStems.map((stem, i) => (
              <p key={i} className="text-xs text-teal-200 italic">&ldquo;{stem}&rdquo;</p>
            ))}
          </div>
        )}

        <CabinRoleReference role={myData.myRole} />
      </div>
    );
  }

  // Submitted — waiting state
  if (submitStatus === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="text-3xl">✓</div>
        <p className="text-green-400 font-semibold">Question sent!</p>
        <p className="text-sm text-lc-text2">Waiting for your teacher to call on you.</p>
        <div className="w-full space-y-3">
          <CabinAnswerRuleCard />
          <CabinRoleReference role={myData.myRole} />
        </div>
      </div>
    );
  }

  // Step 1: pick target (exclude own character)
  if (step === 'pick-target') {
    const targetSuspects = myData.suspects.filter((s) => s.id !== myData.mySuspectId && s.playedBy);
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-lc-text">
          Round {myData.roundNumber} — Who do you want to question?
        </p>
        {targetSuspects.length === 0 ? (
          <p className="text-sm text-lc-text2 text-center py-2">
            No other suspects available to question.
          </p>
        ) : (
          <div className="space-y-2">
            {targetSuspects.map((suspect) => (
              <button
                key={suspect.id}
                onClick={() => {
                  setSelectedTarget(suspect.id);
                  setSelectedQuestion(null);
                  setStep('pick-question');
                }}
                className="w-full text-left rounded-xl bg-lc-surface border border-lc-border hover:border-indigo-500/50 hover:bg-indigo-500/10 px-4 py-3 transition-all"
              >
                <p className="text-sm font-semibold text-lc-text">{suspect.name}</p>
                <p className="text-xs text-lc-text3">
                  {suspect.seatOrRole}
                  {suspect.playedBy ? ` · played by ${suspect.playedBy}` : ''}
                </p>
              </button>
            ))}
          </div>
        )}
        <CabinAnswerRuleCard />
        <CabinRoleReference role={myData.myRole} />
      </div>
    );
  }

  // Step 2: pick question
  const target = myData.suspects.find((s) => s.id === selectedTarget);
  const targetName = target?.name ?? selectedTarget ?? '';
  const questions = selectedTarget ? (myData.availableByTarget[selectedTarget] ?? []) : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setSelectedTarget(null); setSelectedQuestion(null); setStep('pick-target'); }}
          className="text-lc-text3 hover:text-lc-text text-lg leading-none"
        >
          ←
        </button>
        <div>
          <p className="text-sm font-semibold text-lc-text">Ask {targetName}:</p>
          {target?.playedBy && (
            <p className="text-xs text-lc-text3">Ask {target.playedBy} out loud when your teacher calls you.</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {questions.map((q) => (
          <button
            key={q.id}
            onClick={() => setSelectedQuestion(q)}
            className={`w-full text-left rounded-xl px-4 py-3 text-sm transition-all border ${
              selectedQuestion?.id === q.id
                ? 'bg-indigo-500 text-white border-indigo-400'
                : 'bg-lc-surface text-lc-text border-lc-border hover:bg-lc-card'
            }`}
          >
            {q.text}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between pt-1">
        <SubmitStatus status={submitStatus} waitSeconds={0} />
        <Button
          onClick={handleSubmit}
          disabled={!selectedQuestion || isSubmitting}
          className="bg-gradient-to-r from-indigo-500 to-blue-600"
        >
          {isSubmitting ? 'Sending…' : 'Ask Question'}
        </Button>
      </div>
      <CabinAnswerRuleCard />
      <CabinRoleReference role={myData.myRole} />
    </div>
  );
}

// ── Cabin Mystery: Final Vote ─────────────────────────────────────────────────

interface CabinVoteStudentData {
  suspects: Array<{ id: string; name: string; seatOrRole: string }>;
  revealedCards: Array<{ cardNumber: number; label: string }>;
}

function CabinVoteInput({ spec, onSubmit, isSubmitting, submitStatus, displayName }: DynamicInputProps) {
  const [step, setStep] = useState<'pick-suspect' | 'write-motive'>('pick-suspect');
  const [selectedSuspect, setSelectedSuspect] = useState<{ id: string; name: string } | null>(null);
  const [motive, setMotive] = useState('');

  const myData = displayName && spec.perStudentData
    ? (spec.perStudentData[displayName] as CabinVoteStudentData | undefined)
    : undefined;

  const handleSubmit = useCallback(async () => {
    if (!selectedSuspect || !motive.trim() || isSubmitting) return;
    await onSubmit(JSON.stringify({ suspectId: selectedSuspect.id, motive: motive.trim() }));
  }, [selectedSuspect, motive, isSubmitting, onSubmit]);

  if (!myData) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-2xl">🗳️</p>
        <p className="text-sm font-semibold text-lc-text">Final theory phase in progress</p>
        <p className="text-sm text-lc-text2 max-w-xs">
          You joined after roles were assigned. Ask your teacher to restart or reassign roles.
        </p>
      </div>
    );
  }

  if (submitStatus === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="text-3xl">✓</div>
        <p className="text-green-400 font-semibold">Theory submitted!</p>
        <p className="text-sm text-lc-text2">Waiting for the teacher to reveal the truth.</p>
      </div>
    );
  }

  if (step === 'pick-suspect') {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-lc-text">Who do you think is responsible?</p>
        <p className="text-xs text-lc-text3">Select the suspect you believe is the culprit.</p>
        {myData.suspects.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSelectedSuspect(s); setStep('write-motive'); }}
            className="w-full text-left rounded-xl bg-lc-surface border border-lc-border hover:border-rose-500/50 hover:bg-rose-500/10 px-4 py-3 transition-all"
          >
            <p className="text-sm font-semibold text-lc-text">{s.name}</p>
            <p className="text-xs text-lc-text3">{s.seatOrRole}</p>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setSelectedSuspect(null); setStep('pick-suspect'); }}
          className="text-lc-text3 hover:text-lc-text text-lg leading-none"
        >
          ←
        </button>
        <p className="text-sm font-semibold text-rose-300">{selectedSuspect?.name}</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-lc-text mb-1">Why do you think so?</p>
        {myData.revealedCards.length > 0 && (
          <p className="text-xs text-lc-text3 mb-2">
            Evidence: {myData.revealedCards.map((c) => c.label).join(' · ')}
          </p>
        )}
        <textarea
          value={motive}
          onChange={(e) => setMotive(e.target.value)}
          maxLength={180}
          rows={4}
          placeholder="Explain your reasoning using the evidence…"
          autoFocus
          className="w-full px-4 py-3 bg-lc-surface border border-lc-border rounded-xl text-lc-text placeholder:text-lc-text3 focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none"
        />
        <p className="text-xs text-lc-text3 mt-1 text-right">{motive.length}/180</p>
      </div>
      <div className="flex items-center justify-between">
        <SubmitStatus status={submitStatus} waitSeconds={0} />
        <Button
          onClick={handleSubmit}
          disabled={!motive.trim() || isSubmitting}
          className="bg-gradient-to-r from-rose-500 to-red-600"
        >
          {isSubmitting ? 'Submitting…' : 'Submit Theory'}
        </Button>
      </div>
    </div>
  );
}

// ── Cabin Mystery: Culprit Side ───────────────────────────────────────────────

interface CabinCulpritStudentData {
  isCulprit: boolean;
  characterName: string;
  culpritSidePrompt?: string;
  sentenceStems?: string[];
}

function CabinCulpritInput({ spec, displayName }: DynamicInputProps) {
  const myData = displayName && spec.perStudentData
    ? (spec.perStudentData[displayName] as CabinCulpritStudentData | undefined)
    : undefined;

  if (!myData) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <p className="text-2xl">🎤</p>
        <p className="text-sm text-lc-text2">Listening…</p>
      </div>
    );
  }

  if (myData.isCulprit) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-rose-500/15 border border-rose-500/40 p-4 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-rose-400 font-semibold">
            Your moment — speak in character as {myData.characterName}
          </p>
          <p className="text-sm text-rose-200 leading-relaxed">{myData.culpritSidePrompt}</p>
        </div>
        {(myData.sentenceStems?.length ?? 0) > 0 && (
          <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-3 space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-teal-400 font-semibold">Useful Phrases</p>
            {myData.sentenceStems!.map((stem, i) => (
              <p key={i} className="text-xs text-teal-200 italic">&ldquo;{stem}&rdquo;</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <p className="text-2xl">🎤</p>
      <p className="text-base font-bold text-purple-300">{myData.characterName} is speaking</p>
      <p className="text-sm text-lc-text2">Listen carefully to their side of the story.</p>
    </div>
  );
}
