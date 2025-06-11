// src/ui/lib/state.ts
import { create } from 'zustand';
export const useStore = create((set) => ({
    appStage: 'welcome',
    isLoading: true, // Starts true until INIT_COMPLETE is received
    discoveredComponents: [],
    screenSpecs: [],
    exportBundle: null,
    setStage: (stage) => set({ appStage: stage, isLoading: false }),
    setLoading: (loading) => set({ isLoading: loading }),
    setDiscoveredComponents: (components) => set({ discoveredComponents: components }),
    setScreenSpecs: (specs) => set({ screenSpecs: specs }),
    setExportBundle: (bundle) => set({ exportBundle: bundle }),
}));
