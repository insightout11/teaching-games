'use client';

import { useEffect, useRef, useState } from 'react';
import { SourcesDrawer } from '@/components/session/live-room/sources-drawer';
import { openRoomChannel } from '@/components/session/live-room/room-channel';
import type { RoomItem } from '@/stores/live-room-store';

export function SourcesPopout({ sessionId }: { sessionId: string }) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    channelRef.current = openRoomChannel(sessionId);
    document.title = 'Sources · LessonCaptain';
    return () => channelRef.current?.close();
  }, [sessionId]);

  const send = (type: 'show' | 'add', item: RoomItem) => {
    channelRef.current?.postMessage({ type, item });
    setNotice(type === 'show' ? `On screen: ${item.title}` : `Added to room: ${item.title}`);
  };

  return (
    <div className="mx-auto flex h-screen max-w-xl flex-col gap-2 p-3">
      <p className="px-1 text-xs text-white/55">
        Private window. Share only the room tab on Zoom; nothing here reaches the class until you press Show.
      </p>
      {notice && <p className="rounded-lg bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100">{notice}</p>}
      <div className="min-h-0 flex-1">
        <SourcesDrawer
          sessionId={sessionId}
          onShow={(item) => send('show', item)}
          onAdd={(item) => send('add', item)}
          onClose={() => window.close()}
          fill
        />
      </div>
    </div>
  );
}
