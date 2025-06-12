import { create } from 'zustand';
import { ScreenSpec, SupportedDesignSystem } from '../shared/types';

interface AppState {
  stage: 'welcome' | 'analyzing' | 'review' | 'exporting';
  pageInfo: {
    name: string;
    nodeCount: number;
  };
  screenSpecs: ScreenSpec[];
  designSystem: SupportedDesignSystem;
  setStage: (stage: AppState['stage']) => void;
  setPageInfo: (info: AppState['pageInfo']) => void;
  setScreenSpecs: (specs: ScreenSpec[]) => void;
  setDesignSystem: (system: SupportedDesignSystem) => void;
}

export const useStore = create<AppState>((set) => ({
  stage: 'welcome',
  pageInfo: {
    name: '',
    nodeCount: 0
  },
  screenSpecs: [],
  designSystem: 'Custom',
  setStage: (stage) => set({ stage }),
  setPageInfo: (info) => set({ pageInfo: info }),
  setScreenSpecs: (specs) => set({ screenSpecs: specs }),
  setDesignSystem: (system) => set({ designSystem: system })
})); 