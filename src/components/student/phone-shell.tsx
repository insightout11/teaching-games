'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'framer-motion';
import { BookOpen, Hand, LogOut, MessageCircle, X } from 'lucide-react';

// The student phone is a boarding pass + seat panel: a fixed header that says
// what the phone wants right now, one "now" card, and a fixed action bar.

export type PhoneStatus = 'cruising' | 'your-turn' | 'sent' | 'preparing' | 'vote' | 'reconnecting' | 'offline';

const STATUS: Record<PhoneStatus, { label: string; text: string; dot: string; pulse?: boolean }> = {
  cruising: { label: 'Cruising', text: 'text-cyan-300', dot: 'bg-cyan-300' },
  'your-turn': { label: 'Your turn', text: 'text-amber-300', dot: 'bg-amber-400', pulse: true },
  sent: { label: 'Sent', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  preparing: { label: 'Boarding', text: 'text-violet-300', dot: 'bg-violet-400', pulse: true },
  vote: { label: 'Vote', text: 'text-rose-300', dot: 'bg-rose-400', pulse: true },
  reconnecting: { label: 'Reconnecting', text: 'text-amber-300', dot: 'bg-amber-400', pulse: true },
  offline: { label: 'Offline', text: 'text-red-300', dot: 'bg-red-400', pulse: true },
};

export const MONO = 'font-[family-name:var(--font-instrument)] uppercase tracking-[0.12em]';

/** Short phone buzz patterns — each one means something. */
// Many Android motors ignore pulses under ~25ms, so every buzz is at least 40ms.
export const BUZZ = {
  yourTurn: [70, 80, 70],
  sent: 45,
  stamp: 90,
  hand: 50,
} as const;

export function buzz(pattern: number | readonly number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern as number | number[]);
  } catch {
    // iOS Safari has no vibration — the visual moment carries it
  }
}

/** Buzz when the phone starts wanting something, or confirms it got it. */
export function useStatusBuzz(status: PhoneStatus) {
  const prev = useRef<PhoneStatus | null>(null);
  useEffect(() => {
    const was = prev.current;
    prev.current = status;
    if (was === null || was === status) return;
    if (status === 'your-turn' || status === 'vote') buzz(BUZZ.yourTurn);
    else if (status === 'sent') buzz(BUZZ.sent);
  }, [status]);
}

export function BoardingHeader({
  name,
  seat,
  title,
  status,
  statusLabel,
  aside,
  onLeave,
}: {
  name: string;
  /** Cabin seat label; null until the server has placed this phone. */
  seat: string | null;
  title: string;
  status: PhoneStatus;
  statusLabel?: string;
  aside?: ReactNode;
  onLeave: () => void;
}) {
  const s = STATUS[status];
  const reduce = useReducedMotion();
  useStatusBuzz(status);
  return (
    <header className="sticky top-0 z-30 -mx-3 -mt-3 mb-3 border-b-2 border-dashed border-lc-border bg-lc-card px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur sm:-mx-4 sm:-mt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`${MONO} truncate text-[11px] text-lc-text3`}>
            {name}{seat ? ` · Seat ${seat}` : ''}
          </p>
          <p className="truncate font-display text-xl leading-tight text-lc-text">{title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span role="status" className="relative flex items-center">
            <motion.span
              key={status}
              initial={reduce ? false : { y: -8, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 520, damping: 30 }}
              className={`${MONO} flex items-center gap-1.5 text-[11px] ${s.text}`}
            >
              <span className={`h-2 w-2 rounded-full ${s.dot} ${s.pulse ? 'animate-pulse' : ''}`} />
              {statusLabel ?? s.label}
            </motion.span>
          </span>
          {aside}
          <button
            type="button"
            onClick={onLeave}
            aria-label="Leave class"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-lc-border text-lc-text3 hover:text-lc-text"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
      {(status === 'reconnecting' || status === 'offline') && (
        <p className={`${MONO} mt-2 text-[11px] ${status === 'offline' ? 'text-red-300' : 'text-amber-300'}`}>
          {status === 'offline' ? 'No signal · check your Wi-Fi, this page will catch up' : 'Finding the signal · keep this page open'}
        </p>
      )}
    </header>
  );
}

function BarButton({
  icon,
  label,
  active,
  tone,
  onClick,
  badge,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  tone: string;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex min-h-[60px] flex-col items-center justify-center gap-1 text-[12px] font-medium transition-[color,transform] active:scale-90 ${
        active ? tone : 'text-lc-text2 hover:text-lc-text'
      }`}
    >
      {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-current" />}
      <span className="relative">
        {icon}
        {badge ? (
          <span className="absolute -right-2.5 -top-1.5 min-w-[16px] rounded-full bg-amber-400 px-1 text-[10px] font-bold leading-4 text-lc-bg">
            {badge}
          </span>
        ) : null}
      </span>
      {label}
    </button>
  );
}

export function ActionBar({
  handRaised,
  onHand,
  messageLabel,
  messageActive,
  onMessage,
  newWords,
  phrasebookOpen,
  onPhrasebook,
}: {
  handRaised: boolean;
  onHand: () => void;
  messageLabel: string;
  messageActive: boolean;
  onMessage: () => void;
  newWords: number;
  phrasebookOpen: boolean;
  onPhrasebook: () => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-lc-border bg-lc-surface pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto grid max-w-lg grid-cols-3">
        <BarButton
          icon={<Hand className="h-5 w-5" />}
          label={handRaised ? 'Hand up' : 'Hand'}
          active={handRaised}
          tone="text-amber-300"
          onClick={() => { buzz(BUZZ.hand); onHand(); }}
        />
        <BarButton
          icon={<MessageCircle className="h-5 w-5" />}
          label={messageLabel}
          active={messageActive}
          tone="text-cyan-300"
          onClick={onMessage}
        />
        <BarButton
          icon={<BookOpen className="h-5 w-5" />}
          label="Phrasebook"
          active={phrasebookOpen}
          tone="text-amber-200"
          onClick={onPhrasebook}
          badge={newWords}
        />
      </div>
    </nav>
  );
}

export function PhoneSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const dragControls = useDragControls();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="sheet"
          className="fixed inset-0 z-50 flex items-end"
          role="dialog"
          aria-label={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
        >
          <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60" />
          <motion.div
            initial={reduce ? false : { y: '100%' }}
            animate={{ y: 0 }}
            exit={reduce ? undefined : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            drag={reduce ? false : 'y'}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 600) onClose(); }}
            className="relative mx-auto max-h-[82vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-lc-border bg-lc-surface px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3"
          >
            <div
              className="-mx-4 -mt-3 flex touch-none cursor-grab justify-center pb-3 pt-3"
              onPointerDown={(e) => dragControls.start(e)}
              aria-hidden
            >
              <div className="h-1 w-10 rounded-full bg-lc-border" />
            </div>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-2xl text-lc-text">{title}</p>
              <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-lc-text3 hover:text-lc-text">
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
