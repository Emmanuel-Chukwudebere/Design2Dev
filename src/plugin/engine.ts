// src/plugin/engine.ts
import { StyleProperties, ComponentSpec, ScreenSpec, ComponentInstance, ExportBundle, AIPrompt, IndividualCorners, Effect, SupportedDesignSystem, Color, Gradient, Shadow, CornerRadius, InteractionState, isFontName, isLetterSpacing, isLineHeight, isTextCase, isTextDecoration, isLayoutAlign, LayoutAlign, HorizontalConstraint, VerticalConstraint, isHorizontalConstraint, isVerticalConstraint } from '../shared/types';

// Constants for performance tuning
const MIN_COMPONENT_INSTANCES = 2;
const MAX_PARALLEL_EXPORTS = 5;
const EXPORT_TIMEOUT = 30000; // 30 seconds

// Cache for structural hashes
const structuralHashCache = new Map<string, string>();

// Design system detection patterns
const DESIGN_SYSTEM_PATTERNS = {
  'React Native Paper': {
    components: [
      'button', 'card', 'textinput', 'checkbox', 'radio', 'switch',
      'list', 'avatar', 'badge', 'chip', 'divider', 'fab'
    ],
    styles: ['elevation', 'ripple', 'paper']
  },
  'Material UI': {
    components: [
      'mui-button', 'mui-card', 'mui-textfield', 'mui-checkbox',
      'mui-radio', 'mui-switch', 'mui-list', 'mui-avatar'
    ],
    styles: ['mui-elevation', 'mui-ripple']
  },
  'Chakra UI': {
    components: [
      'chakra-button', 'chakra-box', 'chakra-input', 'chakra-checkbox',
      'chakra-radio', 'chakra-switch', 'chakra-list', 'chakra-avatar'
    ],
    styles: ['chakra-style', 'chakra-theme']
  },
  'NativeBase': {
    components: [
      'nb-button', 'nb-box', 'nb-input', 'nb-checkbox',
      'nb-radio', 'nb-switch', 'nb-list', 'nb-avatar'
    ],
    styles: ['nb-style', 'nb-theme']
  }
};

// Permission patterns
const PERMISSION_PATTERNS = {
  camera: {
    patterns: ['camera', 'photo', 'avatar-upload', 'scan', 'qr-code'],
    permissions: {
      android: ['android.permission.CAMERA'],
      ios: ['ios.permission.NSCameraUsageDescription']
    }
  },
  location: {
    patterns: ['location', 'map', 'gps', 'geolocation'],
    permissions: {
      android: [
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION'
      ],
      ios: ['ios.permission.NSLocationWhenInUseUsageDescription']
    }
  },
  storage: {
    patterns: ['storage', 'file', 'download', 'upload', 'gallery'],
    permissions: {
      android: [
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE'
      ],
      ios: ['ios.permission.NSPhotoLibraryUsageDescription']
    }
  },
  notifications: {
    patterns: ['notification', 'push', 'alert'],
    permissions: {
      android: ['android.permission.POST_NOTIFICATIONS'],
      ios: ['ios.permission.NSUserNotificationUsageDescription']
    }
  },
  microphone: {
    patterns: ['microphone', 'audio', 'voice', 'record'],
    permissions: {
      android: ['android.permission.RECORD_AUDIO'],
      ios: ['ios.permission.NSMicrophoneUsageDescription']
    }
  }
};

// Dependency patterns
const DEPENDENCY_PATTERNS = {
  'react-native-maps': {
    patterns: ['map', 'location', 'gps', 'geolocation'],
    version: '^1.7.1'
  },
  'react-native-camera': {
    patterns: ['camera', 'photo', 'scan', 'qr-code'],
    version: '^4.2.1'
  },
  'react-native-image-picker': {
    patterns: ['image-picker', 'photo', 'gallery', 'upload'],
    version: '^5.6.0'
  },
  'react-native-vector-icons': {
    patterns: ['icon', 'material-icon', 'font-awesome'],
    version: '^10.0.0'
  },
  'react-native-gesture-handler': {
    patterns: ['gesture', 'swipe', 'pinch', 'pan'],
    version: '^2.12.0'
  },
  'react-native-reanimated': {
    patterns: ['animation', 'transition', 'motion'],
    version: '^3.3.0'
  },
  'react-native-safe-area-context': {
    patterns: ['safe-area', 'notch', 'status-bar'],
    version: '^4.6.3'
  }
};

