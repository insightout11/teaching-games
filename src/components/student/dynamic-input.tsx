'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { InputSpec } from '@/lib/input-spec';

interface DynamicInputProps {
  spec: InputSpec;
  onSubmit: (value: string) => Promise<void>;
  isSubmitting: boolean;
  submitStatus: 'idle' | 'success' | 'error' | 'rate_limited';
  waitSeconds: number;
  clientId?: string;
  displayName?: string;
}

export function DynamicInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds, clientId, displayName }: DynamicInputProps) {
  switch (spec.type) {
    case 'text':
      return <TextInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
    case 'textarea':
      return <TextareaInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} clientId={clientId} />;
    case 'choice':
      if (spec.timerSeconds) {
        return <QuizChoiceInput
          key={`${spec.prompt ?? ''}::${(spec.options || []).join('|')}`}
          spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} clientId={clientId} />;
      }
      return <ChoiceInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} clientId={clientId} />;
    case 'binary':
      return <BinaryInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
    case 'multi-select':
      return <MultiSelectInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} clientId={clientId} />;
    case 'sequence':
      return <SequenceInput key={`${spec.prompt ?? ''}::${(spec.options || []).join('|')}`} spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
    case 'ranking':
      return <RankingInput key={`${spec.prompt ?? ''}::${(spec.options || []).join('|')}`} spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
    case 'error-correction':
      return <ErrorCorrectionInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
    case 'confirm':
      return <ConfirmInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} displayName={displayName} />;
    default:
      return <TextInput spec={spec} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} waitSeconds={waitSeconds} />;
  }
}

// Common status display component
function SubmitStatus({ status, waitSeconds }: { status: 'idle' | 'success' | 'error' | 'rate_limited'; waitSeconds: number }) {
  if (status === 'idle') return null;
  return (
    <div className="text-sm mt-2">
      {status === 'success' && <span className="text-green-400">Submitted!</span>}
      {status === 'error' && <span className="text-red-400">Failed to submit</span>}
      {status === 'rate_limited' && <span className="text-yellow-400">Wait {waitSeconds}s...</span>}
    </div>
  );
}

// Single line text input
function TextInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds }: DynamicInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Ref-based guard — avoids stale-closure issues with state-based isSubmitting
  const inFlightRef = useRef(false);

  const handleSubmit = useCallback(async () => {
    if (inFlightRef.current) return;
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
  }, [onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium">{spec.prompt}</p>
      )}
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
          disabled={isSubmitting || submitStatus === 'rate_limited'}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

// Multi-line textarea input
function TextareaInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds, clientId }: DynamicInputProps) {
  const prefill = (clientId && spec.prefillByClientId?.[clientId]) ?? '';
  const [value, setValue] = useState(prefill);
  const [showHint, setShowHint] = useState(false);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);

  const hasResources = (spec.resources?.length ?? 0) > 0;
  const resourcesRequired = hasResources && selectedResources.length === 0;

  const handleSubmit = useCallback(async () => {
    if (!value.trim() || isSubmitting || resourcesRequired) return;
    // Encode as structured JSON when resources are involved so the API can extract resourcesUsed
    const payload = hasResources
      ? JSON.stringify({ choice: value.trim(), resourcesUsed: selectedResources })
      : value.trim();
    await onSubmit(payload);
    setValue('');
    setSelectedResources([]);
  }, [value, isSubmitting, hasResources, selectedResources, resourcesRequired, onSubmit]);

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

  return (
    <div className="space-y-4">
      {spec.instruction && (
        <p className="text-sm text-lc-text2 mb-1">{spec.instruction}</p>
      )}
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium">{spec.prompt}</p>
      )}
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
      {spec.keywords && spec.keywords.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs opacity-50 uppercase tracking-widest">Try to use</p>
          <div className="flex flex-wrap gap-1.5">
            {spec.keywords.map((kw) => (
              <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">{kw}</span>
            ))}
          </div>
        </div>
      )}
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
          disabled={!value.trim() || isSubmitting || submitStatus === 'rate_limited' || resourcesRequired}
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

// Quiz-mode choice input: 2×2 grid, auto-submit, timer, locked state
const QUIZ_COLORS = [
  'bg-red-600 hover:bg-red-500 active:bg-red-700',
  'bg-blue-600 hover:bg-blue-500 active:bg-blue-700',
  'bg-amber-500 hover:bg-amber-400 active:bg-amber-600',
  'bg-green-600 hover:bg-green-500 active:bg-green-700',
];
const QUIZ_LABELS = ['A', 'B', 'C', 'D'];

const QUIZ_GRACE_MS = 1500;

