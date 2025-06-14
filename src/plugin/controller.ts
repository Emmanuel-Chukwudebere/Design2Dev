// src/plugin/controller.ts

import { ScreenSpec, Element, StyleProperties, InteractionState, SupportedDesignSystem } from '../shared/types';
import { generateExportBundle } from './engine';
import { analyzeScreens as analyzeScreensUtil } from './engine';

// Constants
const PLUGIN_UI_WIDTH = 400;
const PLUGIN_UI_HEIGHT = 600;
const MAX_SELECTION_SIZE = 8;
const MIN_SELECTION_SIZE = 1;

const API_KEY = 'd2d1'; // Hardcoded for testing
const SERVER_URL = 'http://localhost:3000';

interface State {
  isAnalyzing: boolean;
  isExporting: boolean;
  shouldCancel: boolean;
  selectedDesignSystem: SupportedDesignSystem;
  screenSpecs: ScreenSpec[];
  error: Error | null;
}

const state: State = {
  isAnalyzing: false,
  isExporting: false,
  shouldCancel: false,
  selectedDesignSystem: 'react-native-paper',
  screenSpecs: [],
  error: null
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
  state.error = error;
  figma.notify(`Error in ${context}: ${error.message}`, { error: true });
}

type FigmaEffect = {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR' | 'NOISE' | 'TEXTURE';
  visible: boolean;
  color?: { r: number; g: number; b: number; a: number };
  offset?: { x: number; y: number };
  radius?: number;
  spread?: number;
  blendMode?: BlendMode;
};

type FigmaNode = {
  id: string;
  name: string;
  type: string;
  opacity?: number;
  visible?: boolean;
  rotation?: number;
  blendMode?: string;
  effects?: FigmaEffect[];
  layoutMode?: string;
  primaryAxisSizingMode?: string;
  counterAxisSizingMode?: string;
  children?: Array<{ id: string }>;
  zIndex?: number;
};

// Add frameToScreenSpec function
function frameToScreenSpec(frame: FrameNode): ScreenSpec {
  const elements: Element[] = [];
  const dependencies = new Set<string>();
  const interactions = new Map<string, InteractionState[]>();

  // Analyze all nodes in the frame
  frame.findAll((node) => {
    // Extract element information
    const element: Element = {
      id: node.id,
      name: node.name,
      type: node.type.toLowerCase(),
      position: { x: node.x, y: node.y },
      dimensions: { width: node.width, height: node.height },
      styling: extractStyleProperties(node),
      parent: node.parent?.id,
      children: 'children' in node ? node.children.map(child => child.id) : [],
      zIndex: node.parent ? node.parent.children.indexOf(node) : 0
    };

    // Add content for text nodes
    if (node.type === 'TEXT') {
      element.content = node.characters;
      element.textStyle = {
        fontFamily: isFontName(node.fontName) ? node.fontName.family : 'Inter',
        fontSize: typeof node.fontSize === 'number' ? node.fontSize : 16,
        fontWeight: 400,
        lineHeight: typeof node.lineHeight === 'number' ? node.lineHeight : 1.2,
        letterSpacing: typeof node.letterSpacing === 'number' ? node.letterSpacing : 0,
        textAlign: node.textAlignHorizontal?.toLowerCase() || 'left',
        color: '#000000'
      };
    }

    // Add dependencies based on styling
    if (element.styling) {
      const style = element.styling as any; // Type assertion for shadow properties
      if (style.shadowColor || style.shadowOffset) {
        dependencies.add('react-native-shadow-2');
      }
      if (style.animation) {
        dependencies.add('react-native-reanimated');
      }
    }

    elements.push(element);
    return false;
  });

  return {
    id: `screen-${frame.id}`,
    name: frame.name,
    dimensions: { width: frame.width, height: frame.height },
    layout: extractStyleProperties(frame),
    designSystem: state.selectedDesignSystem,
    elements,
    dependencies: Array.from(dependencies),
    interactions: Object.fromEntries(interactions)
  };
}