// Utility function to safely extract style properties
function extractStyleProperties(node: SceneNode): StyleProperties {
  const properties: StyleProperties = {};

  // Layout properties
  if ('layoutMode' in node) {
    properties.layoutMode = node.layoutMode;
    properties.primaryAlign = node.primaryAxisAlignItems;
    properties.counterAlign = node.counterAxisAlignItems;
    properties.padding = {
      top: node.paddingTop,
      right: node.paddingRight,
      bottom: node.paddingBottom,
      left: node.paddingLeft
    };
    properties.itemSpacing = node.itemSpacing;
    if ('layoutWrap' in node) properties.layoutWrap = node.layoutWrap;
    if (isLayoutAlign(node.layoutAlign)) {
      properties.layoutAlign = node.layoutAlign;
    }
    if ('layoutGrow' in node) properties.layoutGrow = node.layoutGrow;
    if ('layoutPositioning' in node) properties.layoutPositioning = node.layoutPositioning;
  }

  // Grid layout
  if ('layoutGrids' in node && Array.isArray(node.layoutGrids)) {
    properties.gridLayout = node.layoutGrids.map(grid => ({
      pattern: grid.pattern,
      sectionSize: grid.sectionSize,
      visible: grid.visible,
      color: grid.color,
      alignment: grid.alignment,
      gutterSize: grid.gutterSize,
      count: grid.count,
      offset: grid.offset
    }));
  }

  // Position and size
  properties.position = {
    x: node.x,
    y: node.y
  };
  if ('rotation' in node && typeof node.rotation === 'number') {
    properties.position.rotation = node.rotation;
  }
  if ('scaleX' in node && 'scaleY' in node && 
      typeof node.scaleX === 'number' && typeof node.scaleY === 'number') {
    properties.position.scale = {
      x: node.scaleX,
      y: node.scaleY
    };
  }

  // Fill properties
  if ('fills' in node && Array.isArray(node.fills)) {
    properties.fills = node.fills.map(fill => {
      if (fill.type === 'SOLID') {
        return {
          type: 'SOLID',
          color: {
            r: fill.color.r,
            g: fill.color.g,
            b: fill.color.b,
            a: fill.opacity
          }
        };
      } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
        return {
          type: fill.type,
          gradientStops: fill.gradientStops,
          gradientTransform: fill.gradientTransform
        };
      } else if (fill.type === 'IMAGE') {
        return {
          type: 'IMAGE',
          scaleMode: fill.scaleMode,
          imageHash: fill.imageHash,
          blendMode: fill.blendMode
        };
      }
      return fill;
    });
  }

  // Stroke properties
  if ('strokes' in node && Array.isArray(node.strokes)) {
    properties.strokes = node.strokes.map(stroke => {
      if (stroke.type === 'SOLID') {
        return {
          type: 'SOLID',
          color: {
            r: stroke.color.r,
            g: stroke.color.g,
            b: stroke.color.b,
            a: stroke.opacity
          }
        };
      }
      return stroke;
    });
    if (typeof node.strokeWeight === 'number') {
      properties.strokeWeight = node.strokeWeight;
    }
    properties.strokeAlign = node.strokeAlign;
    if ('strokeCap' in node && typeof node.strokeCap === 'string') {
      properties.strokeCap = node.strokeCap as StyleProperties['strokeCap'];
    }
    if ('strokeJoin' in node && typeof node.strokeJoin === 'string') {
      properties.strokeJoin = node.strokeJoin as StyleProperties['strokeJoin'];
    }
    if ('strokeMiterLimit' in node && typeof node.strokeMiterLimit === 'number') {
      properties.strokeMiterLimit = node.strokeMiterLimit;
    }
    if ('strokeDashes' in node && Array.isArray(node.strokeDashes)) {
      properties.strokeDashes = node.strokeDashes;
    }
  }

  // Corner radius
  if ('cornerRadius' in node) {
    if (typeof node.cornerRadius === 'number') {
      properties.cornerRadius = node.cornerRadius;
    } else if (node.cornerRadius && typeof node.cornerRadius === 'object') {
      const radius = node.cornerRadius as CornerRadius;
      properties.cornerRadius = {
        topLeft: radius.topLeft,
        topRight: radius.topRight,
        bottomRight: radius.bottomRight,
        bottomLeft: radius.bottomLeft
      };
    }
  }

  // Effects
  if ('effects' in node && Array.isArray(node.effects)) {
    properties.effects = node.effects.map(effect => {
      if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
        return {
          type: effect.type,
          color: effect.color,
          offset: effect.offset,
          radius: effect.radius,
          spread: effect.spread,
          visible: effect.visible,
          blendMode: effect.blendMode
        };
      } else if (effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR') {
        return {
          type: effect.type,
          radius: effect.radius,
          visible: effect.visible
        };
      }
      return effect;
    });
  }

  // Text properties
  if (node.type === 'TEXT') {
    if (typeof node.fontSize === 'number') {
      properties.fontSize = node.fontSize;
    }
    if (isFontName(node.fontName)) {
      properties.fontName = node.fontName;
    }
    properties.textAlignHorizontal = node.textAlignHorizontal;
    properties.textAlignVertical = node.textAlignVertical;
    if (isLetterSpacing(node.letterSpacing)) {
      properties.letterSpacing = node.letterSpacing;
    }
    if (isLineHeight(node.lineHeight)) {
      properties.lineHeight = node.lineHeight;
    }
    if (isTextCase(node.textCase)) {
      properties.textCase = node.textCase;
    }
    if (isTextDecoration(node.textDecoration)) {
      properties.textDecoration = node.textDecoration;
    }
    if (node.textAutoResize) {
      properties.textAutoResize = node.textAutoResize;
    }
  }

  // Constraints
  if ('constraints' in node) {
    const { horizontal, vertical } = node.constraints;
    if (isHorizontalConstraint(horizontal) && isVerticalConstraint(vertical)) {
      properties.constraints = { horizontal, vertical };
    }
  }

  // Common properties
  if ('opacity' in node && typeof node.opacity === 'number') {
    properties.opacity = node.opacity;
  }
  if ('visible' in node && typeof node.visible === 'boolean') {
    properties.visible = node.visible;
  }
  if ('locked' in node && typeof node.locked === 'boolean') {
    properties.locked = node.locked;
  }
  if ('preserveRatio' in node && typeof node.preserveRatio === 'boolean') {
    properties.preserveRatio = node.preserveRatio;
  }
  if ('blendMode' in node && typeof node.blendMode === 'string') {
    properties.blendMode = node.blendMode as BlendMode;
  }
  if ('exportSettings' in node) {
    properties.exportSettings = [...node.exportSettings];
  }

  return properties;
}

