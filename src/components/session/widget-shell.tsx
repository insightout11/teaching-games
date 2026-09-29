'use client';

import { useSnapZones, nearestZone, snappedPosition } from '@/stores/snap-zones-store';
import { useEffect, useRef, useState, useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Blend, Columns2, Maximize2, Minimize2 } from 'lucide-react';
import { useWidgetStore } from '@/stores/widget-store';

interface WidgetShellProps {
  id: string;
  label: string;
  icon: ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultOpen?: boolean;
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
    'class-questions': { x: right, y: H - 560 },
    'class-board':     { x: right, y: H - 360 },
    'word-cloud':      { x: right, y: H - 420 },
  };
  return Object.fromEntries(
    ids.map((id) => [id, defaults[id] ?? { x: right, y: H - 300 }])
  );
}

function getDefaultPosition(id: string): { x: number; y: number } {
  return computeDefaultPositions([id])[id] ?? { x: 0, y: 0 };
}

export function WidgetShell({ id, label, icon, defaultPosition, defaultOpen = true, children }: WidgetShellProps) {
  // Individual selectors — avoid re-rendering on other widgets' changes
  const widgetEntry = useWidgetStore((s) => s.widgets[id]);
  const bringToFront = useWidgetStore((s) => s.bringToFront);
  const setPosition = useWidgetStore((s) => s.setPosition);
  const closeWidget = useWidgetStore((s) => s.closeWidget);
  const setDefaultPosition = useWidgetStore((s) => s.setDefaultPosition);
  const setLayout = useWidgetStore((s) => s.setLayout);
  const wind = useSnapZones((s) => s.windRect);

  const widget = useMemo(() => ({
    position: widgetEntry?.position ?? { x: 0, y: 0 },
    isOpen: widgetEntry?.isOpen ?? defaultOpen,
    zIndex: widgetEntry?.zIndex ?? 100,
  }), [defaultOpen, widgetEntry]);

  const [mounted, setMounted] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const shellRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  useEffect(() => {
    setMounted(true);
    // Set default position on first mount if no persisted position exists
    const computed = defaultPosition ?? getDefaultPosition(id);
    setDefaultPosition(id, computed, defaultOpen);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, defaultOpen]);

  const zIndex = widget.zIndex;
  const mode = wind ? widgetEntry?.mode ?? 'free' : 'free';
  const glass = !!widgetEntry?.glass;
  const size = widgetEntry?.size ?? null;

  // Where the shell sits: floating (free), or filling half / all of the Live Room
  // windscreen (never the teacher's cockpit around it). Outside the Live Room,
  // "Full size" keeps its old whole-page behaviour.
  const GAP = 10;
  const box: { left: number | string; top: number | string; width: number | string; height?: number | string } =
    wind && mode === 'full' ? { left: wind.left + GAP, top: wind.top + GAP, width: wind.width - GAP * 2, height: wind.height - GAP * 2 }
      : wind && mode === 'half-left' ? { left: wind.left + GAP, top: wind.top + GAP, width: wind.width / 2 - GAP * 1.5, height: wind.height - GAP * 2 }
        : wind && mode === 'half-right' ? { left: wind.left + wind.width / 2 + GAP / 2, top: wind.top + GAP, width: wind.width / 2 - GAP * 1.5, height: wind.height - GAP * 2 }
          : expanded ? { left: '2vw', top: '2vh', width: '96vw', height: '96vh' }
            : { left: widget.position.x, top: widget.position.y, width: size ? size.w : 'clamp(320px, 28vw, 420px)', height: size?.h };
  const pxWidth = typeof box.width === 'number' ? box.width : expanded ? window.innerWidth * 0.96 : PANEL_W();
  // Content grows with the widget (gently: a bigger board also fits more).
  const zoom = Math.min(1.45, Math.max(0.85, Math.pow(pxWidth / 380, 0.45)));
  const filled = box.height !== undefined;

  const toFree = () => {
    const r = shellRef.current?.getBoundingClientRect();
    if (r) setLayout(id, { mode: 'free', position: { x: r.left, y: r.top } });
    else setLayout(id, { mode: 'free' });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (expanded) return; // no dragging while maximized
    if (mode !== 'free') toFree();
    e.currentTarget.setPointerCapture(e.pointerId);
    bringToFront(id);
    isDragging.current = true;
    const r = shellRef.current?.getBoundingClientRect();
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: r?.left ?? widget.position.x,
      posY: r?.top ?? widget.position.y,
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
    // Live Room snap zones (none registered elsewhere): highlight the one we'd snap to.
    const snap = useSnapZones.getState();
    if (snap.zones.length) {
      if (!snap.dragging) snap.setDragging(true);
      const zone = nearestZone(snap.zones, x, y, shellW, shellH);
      if ((zone?.id ?? null) !== snap.hot) snap.setHot(zone?.id ?? null);
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    const snap = useSnapZones.getState();
    if (snap.zones.length) {
      const zone = snap.zones.find((z) => z.id === snap.hot);
      if (zone && shellRef.current) {
        setPosition(id, snappedPosition(zone, shellRef.current.offsetWidth, shellRef.current.offsetHeight));
      }
      snap.setDragging(false);
    }
  };

  // Resize handle (bottom-right corner): any size between the presets.
  const resizeStart = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const onResizeDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const r = shellRef.current?.getBoundingClientRect();
    if (!r) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (mode !== 'free' || expanded) {
      setExpanded(false);
      setLayout(id, { mode: 'free', position: { x: r.left, y: r.top }, size: { w: r.width, h: r.height } });
    }
    bringToFront(id);
    resizeStart.current = { x: e.clientX, y: e.clientY, w: r.width, h: r.height };
  };
  const onResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = resizeStart.current;
    if (!st) return;
    const r = shellRef.current?.getBoundingClientRect();
    const maxW = window.innerWidth - (r?.left ?? 0) - 4;
    const maxH = window.innerHeight - (r?.top ?? 0) - 4;
    setLayout(id, {
      size: {
        w: Math.round(Math.max(260, Math.min(maxW, st.w + e.clientX - st.x))),
        h: Math.round(Math.max(160, Math.min(maxH, st.h + e.clientY - st.y))),
      },
    });
  };
  const onResizeUp = () => { resizeStart.current = null; };

  if (!mounted || !widget.isOpen) return null;

  const btn = 'p-1 text-lc-text2 hover:text-lc-text transition-colors';
  const content = (
    <div
      ref={shellRef}
      data-widget-id={id}
      style={{
        position: 'fixed',
        left: box.left,
        top: box.top,
        zIndex: expanded || mode !== 'free' ? zIndex + 1000 : zIndex,
        width: box.width,
        maxWidth: expanded ? '96vw' : mode !== 'free' ? undefined : '92vw',
        height: minimized ? undefined : box.height,
        userSelect: isDragging.current ? 'none' : undefined,
        transition: isDragging.current || resizeStart.current ? undefined : 'left .25s ease, top .25s ease, width .25s ease, height .25s ease',
      }}
      className={[
        'rounded-xl shadow-xl border overflow-hidden flex flex-col',
        glass ? 'widget-glass border-white/25' : 'glass border-lc-border',
      ].join(' ')}
      onPointerDown={() => bringToFront(id)}
    >
      {glass && (
        <style>{`.widget-glass{background:rgba(8,14,28,.16);backdrop-filter:blur(2px);text-shadow:0 1px 6px rgba(0,0,0,.65)}.widget-glass [class*="bg-lc-"],.widget-glass [class*="bg-white/"],.widget-glass [class*="bg-slate-"],.widget-glass [class*="bg-black/"]{background-color:rgba(10,18,34,.3)!important}`}</style>
      )}
      {/* Title bar — drag handle */}
      <div
        className={`p-3 border-b flex items-center justify-between select-none shrink-0 ${glass ? 'border-white/15' : 'border-lc-border'} ${
          expanded ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="flex items-center gap-2">
          <span className="opacity-70 flex-shrink-0">{icon}</span>
          <span className="font-semibold text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
          {/* See-through: keep the view outside visible */}
          <button onClick={() => setLayout(id, { glass: !glass })} className={glass ? 'p-1 text-sky-300' : btn} title={glass ? 'Solid' : 'Glass (see-through)'}>
            <Blend className="w-3.5 h-3.5" />
          </button>
          {wind && (
            <>
              {/* Half the windscreen, on the side the widget is on */}
              <button
                onClick={() => {
                  setMinimized(false);
                  if (mode === 'half-left' || mode === 'half-right') { toFree(); return; }
                  const r = shellRef.current?.getBoundingClientRect();
                  const left = r ? r.left + r.width / 2 < wind.left + wind.width / 2 : true;
                  setLayout(id, { mode: left ? 'half-left' : 'half-right' });
                }}
                className={mode === 'half-left' || mode === 'half-right' ? 'p-1 text-sky-300' : btn}
                title={mode.startsWith('half') ? 'Float' : 'Half the windscreen'}
              >
                <Columns2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setMinimized(false); if (mode === 'full') toFree(); else setLayout(id, { mode: 'full' }); }}
                className={mode === 'full' ? 'p-1 text-sky-300' : btn}
                title={mode === 'full' ? 'Float' : 'Fill the windscreen'}
              >
                {mode === 'full' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </>
          )}
          {!wind && (
            /* Maximize / restore to full size */
            <button
              onClick={() => {
                setExpanded((v) => !v);
                setMinimized(false);
              }}
              className={btn}
              title={expanded ? 'Restore size' : 'Full size'}
            >
              {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
          {/* Minimize / restore */}
          <button
            onClick={() => setMinimized((m) => !m)}
            className={btn}
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
            className={btn}
            title="Close"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content area: scales with the widget */}
      {!minimized && (
        <div
          className={filled ? 'min-h-0 flex-1 overflow-y-auto overflow-x-hidden' : 'max-h-[60vh] overflow-y-auto overflow-x-hidden'}
          style={{ zoom }}
        >
          {children}
        </div>
      )}
      {!minimized && !expanded && (
        <div
          aria-label="Resize"
          title="Drag to resize"
          onPointerDown={onResizeDown}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeUp}
          className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize touch-none"
          style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,.35) 50%, rgba(255,255,255,.35) 60%, transparent 60%, transparent 70%, rgba(255,255,255,.35) 70%, rgba(255,255,255,.35) 80%, transparent 80%)' }}
        />
      )}
    </div>
  );

  return createPortal(content, document.body);
}