async function analyzeScreens(frames: FrameNode[]) {
  try {
    const screenSpecs = frames.map(frameToScreenSpec);
    const results = await Promise.all(
      screenSpecs.map(async (screen) => {
        const response = await fetch(`${SERVER_URL}/api/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            screen,
            designSystem: state.selectedDesignSystem
          })
        });

        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.statusText}`);
        }

        return response.json();
      })
    );

    return results;
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

// Listen for selection changes
figma.on('selectionchange', async () => {
  const selection = figma.currentPage.selection;
  
  if (selection.length > 0 && selection.length <= MAX_SELECTION_SIZE) {
    const frames = selection.filter(node => node.type === 'FRAME') as FrameNode[];
    
    if (frames.length > 0) {
      try {
        state.isAnalyzing = true;
        postMessage('ANALYSIS_STARTED');
        
        const screenSpecs = await analyzeScreens(frames);
        state.screenSpecs = screenSpecs;
        
        postMessage('ANALYSIS_COMPLETE', { 
          screenSpecs,
          designSystem: state.selectedDesignSystem
        });
      } catch (error) {
        handleError(error as Error, 'analysis');
        postMessage('ANALYSIS_FAILED');
      } finally {
        state.isAnalyzing = false;
      }
    }
  }
});

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

      case 'ANALYZE_SCREENS':
        if (state.isAnalyzing || state.isExporting) {
          figma.ui.postMessage({ type: 'ANALYSIS_ERROR', payload: { error: 'Another operation is in progress' } });
          return;
        }

        state.isAnalyzing = true;
        state.shouldCancel = false;

        try {
          const selection = figma.currentPage.selection;
          if (selection.length === 0) {
            throw new Error('Please select at least one frame to analyze');
          }
          if (selection.length > 8) {
            throw new Error('Please select no more than 8 frames');
          }

          const frames = selection.filter(node => node.type === 'FRAME') as FrameNode[];
          if (frames.length === 0) {
            throw new Error('Please select valid frames to analyze');
          }

          figma.ui.postMessage({ 
            type: 'ANALYSIS_PROGRESS', 
            payload: { message: 'Analyzing frames...' } 
          });

          const screenSpecs = await Promise.all(frames.map(async (frame, index) => {
            if (state.shouldCancel) {
              throw new Error('Analysis cancelled');
            }

            figma.ui.postMessage({ 
              type: 'ANALYSIS_PROGRESS', 
              payload: { message: `Analyzing frame ${index + 1} of ${frames.length}...` } 
            });

            const spec = await analyzeFrame(frame, msg.payload.designSystem);
            return spec;
          }));

          if (state.shouldCancel) {
            throw new Error('Analysis cancelled');
          }

          figma.ui.postMessage({ 
            type: 'ANALYSIS_PROGRESS', 
            payload: { message: 'Finalizing analysis...' } 
          });

          figma.ui.postMessage({ 
            type: 'ANALYSIS_COMPLETE', 
            payload: { screenSpecs } 
          });
        } catch (error) {
          if (!state.shouldCancel) {
            figma.ui.postMessage({ 
              type: 'ANALYSIS_ERROR', 
              payload: { error: error instanceof Error ? error.message : 'Unknown error' } 
            });
          }
        } finally {
          state.isAnalyzing = false;
          state.shouldCancel = false;
        }
        break;

      case 'EXPORT_BUNDLE':
        if (state.isAnalyzing || state.isExporting) {
          figma.ui.postMessage({ type: 'EXPORT_ERROR', payload: { error: 'Another operation is in progress' } });
          return;
        }

        state.isExporting = true;
        state.shouldCancel = false;

        try {
          if (state.shouldCancel) {
            throw new Error('Export cancelled');
          }

          const { screenSpecs } = msg.payload;
          const bundle = await createExportBundle(screenSpecs);

          if (state.shouldCancel) {
            throw new Error('Export cancelled');
          }

          figma.ui.postMessage({ 
            type: 'EXPORT_COMPLETE', 
            payload: { bundle } 
          });
        } catch (error) {
          if (!state.shouldCancel) {
            figma.ui.postMessage({ 
              type: 'EXPORT_ERROR', 
              payload: { error: error instanceof Error ? error.message : 'Unknown error' } 
            });
          }
        } finally {
          state.isExporting = false;
          state.shouldCancel = false;
        }
        break;

      case 'CANCEL_OPERATION':
        state.shouldCancel = true;
        break;

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
  state.error = null;
});

