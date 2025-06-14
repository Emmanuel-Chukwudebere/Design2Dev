import { create } from 'zustand';
import { ScreenSpec, SupportedDesignSystem, ExportBundle } from '../shared/types';

interface PageInfo {
  name: string;
  nodeCount: number;
}

interface StoreState {
  appStage: 'welcome' | 'analyzing' | 'results' | 'export';
  screenSpecs: ScreenSpec[];
  designSystem: SupportedDesignSystem;
  exportBundleData: ExportBundle | null;
  pageInfo: PageInfo | null;
  error: { message: string; context?: string } | null;
  isAnalyzing: boolean;
  isExporting: boolean;
  setAppStage: (stage: StoreState['appStage']) => void;
  setScreenSpecs: (specs: ScreenSpec[]) => void;
  setDesignSystem: (system: SupportedDesignSystem) => void;
  setExportBundleData: (bundle: ExportBundle | null) => void;
  setPageInfo: (info: PageInfo | null) => void;
  setError: (error: StoreState['error']) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setExporting: (isExporting: boolean) => void;
}

const initialState: StoreState = {
  appStage: 'welcome',
  screenSpecs: [],
  designSystem: 'react-native-paper',
  exportBundleData: null,
  pageInfo: null,
  error: null,
  isAnalyzing: false,
  isExporting: false,
  setAppStage: () => {},
  setScreenSpecs: () => {},
  setDesignSystem: () => {},
  setExportBundleData: () => {},
  setPageInfo: () => {},
  setError: () => {},
  setAnalyzing: () => {},
  setExporting: () => {}
};

export const useStore = create<StoreState>((set) => ({
  ...initialState,
  setAppStage: (stage) => set({ appStage: stage }),
  setScreenSpecs: (specs) => set({ screenSpecs: specs }),
  setDesignSystem: (system) => set({ designSystem: system }),
  setExportBundleData: (bundle) => set({ exportBundleData: bundle }),
  setPageInfo: (info) => set({ pageInfo: info }),
  setError: (error) => set({ error }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setExporting: (isExporting) => set({ isExporting })
}));