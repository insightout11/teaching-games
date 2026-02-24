'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useWidgetStore } from '@/stores/widget-store';

interface WidgetShellProps {
  id: string;
  label: string;
  icon: ReactNode;
  defaultPosition?: { x: number; y: number };
  children: ReactNode;
}

function getDefaultPosition(id: string): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  const W = window.innerWidth;
  const H = window.innerHeight;
  const right = W - 296; // 280px panel + 16px margin
  const positions: Record<string, { x: number; y: number }> = {
    timer: { x: right, y: H - 260 },
    'random-picker': { x: right, y: H - 460 },
    poll: { x: right, y: H - 140 },
  };
  return positions[id] ?? { x: right, y: H - 300 };
}

export function WidgetShell({ id, label, icon, defaultPosition, children }: WidgetShellProps) {
  const { getWidget, bringToFront, setPosition, closeWidget, setDefaultPosition } = useWidgetStore();
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

  const widget = getWidget(id);
  // Read zIndex from store directly (not via getWidget which returns default)
  const storedZIndex = useWidgetStore((s) => s.widgets[id]?.zIndex);
  const zIndex = storedZIndex ?? 100;

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
        userSelect: isDragging.current ? 'none' : undefined,
      }}
      className="w-80 glass rounded-xl shadow-xl border border-white/10 overflow-hidden"
      onPointerDown={() => bringToFront(id)}
    >
      {/* Title bar — drag handle */}
      <div
        className="p-3 border-b border-white/10 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
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
            className="p-1 text-gray-400 hover:text-white transition-colors"
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
            className="p-1 text-gray-400 hover:text-white transition-colors"
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
        <div className="max-h-[60vh] overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
