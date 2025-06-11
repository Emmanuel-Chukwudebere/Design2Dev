// src/plugin/controller.ts

import { discoverComponentsOnPage, analyzeScreens, generateExportBundle } from './engine';
import { ComponentSpec, ScreenSpec, SupportedDesignSystem } from '../shared/types';
import JSZip from 'jszip';

// Constants
const PLUGIN_UI_WIDTH = 400;
const PLUGIN_UI_HEIGHT = 600;
const MAX_SELECTION_SIZE = 5;
const MIN_SELECTION_SIZE = 1;

// State management
interface PluginState {
  discoveredComponents: ComponentSpec[];
  isAnalyzing: boolean;
  isExporting: boolean;
  lastError: string | null;
  selectedDesignSystem: SupportedDesignSystem;
}

const state: PluginState = {
  discoveredComponents: [],
  isAnalyzing: false,
  isExporting: false,
  lastError: null,
  selectedDesignSystem: 'React Native Paper',
};

// Initialize plugin UI
figma.showUI(__html__, { 
  width: PLUGIN_UI_WIDTH, 
  height: PLUGIN_UI_HEIGHT, 
  themeColors: true 
});

// Utility functions
function postMessage(type: string, payload?: any) {
  figma.ui.postMessage({ type, payload });
}

function handleError(error: Error, context: string) {
  console.error(`Error in ${context}:`, error);
  state.lastError = error.message;
  figma.notify(`Error: ${error.message}`, { error: true });
  postMessage('ERROR', { message: error.message, context });
}

// Start component discovery immediately
async function initializePlugin() {
  try {
    state.discoveredComponents = await discoverComponentsOnPage();
    postMessage('INIT_COMPLETE', { discoveredComponents: state.discoveredComponents });
  } catch (error) {
    handleError(error as Error, 'initialization');
  }
}

// Initialize plugin
initializePlugin();

// Message handling
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case 'ANALYZE_SCREENS': {
        if (state.isAnalyzing) {
          throw new Error('Analysis already in progress');
        }

        const selection = figma.currentPage.selection.filter(n => n.type === 'FRAME');
        
        if (selection.length < MIN_SELECTION_SIZE || selection.length > MAX_SELECTION_SIZE) {
          throw new Error(`Please select ${MIN_SELECTION_SIZE} to ${MAX_SELECTION_SIZE} top-level frames to analyze.`);
        }

        // Update selected design system
        if (msg.payload?.designSystem) {
          state.selectedDesignSystem = msg.payload.designSystem;
        }

        state.isAnalyzing = true;
        postMessage('ANALYSIS_STARTED');

        try {
          const screenSpecs = analyzeScreens(selection, state.discoveredComponents);
          postMessage('ANALYSIS_COMPLETE', { 
            screenSpecs,
            designSystem: state.selectedDesignSystem 
          });
        } catch (error) {
          handleError(error as Error, 'screen analysis');
          postMessage('ANALYSIS_FAILED');
        } finally {
          state.isAnalyzing = false;
        }
        break;
      }

      case 'GENERATE_EXPORT': {
        if (state.isExporting) {
          throw new Error('Export already in progress');
        }

        const { finalComponents, finalScreens } = msg.payload as {
          finalComponents: ComponentSpec[];
          finalScreens: ScreenSpec[];
        };

        state.isExporting = true;
        postMessage('EXPORT_STARTED');
        figma.notify('Generating export bundle...');

        try {
          const exportData = await generateExportBundle(finalComponents, finalScreens);
          
          // Create a zip file
          const zip = new JSZip();
          
          // Add component and screen specifications
          const specsFolder = zip.folder('specs');
          if (!specsFolder) throw new Error('Failed to create specs folder in zip');
          
          specsFolder.file('components.json', JSON.stringify(exportData.componentSpecs, null, 2));
          specsFolder.file('screens.json', JSON.stringify(exportData.screenSpecs, null, 2));

          // Add AI prompts
          const promptsFolder = zip.folder('prompts');
          if (!promptsFolder) throw new Error('Failed to create prompts folder in zip');
          
          exportData.aiPrompts.forEach((prompt, i) => {
            const content = `Generate a React Native component based on these specifications:\n\n` +
              `**Component**: ${prompt.componentName}\n` +
              `**Design System**: ${prompt.designSystem}\n\n` +
              `**Specifications**:\n\`\`\`json\n${prompt.specifications}\n\`\`\`\n\n` +
              `**Accessibility Requirements**:\n\`\`\`json\n${prompt.accessibilityRequirements}\n\`\`\`\n`;
            promptsFolder.file(`${i + 1}_${prompt.componentName}.md`, content);
          });

          // Add assets
          const assetsFolder = zip.folder('assets');
          if (!assetsFolder) throw new Error('Failed to create assets folder in zip');
          
          exportData.assets.forEach(asset => {
            assetsFolder.file(asset.name, asset.data);
          });
          
          const zipFile = await zip.generateAsync({ type: 'uint8array' });
          postMessage('EXPORT_COMPLETE', { exportBundle: { zipFile } });
        } catch (error) {
          handleError(error as Error, 'export generation');
          postMessage('EXPORT_FAILED');
        } finally {
          state.isExporting = false;
        }
        break;
      }

      case 'HIGHLIGHT_NODE': {
        const node = figma.getNodeById(msg.payload.nodeId);
        if (node) {
          figma.viewport.scrollAndZoomIntoView([node]);
          figma.notify(`Highlighting: ${node.name}`, { timeout: 1500 });
        } else {
          figma.notify('Node not found', { error: true });
        }
        break;
      }

      case 'REFRESH_COMPONENTS': {
        try {
          state.discoveredComponents = await discoverComponentsOnPage();
          postMessage('COMPONENTS_REFRESHED', { 
            discoveredComponents: state.discoveredComponents 
          });
        } catch (error) {
          handleError(error as Error, 'component refresh');
        }
        break;
      }

      default:
        throw new Error(`Unknown message type: ${msg.type}`);
    }
  } catch (error) {
    handleError(error as Error, 'message handling');
  }
};

// Cleanup on plugin close
figma.on('close', () => {
  // Clear any pending operations
  state.isAnalyzing = false;
  state.isExporting = false;
  state.lastError = null;
});