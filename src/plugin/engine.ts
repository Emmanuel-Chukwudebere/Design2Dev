// src/plugin/engine.ts
import { StyleProperties, ComponentSpec, ScreenSpec, ComponentInstance, ExportBundle, AIPrompt, IndividualCorners } from '../shared/types';

// Constants for performance tuning
const MIN_COMPONENT_INSTANCES = 2;
const MAX_PARALLEL_EXPORTS = 5;
const EXPORT_TIMEOUT = 30000; // 30 seconds

// Utility function to safely extract style properties
function extractStyleProperties(node: SceneNode): StyleProperties {
  try {
    let fills: StyleProperties['fills'] = [];
    if ('fills' in node && Array.isArray(node.fills)) {
      fills = node.fills.map(paint => {
        if (paint.type === 'SOLID') {
          return { r: paint.color.r, g: paint.color.g, b: paint.color.b, a: paint.opacity ?? 1 };
        }
        if (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL') {
          return { 
            type: paint.type, 
            stops: paint.gradientStops.map((s: { color: RGB; position: number }) => ({ 
              color: s.color, 
              position: s.position 
            })) 
          };
        }
        return null;
      }).filter(Boolean) as StyleProperties['fills'];
    }

    let effects: StyleProperties['effects'] = [];
    if ('effects' in node && Array.isArray(node.effects)) {
      effects = node.effects.map(effect => {
        if ((effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') && effect.visible) {
          return { 
            type: effect.type, 
            color: effect.color, 
            offset: effect.offset, 
            blur: effect.radius, 
            spread: effect.spread ?? 0 
          };
        }
        return null;
      }).filter(Boolean) as StyleProperties['effects'];
    }
    
    const textNode = node.type === 'TEXT' ? node : null;

    return {
      fills,
      strokes: 'strokes' in node ? (node.strokes.map(p => (p.type === 'SOLID' ? { ...p.color, a: p.opacity ?? 1 } : null)).filter(Boolean) as any[]) : [],
      strokeWeight: 'strokeWeight' in node ? node.strokeWeight as number : 0,
      cornerRadius: 'cornerRadius' in node ? node.cornerRadius as (number | IndividualCorners) : 0,
      opacity: 'opacity' in node ? node.opacity as number : 1,
      effects,
      layoutMode: 'layoutMode' in node ? node.layoutMode : 'NONE',
      primaryAlign: 'primaryAxisAlignItems' in node ? node.primaryAxisAlignItems : 'MIN',
      counterAlign: 'counterAxisAlignItems' in node ? node.counterAxisAlignItems : 'MIN',
      padding: {
        top: 'paddingTop' in node ? node.paddingTop : 0,
        right: 'paddingRight' in node ? node.paddingRight : 0,
        bottom: 'paddingBottom' in node ? node.paddingBottom : 0,
        left: 'paddingLeft' in node ? node.paddingLeft : 0,
      },
      itemSpacing: 'itemSpacing' in node ? node.itemSpacing : 0,
      fontFamily: textNode && textNode.fontName !== figma.mixed ? textNode.fontName.family : null,
      fontWeight: textNode && textNode.fontWeight !== figma.mixed ? (textNode.fontWeight as number) : null,
      fontSize: textNode && textNode.fontSize !== figma.mixed ? (textNode.fontSize as number) : null,
      lineHeight: textNode && textNode.lineHeight !== figma.mixed ? (textNode.lineHeight as any).value : null,
      letterSpacing: textNode && textNode.letterSpacing !== figma.mixed ? (textNode.letterSpacing as any).value : null,
      textAlign: textNode && 'textAlignHorizontal' in textNode ? textNode.textAlignHorizontal : 'LEFT',
    };
  } catch (error) {
    console.error('Error extracting style properties:', error);
    return {
      fills: [],
      strokes: [],
      strokeWeight: 0,
      cornerRadius: 0,
      opacity: 1,
      effects: [],
      layoutMode: 'NONE',
      primaryAlign: 'MIN',
      counterAlign: 'MIN',
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      itemSpacing: 0,
      fontFamily: null,
      fontWeight: null,
      fontSize: null,
      lineHeight: null,
      letterSpacing: null,
      textAlign: 'LEFT',
    };
  }
}

// Optimized structural hash calculation with caching
const structuralHashCache = new Map<string, string>();

function getStructuralHash(node: SceneNode): string {
  const cached = structuralHashCache.get(node.id);
  if (cached) return cached;

  if (!('children' in node)) {
    structuralHashCache.set(node.id, node.type);
    return node.type;
  }

  const childrenTypes = node.children
    .map(child => getStructuralHash(child))
    .sort()
    .join(',');
  
  const hash = `${node.type}[${childrenTypes}]`;
  structuralHashCache.set(node.id, hash);
  return hash;
}

// Optimized style signature calculation
function getStyleSignature(style: StyleProperties): string {
  const parts: string[] = [];
  const sig = (val: any) => JSON.stringify(val, Object.keys(val).sort());

  style.fills.forEach(f => parts.push(`fill:${sig(f)}`));
  style.strokes.forEach(s => parts.push(`stroke:${sig(s)}`));
  parts.push(`sw:${style.strokeWeight}`);
  parts.push(`cr:${JSON.stringify(style.cornerRadius)}`);
  style.effects.forEach(e => parts.push(`effect:${sig(e)}`));
  
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

// Main component discovery function with error handling and performance optimizations
export async function discoverComponentsOnPage(): Promise<ComponentSpec[]> {
  try {
    const allNodes = figma.currentPage.findAll(n => 
      n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'INSTANCE'
    );
    
    const structuralGroups = new Map<string, SceneNode[]>();

    // Group nodes by their structural hash
    for (const node of allNodes) {
      if (!('children' in node) || node.children.length === 0) continue;
      const hash = getStructuralHash(node);
      if (!structuralGroups.has(hash)) {
        structuralGroups.set(hash, []);
      }
      structuralGroups.get(hash)!.push(node);
    }

    const finalComponentSpecs: ComponentSpec[] = [];

    // Process structural groups in parallel batches
    await processBatch(
      [...structuralGroups.entries()],
      async ([hash, nodes]) => {
        if (nodes.length < MIN_COMPONENT_INSTANCES) return;

        const styleGroups = new Map<string, SceneNode[]>();

        // Sub-group by style signature
        for (const node of nodes) {
          const style = extractStyleProperties(node);
          const signature = getStyleSignature(style);
          if (!styleGroups.has(signature)) {
            styleGroups.set(signature, []);
          }
          styleGroups.get(signature)!.push(node);
        }
        
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

        // Process variants
        if (sortedStyleGroups.length > 1) {
          for (let i = 1; i < sortedStyleGroups.length; i++) {
            const variantNodes = sortedStyleGroups[i];
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
          }
        }

        finalComponentSpecs.push(baseSpec);
      },
      MAX_PARALLEL_EXPORTS
    );

    return finalComponentSpecs;
  } catch (error) {
    console.error('Error in component discovery:', error);
    figma.notify('Error discovering components. Please try again.', { error: true });
    return [];
  }
}

// Screen analysis with error handling
export function analyzeScreens(
  selectedScreens: readonly SceneNode[],
  discoveredComponents: ComponentSpec[]
): ScreenSpec[] {
  try {
    const screenSpecs: ScreenSpec[] = [];

    for (const screenNode of selectedScreens) {
      if (screenNode.type !== 'FRAME') continue;

      const componentInstances: ComponentInstance[] = [];
      const dependencies = new Set<string>();
      const permissions = new Set<string>();

      const allComponentSpecs = discoveredComponents.flatMap(c => [c, ...c.variants]);

      screenNode.findAll((node) => {
        for (const spec of allComponentSpecs) {
          if (node.id === spec.id.replace('comp-', '')) {
            componentInstances.push({
              specId: spec.id,
              position: { x: node.x, y: node.y },
              instanceProps: {
                text: 'children' in node ? node.children.find(c => c.type === 'TEXT')?.name : undefined
              }
            });
            return false;
          }
        }

        const nodeName = node.name.toLowerCase();
        if (nodeName.includes('map')) dependencies.add('react-native-maps');
        if (nodeName.includes('camera') || nodeName.includes('avatar-upload')) {
          permissions.add('android.permission.CAMERA');
          permissions.add('ios.permission.NSCameraUsageDescription');
        }
        if (nodeName.includes('location')) permissions.add('android.permission.ACCESS_FINE_LOCATION');

        return false;
      });

      const spec: ScreenSpec = {
        id: `screen-${screenNode.id}`,
        name: screenNode.name,
        dimensions: { width: screenNode.width, height: screenNode.height },
        layout: extractStyleProperties(screenNode),
        componentInstances,
        dependencies: Array.from(dependencies),
        permissions: Array.from(permissions),
      };

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
  finalComponents: ComponentSpec[],
  finalScreens: ScreenSpec[]
): Promise<ExportBundle> {
  try {
    const aiPrompts: AIPrompt[] = [];
    const assets: ExportBundle['assets'] = [];

    const allComponents = finalComponents.flatMap(c => [c, ...c.variants]);

    // Process components in batches
    await processBatch(
      allComponents,
      async (component) => {
        aiPrompts.push({
          componentName: component.name,
          designSystem: component.mapping.designSystem,
          specifications: JSON.stringify(component, null, 2),
          accessibilityRequirements: JSON.stringify(component.accessibility, null, 2),
        });

        const node = figma.getNodeById(component.id.replace('comp-', ''));
        if (node && 'findAll' in node) {
          const exportableNodes = node.findAll(n => 
            n.exportSettings.length > 0 || 
            ['VECTOR', 'IMAGE', 'SHAPE_WITH_TEXT', 'RECTANGLE', 'ELLIPSE'].includes(n.type)
          );

          // Process exports with timeout
          const exportPromises = exportableNodes.map(async (exportNode) => {
            try {
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Export timeout')), EXPORT_TIMEOUT)
              );

              // Export SVG
              const svgData = await Promise.race([
                exportNode.exportAsync({ format: 'SVG' }),
                timeoutPromise
              ]);
              assets.push({ 
                name: `${exportNode.name.replace(/[^a-zA-Z0-9]/g, '_')}.svg`, 
                data: svgData as Uint8Array
              });

              // Export PNG at different resolutions
              const resolutions = [
                { scale: 1, suffix: '' },
                { scale: 2, suffix: '@2x' },
                { scale: 3, suffix: '@3x' }
              ];

              for (const { scale, suffix } of resolutions) {
                const pngData = await Promise.race([
                  exportNode.exportAsync({ 
                    format: 'PNG',
                    constraint: { type: 'SCALE', value: scale }
                  }),
                  timeoutPromise
                ]);
                assets.push({ 
                  name: `${exportNode.name.replace(/[^a-zA-Z0-9]/g, '_')}${suffix}.png`, 
                  data: pngData as Uint8Array
                });
              }
            } catch (e) {
              console.error(`Could not export node ${exportNode.name}:`, e);
              figma.notify(`Failed to export ${exportNode.name}. Skipping...`, { timeout: 2000 });
            }
          });

          await Promise.all(exportPromises);
        }
      },
      MAX_PARALLEL_EXPORTS
    );

    return {
      componentSpecs: finalComponents,
      screenSpecs: finalScreens,
      aiPrompts,
      assets,
    };
  } catch (error) {
    console.error('Error generating export bundle:', error);
    figma.notify('Error generating export bundle. Please try again.', { error: true });
    throw error;
  }
}