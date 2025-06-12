import { ComponentSpec, SupportedDesignSystem } from '../shared/types';
import { designSystems } from './systems';

interface MappingSuggestion {
  designSystem: SupportedDesignSystem;
  componentName: string;
  confidence: number;
  reasoning: string;
}

interface ComponentPattern {
  patterns: readonly string[];
  styles?: readonly string[];
  interactions?: readonly string[];
  variants?: readonly string[];
  states?: readonly string[];
  layouts?: readonly string[];
  features?: readonly string[];
}

// Component pattern definitions
const COMPONENT_PATTERNS: Record<string, ComponentPattern> = {
  button: {
    patterns: ['btn', 'button', 'action', 'cta'],
    styles: ['primary', 'secondary', 'outline', 'ghost'],
    interactions: ['hover', 'press', 'disabled'],
  },
  input: {
    patterns: ['input', 'textfield', 'field', 'search', 'form'],
    variants: ['text', 'password', 'email', 'number'],
    states: ['focus', 'error', 'disabled'],
  },
  card: {
    patterns: ['card', 'container', 'box', 'panel'],
    layouts: ['horizontal', 'vertical', 'grid'],
    features: ['header', 'footer', 'media'],
  },
  text: {
    patterns: ['text', 'label', 'heading', 'title', 'paragraph'],
    variants: ['h1', 'h2', 'h3', 'body', 'caption'],
    styles: ['bold', 'italic', 'underline'],
  },
};

// Style similarity weights
const STYLE_WEIGHTS = {
  layoutMode: 0.3,
  primaryAlign: 0.2,
  counterAlign: 0.2,
  padding: 0.15,
  itemSpacing: 0.15,
} as const;

function calculateStyleSimilarity(component: ComponentSpec, targetComponent: string): number {
  let similarity = 0;
  const { styling } = component;

  // Check layout properties
  if (styling.layoutMode !== 'NONE') {
    similarity += STYLE_WEIGHTS.layoutMode;
  }

  // Check alignment properties
  if (styling.primaryAlign !== 'MIN' || styling.counterAlign !== 'MIN') {
    similarity += STYLE_WEIGHTS.primaryAlign + STYLE_WEIGHTS.counterAlign;
  }

  // Check spacing properties
  if (styling.padding && typeof styling.padding === 'object') {
    const paddingValues = Object.values(styling.padding);
    if (paddingValues.some(v => typeof v === 'number' && v > 0)) {
      similarity += STYLE_WEIGHTS.padding;
    }
  }

  if (typeof styling.itemSpacing === 'number' && styling.itemSpacing > 0) {
    similarity += STYLE_WEIGHTS.itemSpacing;
  }

  return similarity;
}

function calculateNameSimilarity(component: ComponentSpec, targetComponent: string): number {
  const componentName = component.name.toLowerCase();
  const targetName = targetComponent.toLowerCase();
  
  // Direct match
  if (componentName === targetName) {
    return 1.0;
  }
  
  // Contains match
  if (componentName.includes(targetName) || targetName.includes(componentName)) {
    return 0.8;
  }
  
  // Pattern matching
  for (const [key, patterns] of Object.entries(COMPONENT_PATTERNS)) {
    if (targetName === key) {
      // Check for pattern matches
      if (patterns.patterns.some(p => componentName.includes(p))) {
        return 0.7;
      }
      
      // Check for style matches
      if (patterns.styles?.some(s => componentName.includes(s))) {
        return 0.6;
      }
      
      // Check for interaction/state matches
      if (patterns.interactions?.some(i => componentName.includes(i)) ||
          patterns.states?.some(s => componentName.includes(s))) {
        return 0.5;
      }
    }
  }
  
  return 0.3; // Default low confidence
}

function calculateSimilarity(component: ComponentSpec, targetComponent: string): number {
  try {
    const nameSimilarity = calculateNameSimilarity(component, targetComponent);
    const styleSimilarity = calculateStyleSimilarity(component, targetComponent);
    
    // Weight the similarities (name is more important than style)
    return (nameSimilarity * 0.7) + (styleSimilarity * 0.3);
  } catch (error) {
    console.error('Error calculating similarity:', error);
    return 0; // Return 0 confidence on error
  }
}

export function suggestMappings(component: ComponentSpec): MappingSuggestion[] {
  try {
    const suggestions: MappingSuggestion[] = [];
    
    // Iterate through each design system
    for (const [systemName, system] of Object.entries(designSystems)) {
      // Get all component names from the design system
      const componentNames = Object.keys(system.components);
      
      for (const targetComponent of componentNames) {
        const confidence = calculateSimilarity(component, targetComponent);
        
        if (confidence > 0.5) {
          const reasoning = generateReasoning(component, targetComponent, confidence);
          suggestions.push({
            designSystem: systemName as SupportedDesignSystem,
            componentName: targetComponent,
            confidence,
            reasoning,
          });
        }
      }
    }
    
    // Sort by confidence and limit to top 3 suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  } catch (error) {
    console.error('Error generating mapping suggestions:', error);
    return []; // Return empty array on error
  }
}

function generateReasoning(
  component: ComponentSpec,
  targetComponent: string,
  confidence: number
): string {
  const reasons: string[] = [];
  
  // Add name-based reasoning
  if (component.name.toLowerCase().includes(targetComponent.toLowerCase())) {
    reasons.push(`Component name "${component.name}" matches ${targetComponent}`);
  }
  
  // Add style-based reasoning
  if (component.styling.layoutMode !== 'NONE') {
    reasons.push('Component uses layout properties');
  }
  
  // Add confidence level
  reasons.push(`Confidence: ${Math.round(confidence * 100)}%`);
  
  return reasons.join('. ');
}

export function getBestMapping(component: ComponentSpec): MappingSuggestion | null {
  try {
    const suggestions = suggestMappings(component);
    return suggestions.length > 0 ? suggestions[0] : null;
  } catch (error) {
    console.error('Error getting best mapping:', error);
    return null;
  }
} 