// Fixed version of getStructuralHash function
function getStructuralHash(node: SceneNode, depth: number = 0, visited: Set<string> = new Set()): string {
  // Prevent infinite recursion with stricter depth limit
  if (depth > 5) {
    return `${node.type}[MAX_DEPTH]`;
  }

  // Check cache first
  const cached = structuralHashCache.get(node.id);
  if (cached) return cached;

  // Prevent circular references - check if node is already being processed
  if (visited.has(node.id)) {
    return `${node.type}[CIRCULAR]`;
  }

  // Add current node to visited set
  const newVisited = new Set(visited);
  newVisited.add(node.id);

  try {
    // Handle leaf nodes
    if (!('children' in node) || !node.children || node.children.length === 0) {
      const hash = node.type;
      structuralHashCache.set(node.id, hash);
      return hash;
    }

    // Process children with updated visited set and depth
    const childrenHashes: string[] = [];
    for (const child of node.children) {
      try {
        const childHash = getStructuralHash(child, depth + 1, newVisited);
        childrenHashes.push(childHash);
      } catch (error) {
        // Skip problematic children
        console.warn(`Skipping child ${child.id} due to error:`, error);
        childrenHashes.push(`${child.type}[ERROR]`);
      }
    }
    
    const hash = `${node.type}[${childrenHashes.sort().join(',')}]`;
    structuralHashCache.set(node.id, hash);
    return hash;
  } catch (error) {
    console.error(`Error computing hash for node ${node.id}:`, error);
    const fallbackHash = `${node.type}[ERROR]`;
    structuralHashCache.set(node.id, fallbackHash);
    return fallbackHash;
  }
}

