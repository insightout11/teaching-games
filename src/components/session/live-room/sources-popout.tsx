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

export function SourcesPopout({ sessionId, initialTab = 'sources' }: { sessionId: string; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // The class's current topic (the room says when it changes), for the free pictures row.
  const [topic, setTopic] = useState<string | null>(null);
  // "More from Google Images": runs the (paid) image search below with the topic typed in.
  const [googleRequest, setGoogleRequest] = useState<{ query: string; n: number } | null>(null);

  useEffect(() => {
    channelRef.current = openRoomChannel(sessionId, (m) => { if (m.type === 'topic') setTopic(m.title || null); });
    channelRef.current?.postMessage({ type: 'hello' });
    document.title = 'Private window · LessonCaptain';
    return () => channelRef.current?.close();
  }, [sessionId]);

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
        Private window. Share only the room tab on Zoom; nothing here reaches the class until you choose.
      </p>
      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {(['messages', 'board', 'sources'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={['flex-1 rounded-lg px-3 py-1.5 text-sm capitalize', tab === t ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white'].join(' ')}>
            {t}
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
          <BoardInbox sessionId={sessionId} />
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
