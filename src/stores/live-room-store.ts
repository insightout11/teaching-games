import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Live Room material, per session. Lives outside the room view because the
 * view unmounts whenever a game/activity launches — "back to room" must find
 * the same shown item and saved material. Persisted to sessionStorage so a
 * teacher refresh keeps the room (server persistence is a later step).
 */

/** 'note': a topic the class raised itself (typed, a student question, a Talk prompt). */
export type RoomItemKind = 'web' | 'news' | 'image' | 'place' | 'video' | 'article' | 'note';

export interface RoomItem {
  id: string;
  kind: RoomItemKind;
  title: string;
  /** Source page — always kept for attribution. */
  url: string;
  publisher: string | null;
  description?: string;
  imageUrl?: string | null;
  /** Extracted article text (reader), capped server-side. */
  text?: string;
  coordinates?: { latitude: number; longitude: number } | null;
  address?: string | null;
  videoId?: string | null;
  thumbnailUrl?: string | null;
  /** Library items: where it came from, so activities can use the stored transcript. */
  library?: { source: string; id: string };
}

interface RoomState {
  shown: RoomItem | null;
  material: RoomItem[];
}

const EMPTY: RoomState = { shown: null, material: [] };
const MAX_MATERIAL = 40;

interface LiveRoomStore {
  rooms: Record<string, RoomState>;
  /** Sessions that opened as a Live Room: flights launched from them return here. */
  roomSessions: Record<string, true>;
  markRoom: (sessionId: string) => void;
  show: (sessionId: string, item: RoomItem) => void;
  hide: (sessionId: string) => void;
  add: (sessionId: string, item: RoomItem) => void;
  remove: (sessionId: string, itemId: string) => void;
  update: (sessionId: string, itemId: string, patch: Partial<RoomItem>) => void;
}

const room = (s: LiveRoomStore, sessionId: string) => s.rooms[sessionId] ?? EMPTY;

export const useLiveRoomStore = create<LiveRoomStore>()(
  persist(
    (set) => ({
      rooms: {},
      roomSessions: {},
      markRoom: (sessionId) =>
        set((s) => (s.roomSessions[sessionId] ? s : { roomSessions: { ...s.roomSessions, [sessionId]: true } })),
      show: (sessionId, item) =>
        set((s) => ({ rooms: { ...s.rooms, [sessionId]: { ...room(s, sessionId), shown: item } } })),
      hide: (sessionId) =>
        set((s) => ({ rooms: { ...s.rooms, [sessionId]: { ...room(s, sessionId), shown: null } } })),
      add: (sessionId, item) =>
        set((s) => {
          const r = room(s, sessionId);
          if (r.material.some((m) => m.id === item.id)) return s;
          return { rooms: { ...s.rooms, [sessionId]: { ...r, material: [item, ...r.material].slice(0, MAX_MATERIAL) } } };
        }),
      update: (sessionId, itemId, patch) =>
        set((s) => {
          const r = room(s, sessionId);
          const patchItem = (m: RoomItem) => (m.id === itemId ? { ...m, ...patch } : m);
          return {
            rooms: {
              ...s.rooms,
              [sessionId]: { shown: r.shown ? patchItem(r.shown) : null, material: r.material.map(patchItem) },
            },
          };
        }),
      remove: (sessionId, itemId) =>
        set((s) => {
          const r = room(s, sessionId);
          return {
            rooms: {
              ...s.rooms,
              [sessionId]: {
                shown: r.shown?.id === itemId ? null : r.shown,
                material: r.material.filter((m) => m.id !== itemId),
              },
            },
          };
        }),
    }),
    { name: 'lc-live-room', storage: createJSONStorage(() => sessionStorage) },
  ),
);

export function useRoom(sessionId: string): RoomState {
  return useLiveRoomStore((s) => s.rooms[sessionId] ?? EMPTY);
}
