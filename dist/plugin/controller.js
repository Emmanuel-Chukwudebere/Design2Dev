// src/plugin/controller.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { discoverComponentsOnPage, analyzeScreens, generateExportBundle } from './engine';
import JSZip from 'jszip';
figma.showUI(__html__, { width: 400, height: 600, themeColors: true });
let discoveredComponents = [];
function postMessage(type, payload) {
    figma.ui.postMessage({ type, payload });
}
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    switch (msg.type) {
        case 'INIT':
            discoveredComponents = yield discoverComponentsOnPage();
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
            const { finalComponents, finalScreens } = msg.payload;
            try {
                figma.notify('Generating export bundle...');
                const exportData = yield generateExportBundle(finalComponents, finalScreens);
                // Create a zip file
                const zip = new JSZip();
                (_a = zip.folder('specs')) === null || _a === void 0 ? void 0 : _a.file('components.json', JSON.stringify(exportData.componentSpecs, null, 2));
                (_b = zip.folder('specs')) === null || _b === void 0 ? void 0 : _b.file('screens.json', JSON.stringify(exportData.screenSpecs, null, 2));
                const promptsFolder = zip.folder('prompts');
                exportData.aiPrompts.forEach((prompt, i) => {
                    const content = `Generate a React Native component based on these specifications:\n\n**Component**: ${prompt.componentName}\n**Design System**: ${prompt.designSystem}\n\n**Specifications**:\n\`\`\`json\n${prompt.specifications}\n\`\`\`\n\n**Accessibility Requirements**:\n\`\`\`json\n${prompt.accessibilityRequirements}\n\`\`\`\n`;
                    promptsFolder === null || promptsFolder === void 0 ? void 0 : promptsFolder.file(`${i + 1}_${prompt.componentName}.md`, content);
                });
                const assetsFolder = zip.folder('assets');
                exportData.assets.forEach(asset => {
                    assetsFolder === null || assetsFolder === void 0 ? void 0 : assetsFolder.file(asset.name, asset.data);
                });
                const zipFile = yield zip.generateAsync({ type: 'uint8array' });
                postMessage('EXPORT_COMPLETE', { exportBundle: { zipFile } });
            }
            catch (e) {
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
});
