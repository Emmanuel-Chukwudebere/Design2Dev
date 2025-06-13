import { create } from 'zustand';
import { ScreenSpec, SupportedDesignSystem, ExportBundle, AIPrompt } from '../shared/types';
import { postToFigma } from './lib/utils';

interface PageInfo {
  name: string;
  id: string;
  nodeCount: number;
}

interface ErrorState {
  message: string;
  context: string;
}

interface AppState {
  appStage: 'welcome' | 'analyzing' | 'review' | 'export';
  isLoading: boolean;
  designSystem: SupportedDesignSystem;
  screenSpecs: ScreenSpec[];
  analyzedScreens: ScreenSpec[];
  isAnalyzing: boolean;
  isExporting: boolean;
  error: ErrorState | null;
  pageInfo: PageInfo | null;
  exportBundleData: ExportBundle | null;
  setAppStage: (stage: AppState['appStage']) => void;
  setLoading: (loading: boolean) => void;
  setDesignSystem: (system: SupportedDesignSystem) => void;
  setScreenSpecs: (specs: ScreenSpec[]) => void;
  setAnalyzedScreens: (screens: ScreenSpec[]) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setExporting: (exporting: boolean) => void;
  setError: (error: ErrorState | null) => void;
  setPageInfo: (info: PageInfo | null) => void;
  clearError: () => void;
  setExportBundleData: (bundle: ExportBundle | null) => void;
  exportBundle: () => Promise<void>;
}

export const useStore = create<AppState>()((set, get) => ({
  appStage: 'welcome',
  isLoading: true,
  designSystem: 'React Native Paper',
  screenSpecs: [],
  analyzedScreens: [],
  isAnalyzing: false,
  isExporting: false,
  error: null,
  pageInfo: null,
  exportBundleData: null,

  setAppStage: (stage) => set({ appStage: stage }),
  setLoading: (loading) => set({ isLoading: loading }),
  setDesignSystem: (system) => set({ designSystem: system }),
  setScreenSpecs: (specs) => set({ screenSpecs: specs }),
  setAnalyzedScreens: (screens) => set({ analyzedScreens: screens }),
  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setExporting: (exporting) => set({ isExporting: exporting }),
  setError: (error) => set({ error }),
  setPageInfo: (info) => set({ pageInfo: info }),
  clearError: () => set({ error: null }),
  setExportBundleData: (bundle) => set({ exportBundleData: bundle }),

  exportBundle: async () => {
    const { screenSpecs } = get();
    set({ isExporting: true, error: null });
    try {
      await postToFigma('EXPORT_BUNDLE', { screenSpecs });
    } catch (error) {
      set({ 
        isExporting: false,
        error: { 
          message: error instanceof Error ? error.message : 'Export failed',
          context: 'export'
        }
      });
    }
  }
}));