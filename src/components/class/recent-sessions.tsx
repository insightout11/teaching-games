import type { Session } from '@/lib/supabase/types';
import { Card } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export function RecentSessions({ sessions, classId }: { sessions: Session[]; classId: string }) {
  return (
    <Card className="flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-lc-text3 shrink-0" />
        <h2 className="text-base font-semibold text-lc-text">Flight Log</h2>
        {sessions.length > 0 && (
          <span className="ml-auto text-xs text-lc-text3">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-lc-text3">
          <span className="text-2xl">✈</span>
          <p className="text-sm">No flights yet</p>
        </div>
      ) : (
        <div className="space-y-1.5 overflow-y-auto max-h-[520px] pr-0.5">
          {sessions.map((s) => {
            const date = new Date(s.started_at);
            const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isActive = s.status === 'active';
            return (
              <div
                key={s.id}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 border transition-colors ${
                  isActive
                    ? 'bg-lc-success/5 border-lc-success/20'
                    : 'bg-lc-surface border-lc-border-subtle hover:border-lc-border'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-lc-success' : 'bg-lc-border'}`} />
                  <span className="text-sm text-lc-text tabular-nums">{dateStr}</span>
                  <span className="text-xs text-lc-text3 tabular-nums">{timeStr}</span>
                </div>
                {isActive ? (
                  <a href={`/sessions/${s.id}`} className="text-xs font-semibold text-lc-success hover:text-lc-success/80 shrink-0 ml-2 uppercase tracking-wide">
                    Resume
                  </a>
                ) : (
                  <a href={`/classes/${classId}/sessions/${s.id}/control-room`} className="text-xs text-lc-blue hover:text-lc-blue-hover shrink-0 ml-2">
                    Debrief →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