// Clear cache function - call this before major operations
function clearStructuralCache() {
  structuralHashCache.clear();
}

// Optimized style signature calculation
function getStyleSignature(style: StyleProperties): string {
  const parts: string[] = [];
  const sig = (val: any) => JSON.stringify(val, Object.keys(val).sort());

  (style.fills ?? []).forEach(f => parts.push(`fill:${sig(f)}`));
  (style.strokes ?? []).forEach(s => parts.push(`stroke:${sig(s)}`));
  parts.push(`sw:${style.strokeWeight}`);
  parts.push(`cr:${JSON.stringify(style.cornerRadius)}`);
  (style.effects ?? []).forEach(e => parts.push(`effect:${sig(e)}`));
  
  return parts.join('|');
}

// Batch processing utility
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

// Improved discoverComponentsOnPage with better error handling
export async function discoverComponentsOnPage(): Promise<ComponentSpec[]> {
  try {
    // Clear caches to prevent stale data
    clearStructuralCache();
    
    // Limit the number of nodes to prevent performance issues
    const MAX_NODES_TO_PROCESS = 500; // Reduced from 1000
    const allNodes = figma.currentPage.findAll(n => 
      (n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'INSTANCE') &&
      n.visible !== false // Skip hidden nodes
    ).slice(0, MAX_NODES_TO_PROCESS);
    
    if (allNodes.length === 0) {
      figma.notify('No components found on this page.', { timeout: 2000 });
      return [];
    }

    console.log(`Processing ${allNodes.length} nodes...`);
    
    const structuralGroups = new Map<string, SceneNode[]>();
    let processedCount = 0;

    // Group nodes by their structural hash with error handling
    for (const node of allNodes) {
      try {
        // Skip nodes without children
        if (!('children' in node) || !node.children || node.children.length === 0) {
          continue;
        }
        
        // Add timeout for individual node processing
        const timeoutPromise = new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('Hash computation timeout')), 5000)
        );
        
        const hashPromise = new Promise<string>((resolve) => {
          try {
            const hash = getStructuralHash(node);
            resolve(hash);
          } catch (error) {
            resolve(`${node.type}[HASH_ERROR]`);
          }
        });
        
        const hash = await Promise.race([hashPromise, timeoutPromise]);
        
        if (!structuralGroups.has(hash)) {
          structuralGroups.set(hash, []);
        }
        structuralGroups.get(hash)!.push(node);
        
        processedCount++;
        
        // Progress feedback every 50 nodes
        if (processedCount % 50 === 0) {
          console.log(`Processed ${processedCount}/${allNodes.length} nodes...`);
        }
        
      } catch (error) {
        console.warn(`Skipping node ${node.id} (${node.name}) due to error:`, error);
        continue;
      }
    }

    console.log(`Found ${structuralGroups.size} structural groups`);

    const finalComponentSpecs: ComponentSpec[] = [];

    // Process structural groups with better error handling
    const groupEntries = [...structuralGroups.entries()];
    
    for (let i = 0; i < groupEntries.length; i++) {
      const [hash, nodes] = groupEntries[i];
      
      try {
        if (nodes.length < MIN_COMPONENT_INSTANCES) continue;

        // Progress feedback for group processing
        if (i % 10 === 0) {
          console.log(`Processing group ${i + 1}/${groupEntries.length}...`);
        }

        const styleGroups = new Map<string, SceneNode[]>();

        // Sub-group by style signature with error handling
        for (const node of nodes) {
          try {
            const style = extractStyleProperties(node);
            const signature = getStyleSignature(style);
            if (!styleGroups.has(signature)) {
              styleGroups.set(signature, []);
            }
            styleGroups.get(signature)!.push(node);
          } catch (error) {
            console.warn(`Error processing node ${node.id} for styling:`, error);
            continue;
          }
        }
        
        if (styleGroups.size === 0) continue;

        const sortedStyleGroups = [...styleGroups.values()].sort((a, b) => b.length - a.length);
        const baseNodes = sortedStyleGroups[0];
        const baseNode = baseNodes[0];

        const baseSpec: ComponentSpec = {
          id: `comp-${baseNode.id}`,
          name: baseNode.name.split(/[\/\=]/).pop()?.trim() ?? 'Component',
          category: 'container',
          styling: extractStyleProperties(baseNode),
          dimensions: { width: baseNode.width, height: baseNode.height },
          variants: [],
          mapping: { designSystem: 'Custom', mappedComponent: null, styleOverrides: [] },
          accessibility: { role: 'group', label: null },
        };

        // Process variants with stricter limits
        const MAX_VARIANTS = 3; // Reduced from 5
        const variantCount = Math.min(sortedStyleGroups.length - 1, MAX_VARIANTS);
        
        for (let j = 1; j <= variantCount; j++) {
          try {
            const variantNodes = sortedStyleGroups[j];
            const variantNode = variantNodes[0];
            const variantSpec: ComponentSpec = {
              id: `comp-${variantNode.id}`,
              name: variantNode.name.split(/[\/\=]/).pop()?.trim() ?? `${baseSpec.name} Variant`,
              category: 'container',
              styling: extractStyleProperties(variantNode),
              dimensions: { width: variantNode.width, height: variantNode.height },
              variants: [],
              mapping: { designSystem: 'Custom', mappedComponent: null, styleOverrides: [] },
              accessibility: { role: 'group', label: null },
            };
            baseSpec.variants.push(variantSpec);
          } catch (error) {
            console.warn(`Error processing variant ${j}:`, error);
            continue;
          }
        }

        finalComponentSpecs.push(baseSpec);
      } catch (error) {
        console.warn(`Error processing structural group ${i}:`, error);
        continue;
      }
    }

    // Clear caches after processing
    clearStructuralCache();

    console.log(`Discovery complete. Found ${finalComponentSpecs.length} component patterns`);
    figma.notify(`Found ${finalComponentSpecs.length} component patterns`, { timeout: 2000 });
    return finalComponentSpecs;
    
  } catch (error) {
    console.error('Critical error in component discovery:', error);
    figma.notify('Error discovering components. Please try again.', { error: true });
    
    // Clear caches on error
    clearStructuralCache();
    
    return [];
  }
}

