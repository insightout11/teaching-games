import { create } from 'zustand';

/**
 * The Stage window (Live Room pop-out shared in Zoom). Widgets read this to
 * render onto the stage: `onStage[id]` is the teacher's choice; widgets filling
 * half / all of the windscreen go there by default.
 */
interface StageState {
  container: HTMLElement | null;
  size: { w: number; h: number };
  onStage: Record<string, boolean>;
  setContainer: (el: HTMLElement | null) => void;
  setSize: (size: { w: number; h: number }) => void;
  setOnStage: (id: string, on: boolean) => void;
}

export const useStageStore = create<StageState>((set) => ({
  container: null,
  size: { w: 1280, h: 720 },
  onStage: {},
  setContainer: (container) => set({ container }),
  setSize: (size) => set({ size }),
  setOnStage: (id, on) => set((s) => ({ onStage: { ...s.onStage, [id]: on } })),
}));
