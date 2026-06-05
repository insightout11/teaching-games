'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Copy, Check, Loader2 } from 'lucide-react';
import type { Student } from '@/lib/supabase/types';

type SessionCount = 3 | 5 | 10 | 0;

const SESSION_OPTIONS: { value: SessionCount; label: string }[] = [
  { value: 3,  label: 'Last 3 sessions'  },
  { value: 5,  label: 'Last 5 sessions'  },
  { value: 10, label: 'Last 10 sessions' },
  { value: 0,  label: 'All sessions'     },
];

interface ProgressReportModalProps {
  student: Student | null;
  classId: string;
  open: boolean;
  onClose: () => void;
}

export function ProgressReportModal({ student, classId, open, onClose }: ProgressReportModalProps) {
  const [sessionCount, setSessionCount] = useState<SessionCount>(5);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [report, setReport] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setStatus('idle');
      setReport('');
      setErrorMsg('');
      setCopied(false);
    }
  }, [open]);

  async function handleGenerate() {
    if (!student) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/student/progress-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, classId, sessionCount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }
      setReport(data.report);
      setStatus('done');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!student) return null;

  return (
    <Modal open={open} onClose={onClose} title="Progress Report Draft">
      <div className="space-y-4">
        {/* Student name */}
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-lc-text3 shrink-0" />
          <span className="text-sm font-medium text-lc-text">{student.name}</span>
        </div>

        {/* Session range selector */}
        {status !== 'done' && (
          <div>
            <p className="text-xs text-lc-text3 mb-2">Sessions to include</p>
            <div className="grid grid-cols-2 gap-2">
              {SESSION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSessionCount(opt.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    sessionCount === opt.value
                      ? 'bg-lc-blue/10 border-lc-blue/40 text-lc-blue'
                      : 'bg-lc-surface border-lc-border text-lc-text3 hover:text-lc-text hover:border-lc-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {status === 'loading' && (
          <div className="flex items-center gap-3 py-6 justify-center text-lc-text3 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Gathering data and drafting report…
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="px-4 py-3 rounded-lg bg-lc-danger/10 border border-lc-danger/20 text-lc-danger text-sm">
            {errorMsg}
          </div>
        )}

        {/* Generated report */}
        {status === 'done' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-amber-400">AI draft. Review before sharing.</p>
              <button
                onClick={() => setStatus('idle')}
                className="text-xs text-lc-text3 hover:text-lc-text transition-colors"
              >
                Regenerate
              </button>
            </div>
            <Textarea
              inputSize="lg"
              className="h-72 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-lc-blue/50 font-mono leading-relaxed"
              value={report}
              onChange={(e) => setReport(e.target.value)}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <div className="flex items-center gap-2">
            {status === 'done' && (
              <Button variant="secondary" size="sm" onClick={handleCopy} className="gap-1.5">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy report'}
              </Button>
            )}
            {(status === 'idle' || status === 'error') && (
              <Button variant="primary" size="sm" onClick={handleGenerate}>
                Generate report
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
