'use client';

import { createContext, useContext } from 'react';

/**
 * True for a game/activity running on the Live Room windscreen. The deck's
 * cabin already shows who is on board, who answered and the scores, so shells
 * drop their own class-status sidebar there.
 */
export const InLiveRoomContext = createContext(false);

export function useInLiveRoom(): boolean {
  return useContext(InLiveRoomContext);
}
