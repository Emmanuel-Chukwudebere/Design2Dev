// src/plugin/engine.ts
import { StyleProperties, ComponentSpec, ScreenSpec, ComponentInstance, ExportBundle, AIPrompt, IndividualCorners, Effect, SupportedDesignSystem, Color, Gradient, Shadow } from '../shared/types';

// Constants for performance tuning
const MIN_COMPONENT_INSTANCES = 2;
const MAX_PARALLEL_EXPORTS = 5;
const EXPORT_TIMEOUT = 30000; // 30 seconds

// Cache for structural hashes
const structuralHashCache = new Map<string, string>();

// Utility function to safely extract style properties
function extractStyleProperties(node: SceneNode): StyleProperties {
  const style: StyleProperties = {};

  if ('layoutMode' in node) {
    style.layoutMode = node.layoutMode;
    style.primaryAlign = node.primaryAxisAlignItems;
    style.counterAlign = node.counterAxisAlignItems;
    style.padding = {
      top: node.paddingTop,
      right: node.paddingRight,
      bottom: node.paddingBottom,
      left: node.paddingLeft
    };
    style.itemSpacing = node.itemSpacing;
  }

  if ('fills' in node && Array.isArray(node.fills)) {
    style.fills = node.fills.map((fill: Paint) => {
      if (fill.type === 'SOLID') {
        return {
          r: fill.color.r,
          g: fill.color.g,
          b: fill.color.b,
          a: fill.opacity
        };
      } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
        return {
          type: fill.type === 'GRADIENT_LINEAR' ? 'LINEAR' : 'RADIAL',
          stops: fill.gradientStops.map((stop: ColorStop) => ({
            color: {
              r: stop.color.r,
              g: stop.color.g,
              b: stop.color.b,
              a: stop.color.a
            },
            position: stop.position
          }))
        };
      }
      return null;
    }).filter(Boolean) as (Color | Gradient)[];
  }

  if ('strokes' in node && Array.isArray(node.strokes)) {
    style.strokes = node.strokes.map((stroke: Paint) => {
      if (stroke.type === 'SOLID') {
        return {
          r: stroke.color.r,
          g: stroke.color.g,
          b: stroke.color.b,
          a: stroke.opacity
        };
      }
      return null;
    }).filter(Boolean) as Color[];
    style.strokeWeight = typeof node.strokeWeight === 'number' ? node.strokeWeight : 0;
  }

  if ('cornerRadius' in node) {
    if (typeof node.cornerRadius === 'number') {
      style.cornerRadius = node.cornerRadius;
    } else if (node.cornerRadius !== figma.mixed && 'topLeftRadius' in node) {
      style.cornerRadius = {
        topLeft: node.topLeftRadius,
        topRight: node.topRightRadius,
        bottomLeft: node.bottomLeftRadius,
        bottomRight: node.bottomRightRadius
      };
    }
  }

  if ('opacity' in node) {
    style.opacity = node.opacity;
  }

  if ('effects' in node && Array.isArray(node.effects)) {
    style.effects = node.effects.map((effect: Effect) => {
      if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
        const shadow: Shadow = {
          type: effect.type,
          color: {
            r: effect.color?.r ?? 0,
            g: effect.color?.g ?? 0,
            b: effect.color?.b ?? 0,
            a: effect.opacity ?? 1
          },
          offset: {
            x: effect.offset?.x ?? 0,
            y: effect.offset?.y ?? 0
          },
          blur: effect.radius ?? 0,
          spread: effect.spread ?? 0
        };
        return shadow;
      }
      return null;
    }).filter((effect): effect is Shadow => effect !== null);
  }

  return style;
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

// Screen analysis with error handling
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
        };

        // Add content for text nodes
        if (node.type === 'TEXT') {
          element.content = node.characters;
        }

        // Add children IDs for container nodes
        if ('children' in node) {
          element.children = node.children.map(child => child.id);
        }

        // Add auto-layout information
        if ('layoutMode' in node && node.layoutMode !== 'NONE') {
          element.autoLayout = {
            direction: node.layoutMode,
            alignment: node.primaryAxisAlignItems,
            spacing: node.itemSpacing,
            padding: {
              top: node.paddingTop,
              right: node.paddingRight,
              bottom: node.paddingBottom,
              left: node.paddingLeft
            }
          };
        }

        // Add effects
        if ('effects' in node && Array.isArray((node as any).effects) && (node as any).effects.length > 0) {
          element.effects = ((node as any).effects).map((effect: any) => ({
            type: effect.type,
            properties: effect
          }));
        }

        // Add constraints
        if ('constraints' in node) {
          element.constraints = {
            horizontal: node.constraints.horizontal,
            vertical: node.constraints.vertical
          };
        }

        elements.push(element);

        // Check for dependencies and permissions
        const nodeName = node.name.toLowerCase();
        if (nodeName.includes('map')) dependencies.add('react-native-maps');
        if (nodeName.includes('camera') || nodeName.includes('avatar-upload')) {
          permissions.add('android.permission.CAMERA');
          permissions.add('ios.permission.NSCameraUsageDescription');
        }
        if (nodeName.includes('location')) permissions.add('android.permission.ACCESS_FINE_LOCATION');

        // Check for navigation patterns
        if (nodeName.includes('nav') || nodeName.includes('menu')) {
          const navType = nodeName.includes('tab') ? 'tab' : 
                         nodeName.includes('drawer') ? 'drawer' : 'stack';
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
        designSystem,
        elements,
        dependencies: Array.from(dependencies),
        permissions: Array.from(permissions),
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