function detectDesignSystem(node: SceneNode): SupportedDesignSystem {
  const nodeName = node.name.toLowerCase();
  
  for (const [system, patterns] of Object.entries(DESIGN_SYSTEM_PATTERNS)) {
    const hasComponent = patterns.components.some(comp => nodeName.includes(comp));
    const hasStyle = patterns.styles.some(style => nodeName.includes(style));
    
    if (hasComponent || hasStyle) {
      return system as SupportedDesignSystem;
    }
  }
  
  return 'React Native Paper'; // Default
}

function detectPermissions(node: SceneNode): string[] {
  const permissions = new Set<string>();
  const nodeName = node.name.toLowerCase();
  
  for (const [category, info] of Object.entries(PERMISSION_PATTERNS)) {
    if (info.patterns.some(pattern => nodeName.includes(pattern))) {
      info.permissions.android.forEach(perm => permissions.add(perm));
      info.permissions.ios.forEach(perm => permissions.add(perm));
    }
  }
  
  return Array.from(permissions);
}

function detectDependencies(node: SceneNode): string[] {
  const dependencies = new Set<string>();
  const nodeName = node.name.toLowerCase();
  
  for (const [dep, info] of Object.entries(DEPENDENCY_PATTERNS)) {
    if (info.patterns.some(pattern => nodeName.includes(pattern))) {
      dependencies.add(dep);
    }
  }
  
  return Array.from(dependencies);
}

