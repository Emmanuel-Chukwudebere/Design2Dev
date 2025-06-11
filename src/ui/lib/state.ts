// src/ui/lib/state.ts
import { create } from 'zustand';
import { ComponentSpec, ScreenSpec, ExportBundle } from '../../shared/types';

export type AppStage = 'welcome' | 'analyzing' | 'review' | 'exporting' | 'complete' | 'error';

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
  appStage: AppStage;
  isLoading: boolean;
  discoveredComponents: ComponentSpec[];
  screenSpecs: ScreenSpec[];
  exportBundle: ExportBundle | null;
  pageInfo: PageInfo | null;
  
  // Error handling
  error: ErrorState | null;
  
  // Loading states
  isAnalyzing: boolean;
  isExporting: boolean;
  isRefreshing: boolean;

  // Actions
  setStage: (stage: AppStage) => void;
  setLoading: (loading: boolean) => void;
  setDiscoveredComponents: (components: ComponentSpec[]) => void;
  setScreenSpecs: (specs: ScreenSpec[]) => void;
  setExportBundle: (bundle: ExportBundle) => void;
  setError: (error: ErrorState | null) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setExporting: (isExporting: boolean) => void;
  setRefreshing: (isRefreshing: boolean) => void;
  setPageInfo: (pageInfo: PageInfo) => void;
  
  // Complex actions
  refreshComponents: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  appStage: 'welcome' as AppStage,
  isLoading: true,
  discoveredComponents: [],
  screenSpecs: [],
  exportBundle: null,
  error: null,
  isAnalyzing: false,
  isExporting: false,
  isRefreshing: false,
  pageInfo: null,
};

export const useStore = create<AppState>((set, get) => ({
  ...initialState,

  setStage: (stage) => set({ appStage: stage, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  setDiscoveredComponents: (components) => set({ discoveredComponents: components }),
  setScreenSpecs: (specs) => set({ screenSpecs: specs }),
  setExportBundle: (bundle) => set({ exportBundle: bundle }),
  setError: (error) => set({ error, appStage: error ? 'error' : get().appStage }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setExporting: (isExporting) => set({ isExporting }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  setPageInfo: (pageInfo) => set({ pageInfo }),

  refreshComponents: async () => {
    const { setRefreshing, setDiscoveredComponents, setError } = get();
    setRefreshing(true);
    try {
      // This will be handled by the plugin controller
      window.parent.postMessage({ pluginMessage: { type: 'REFRESH_COMPONENTS' } }, '*');
    } catch (error) {
      setError({ 
        message: error instanceof Error ? error.message : 'Failed to refresh components',
        context: 'component-refresh'
      });
    } finally {
      setRefreshing(false);
    }
  },

  clearError: () => set({ error: null }),
  
  reset: () => set(initialState),
}));