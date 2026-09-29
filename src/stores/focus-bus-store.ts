import { create } from 'zustand';

/**
 * Lets tools outside the Live Room deck (widgets) offer "Make this the topic"
 * and see the topic's key words. The deck registers the handler while it is
 * mounted; with no handler (outside the Live Room) those buttons don't show.
 */
export interface FocusRequest {
  title: string;
  text?: string;
  /** Who raised it, e.g. a student's name. */
  credit?: string;
}

export interface FocusWord { word: string; definition: string }

interface FocusBusState {
  makeFocus: ((req: FocusRequest) => void) | null;
  setMakeFocus: (fn: ((req: FocusRequest) => void) | null) => void;
  /** Key words from the current topic's briefing (the Word bank shows them). */
  vocab: FocusWord[];
  setVocab: (vocab: FocusWord[]) => void;
}

export const useFocusBus = create<FocusBusState>((set) => ({
  makeFocus: null,
  setMakeFocus: (makeFocus) => set({ makeFocus }),
  vocab: [],
  setVocab: (vocab) => set({ vocab }),
}));
