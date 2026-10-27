'use client';

import { useEffect, useRef, useState } from 'react';
import { SourcesDrawer } from '@/components/session/live-room/sources-drawer';
import { openRoomChannel } from '@/components/session/live-room/room-channel';
import type { RoomItem } from '@/stores/live-room-store';
import type { RoomMessage } from '@/components/session/live-room/room-channel';
import { MessagesInbox } from '@/components/session/live-room/messages-inbox';
import { BoardInbox } from '@/components/session/live-room/board-inbox';
import { FreePicturesRow } from '@/components/session/live-room/free-pictures-row';

type Tab = 'messages' | 'board' | 'sources';

const TAB_LABEL = { messages: 'Messages', board: 'Board', sources: 'Find' } as const;
const TAB_HINT = { messages: 'Messages from students, to approve or answer', board: 'Cards waiting for the Class Board', sources: 'Pictures, the library, search and answers about the topic' } as const;

export function SourcesPopout({ sessionId, initialTab = 'sources' }: { sessionId: string; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // The class's current topic (the room says when it changes), for the free pictures row.
  const [topic, setTopic] = useState<string | null>(null);
  // "More from Google Images": runs the (paid) image search below with the topic typed in.
  const [googleRequest, setGoogleRequest] = useState<{ query: string; n: number } | null>(null);

  useEffect(() => {
    channelRef.current = openRoomChannel(sessionId, (m) => {
      if (m.type === 'topic') setTopic(m.title || null);
      else if (m.type === 'heard') setHeard(m.students);
      else if (m.type === 'answer') setAnswer({ question: m.question, answer: m.answer, open: m.open, source: m.source ?? null });
    });
    channelRef.current?.postMessage({ type: 'hello' });
    document.title = 'Co-pilot · LessonCaptain';
    return () => channelRef.current?.close();
  }, [sessionId]);

  // The answer key for the question the class was just asked (private: only here until the teacher reveals it)
  const [answer, setAnswer] = useState<{ question: string; answer: string | null; open?: boolean; source: { title: string; url: string } | null } | null>(null);
  // Who has not been heard yet this lesson (private: only here).
  const [heard, setHeard] = useState<Array<{ id: string; name: string; heard: boolean }>>([]);
  const [showHeard, setShowHeard] = useState(false);
  const tick = (id: string, isHeard: boolean) => {
    setHeard((list) => list.map((s) => (s.id === id ? { ...s, heard: isHeard } : s)));
    channelRef.current?.postMessage({ type: 'spoke', id, heard: isHeard });
  };

  const send = (type: 'show' | 'add', item: RoomItem) => {
    channelRef.current?.postMessage({ type, item });
    setNotice(type === 'show' ? `On screen: ${item.title}` : `Added to room: ${item.title}`);
  };
  const relay = (m: RoomMessage) => {
    channelRef.current?.postMessage(m);
    setNotice(m.type === 'focus' ? `New topic: ${m.title}` : m.type === 'show' ? `On screen: ${m.item.title}` : m.type === 'add' ? `Saved to cargo: ${m.item.title}` : null);
  };

  // The room tab can ask this window to switch tabs (the Messages button).
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === '#messages') setTab('messages');
      if (window.location.hash === '#board') setTab('board');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <div className="mx-auto flex h-screen max-w-xl flex-col gap-2 p-3">
      <p className="px-1 text-xs text-white/55">
        Co-pilot: your private window. Share only the room tab on Zoom; nothing here reaches the class until you choose.
      </p>
      {answer && (
        <div className="rounded-xl border border-emerald-300/40 bg-emerald-400/[0.07] p-3" aria-label="Answer key">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">{answer.open ? 'Answer key · good answers' : 'Answer key'}</span>
            <button type="button" onClick={() => setAnswer(null)} className="text-[11px] text-white/50 hover:text-white">Hide</button>
          </div>
          <p className="mt-1 text-xs italic text-white/60">{answer.question}</p>
          <p className="mt-1 text-sm leading-snug text-white">{answer.answer ?? 'Finding the answer…'}</p>
          {answer.source && <a href={answer.source.url} target="_blank" rel="noreferrer" className="mt-1 block text-[11px] text-cyan-200 underline">Source: {answer.source.title} (Wikipedia)</a>}
          <p className="mt-1 text-[11px] text-white/45">Only you can see this. Press Reveal the answer in the room to show the class.</p>
        </div>
      )}
      {heard.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5" aria-label="Not heard yet">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">
              Not heard yet · {heard.filter((s) => !s.heard).length} of {heard.length}
            </span>
            <button type="button" onClick={() => setShowHeard((v) => !v)} className="text-[11px] text-white/50 hover:text-white">{showHeard ? 'Hide heard' : 'Show heard'}</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {heard.filter((s) => !s.heard).map((s) => (
              <button key={s.id} type="button" onClick={() => tick(s.id, true)} title="Tap when they have spoken" className="rounded-full border border-amber-300/40 px-2.5 py-1 text-xs text-amber-50 hover:bg-amber-300/10">{s.name}</button>
            ))}
            {heard.every((s) => s.heard) && <span className="text-xs text-emerald-200/80">Everyone has been heard.</span>}
          </div>
          {showHeard && heard.some((s) => s.heard) && (
            <div className="mt-2 flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
              {heard.filter((s) => s.heard).map((s) => (
                <button key={s.id} type="button" onClick={() => tick(s.id, false)} title="Undo" className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/50 line-through hover:text-white">{s.name}</button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {(['messages', 'board', 'sources'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} title={TAB_HINT[t]} className={['flex-1 rounded-lg px-3 py-1.5 text-sm', tab === t ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white'].join(' ')}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>
      {notice && <p className="rounded-lg bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100">{notice}</p>}
      {tab === 'messages' && (
        <div className="min-h-0 flex-1">
          <MessagesInbox sessionId={sessionId} send={relay} />
        </div>
      )}
      {tab === 'board' && (
        <div className="min-h-0 flex-1">
          <BoardInbox sessionId={sessionId} roster={heard.map((s) => s.name)} />
        </div>
      )}
      {tab === 'sources' && (
        <FreePicturesRow
          sessionId={sessionId}
          topic={topic}
          onShow={(item) => send('show', item)}
          onGoogle={(query) => setGoogleRequest((g) => ({ query, n: (g?.n ?? 0) + 1 }))}
        />
      )}
      <div className={tab === 'sources' ? 'min-h-0 flex-1' : 'hidden'}>
        <SourcesDrawer
          sessionId={sessionId}
          searchRequest={googleRequest ? { ...googleRequest, surface: 'images' } : null}
          onShow={(item) => send('show', item)}
          onAdd={(item) => send('add', item)}
          onClose={() => window.close()}
          fill
        />
      </div>
    </div>
  );
}
