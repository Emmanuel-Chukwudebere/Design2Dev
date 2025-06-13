// src/ui/features/ExportScreen.tsx
import React from 'react';
import { Button, Typography, Box, CircularProgress } from '@mui/material';
import { useStore } from '../store';
import JSZip from 'jszip';
import { analyzeScreenStructure, generatePromptWithGemini } from '../../config/gemini';
import { ScreenSpec as FrontendScreenSpec } from '../../shared/types';
import { ScreenSpec as GeminiScreenSpec } from '../../config/gemini';
import type { ScreenSpec } from '../../shared/types';

export function ExportScreen() {
  const { exportBundleData, isExporting, setExporting, setError } = useStore();

  const handleDownload = async () => {
    if (!exportBundleData) return;

    try {
      setExporting(true);
      const zip = new JSZip();

      // Create folders
      const specsFolder = zip.folder('specs');
      const promptsFolder = zip.folder('prompts');
      const assetsFolder = zip.folder('assets');

      if (!specsFolder || !promptsFolder || !assetsFolder) {
        throw new Error('Failed to create zip folders');
      }

      // Process each screen
      for (const screen of exportBundleData.screenSpecs) {
        // Convert to Gemini ScreenSpec format
        const geminiScreen: GeminiScreenSpec = {
          screenMetadata: {
            screenId: screen.id,
            name: screen.name,
            dimensions: screen.dimensions,
            backgroundColorRef: 'colors.background',
            tokensRef: 'sharedDesignTokens'
          },
          sharedDesignTokens: {},
          components: screen.elements.map(element => ({
            id: element.id,
            type: element.type,
            layout: {
              x: element.position.x,
              y: element.position.y,
              width: element.dimensions.width,
              height: element.dimensions.height
            },
            style: element.styling,
            content: element.content
          })),
          assets: [],
          dataModels: {}
        };

        // Analyze screen structure with Gemini
        const analyzedScreen = await analyzeScreenStructure(geminiScreen);
        
        // Add screen spec to specs folder
        specsFolder.file(`${screen.name}.json`, JSON.stringify(analyzedScreen, null, 2));

        // Generate AI prompt with Gemini
        const prompt = await generatePromptWithGemini(analyzedScreen);
        promptsFolder.file(`${screen.name}.md`, prompt);
      }

      // Add assets
      for (const asset of exportBundleData.assets) {
        if (asset.data) {
          assetsFolder.file(asset.name, asset.data);
        }
      }

      // Generate and download zip
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'design-export.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading:', error);
      setError({
        message: 'Failed to create export bundle',
        context: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h5" component="h1">
        Export Design
      </Typography>

      <Typography variant="body1" color="text.secondary">
        Your design has been analyzed and is ready for export. The export bundle includes:
        <ul>
          <li>Comprehensive screen specifications optimized for LLM implementation</li>
          <li>AI-generated prompts for accurate screen reproduction</li>
          <li>All required assets with proper naming and organization</li>
        </ul>
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleDownload}
          disabled={!exportBundleData || isExporting}
          startIcon={isExporting ? <CircularProgress size={20} /> : null}
        >
          {isExporting ? 'Preparing Export...' : 'Download Bundle'}
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => useStore.getState().setAppStage('review')}
          disabled={isExporting}
        >
          Back to Review
        </Button>
      </Box>
    </Box>
  );
}