// Update analyzeScreens function to use new detection functions
export function analyzeScreens(
  selectedScreens: readonly SceneNode[],
  designSystem: SupportedDesignSystem
): ScreenSpec[] {
  try {
    const screenSpecs: ScreenSpec[] = [];

    for (const screenNode of selectedScreens) {
      if (screenNode.type !== 'FRAME') continue;

      const elements: ScreenSpec['elements'] = [];
      const dependencies = new Set<string>();
      const permissions = new Set<string>();
      const navigationScreens = new Set<string>();
      const interactions = new Map<string, InteractionState[]>();

      // Analyze all nodes in the screen
      screenNode.findAll((node) => {
        // Extract element information
        const element: ScreenSpec['elements'][0] = {
          id: node.id,
          name: node.name,
          type: node.type.toLowerCase() as ScreenSpec['elements'][0]['type'],
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
            fontSize: typeof node.fontSize === 'number' ? node.fontSize : 16, // Default font size
            fontName: isFontName(node.fontName) ? node.fontName : {
              family: 'Inter',
              style: 'Regular'
            },
            textAlignHorizontal: node.textAlignHorizontal,
            textAlignVertical: node.textAlignVertical,
            letterSpacing: typeof node.letterSpacing === 'number' ? node.letterSpacing : 0,
            lineHeight: typeof node.lineHeight === 'number' ? node.lineHeight : 1.2,
            textCase: isTextCase(node.textCase) && node.textCase !== 'SMALL_CAPS' ? node.textCase : 'ORIGINAL',
            textDecoration: isTextDecoration(node.textDecoration) ? node.textDecoration : 'NONE'
          };
        }

        // Add auto-layout information
        if ('layoutMode' in node && node.layoutMode !== 'NONE') {
          element.autoLayout = {
            direction: node.layoutMode,
            alignment: node.primaryAxisAlignItems,
            counterAlignment: node.counterAxisAlignItems,
            spacing: node.itemSpacing,
            padding: {
              top: node.paddingTop,
              right: node.paddingRight,
              bottom: node.paddingBottom,
              left: node.paddingLeft
            },
            layoutWrap: node.layoutWrap,
            layoutAlign: isLayoutAlign(node.layoutAlign) && (node.layoutAlign === 'STRETCH' || node.layoutAlign === 'INHERIT') 
              ? node.layoutAlign 
              : 'STRETCH',
            layoutGrow: node.layoutGrow
          };
        }

        // Add grid layout information
        if ('layoutGrids' in node && Array.isArray(node.layoutGrids)) {
          element.gridLayout = node.layoutGrids.map(grid => ({
            pattern: grid.pattern,
            sectionSize: grid.sectionSize,
            visible: grid.visible,
            color: grid.color,
            alignment: grid.alignment,
            gutterSize: grid.gutterSize,
            count: grid.count,
            offset: grid.offset
          }));
        }

        // Add constraints
        if ('constraints' in node) {
          const { horizontal, vertical } = node.constraints;
          if (isHorizontalConstraint(horizontal) && isVerticalConstraint(vertical)) {
            element.constraints = {
              horizontal,
              vertical
            };
          }
        }

        // Add effects
        if ('effects' in node && Array.isArray((node as any).effects) && (node as any).effects.length > 0) {
          element.effects = ((node as any).effects).map((effect: any) => ({
            type: effect.type,
            properties: effect
          }));
        }

        // Check for interactions
        if (node.name.toLowerCase().includes('hover') || 
            node.name.toLowerCase().includes('active') || 
            node.name.toLowerCase().includes('pressed')) {
          const baseName = node.name.split('/')[0];
          if (!interactions.has(baseName)) {
            interactions.set(baseName, []);
          }
          interactions.get(baseName)?.push({
            state: node.name.toLowerCase().includes('hover') ? 'hover' :
                   node.name.toLowerCase().includes('active') ? 'active' : 'pressed',
            nodeId: node.id
          });
        }

        elements.push(element);

        // Detect permissions and dependencies
        const nodePermissions = detectPermissions(node);
        const nodeDependencies = detectDependencies(node);
        
        nodePermissions.forEach(perm => permissions.add(perm));
        nodeDependencies.forEach(dep => dependencies.add(dep));

        // Check for navigation patterns
        if (node.name.toLowerCase().includes('nav') || node.name.toLowerCase().includes('menu')) {
          const navType = node.name.toLowerCase().includes('tab') ? 'tab' : 
                         node.name.toLowerCase().includes('drawer') ? 'drawer' : 'stack';
          // Look for connected screens
          if ('findAll' in node && typeof node.findAll === 'function') {
            node.findAll((n: SceneNode) => {
              if (n.type === 'FRAME' && n !== screenNode) {
                navigationScreens.add(n.name);
              }
              return false;
            });
          }
        }

        return false;
      });

      const spec: ScreenSpec = {
        id: `screen-${screenNode.id}`,
        name: screenNode.name,
        dimensions: { width: screenNode.width, height: screenNode.height },
        layout: extractStyleProperties(screenNode),
        designSystem: detectDesignSystem(screenNode),
        elements,
        dependencies: Array.from(dependencies),
        permissions: Array.from(permissions),
        interactions: Object.fromEntries(interactions)
      };

      // Add navigation if found
      if (navigationScreens.size > 0) {
        spec.navigation = {
          type: 'stack', // Default to stack, can be overridden by UI
          screens: Array.from(navigationScreens)
        };
      }

      screenSpecs.push(spec);
    }

    return screenSpecs;
  } catch (error) {
    console.error('Error analyzing screens:', error);
    figma.notify('Error analyzing screens. Please try again.', { error: true });
    return [];
  }
}

