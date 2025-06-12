import { create } from 'zustand';
import { ScreenSpec, SupportedDesignSystem } from '../shared/types';

interface ErrorState {
  message: string;
  context: string;
}

interface PageInfo {
  name: string;
  nodeCount: number;
}

interface AppState {
  // Core state
  appStage: 'welcome' | 'analyzing' | 'review' | 'exporting' | 'complete' | 'error';
  isLoading: boolean;
  screenSpecs: ScreenSpec[];
  designSystem: SupportedDesignSystem;
  pageInfo: PageInfo;
  
  // Error handling
  error: ErrorState | null;
  
  // Loading states
  isAnalyzing: boolean;
  isExporting: boolean;

  // Actions
  setStage: (stage: AppState['appStage']) => void;
  setLoading: (loading: boolean) => void;
  setScreenSpecs: (specs: ScreenSpec[]) => void;
  setDesignSystem: (system: SupportedDesignSystem) => void;
  setError: (error: ErrorState | null) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setExporting: (isExporting: boolean) => void;
  setPageInfo: (info: PageInfo) => void;
  clearError: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  appStage: 'welcome',
  isLoading: true,
  screenSpecs: [],
  designSystem: 'Custom',
  pageInfo: {
    name: '',
    nodeCount: 0
  },
  error: null,
  isAnalyzing: false,
  isExporting: false,

  // Actions
  setStage: (stage) => set({ appStage: stage }),
  setLoading: (loading) => set({ isLoading: loading }),
  setScreenSpecs: (specs) => set({ screenSpecs: specs }),
  setDesignSystem: (system) => set({ designSystem: system }),
  setError: (error) => set({ error, appStage: error ? 'error' : 'welcome' }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setExporting: (isExporting) => set({ isExporting }),
  setPageInfo: (info) => set({ pageInfo: info }),
  clearError: () => set({ error: null })
})); 