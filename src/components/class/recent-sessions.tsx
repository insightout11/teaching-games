import type { Session } from '@/lib/supabase/types';
import { Card } from '@/components/ui/card';

export function RecentSessions({ sessions, classId }: { sessions: Session[]; classId: string }) {
  if (sessions.length === 0) {
    return (
      <Card>
        <h2 className="text-lg font-semibold mb-3">Recent Sessions</h2>
        <p className="text-sm text-lc-text3 text-center py-8">No sessions yet</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col min-h-0">
      <h2 className="text-lg font-semibold mb-3">Recent Sessions</h2>
      <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
        {sessions.map((s) => {
          const date = new Date(s.started_at);
          const dateStr = date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' });
          const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <div
              key={s.id}
              className="flex items-center justify-between bg-lc-surface border border-lc-border rounded-xl px-3 py-2.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-lc-text truncate">{dateStr} {timeStr}</span>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                  s.status === 'active'
                    ? 'bg-lc-success/15 text-lc-success'
                    : 'bg-lc-surface text-lc-text3'
                }`}>
                  {s.status}
                </span>
              </div>
              {s.status === 'active' && (
                <a href={`/sessions/${s.id}`} className="text-sm text-lc-blue hover:text-lc-blue-hover shrink-0 ml-2">
                  Resume
                </a>
              )}
              {s.status === 'ended' && (
                <a href={`/classes/${classId}/sessions/${s.id}/control-room`} className="text-sm text-lc-blue hover:text-lc-blue-hover shrink-0 ml-2">
                  Control Room
                </a>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
