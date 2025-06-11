// src/plugin/engine.ts
import { StyleProperties, ComponentSpec, ScreenSpec, ComponentInstance, ExportBundle, AIPrompt, IndividualCorners } from '../shared/types';

function extractStyleProperties(node: SceneNode): StyleProperties {
  let fills: StyleProperties['fills'] = [];
  if ('fills' in node && Array.isArray(node.fills)) {
    fills = node.fills.map(paint => {
      if (paint.type === 'SOLID') {
        return { r: paint.color.r, g: paint.color.g, b: paint.color.b, a: paint.opacity ?? 1 };
      }
      if (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL') {
        return { type: paint.type, stops: paint.gradientStops.map((s: { color: RGB; position: number }) => ({ color: s.color, position: s.position })) };
      }
      return null;
    }).filter(Boolean) as StyleProperties['fills'];
  }

  let effects: StyleProperties['effects'] = [];
  if ('effects' in node && Array.isArray(node.effects)) {
    effects = node.effects.map(effect => {
      if ((effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') && effect.visible) {
        return { type: effect.type, color: effect.color, offset: effect.offset, blur: effect.radius, spread: effect.spread ?? 0 };
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
}
  
  // [This function remains unchanged]
  function getStructuralHash(node: SceneNode): string {
      if (!('children' in node)) {
        return node.type;
      }
      const childrenTypes = node.children.map(child => getStructuralHash(child)).sort().join(',');
      return `${node.type}[${childrenTypes}]`;
  }
  
  /**
   * Creates a stable string signature from a StyleProperties object.
   * This is used to group nodes with identical styles together.
   */
  function getStyleSignature(style: StyleProperties): string {
      const parts: string[] = [];
      const sig = (val: any) => JSON.stringify(val, Object.keys(val).sort());
  
      style.fills.forEach(f => parts.push(`fill:${sig(f)}`));
      style.strokes.forEach(s => parts.push(`stroke:${sig(s)}`));
      parts.push(`sw:${style.strokeWeight}`);
      parts.push(`cr:${JSON.stringify(style.cornerRadius)}`);
      style.effects.forEach(e => parts.push(`effect:${sig(e)}`));
      
      // We only consider visual styles for variant detection, not layout.
      return parts.join('|');
  }
  
  /**
   * =================================================================================
   * PASS 1: GLOBAL DISCOVERY (UPDATED WITH VARIANT DETECTION)
   * Analyzes the entire page to find potential reusable components and their variants.
   * =================================================================================
   */
  export async function discoverComponentsOnPage(): Promise<ComponentSpec[]> {
    const allNodes = figma.currentPage.findAll(n => n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'INSTANCE');
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
  
    // Analyze each structural group to find a base component and its variants
    for (const nodes of structuralGroups.values()) {
      if (nodes.length < 2) continue; // Not a reusable component
  
      const styleGroups = new Map<string, SceneNode[]>();
  
      // Sub-group by style signature to find variants
      for (const node of nodes) {
        const style = extractStyleProperties(node);
        const signature = getStyleSignature(style);
        if (!styleGroups.has(signature)) {
          styleGroups.set(signature, []);
        }
        styleGroups.get(signature)!.push(node);
      }
      
      // The most common style is the "base" component. Others are variants.
      const sortedStyleGroups = [...styleGroups.values()].sort((a, b) => b.length - a.length);
  
      const baseNodes = sortedStyleGroups[0];
      const baseNode = baseNodes[0]; // Use the first node of the most common style as the reference
  
      const baseSpec: ComponentSpec = {
        id: `comp-${baseNode.id}`,
        name: baseNode.name.split(/[\/\=]/).pop()?.trim() ?? 'Component', // Get the cleanest part of the name
        category: 'container',
        styling: extractStyleProperties(baseNode),
        dimensions: { width: baseNode.width, height: baseNode.height },
        variants: [], // This will hold the variants
        mapping: { designSystem: 'Custom', mappedComponent: null, styleOverrides: [] },
        accessibility: { role: 'group', label: null },
      };
  
      // Process other style groups as variants of the base component
      if (sortedStyleGroups.length > 1) {
          for (let i = 1; i < sortedStyleGroups.length; i++) {
              const variantNodes = sortedStyleGroups[i];
              const variantNode = variantNodes[0]; // Use the first node of this style as the reference
              const variantSpec: ComponentSpec = {
                  id: `comp-${variantNode.id}`,
                  name: variantNode.name.split(/[\/\=]/).pop()?.trim() ?? `${baseSpec.name} Variant`,
                  category: 'container',
                  styling: extractStyleProperties(variantNode),
                  dimensions: { width: variantNode.width, height: variantNode.height },
                  variants: [], // Variants do not have their own variants
                  mapping: { designSystem: 'Custom', mappedComponent: null, styleOverrides: [] },
                  accessibility: { role: 'group', label: null },
              };
              baseSpec.variants.push(variantSpec);
          }
      }
  
      finalComponentSpecs.push(baseSpec);
    }
  
    return finalComponentSpecs;
  }
  
  // =================================================================================
  // PASS 2 & 3 (These functions remain unchanged but will benefit from the improved component discovery)
  // =================================================================================
  
  // [analyzeScreens function remains unchanged]
  export function analyzeScreens(
    selectedScreens: readonly SceneNode[],
    discoveredComponents: ComponentSpec[]
  ): ScreenSpec[] {
      // ... same implementation as before
      const screenSpecs: ScreenSpec[] = [];
  
      for (const screenNode of selectedScreens) {
          if (screenNode.type !== 'FRAME') continue; // Only analyze top-level frames
  
          const componentInstances: ComponentInstance[] = [];
          const dependencies = new Set<string>();
          const permissions = new Set<string>();
  
          // We need to check against base components AND their variants
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
                      // Once matched, no need to check other specs for this node
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
  }
  
  // [generateExportBundle function remains unchanged]
  export async function generateExportBundle(
      finalComponents: ComponentSpec[],
      finalScreens: ScreenSpec[]
  ): Promise<ExportBundle> {
      // ... same implementation as before
      const aiPrompts: AIPrompt[] = [];
      const assets: ExportBundle['assets'] = [];
  
      const allComponents = finalComponents.flatMap(c => [c, ...c.variants]);
  
      for (const component of allComponents) {
          aiPrompts.push({
              componentName: component.name,
              designSystem: component.mapping.designSystem,
              specifications: JSON.stringify(component, null, 2),
              accessibilityRequirements: JSON.stringify(component.accessibility, null, 2),
          });
  
          const node = figma.getNodeById(component.id.replace('comp-', ''));
          if (node && 'findAll' in node) {
               // Find all nodes that can be exported as vectors within the component
              const exportableNodes = node.findAll(n => n.exportSettings.length > 0 || ['VECTOR', 'IMAGE', 'SHAPE_WITH_TEXT', 'RECTANGLE', 'ELLIPSE'].includes(n.type));
              for(const exportNode of exportableNodes) {
                  try {
                      const svgData = await exportNode.exportAsync({ format: 'SVG' });
                      assets.push({ name: `${exportNode.name.replace(/[^a-zA-Z0-9]/g, '_')}.svg`, data: svgData });
                  } catch(e) {
                      console.error(`Could not export node ${exportNode.name}: ${e}`);
                  }
              }
          }
      }
  
      return {
          componentSpecs: finalComponents, // Note: returning the nested structure
          screenSpecs: finalScreens,
          aiPrompts,
          assets,
      };
  }