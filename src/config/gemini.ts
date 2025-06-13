// src/config/gemini.ts
import { ENV } from './env';

const API_BASE_URL = 'https://your-render-backend-url.onrender.com';

export const GEMINI_API_KEY = ENV.GEMINI_API_KEY;
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<string, {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    fontWeight: string;
  }>;
  spacing: Record<string, number>;
  radius: Record<string, number>;
  elevation: Record<string, {
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  }>;
}

interface ComponentSpec {
  id: string;
  type: string;
  layout: { x: number; y: number; width: number; height: number };
  style: Record<string, any>;
  children?: ComponentSpec[];
  content?: string;
  contentRef?: string;
  styleRef?: string;
  colorRef?: string;
  placeholder?: string;
  assetId?: string;
}

interface ScreenSpec {
  screenMetadata: {
    screenId: string;
    name: string;
    dimensions: { width: number; height: number };
    backgroundColorRef: string;
    tokensRef: string;
  };
  sharedDesignTokens: any;
  components: any[];
  assets: any[];
  dataModels: Record<string, any>;
}

async function analyzeScreenStructure(screen: any): Promise<ScreenSpec> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ENV.API_KEY
      },
      body: JSON.stringify(screen)
    });

    if (!response.ok) {
      throw new Error('Failed to analyze screen');
    }

    return response.json();
  } catch (error) {
    console.error('Error analyzing screen:', error);
    return generateFallbackSpec(screen);
  }
}

async function generatePromptWithGemini(screen: ScreenSpec): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ENV.API_KEY
      },
      body: JSON.stringify(screen)
    });

    if (!response.ok) {
      throw new Error('Failed to generate prompt');
    }

    const data = await response.json();
    return data.prompt;
  } catch (error) {
    console.error('Error generating prompt:', error);
    return generateFallbackPrompt(screen);
  }
}

function generateFallbackSpec(screen: any): ScreenSpec {
  return {
    screenMetadata: {
      screenId: screen.id || `screen-${Date.now()}`,
      name: screen.name,
      dimensions: screen.dimensions,
      backgroundColorRef: 'colors.background',
      tokensRef: 'sharedDesignTokens'
    },
    sharedDesignTokens: {
      colors: {
        primary: '#000000',
        background: '#FFFFFF',
        text: '#000000'
      },
      typography: {
        body: {
          fontFamily: 'System',
          fontSize: 16,
          lineHeight: 24,
          fontWeight: '400'
        }
      },
      spacing: {
        sm: 8,
        md: 16,
        lg: 24
      },
      radius: {
        sm: 4,
        md: 8
      },
      elevation: {
        low: {
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 1
        }
      }
    },
    components: screen.elements.map((element: any) => ({
      id: element.id,
      type: element.type,
      layout: element.position,
      style: element.styling,
      content: element.content
    })),
    assets: [],
    dataModels: {}
  };
}

function generateFallbackPrompt(screen: ScreenSpec): string {
  return `# ${screen.screenMetadata.name}

## Layout
- Dimensions: ${screen.screenMetadata.dimensions.width}x${screen.screenMetadata.dimensions.height}
- Background: ${screen.screenMetadata.backgroundColorRef}

## Components
${screen.components.map(comp => `- ${comp.id} (${comp.type})`).join('\n')}

## Design Tokens
${Object.entries(screen.sharedDesignTokens).map(([category, tokens]) => 
  `### ${category}\n${Object.entries(tokens).map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`).join('\n')}`
).join('\n\n')}

## Assets
${screen.assets.map(asset => `- ${asset.assetId} (${asset.type})`).join('\n')}

## Data Models
${Object.entries(screen.dataModels).map(([model, spec]) => 
  `### ${model}\n${Object.entries(spec.props).map(([prop, type]) => `- ${prop}: ${type}`).join('\n')}`
).join('\n\n')}

## Accessibility
- Ensure proper contrast ratios
- Add appropriate ARIA labels
- Maintain logical tab order
- Support screen readers`;
}

export { analyzeScreenStructure, generatePromptWithGemini, type ScreenSpec, type ComponentSpec, type DesignTokens }; 