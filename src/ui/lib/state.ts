// src/ui/lib/state.ts
import { create } from 'zustand';
import { ComponentSpec, ScreenSpec, ExportBundle } from '../../shared/types';

type AppStage = 'welcome' | 'analyzing' | 'review' | 'exporting' | 'complete';

interface AppState {
  appStage: AppStage;
  isLoading: boolean;
  discoveredComponents: ComponentSpec[];
  screenSpecs: ScreenSpec[];
  exportBundle: ExportBundle | null;
  setStage: (stage: AppStage) => void;
  setLoading: (loading: boolean) => void;
  setDiscoveredComponents: (components: ComponentSpec[]) => void;
  setScreenSpecs: (specs: ScreenSpec[]) => void;
  setExportBundle: (bundle: ExportBundle) => void;
}

export const useStore = create<AppState>((set) => ({
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