function extractNodeProperties(node: SceneNode): StyleProperties {
  const properties: StyleProperties = {};
  const figmaNode = node as unknown as FigmaNode;

  // Basic properties
  if (typeof figmaNode.opacity === 'number') {
    properties.opacity = figmaNode.opacity;
  }
  if (typeof figmaNode.visible === 'boolean') {
    properties.visible = figmaNode.visible;
  }
  if (typeof figmaNode.rotation === 'number') {
    properties.rotation = figmaNode.rotation;
  }
  if (typeof figmaNode.blendMode === 'string') {
    properties.blendMode = figmaNode.blendMode as BlendMode;
  }
  if (Array.isArray(figmaNode.effects)) {
    properties.effects = figmaNode.effects
      .filter((effect): effect is FigmaEffect & { type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR' } => {
        return effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW' || effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR';
      })
      .map(effect => ({
        type: effect.type,
        visible: effect.visible,
        color: effect.color,
        offset: effect.offset,
        radius: effect.radius,
        spread: effect.spread,
        blendMode: effect.blendMode || 'NORMAL'
      }));
  }

  // Layout properties
  if (typeof figmaNode.layoutMode === 'string') {
    const mode = figmaNode.layoutMode;
    if (mode === 'NONE' || mode === 'HORIZONTAL' || mode === 'VERTICAL') {
      properties.layoutMode = mode;
    }
  }
  if (typeof figmaNode.primaryAxisSizingMode === 'string') {
    const mode = figmaNode.primaryAxisSizingMode;
    if (mode === 'FIXED' || mode === 'AUTO') {
      properties.primaryAxisSizingMode = mode;
    }
  }
  if (typeof figmaNode.counterAxisSizingMode === 'string') {
    const mode = figmaNode.counterAxisSizingMode;
    if (mode === 'FIXED' || mode === 'AUTO') {
      properties.counterAxisSizingMode = mode;
    }
  }

  return properties;
}

// Add helper functions
function extractStyleProperties(node: SceneNode): Record<string, any> {
  const properties: Record<string, any> = {};
  
  if ('opacity' in node) properties.opacity = node.opacity;
  if ('visible' in node) properties.visible = node.visible;
  if ('rotation' in node) properties.rotation = node.rotation;
  if ('blendMode' in node) properties.blendMode = node.blendMode;
  if ('effects' in node) {
    properties.effects = node.effects.map(effect => {
      const baseEffect = {
        type: effect.type,
        visible: true,
        blendMode: 'NORMAL'
      };
      
      if ('color' in effect) {
        return {
          ...baseEffect,
          color: effect.color,
          offset: effect.offset,
          radius: effect.radius,
          spread: effect.spread
        };
      }
      
      if ('radius' in effect) {
        return {
          ...baseEffect,
          radius: effect.radius
        };
      }
      
      return baseEffect;
    });
  }
  
  return properties;
}

function isFontName(value: any): value is FontName {
  return value && typeof value === 'object' && 'family' in value;
}

// Add dependency detection function
function detectDependencies(screen: ScreenSpec): string[] {
  const dependencies = new Set<string>();
  
  // Add base dependencies based on design system
  switch (state.selectedDesignSystem) {
    case 'react-native-paper':
      dependencies.add('react-native-paper');
      dependencies.add('react-native-safe-area-context');
      dependencies.add('react-native-vector-icons');
      break;
    case 'react-native-elements':
      dependencies.add('@rneui/themed');
      dependencies.add('@rneui/base');
      dependencies.add('react-native-vector-icons');
      break;
    case 'native-base':
      dependencies.add('native-base');
      dependencies.add('react-native-svg');
      dependencies.add('react-native-safe-area-context');
      break;
  }

  // Add dependencies based on component types
  screen.elements.forEach(element => {
    switch (element.type) {
      case 'image':
        dependencies.add('react-native-fast-image');
        break;
      case 'vector':
        dependencies.add('react-native-svg');
        break;
      case 'text':
        if (element.textStyle?.fontFamily?.includes('Material')) {
          dependencies.add('react-native-vector-icons');
        }
        break;
    }

    // Add dependencies based on styling
    if (element.styling) {
      const style = element.styling as any; // Type assertion for shadow properties
      if (style.shadowColor || style.shadowOffset) {
        dependencies.add('react-native-shadow-2');
      }
      if (style.animation) {
        dependencies.add('react-native-reanimated');
      }
    }
  });

  return Array.from(dependencies);
}

// Update function names
const analyzeFrame = async (frame: FrameNode, designSystem: SupportedDesignSystem): Promise<ScreenSpec> => {
  // Implementation of frame analysis
  return {
    id: frame.id,
    name: frame.name,
    dimensions: {
      width: frame.width,
      height: frame.height
    },
    layout: {
      layoutMode: frame.layoutMode,
      primaryAxisAlignItems: frame.primaryAxisAlignItems,
      counterAxisAlignItems: frame.counterAxisAlignItems,
      padding: frame.paddingTop ? {
        top: frame.paddingTop,
        right: frame.paddingRight,
        bottom: frame.paddingBottom,
        left: frame.paddingLeft
      } : undefined,
      itemSpacing: frame.itemSpacing
    } as StyleProperties,
    designSystem,
    dependencies: [],
    interactions: {},
    elements: [] // Add element analysis logic here
  };
};

const createExportBundle = async (screenSpecs: ScreenSpec[]): Promise<any> => {
  // Implementation of export bundle generation
  return {
    screens: screenSpecs,
    timestamp: new Date().toISOString()
  };
};