// Export bundle generation with timeout and error handling
export async function generateExportBundle(
  screenSpecs: ScreenSpec[],
  designSystem: SupportedDesignSystem
): Promise<ExportBundle> {
  try {
    const aiPrompts: AIPrompt[] = [];
    const assets: ExportBundle['assets'] = [];

    // Process screens
    for (const screen of screenSpecs) {
      aiPrompts.push({
        screenName: screen.name,
        designSystem,
        specifications: JSON.stringify(screen, null, 2),
        accessibilityRequirements: JSON.stringify({
          elements: screen.elements.map(el => ({
            id: el.id,
            name: el.name,
            type: el.type,
            role: el.type === 'text' ? 'text' : 
                  el.type === 'image' ? 'image' : 
                  el.type === 'vector' ? 'image' : 'group'
          }))
        }, null, 2)
      });

      // Extract assets from elements
      for (const element of screen.elements) {
        if (element.type === 'image' || element.type === 'vector') {
          const node = figma.getNodeById(element.id);
          if (node && 'exportAsync' in node) {
            const data = await node.exportAsync({
              format: 'PNG',
              constraint: { type: 'SCALE', value: 2 }
            });
            assets.push({
              name: `${element.name}.png`,
              data
            });
          }
        }
      }
    }

    return {
      screenSpecs,
      aiPrompts,
      assets
    };
  } catch (error) {
    console.error('Error generating export bundle:', error);
    figma.notify('Error generating export bundle. Please try again.', { error: true });
    throw error;
  }
}