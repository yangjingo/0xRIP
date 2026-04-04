import { create } from 'zustand'

export interface Message {
  id: string;
  role: 'user' | 'ghost' | 'system';
  content: string;
}

export interface Grave {
  id: string;
  name: string;
  epitaph: string;
  position: [number, number, number];
  videoUrl?: string;
  videoStatus?: 'none' | 'processing' | 'completed' | 'failed';
}

interface AppState {
  lang: 'en' | 'zh';
  setLang: (lang: 'en' | 'zh') => void;
  selectedGrave: Grave | null;
  selectGrave: (grave: Grave | null) => void;
  graves: Grave[];
  setGraves: (graves: Grave[]) => void;
  updateGrave: (id: string, data: Partial<Grave>) => void;
  isAutoRotating: boolean;
  toggleAutoRotate: () => void;
  panelExpanded: boolean;
  togglePanel: () => void;

  // Chat State
  isChatOpen: boolean;
  setChatOpen: (isOpen: boolean) => void;
  messages: Message[];
  addMessage: (msg: Omit<Message, 'id'>) => void;
  clearMessages: () => void;
}

export const useStore = create<AppState>((set) => ({
  lang: (localStorage.getItem('0xrip-lang') as 'en' | 'zh') || 'en',
  setLang: (lang) => {
    localStorage.setItem('0xrip-lang', lang);
    set({ lang });
  },
  selectedGrave: null,
  selectGrave: (grave) => set({ selectedGrave: grave, panelExpanded: !!grave }),
  graves: [],
  setGraves: (graves) => set({ graves }),
  updateGrave: (id, data) => set((state) => ({
    graves: state.graves.map(g => g.id === id ? { ...g, ...data } : g),
    selectedGrave: state.selectedGrave?.id === id ? { ...state.selectedGrave, ...data } : state.selectedGrave
  })),
  isAutoRotating: false,
  toggleAutoRotate: () => set((state) => ({ isAutoRotating: !state.isAutoRotating })),
  panelExpanded: false,
  togglePanel: () => set((state) => ({ panelExpanded: !state.panelExpanded })),

  isChatOpen: false,
  setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
  messages: [],
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, { ...msg, id: Math.random().toString(36).substring(7) }]
  })),
  clearMessages: () => set({ messages: [] }),
}))
