// src/plugin/controller.ts

import { analyzeScreens, generateExportBundle } from './engine';
import { ScreenSpec, SupportedDesignSystem } from '../shared/types';
import JSZip from 'jszip';

// Constants
const PLUGIN_UI_WIDTH = 400;
const PLUGIN_UI_HEIGHT = 600;
const MAX_SELECTION_SIZE = 8;
const MIN_SELECTION_SIZE = 1;

// State management
interface PluginState {
  isAnalyzing: boolean;
  isExporting: boolean;
  lastError: string | null;
  selectedDesignSystem: SupportedDesignSystem;
}

// Initialize plugin state
const state: PluginState = {
  isAnalyzing: false,
  isExporting: false,
  lastError: null,
  selectedDesignSystem: 'Custom'
};

// Initialize plugin UI
figma.showUI(__html__, {
  width: PLUGIN_UI_WIDTH,
  height: PLUGIN_UI_HEIGHT
});

// Send initial state
console.log('Sending initial state');
postMessage('PLUGIN_READY');
postMessage('PAGE_INFO', {
  name: figma.currentPage.name,
  nodeCount: figma.currentPage.children.length
});

// Utility functions
function postMessage(type: string, payload?: any) {
  figma.ui.postMessage({ type, payload });
}

// Error handling
function handleError(error: Error, context: string) {
  console.error(`Error in ${context}:`, error);
  state.lastError = error.message;
  figma.notify(`Error in ${context}: ${error.message}`, { error: true });
}

// Message handling
figma.ui.onmessage = async (msg) => {
  console.log('Plugin received message:', msg);
  
  try {
    switch (msg.type) {
      case 'INIT': {
        console.log('Received INIT message, sending PLUGIN_READY');
        postMessage('PLUGIN_READY');
        postMessage('PAGE_INFO', {
          name: figma.currentPage.name,
          nodeCount: figma.currentPage.children.length
        });
        break;
      }

      case 'ANALYZE_SCREENS': {
        if (state.isAnalyzing) {
          throw new Error('Analysis already in progress');
        }

        const selection = figma.currentPage.selection.filter(n => n.type === 'FRAME');
        console.log('Selected frames:', selection.length);
        
        if (selection.length < MIN_SELECTION_SIZE) {
          throw new Error(`Please select at least ${MIN_SELECTION_SIZE} frame to analyze.`);
        }

        if (selection.length > MAX_SELECTION_SIZE) {
          throw new Error(`Please select no more than ${MAX_SELECTION_SIZE} frames to analyze.`);
        }

        if (msg.payload?.designSystem) {
          state.selectedDesignSystem = msg.payload.designSystem;
        }

        state.isAnalyzing = true;
        postMessage('ANALYSIS_STARTED');

        try {
          const screenSpecs = analyzeScreens(selection, state.selectedDesignSystem);
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

      case 'EXPORT_BUNDLE': {
        if (state.isExporting) {
          throw new Error('Export already in progress');
        }

        const { screenSpecs } = msg.payload as { screenSpecs: ScreenSpec[] };

        state.isExporting = true;
        postMessage('EXPORT_STARTED');

        try {
          const bundle = await generateExportBundle(screenSpecs, state.selectedDesignSystem);
          postMessage('EXPORT_COMPLETE', { bundle });
        } catch (error) {
          handleError(error as Error, 'export');
          postMessage('EXPORT_FAILED');
        } finally {
          state.isExporting = false;
        }
        break;
      }

      default:
        console.log('Unknown message type:', msg.type);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    handleError(error as Error, 'message handling');
  }
};

// Cleanup on plugin close
figma.on('close', () => {
  state.isAnalyzing = false;
  state.isExporting = false;
  state.lastError = null;
});