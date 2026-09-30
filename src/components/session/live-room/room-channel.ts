import type { RoomItem } from '@/stores/live-room-store';

/**
 * Same-browser link between the pop-out Sources window and the room tab. The
 * teacher shares only the room tab on Zoom, so searching, previewing and reading
 * student messages in the pop-out stays off the class's screen; actions cross over here.
 */
export type RoomMessage =
  | { type: 'show'; item: RoomItem }
  | { type: 'add'; item: RoomItem }
  /** Make a student's message the class topic (the room runs the Focus flow). */
  | { type: 'focus'; title: string; credit?: string }
  /** Room → Sources window: the class topic changed (the Library shelf follows it). */
  | { type: 'topic'; title: string }
  | { type: 'hello' };

const channelName = (sessionId: string) => `lc-live-room:${sessionId}`;

export function openRoomChannel(sessionId: string, onMessage?: (m: RoomMessage) => void) {
  if (typeof BroadcastChannel === 'undefined') return null;
  const channel = new BroadcastChannel(channelName(sessionId));
  if (onMessage) channel.onmessage = (e: MessageEvent<RoomMessage>) => onMessage(e.data);
  return channel;
}
