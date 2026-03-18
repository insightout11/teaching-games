'use client';

import { useEffect, useRef, useState, useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useWidgetStore } from '@/stores/widget-store';

interface WidgetShellProps {
  id: string;
  label: string;
  icon: ReactNode;
  defaultPosition?: { x: number; y: number };
  children: ReactNode;
}

// Panel width matches the clamp() in the shell style below
const PANEL_W = () =>
  typeof window !== 'undefined'
    ? Math.min(420, Math.max(320, window.innerWidth * 0.28))
    : 340;

const PANEL_MARGIN = 16;

// Exported so WidgetLauncher can call it when resetting layout
export function computeDefaultPositions(
  ids: string[]
): Record<string, { x: number; y: number }> {
  if (typeof window === 'undefined') return {};
  const W = window.innerWidth;
  const H = window.innerHeight;
  const right = W - PANEL_W() - PANEL_MARGIN;
  const defaults: Record<string, { x: number; y: number }> = {
    timer:             { x: right, y: H - 290 },
    'random-picker':   { x: right, y: H - 510 },
    poll:              { x: right, y: H - 150 },
    freeze:            { x: right, y: H - 400 },
    'class-questions': { x: right, y: H - 560 },
  };
  return Object.fromEntries(
    ids.map((id) => [id, defaults[id] ?? { x: right, y: H - 300 }])
  );
}

function getDefaultPosition(id: string): { x: number; y: number } {
  return computeDefaultPositions([id])[id] ?? { x: 0, y: 0 };
}

export function WidgetShell({ id, label, icon, defaultPosition, children }: WidgetShellProps) {
  // Individual selectors — avoid re-rendering on other widgets' changes
  const widgetEntry = useWidgetStore((s) => s.widgets[id]);
  const bringToFront = useWidgetStore((s) => s.bringToFront);
  const setPosition = useWidgetStore((s) => s.setPosition);
  const closeWidget = useWidgetStore((s) => s.closeWidget);
  const setDefaultPosition = useWidgetStore((s) => s.setDefaultPosition);

  const widget = useMemo(() => ({
    position: widgetEntry?.position ?? { x: 0, y: 0 },
    isOpen: widgetEntry?.isOpen ?? true,
    zIndex: widgetEntry?.zIndex ?? 100,
  }), [widgetEntry]);

  const [mounted, setMounted] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const shellRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  useEffect(() => {
    setMounted(true);
    // Set default position on first mount if no persisted position exists
    const computed = defaultPosition ?? getDefaultPosition(id);
    setDefaultPosition(id, computed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const zIndex = widget.zIndex;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    bringToFront(id);
    isDragging.current = true;
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: widget.position.x,
      posY: widget.position.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.mouseX;
    const dy = e.clientY - dragStart.current.mouseY;
    const shellW = shellRef.current?.offsetWidth ?? 280;
    const shellH = shellRef.current?.offsetHeight ?? 200;
    const x = Math.max(0, Math.min(dragStart.current.posX + dx, window.innerWidth - shellW));
    const y = Math.max(0, Math.min(dragStart.current.posY + dy, window.innerHeight - shellH));
    setPosition(id, { x, y });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  if (!mounted || !widget.isOpen) return null;

  const content = (
    <div
      ref={shellRef}
      style={{
        position: 'fixed',
        left: widget.position.x,
        top: widget.position.y,
        zIndex,
        width: 'clamp(320px, 28vw, 420px)',
        maxWidth: '92vw',
        userSelect: isDragging.current ? 'none' : undefined,
      }}
      className="glass rounded-xl shadow-xl border border-lc-border overflow-hidden"
      onPointerDown={() => bringToFront(id)}
    >
      {/* Title bar — drag handle */}
      <div
        className="p-3 border-b border-lc-border flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="flex items-center gap-2">
          <span className="opacity-70 flex-shrink-0">{icon}</span>
          <span className="font-semibold text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
          {/* Minimize / restore */}
          <button
            onClick={() => setMinimized((m) => !m)}
            className="p-1 text-lc-text2 hover:text-lc-text transition-colors"
            title={minimized ? 'Restore' : 'Minimize'}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {minimized ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              )}
            </svg>
          </button>
          {/* Close */}
          <button
            onClick={() => closeWidget(id)}
            className="p-1 text-lc-text2 hover:text-lc-text transition-colors"
            title="Close"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content area */}
      {!minimized && (
        <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
