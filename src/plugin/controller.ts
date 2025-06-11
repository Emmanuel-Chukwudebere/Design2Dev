// src/plugin/controller.ts

import { discoverComponentsOnPage, analyzeScreens, generateExportBundle } from './engine';
import { ComponentSpec, ScreenSpec } from '../shared/types';
import JSZip from 'jszip';

figma.showUI(__html__, { width: 400, height: 600, themeColors: true });

let discoveredComponents: ComponentSpec[] = [];

function postMessage(type: string, payload?: any) {
  figma.ui.postMessage({ type, payload });
}

figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case 'INIT':
      discoveredComponents = await discoverComponentsOnPage();
      postMessage('INIT_COMPLETE', { discoveredComponents });
      break;

    case 'ANALYZE_SCREENS':
      const selection = figma.currentPage.selection.filter(n => n.type === 'FRAME');
      if (selection.length === 0 || selection.length > 5) {
        figma.notify('Please select 1 to 5 top-level frames to analyze.', { error: true });
        postMessage('ANALYSIS_FAILED');
        return;
      }
      const screenSpecs = analyzeScreens(selection, discoveredComponents);
      postMessage('ANALYSIS_COMPLETE', { screenSpecs });
      break;

    case 'GENERATE_EXPORT':
      const { finalComponents, finalScreens } = msg.payload as {
        finalComponents: ComponentSpec[];
        finalScreens: ScreenSpec[];
      };
      try {
        figma.notify('Generating export bundle...');
        const exportData = await generateExportBundle(finalComponents, finalScreens);
        
        // Create a zip file
        const zip = new JSZip();
        zip.folder('specs')?.file('components.json', JSON.stringify(exportData.componentSpecs, null, 2));
        zip.folder('specs')?.file('screens.json', JSON.stringify(exportData.screenSpecs, null, 2));

        const promptsFolder = zip.folder('prompts');
        exportData.aiPrompts.forEach((prompt, i) => {
            const content = `Generate a React Native component based on these specifications:\n\n**Component**: ${prompt.componentName}\n**Design System**: ${prompt.designSystem}\n\n**Specifications**:\n\`\`\`json\n${prompt.specifications}\n\`\`\`\n\n**Accessibility Requirements**:\n\`\`\`json\n${prompt.accessibilityRequirements}\n\`\`\`\n`;
            promptsFolder?.file(`${i + 1}_${prompt.componentName}.md`, content);
        });

        const assetsFolder = zip.folder('assets');
        exportData.assets.forEach(asset => {
            assetsFolder?.file(asset.name, asset.data);
        });
        
        const zipFile = await zip.generateAsync({ type: 'uint8array' });

        postMessage('EXPORT_COMPLETE', { exportBundle: { zipFile } });
      } catch (e) {
        figma.notify(`Error during export: ${e}`, { error: true });
      }
      break;

    case 'HIGHLIGHT_NODE':
      const node = figma.getNodeById(msg.payload.nodeId);
      if (node) {
        figma.viewport.scrollAndZoomIntoView([node]);
        figma.notify(`Highlighting: ${node.name}`, { timeout: 1500 });
      }
      break;
  }
};