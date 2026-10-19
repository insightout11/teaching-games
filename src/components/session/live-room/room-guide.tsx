'use client';

import { GraduationCap, X } from 'lucide-react';
import { classTypeName, type ClassType, type TeachPlace } from '@/lib/class-profile';

const TYPE_GUIDE: Record<ClassType | 'none', string[]> = {
  structured: [
    'Open a flight plan (Launch a flight) and follow its stages with Next.',
    'Right answers count, so scores and the podium matter here.',
    'Courses fit this kind of class: each lesson continues the last.',
  ],
  'game-time': [
    'Teach your lesson your way; open the room for the last 15–20 minutes.',
    'The quick bar holds your class favourites. Star a game in All tools to keep it there.',
    'The plane takes off when you do and lands when the game minutes are up.',
  ],
  conversation: [
    'Talk is your home. Set a topic in the bar at the top; the room brings questions and words.',
    '“Pick a student” shares turns fairly, including students without a device.',
    'Activities in the quick bar keep the talking going: Scene Igniter, Conversation Rounds, Mystery Flight.',
  ],
  'free-talk': [
    'Set a topic; “Where next?” under it suggests where to go, and “Back to” returns to earlier threads.',
    'Sources (private window) shows free pictures for the topic: click one to show it, star some to step through.',
    'Nobody is ranked. Choose Deep dive in “About this topic” when the class knows the subject well.',
  ],
  none: [
    'Set a topic in the bar at the top, or launch an activity from the quick bar.',
    'Pick a class type on the class page and the room opens set up for that kind of class.',
  ],
};

/** The "?" in the room: a one-page guide for this kind of class, screen setup tips and the test flight replay. */
export function RoomGuide({ type, place, oneOnOne, tipsOn, onTips, onReplay, onClose }: {
  type: ClassType | undefined;
  place: TeachPlace | undefined;
  oneOnOne: boolean;
  tipsOn: boolean;
  onTips: (on: boolean) => void;
  onReplay: () => void;
  onClose: () => void;
}) {
  const screen = oneOnOne
    ? ['Share your screen; the student answers out loud or on a phone.']
    : place === 'classroom'
      ? ['Use Full screen on the projector.', 'In a bright room, keep the Zoom layout off so text stays large.']
      : ['Share this tab in Zoom and turn on Zoom layout.', 'Open Sources (private window) on a second monitor: nothing there reaches the class until you choose.'];
  return (
    <div className="fixed right-4 top-16 z-[74] max-h-[80vh] w-[380px] max-w-[92vw] overflow-y-auto space-y-3 rounded-2xl border border-white/15 bg-slate-950/95 p-4 text-sm text-white/85 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300">Guide · {classTypeName(type) ?? 'This class'}</span>
        <button type="button" onClick={onClose} aria-label="Close" className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <ul className="list-disc space-y-1.5 pl-5">{TYPE_GUIDE[type ?? 'none'].map((t) => <li key={t}>{t}</li>)}</ul>
      <div>
        <p className="mb-1 text-xs font-semibold text-white/60">Your screen</p>
        <ul className="list-disc space-y-1 pl-5 text-white/75">{screen.map((t) => <li key={t}>{t}</li>)}</ul>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
        <button type="button" onClick={onReplay} className="flex items-center gap-1.5 rounded-lg border border-sky-300/50 px-2.5 py-1 text-xs text-sky-100 hover:bg-sky-300/10">
          <GraduationCap className="h-3.5 w-3.5" /> Replay the test flight
        </button>
        <label className="flex items-center gap-1.5 text-xs text-white/60">
          <input type="checkbox" checked={tipsOn} onChange={(e) => onTips(e.target.checked)} className="h-3.5 w-3.5 accent-amber-400" /> Show tips
        </label>
      </div>
    </div>
  );
}
