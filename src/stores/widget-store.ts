import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WidgetEntry {
  position: { x: number; y: number };
  isOpen: boolean;
  zIndex?: number;
}

interface WidgetStoreState {
  widgets: Record<string, WidgetEntry>;
  zCounter: number;
  getWidget: (id: string) => WidgetEntry;
  bringToFront: (id: string) => void;
  setPosition: (id: string, pos: { x: number; y: number }) => void;
  openWidget: (id: string) => void;
  closeWidget: (id: string) => void;
  setDefaultPosition: (id: string, pos: { x: number; y: number }, defaultOpen?: boolean) => void;
  resetLayout: (positions: Record<string, { x: number; y: number }>) => void;
}

const DEFAULT_Z = 100;

export const useWidgetStore = create<WidgetStoreState>()(
  persist(
    (set, get) => ({
      widgets: {},
      zCounter: DEFAULT_Z,

      getWidget: (id) => {
        const w = get().widgets[id];
        return {
          position: w?.position ?? { x: 0, y: 0 },
          isOpen: w?.isOpen ?? true,
          zIndex: DEFAULT_Z,
        };
      },

      bringToFront: (id) => {
        set((state) => {
          const next = state.zCounter + 1;
          return {
            zCounter: next,
            widgets: {
              ...state.widgets,
              [id]: {
                ...state.widgets[id],
                position: state.widgets[id]?.position ?? { x: 0, y: 0 },
                isOpen: state.widgets[id]?.isOpen ?? true,
                zIndex: next,
              },
            },
          };
        });
      },

      setPosition: (id, pos) => {
        set((state) => ({
          widgets: {
            ...state.widgets,
            [id]: {
              ...state.widgets[id],
              position: pos,
              isOpen: state.widgets[id]?.isOpen ?? true,
            },
          },
        }));
      },

      openWidget: (id) => {
        set((state) => {
          const next = state.zCounter + 1;
          return {
            zCounter: next,
            widgets: {
              ...state.widgets,
              [id]: {
                ...state.widgets[id],
                position: state.widgets[id]?.position ?? { x: 0, y: 0 },
                isOpen: true,
                zIndex: next,
              },
            },
          };
        });
      },

      closeWidget: (id) => {
        set((state) => ({
          widgets: {
            ...state.widgets,
            [id]: {
              ...state.widgets[id],
              position: state.widgets[id]?.position ?? { x: 0, y: 0 },
              isOpen: false,
            },
          },
        }));
      },

      setDefaultPosition: (id, pos, defaultOpen = true) => {
        set((state) => {
          // Only set if no persisted position exists
          if (state.widgets[id]?.position) return state;
          return {
            widgets: {
              ...state.widgets,
              [id]: {
                position: pos,
                isOpen: state.widgets[id]?.isOpen ?? defaultOpen,
              },
            },
          };
        });
      },

      resetLayout: (positions) => {
        const widgets: Record<string, WidgetEntry> = {};
        for (const [id, pos] of Object.entries(positions)) {
          widgets[id] = { position: pos, isOpen: true };
        }
        set({ widgets, zCounter: DEFAULT_Z });
      },
    }),
    {
      name: 'lc-widget-layout',
      // Only persist position and isOpen — not zIndex or zCounter
      partialize: (state) => ({
        widgets: Object.fromEntries(
          Object.entries(state.widgets).map(([id, w]) => [
            id,
            { position: w.position, isOpen: w.isOpen },
          ])
        ),
      }),
    }
  )
);
