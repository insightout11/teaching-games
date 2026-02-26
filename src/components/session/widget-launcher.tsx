'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { useWidgetStore } from '@/stores/widget-store';
import { WIDGET_REGISTRY, WIDGET_ICON_PATHS } from './widget-registry';
import { computeDefaultPositions } from './widget-shell';

interface WidgetLauncherProps {
  sessionId?: string;
}

export function WidgetLauncher({ sessionId }: WidgetLauncherProps) {
  const { widgets, openWidget, resetLayout } = useWidgetStore();
  const [mounted, setMounted] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState(0);

  // Subscribe to pending Class Questions count for the notification badge
  useEffect(() => {
    if (!sessionId || isMockMode()) return;
    const supabase = createClient();

    supabase
      .from('student_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('status', 'pending')
      .is('game_key', null)
      .then(({ count }: { count: number | null }) => setPendingQuestions(count ?? 0));

    const channel = supabase
      .channel(`widget-launcher-questions:${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'student_submissions',
        filter: `session_id=eq.${sessionId}`,
      }, (payload: { new: { game_key: string | null; status: string } }) => {
        if (payload.new.game_key === null && payload.new.status === 'pending') {
          setPendingQuestions((n) => n + 1);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'student_submissions',
        filter: `session_id=eq.${sessionId}`,
      }, () => {
        // Re-fetch count on any update (publish/reject resets the pending list)
        supabase
          .from('student_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', sessionId)
          .eq('status', 'pending')
          .is('game_key', null)
          .then(({ count }: { count: number | null }) => setPendingQuestions(count ?? 0));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Widgets that are currently closed
  const closedWidgets = WIDGET_REGISTRY.filter((w) => {
    const entry = widgets[w.id];
    return entry ? !entry.isOpen : false;
  });

  // If all widgets are open, show a minimal icon only
  const allOpen = closedWidgets.length === 0;

  if (!mounted) return null;

  const content = (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col items-end gap-2">
      {/* Tray */}
      {trayOpen && (
        <div className="glass rounded-xl shadow-xl border border-white/10 overflow-hidden mb-1 w-44">
          <div className="p-2 border-b border-white/10">
            <span className="text-xs font-semibold opacity-60 uppercase tracking-wider">Widgets</span>
          </div>
          <div className="p-2 space-y-1">
            {closedWidgets.length === 0 ? (
              <p className="text-xs opacity-40 text-center py-1">All widgets open</p>
            ) : (
              closedWidgets.map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    openWidget(w.id);
                    setTrayOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-white/10 transition-colors text-left"
                >
                  <svg className="w-3.5 h-3.5 opacity-70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={WIDGET_ICON_PATHS[w.id] ?? ''} />
                  </svg>
                  <span className="flex-1">{w.label}</span>
                  {w.id === 'class-questions' && pendingQuestions > 0 && (
                    <span className="w-4 h-4 bg-amber-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white flex-shrink-0">
                      {pendingQuestions}
                    </span>
                  )}
                </button>
              ))
            )}
            <div className="border-t border-white/10 mt-1 pt-1">
              <button
                onClick={() => {
                  const ids = WIDGET_REGISTRY.map((w) => w.id);
                  resetLayout(computeDefaultPositions(ids));
                  setTrayOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-white/10 transition-colors text-left opacity-60 hover:opacity-100"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset layout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Launcher button — only show if there are closed widgets or tray is open */}
      {(!allOpen || trayOpen) && (
        <button
          onClick={() => setTrayOpen((o) => !o)}
          className={`relative w-10 h-10 rounded-full glass shadow-lg flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 ${
            trayOpen ? 'bg-white/10' : ''
          }`}
          title="Widgets"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {pendingQuestions > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
              {pendingQuestions}
            </span>
          )}
        </button>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
