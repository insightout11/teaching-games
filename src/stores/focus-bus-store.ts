import { create } from 'zustand';

/**
 * Lets tools outside the Live Room deck (the Class Questions widget) offer
 * "Make this the topic". The deck registers the handler while it is mounted;
 * with no handler (outside the Live Room) those buttons don't show.
 */
export interface FocusRequest {
  title: string;
  text?: string;
  /** Who raised it, e.g. a student's name. */
  credit?: string;
}

interface FocusBusState {
  makeFocus: ((req: FocusRequest) => void) | null;
  setMakeFocus: (fn: ((req: FocusRequest) => void) | null) => void;
}

export const useFocusBus = create<FocusBusState>((set) => ({
  makeFocus: null,
  setMakeFocus: (makeFocus) => set({ makeFocus }),
}));
