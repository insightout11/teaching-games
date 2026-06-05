'use client';

// First-run, skippable onboarding (home §5). Five quick taps capture the teaching
// profile that powers "Recommended for you". Selecting an option auto-advances; the
// final pick saves to the teacher row and refreshes the home so recommendations update.

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { ONBOARDING_STEPS, type TeacherProfile } from '@/lib/teacher-profile';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  open: boolean;
  onClose: () => void;       // skip / dismiss without completing
  onCompleted: () => void;   // saved successfully
}

export function OnboardingFlow({ open, onClose, onCompleted }: OnboardingFlowProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Partial<TeacherProfile>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const step = ONBOARDING_STEPS[stepIdx];
  const isLast = stepIdx === ONBOARDING_STEPS.length - 1;

  async function select(value: string) {
    const next = { ...answers, [step.key]: value };
    setAnswers(next);
    if (!isLast) {
      setStepIdx((i) => i + 1);
      return;
    }
    // Final pick — save.
    setSaving(true);
    setError(false);
    try {
      const res = await fetch('/api/teacher/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error();
      onCompleted();
    } catch {
      setSaving(false);
      setError(true);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-5">
        {/* Header: progress + skip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {ONBOARDING_STEPS.map((s, i) => (
              <span
                key={s.key}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === stepIdx ? 'w-6 bg-cyan-400' : i < stepIdx ? 'w-1.5 bg-cyan-400/60' : 'w-1.5 bg-white/15',
                )}
              />
            ))}
          </div>
          <button onClick={onClose} className="text-[12px] text-lc-text3 transition-colors hover:text-lc-text">
            Skip for now
          </button>
        </div>

        <div>
          <p className="font-instrument text-[11px] uppercase tracking-[0.22em] text-cyan-300/80">
            Personalize your home · {stepIdx + 1} of {ONBOARDING_STEPS.length}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-lc-text">{step.question}</h2>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {step.options.map((opt) => {
            const selected = answers[step.key] === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={saving}
                onClick={() => select(opt.value)}
                className={cn(
                  'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all disabled:opacity-50',
                  selected
                    ? 'border-cyan-300/70 bg-cyan-400/10'
                    : 'border-lc-border bg-lc-surface hover:border-cyan-300/40 hover:bg-white/[0.04]',
                )}
              >
                <span>
                  <span className="block text-sm font-medium text-lc-text">{opt.label}</span>
                  {opt.hint && <span className="block text-[11px] text-lc-text3">{opt.hint}</span>}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-1">
          {stepIdx > 0 ? (
            <button
              onClick={() => setStepIdx((i) => i - 1)}
              disabled={saving}
              className="inline-flex items-center gap-1 text-[13px] text-lc-text3 transition-colors hover:text-lc-text disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden /> Back
            </button>
          ) : (
            <span />
          )}
          {saving && <span className="text-[13px] text-lc-text3">Saving…</span>}
          {error && <span className="text-[13px] text-red-400">Couldn’t save — try again.</span>}
        </div>
      </div>
    </Modal>
  );
}
