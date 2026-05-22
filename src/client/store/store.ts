import { create } from 'zustand'

export interface Grave {
  id: string;
  name: string;
  epitaph: string;
  date: string;
  skillType?: string;
  position: [number, number, number];
  videoUrl?: string;
  videoStatus?: 'none' | 'processing' | 'completed' | 'failed';
}

interface AppState {
  // Graveyard
  graves: Grave[];
  setGraves: (graves: Grave[]) => void;
  selectedGrave: Grave | null;
  selectGrave: (grave: Grave | null) => void;

  // Chat
  isChatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  clearMessages: () => void;
}

export const useStore = create<AppState>((set) => ({
  graves: [],
  setGraves: (graves) => set({ graves }),
  selectedGrave: null,
  selectGrave: (grave) => set({ selectedGrave: grave }),

  isChatOpen: false,
  setChatOpen: (open) => set({ isChatOpen: open }),
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),
  clearMessages: () => {},
}))
