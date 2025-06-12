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
  pageInfo: PageInfo | null;
  
  // Error handling
  error: ErrorState | null;
  
  // Loading states
  isAnalyzing: boolean;
  isExporting: boolean;

  // Actions
  setAppStage: (stage: AppState['appStage']) => void;
  setLoading: (loading: boolean) => void;
  setScreenSpecs: (specs: ScreenSpec[]) => void;
  setDesignSystem: (system: SupportedDesignSystem) => void;
  setError: (error: ErrorState | null) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setExporting: (isExporting: boolean) => void;
  setPageInfo: (info: PageInfo) => void;
  clearError: () => void;
}

const initialState = {
  appStage: 'welcome' as const,
  isLoading: true,
  screenSpecs: [],
  designSystem: 'Custom' as SupportedDesignSystem,
  pageInfo: null,
  error: null,
  isAnalyzing: false,
  isExporting: false
};

export const useStore = create<AppState>((set, get) => {
  console.log('Initializing store with state:', initialState);
  
  return {
    ...initialState,

    // Actions
    setAppStage: (stage) => {
      console.log('Setting app stage:', stage);
      set({ appStage: stage });
    },
    setLoading: (loading) => {
      console.log('Setting loading:', loading);
      set({ isLoading: loading });
    },
    setScreenSpecs: (specs) => {
      console.log('Setting screen specs:', specs.length);
      set({ screenSpecs: specs });
    },
    setDesignSystem: (system) => {
      console.log('Setting design system:', system);
      set({ designSystem: system });
    },
    setError: (error) => {
      console.log('Setting error:', error);
      set({ 
        error, 
        appStage: error ? 'error' : get().appStage 
      });
    },
    setAnalyzing: (isAnalyzing) => {
      console.log('Setting analyzing:', isAnalyzing);
      set({ isAnalyzing });
    },
    setExporting: (isExporting) => {
      console.log('Setting exporting:', isExporting);
      set({ isExporting });
    },
    setPageInfo: (info) => {
      console.log('Setting page info:', info);
      set({ pageInfo: info });
    },
    clearError: () => {
      console.log('Clearing error');
      set({ error: null });
    }
  };
});