function QuizChoiceInput({ spec, onSubmit, isSubmitting, clientId }: DynamicInputProps) {
  const timerSeconds = spec.timerSeconds ?? 30;
  // Sync to teacher timer: subtract time already elapsed since question was broadcast
  const initialTime = spec.startedAt
    ? Math.max(0, timerSeconds - Math.floor((Date.now() - spec.startedAt) / 1000))
    : timerSeconds;
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [submitted, setSubmitted] = useState(false);
  // Grace period: keep buttons active for QUIZ_GRACE_MS after timer hits 0
  const [isExpired, setIsExpired] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  // Expire buttons after grace period once timer hits 0
  useEffect(() => {
    if (submitted || timeLeft > 0) return;
    const grace = setTimeout(() => setIsExpired(true), QUIZ_GRACE_MS);
    return () => clearTimeout(grace);
  }, [submitted, timeLeft]);

  // Per-student data from game
  const myData = (clientId ? spec.perStudentData?.[clientId] : undefined) as
    | { locked?: boolean; result?: 'correct' | 'incorrect'; pointsEarned?: number }
    | undefined;
  const isLocked = myData?.locked === true || submitted;
  const result = myData?.result;

  const handlePick = useCallback(async (index: number) => {
    if (isSubmitting || isLocked || isExpired) return;
    setSubmitted(true);
    await onSubmit(String(index));
  }, [isSubmitting, isLocked, isExpired, onSubmit]);

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
        <p className="text-green-400 font-bold text-lg">Locked in!</p>
        <p className="text-lc-text2 text-sm">Waiting for others…</p>
      </div>
    );
  }

  // Active — show timer + answer grid
  const timerPct = (timeLeft / timerSeconds) * 100;
  const timerColor = timerPct > 50 ? 'bg-green-500' : timerPct > 25 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-base text-lc-text font-medium leading-snug">{spec.prompt}</p>
      )}
      {/* Timer bar */}
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
      {/* 2×2 answer grid */}
      <div className="grid grid-cols-2 gap-3">
        {(spec.options ?? []).slice(0, 4).map((option, i) => (
          <button
            key={i}
            onClick={() => handlePick(i)}
            disabled={isSubmitting || isExpired}
            className={`${QUIZ_COLORS[i]} text-white rounded-xl p-4 text-left shadow-lg transition-all disabled:opacity-40 active:scale-95`}
          >
            <div className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">{QUIZ_LABELS[i]}</div>
            <div className="text-sm font-semibold leading-snug">{option}</div>
          </button>
        ))}
      </div>
      {timeLeft === 0 && (
        <p className="text-center text-lc-text2 text-sm">Time&apos;s up!</p>
      )}
    </div>
  );
}

// Multiple choice (pick one)
function ChoiceInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds }: DynamicInputProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [writeInMode, setWriteInMode] = useState(false);
  const [writeInText, setWriteInText] = useState('');

  const submitValue = writeInMode ? writeInText.trim() : selected;
  const canSubmit = !!submitValue && !isSubmitting && submitStatus !== 'rate_limited';

  const handleSubmit = useCallback(async () => {
    if (!submitValue || isSubmitting) return;
    await onSubmit(submitValue);
    setSelected(null);
    setWriteInMode(false);
    setWriteInText('');
  }, [submitValue, isSubmitting, onSubmit]);

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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

// Binary choice (A or B)
function BinaryInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds }: DynamicInputProps) {
  const labels = useMemo(() => spec.optionLabels || ['A', 'B'], [spec.optionLabels]);
  const options = spec.options || labels;

  // Send the LABEL (A/B), not the full option text
  const handleChoice = useCallback(async (index: number) => {
    if (isSubmitting) return;
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
            disabled={isSubmitting || submitStatus === 'rate_limited'}
            className="p-6 rounded-2xl bg-lc-surface border border-lc-border hover:border-cyan-500/50 hover:bg-lc-card transition-all text-lc-text font-bold text-xl disabled:opacity-50"
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
      <div className="grid grid-cols-4 gap-1.5">
        {spec.options?.map((option, index) => (
          <button
            key={index}
            onClick={() => toggleOption(option)}
            disabled={isSubmitting || foundWords.has(option)}
            className={`p-1.5 sm:p-2.5 rounded-xl text-xs sm:text-sm transition-all min-h-[3rem] flex items-center justify-center text-center leading-tight break-words hyphens-auto ${
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
function SequenceInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds }: DynamicInputProps) {
  const [sequence, setSequence] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<string[]>(spec.options || []);

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
    if (remaining.length > 0 || isSubmitting) return;
    await onSubmit(JSON.stringify(sequence));
    setSequence([]);
    setRemaining(spec.options || []);
  }, [sequence, remaining.length, isSubmitting, onSubmit, spec.options]);

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

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium">{spec.prompt}</p>
      )}

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
          disabled={remaining.length > 0 || isSubmitting || submitStatus === 'rate_limited'}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}

// Error correction input (tap words to mark errors and type corrections)
function ErrorCorrectionInput({ spec, onSubmit, isSubmitting, submitStatus, waitSeconds }: DynamicInputProps) {
  const [corrections, setCorrections] = useState<Map<number, string>>(new Map());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [correctionText, setCorrectionText] = useState('');

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
    if (corrections.size === 0 || isSubmitting) return;
    const payload = Array.from(corrections.entries()).map(([index, correction]) => ({
      position: index,
      original: words[index]?.replace(/[.,!?;:'"]/g, '') || '',
      correction,
    }));
    await onSubmit(JSON.stringify(payload));
    setCorrections(new Map());
    setEditingIndex(null);
    setCorrectionText('');
  }, [corrections, isSubmitting, onSubmit, words]);

  return (
    <div className="space-y-4">
      {spec.prompt && (
        <p className="text-lg text-cyan-400 font-medium">{spec.prompt}</p>
      )}

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
          disabled={corrections.size === 0 || isSubmitting || submitStatus === 'rate_limited'}
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

  // Look up character card for this student by display name
  const characterCard = displayName && spec.perStudentData
    ? (spec.perStudentData[displayName] as { name?: string; viewpoint?: string; speakingLine?: string } | undefined)
    : undefined;
  const hasCard = characterCard?.name && (characterCard?.viewpoint || characterCard?.speakingLine);

  return (
    <div className="space-y-6 text-center">
      {hasCard ? (
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
      <p className="text-sm text-lc-text2">Drag to reorder (1 = highest)</p>

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
                className="p-1 text-lc-text3 hover:text-lc-text disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => index < items.length - 1 && moveItem(index, index + 1)}
                disabled={index === items.length - 1}
                className="p-1 text-lc-text3 hover:text-lc-text disabled:opacity-30"
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
