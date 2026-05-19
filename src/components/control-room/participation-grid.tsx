'use client';

import { Radio } from 'lucide-react';
import { StudentNoteEditor } from './student-note-editor';

interface ParticipationRow {
  studentId: string;
  name: string;
  attempts: number;
  coverage: number | null;
  accuracy: number | null;
}

interface ParticipationGridProps {
  rows: ParticipationRow[];
  maxPromptIndex: number | null;
  sessionId: string;
  classId: string;
  teacherId: string;
  initialNotes: Record<string, string>;
}

function accuracyColor(accuracy: number | null): string {
  if (accuracy === null) return 'text-lc-text3';
  if (accuracy >= 80) return 'text-lc-success';
  if (accuracy >= 50) return 'text-lc-warn';
  return 'text-lc-danger';
}

const AVATAR_COLORS = [
  'bg-blue-500/20 text-blue-300',
  'bg-violet-500/20 text-violet-300',
  'bg-emerald-500/20 text-emerald-300',
  'bg-amber-500/20 text-amber-300',
  'bg-rose-500/20 text-rose-300',
  'bg-cyan-500/20 text-cyan-300',
  'bg-pink-500/20 text-pink-300',
  'bg-indigo-500/20 text-indigo-300',
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function ParticipationGrid({ rows, maxPromptIndex, sessionId, classId, teacherId, initialNotes }: ParticipationGridProps) {
  const sorted = [...rows].sort((a, b) => {
    if (a.coverage === null && b.coverage === null) return a.name.localeCompare(b.name);
    if (a.coverage === null) return 1;
    if (b.coverage === null) return -1;
    if (b.coverage !== a.coverage) return b.coverage - a.coverage;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="bg-lc-card rounded-2xl border border-lc-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="w-4 h-4 text-lc-text3 shrink-0" />
        <h2 className="font-semibold text-lc-text">Crew Activity</h2>
      </div>

      {maxPromptIndex === null && (
        <div className="mb-4 text-sm text-lc-text3 bg-lc-surface rounded-lg px-4 py-3">
          Coverage tracking requires sessions recorded after the v1.1 update.
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-lc-text3 text-sm">No crew on record</p>
      ) : (
        <div className="space-y-1">
          {sorted.map((row) => (
            <div key={row.studentId} className="pb-2 border-b border-lc-border-subtle last:border-0">
              <div className="flex items-center gap-3 py-1">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(row.name)}`}>
                  {row.name.charAt(0).toUpperCase()}
                </span>
                <span className="w-28 text-sm text-lc-text truncate shrink-0">{row.name}</span>
                <div className="flex-1 bg-lc-surface rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-lc-blue transition-all duration-500"
                    style={{ width: `${row.coverage ?? 0}%` }}
                  />
                </div>
                <span className="w-10 text-xs text-lc-text3 text-right shrink-0 tabular-nums">
                  {row.coverage !== null ? `${row.coverage}%` : 'N/A'}
                </span>
                <span className={`w-10 text-xs font-semibold text-right shrink-0 tabular-nums ${accuracyColor(row.accuracy)}`}>
                  {row.accuracy !== null ? `${row.accuracy}%` : '—'}
                </span>
              </div>
              <StudentNoteEditor
                sessionId={sessionId}
                studentId={row.studentId}
                classId={classId}
                teacherId={teacherId}
                initialNote={initialNotes[row.studentId] ?? ''}
              />
            </div>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <span className="w-7 shrink-0" />
            <span className="w-28 shrink-0" />
            <span className="flex-1" />
            <span className="w-10 text-xs text-lc-text3 text-right shrink-0">Cov</span>
            <span className="w-10 text-xs text-lc-text3 text-right shrink-0">Acc</span>
          </div>
        </div>
      )}
    </div>
  );
}
