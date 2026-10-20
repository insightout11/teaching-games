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
  /** A place on the flight ("Australia"): which Blue Mountains, which Victoria... so the facts are about the right one. */
  where?: string;
}

export interface FocusWord { word: string; definition: string }

interface FocusBusState {
  makeFocus: ((req: FocusRequest) => void) | null;
  setMakeFocus: (fn: ((req: FocusRequest) => void) | null) => void;
  /** Key words from the current topic's briefing (the Word bank shows them). */
  vocab: FocusWord[];
  setVocab: (vocab: FocusWord[]) => void;
  /** What the current topic is actually about (its briefing and facts), so widgets write for it, not for its title. */
  context: string;
  setContext: (context: string) => void;
  /** Set the next destination by city name (the class's "where next?" poll). */
  flyTo: ((city: string) => void) | null;
  /** Big idea or Deep dive: the teacher's choice for how far into the topic itself the class goes. */
  depth: 'big' | 'deep';
  /** Tools that ask phones for something outside the input spec (a live poll), for the "On your phones" banner. */
  phoneAsks: string[];
  setPhoneAsk: (key: string, on: boolean) => void;
  setDepth: (depth: 'big' | 'deep') => void;
  setFlyTo: (fn: ((city: string) => void) | null) => void;
}

export const useFocusBus = create<FocusBusState>((set) => ({
  makeFocus: null,
  setMakeFocus: (makeFocus) => set({ makeFocus }),
  vocab: [],
  setVocab: (vocab) => set({ vocab }),
  context: '',
  setContext: (context) => set({ context }),
  flyTo: null,
  depth: 'big',
  phoneAsks: [],
  setPhoneAsk: (key, on) => set((st) => {
    const has = st.phoneAsks.includes(key);
    if (on === has) return st;
    return { phoneAsks: on ? [...st.phoneAsks, key] : st.phoneAsks.filter((k) => k !== key) };
  }),
  setDepth: (depth) => set({ depth }),
  setFlyTo: (flyTo) => set({ flyTo }),
}));
